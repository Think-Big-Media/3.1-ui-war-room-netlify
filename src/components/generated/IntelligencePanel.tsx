import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { SWOTDataPoint, CrisisAlert } from './SWOTRadarDashboard';

export interface IntelligencePanelProps {
  isConnected: boolean;
  dataPoints: SWOTDataPoint[];
  crisisAlerts: CrisisAlert[];
  onExport: () => void;
}

export const IntelligencePanel: React.FC<IntelligencePanelProps> = ({
  isConnected,
  dataPoints,
  crisisAlerts,
  onExport,
}) => {
  const navigate = useNavigate();

  // Convert SWOT data points to intelligence items with proper colors
  const getColorForType = (type: string) => {
    switch (type) {
      case 'strength':
        return 'border-emerald-400 bg-emerald-400/10 text-emerald-300';
      case 'weakness':
        return 'border-rose-400 bg-rose-400/10 text-rose-300';
      case 'opportunity':
        return 'border-sky-400 bg-sky-400/10 text-sky-300';
      case 'threat':
        return 'border-amber-400 bg-amber-400/10 text-amber-300';
      default:
        return 'border-slate-400 bg-slate-400/10 text-slate-300';
    }
  };

  const intelligenceItems = dataPoints.map((point) => ({
    id: point.id,
    type: point.type.toUpperCase(),
    message: point.label,
    color: getColorForType(point.type),
    originalType: point.type,
  }));

  const handleItemClick = (item: any) => {
    navigate(`/intelligence-hub?category=${item.originalType}&item=${item.id}`);
  };

  return (
    <div className="intelligence-panel h-full flex flex-col">
      {/* Intelligence Feed - Tighter spacing to reduce radar padding */}
      <div className="flex-1 space-y-2 overflow-y-auto">
        {intelligenceItems.map((item) => (
          <div
            key={item.id}
            className={`${item.color} border-l-4 p-2 rounded-r text-xs cursor-pointer hover:opacity-80 transition-opacity`}
            onClick={() => handleItemClick(item)}
          >
            <div className="font-semibold mb-1">{item.type}:</div>
            <div className="text-gray-200 leading-tight">{item.message}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
