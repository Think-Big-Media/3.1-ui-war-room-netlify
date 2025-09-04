import React from 'react';
import { StatusIndicator } from './StatusIndicator';
const SYSTEM_STATUSES = [
  {
    name: 'Meta',
    status: 'CONNECTED',
    type: 'success' as const,
  },
  {
    name: 'Google',
    status: 'CONNECTED',
    type: 'success' as const,
  },
  {
    name: 'Social',
    status: 'CONNECTED',
    type: 'success' as const,
  },
  {
    name: 'Analytics',
    status: 'WARNING',
    type: 'warning' as const,
  },
] as any[];

// @component: SystemHealthIndicators
export const SystemHealthIndicators = () => {
  // @return
  return (
    <div className="flex items-center gap-4">
      {SYSTEM_STATUSES.map((system) => (
        <StatusIndicator
          key={system.name}
          name={system.name}
          status={system.status}
          type={system.type}
        />
      ))}
    </div>
  );
};
