import React, { useState, useEffect, useRef } from 'react';
import { RadarCanvas } from './RadarCanvas';
import '../swot-radar.css';
export interface SWOTDataPoint {
  id: string;
  type: 'strength' | 'weakness' | 'opportunity' | 'threat';
  x: number;
  y: number;
  intensity: number;
  label: string;
  timestamp: Date;
  sentiment: number;
  source: string;
}
export interface CrisisAlert {
  id: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  source: string;
}

// @component: SWOTRadarDashboard
export const SWOTRadarDashboard = () => {
  const [dataPoints, setDataPoints] = useState<SWOTDataPoint[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [crisisAlerts, setCrisisAlerts] = useState<CrisisAlert[]>([]);
  const [activeLabel, setActiveLabel] = useState<{
    point: SWOTDataPoint;
    x: number;
    y: number;
  } | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Mock data for demonstration
  const mockDataPoints: SWOTDataPoint[] = [
    {
      id: '1',
      type: 'strength',
      x: 150,
      y: 120,
      intensity: 0.8,
      label: 'Strong Brand Recognition',
      timestamp: new Date(),
      sentiment: 0.7,
      source: 'Twitter',
    },
    {
      id: '2',
      type: 'weakness',
      x: 450,
      y: 180,
      intensity: 0.6,
      label: 'Customer Service Issues',
      timestamp: new Date(),
      sentiment: -0.5,
      source: 'Reviews',
    },
    {
      id: '3',
      type: 'opportunity',
      x: 180,
      y: 420,
      intensity: 0.9,
      label: 'Emerging Market Expansion',
      timestamp: new Date(),
      sentiment: 0.8,
      source: 'News',
    },
    {
      id: '4',
      type: 'threat',
      x: 480,
      y: 450,
      intensity: 0.7,
      label: 'Competitor Launch',
      timestamp: new Date(),
      sentiment: -0.6,
      source: 'Industry Reports',
    },
  ];

  // Sweep animation is now handled inside RadarCanvas with requestAnimationFrame

  // Initialize mock data
  useEffect(() => {
    setDataPoints(mockDataPoints);
    setIsConnected(true);

    // Mock crisis alert
    setCrisisAlerts([
      {
        id: 'alert-1',
        message: 'Negative sentiment spike detected in customer service mentions',
        severity: 'high',
        timestamp: new Date(),
        source: 'Social Media',
      },
    ]);
  }, []);
  const handleSweepHit = (point: SWOTDataPoint, canvasX: number, canvasY: number) => {
    setActiveLabel({
      point,
      x: canvasX,
      y: canvasY,
    });
    setTimeout(() => setActiveLabel(null), 3000);
  };
  const exportData = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      dataPoints,
      crisisAlerts,
      summary: {
        strengths: dataPoints.filter((p) => p.type === 'strength').length,
        weaknesses: dataPoints.filter((p) => p.type === 'weakness').length,
        opportunities: dataPoints.filter((p) => p.type === 'opportunity').length,
        threats: dataPoints.filter((p) => p.type === 'threat').length,
      },
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `swot-analysis-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // @return
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 text-foreground">
      <div className="max-w-7xl mx-auto px-6 py-8 lg:px-8 lg:py-12">
        <header className="mb-12 text-center">
          <h1 className="text-4xl lg:text-5xl font-light text-slate-900 dark:text-slate-100 mb-4 tracking-tight">
            <span>SWOT Intelligence Radar</span>
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            <span>Real-time strategic analysis powered by advanced data intelligence</span>
          </p>
        </header>

        <div className="flex justify-center">
          <div className="w-full max-w-4xl">
            <div className="relative bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60 rounded-2xl p-8 shadow-xl shadow-slate-200/20 dark:shadow-slate-900/20">
              <RadarCanvas dataPoints={dataPoints} onSweepHit={handleSweepHit} />

              {activeLabel && (
                <div
                  className="absolute bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border border-slate-200/60 dark:border-slate-700/60 rounded-xl p-4 shadow-2xl z-[1060] max-w-xs animate-fadeIn"
                  style={{
                    left: activeLabel.x + 10,
                    top: activeLabel.y - 10,
                    transform: 'translate(0, -100%)',
                  }}
                >
                  <div className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
                    <span>{activeLabel.point.label}</span>
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">
                    <span>Source: {activeLabel.point.source}</span>
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    <span>Sentiment: {(activeLabel.point.sentiment * 100).toFixed(0)}%</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
