import React from 'react';
const METRICS_DATA = [
  {
    label: 'Mentions',
    value: 236,
    color: 'text-gray-200',
    glow: 'rgba(255,255,255,0.4)',
  },
  {
    label: 'Alerts',
    value: 9,
    color: 'text-orange-400',
    glow: '#fb923c',
  },
  {
    label: 'Opportunities',
    value: 18,
    color: 'text-green-400',
    glow: '#4ade80',
  },
  {
    label: 'Threats',
    value: 3,
    color: 'text-red-400',
    glow: '#f87171',
  },
] as any[];

// @component: MetricsDisplay
export const MetricsDisplay = () => {
  // @return
  return (
    <div className="flex items-center">
      {METRICS_DATA.map((metric, index) => (
        <div key={metric.label} className="flex items-center">
          {index > 0 && <span className="text-gray-600 mx-3 text-xs">|</span>}

          <div className="flex items-center gap-1.5">
            <span className={`text-xs font-semibold ${metric.color}`}>{metric.value}</span>

            <span className="text-xs text-gray-400">{metric.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
};
