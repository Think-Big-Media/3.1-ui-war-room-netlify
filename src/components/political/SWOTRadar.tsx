import type React from 'react';
import { useState } from 'react';
import Card from '../shared/Card';

interface SWOTRadarProps {
  className?: string;
  onBlobClick?: (feedId: string) => void;
}

interface RadarBlob {
  id: string;
  type: 'strength' | 'weakness' | 'opportunity' | 'threat';
  label: string;
  position: { top?: string; bottom?: string; left?: string; right?: string };
  size: 'sm' | 'md' | 'lg';
}

const SWOTRadar: React.FC<SWOTRadarProps> = ({ className = '', onBlobClick }) => {
  const [hoveredBlob, setHoveredBlob] = useState<string | null>(null);

  const radarBlobs: RadarBlob[] = [
    {
      id: 'brand-recognition',
      type: 'strength',
      label: 'Brand Recognition +18%',
      position: { top: '25%', right: '30%' },
      size: 'lg',
    },
    {
      id: 'youth-engagement',
      type: 'strength',
      label: 'Youth Engagement +23%',
      position: { top: '35%', right: '20%' },
      size: 'md',
    },
    {
      id: 'ad-fatigue',
      type: 'weakness',
      label: 'Ad Fatigue Detected',
      position: { top: '30%', left: '25%' },
      size: 'md',
    },
    {
      id: 'wisconsin-opens',
      type: 'opportunity',
      label: 'Wisconsin Opens +34%',
      position: { bottom: '35%', right: '35%' },
      size: 'lg',
    },
    {
      id: 'fl-suburbs',
      type: 'opportunity',
      label: 'FL Suburbs +12%',
      position: { bottom: '25%', right: '22%' },
      size: 'md',
    },
    {
      id: 'competitor-launch',
      type: 'threat',
      label: 'Competitor $250K Launch',
      position: { bottom: '30%', left: '30%' },
      size: 'lg',
    },
    {
      id: 'viral-negative',
      type: 'threat',
      label: 'Viral Negative 12K RT',
      position: { bottom: '40%', left: '20%' },
      size: 'sm',
    },
  ];

  const getBlobColor = (type: RadarBlob['type']) => {
    switch (type) {
      case 'strength':
        return 'from-green-500/80 to-transparent';
      case 'weakness':
        return 'from-red-500/80 to-transparent';
      case 'opportunity':
        return 'from-blue-500/80 to-transparent';
      case 'threat':
        return 'from-orange-500/80 to-transparent';
    }
  };

  const getBlobSize = (size: RadarBlob['size']) => {
    switch (size) {
      case 'sm':
        return 'w-4 h-4';
      case 'md':
        return 'w-5 h-5';
      case 'lg':
        return 'w-6 h-6';
    }
  };

  const handleBlobClick = (blobId: string) => {
    onBlobClick?.(blobId);
  };

  return (
    <Card className={`hoverable ${className}`} padding="md" variant="glass">
      <div className="space-y-4">
        <div className="relative w-full h-[400px] bg-gradient-radial from-emerald-500/5 to-transparent border-2 border-emerald-500/20 rounded-full flex items-center justify-center">
          {/* Radar Sweep */}
          <div
            className="absolute w-1/2 h-0.5 bg-gradient-to-r from-emerald-500/80 to-transparent left-1/2 top-1/2 origin-left"
            style={{
              animation: 'spin 12s linear infinite',
            }}
          />

          {/* Quadrant Labels */}
          <div className="absolute top-4 right-4 text-xs text-emerald-400 font-medium font-mono uppercase">
            STRENGTHS
          </div>
          <div className="absolute top-4 left-4 text-xs text-emerald-400 font-medium font-mono uppercase">
            WEAKNESSES
          </div>
          <div className="absolute bottom-4 right-4 text-xs text-emerald-400 font-medium font-mono uppercase">
            OPPORTUNITIES
          </div>
          <div className="absolute bottom-4 left-4 text-xs text-emerald-400 font-medium font-mono uppercase">
            THREATS
          </div>

          {/* Radar Blobs */}
          {radarBlobs.map((blob) => (
            <div
              key={blob.id}
              className={`absolute ${getBlobSize(blob.size)} cursor-pointer group`}
              style={blob.position}
              onClick={() => handleBlobClick(blob.id)}
              onMouseEnter={() => setHoveredBlob(blob.id)}
              onMouseLeave={() => setHoveredBlob(null)}
            >
              <div
                className={`w-full h-full rounded-full bg-gradient-radial ${getBlobColor(blob.type)} animate-pulse`}
              />
              <div
                className={`absolute -top-9 left-1/2 transform -translate-x-1/2 bg-black/95 text-white text-xs px-2 py-1 rounded border border-white/20 whitespace-nowrap transition-opacity z-10 ${
                  hoveredBlob === blob.id ? 'opacity-100' : 'opacity-0'
                }`}
              >
                {blob.label}
              </div>
            </div>
          ))}
        </div>

        <div className="text-xs text-white/60 font-mono">
          <div className="flex justify-between">
            <span>Active Threats: 2</span>
            <span>Opportunities: 4</span>
          </div>
          <div className="flex justify-between mt-1">
            <span>Risk Level: Medium</span>
            <span>Detection Rate: 97%</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default SWOTRadar;
