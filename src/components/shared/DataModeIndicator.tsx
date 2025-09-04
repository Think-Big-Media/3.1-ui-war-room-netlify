import React from 'react';
import { COLORS } from '../../constants/colors';

interface DataModeIndicatorProps {
  mode: 'MOCK' | 'LIVE';
  loading?: boolean;
  position?: 'fixed' | 'absolute' | 'relative';
  className?: string;
}

/**
 * Unified data mode indicator component
 * Shows whether the app is using mock or live data
 */
export const DataModeIndicator: React.FC<DataModeIndicatorProps> = React.memo(
  ({ mode, loading = false, position = 'fixed', className = '' }) => {
    const isMock = mode === 'MOCK';

    const baseClasses = `
    px-3 py-1.5 rounded-lg text-xs font-bold backdrop-blur-sm
    transition-all duration-200
  `;

    const positionClasses =
      position === 'fixed'
        ? 'fixed top-20 right-4 z-40'
        : position === 'absolute'
          ? 'absolute top-2 right-2 z-10'
          : '';

    const colorClasses = isMock
      ? `bg-${COLORS.status.mockBg} text-${COLORS.status.mockText} border border-${COLORS.status.mockBorder}`
      : `bg-${COLORS.status.liveBg} text-${COLORS.status.liveText} border border-${COLORS.status.liveBorder}`;

    return (
      <div className={`${positionClasses} ${className}`}>
        <div className={`${baseClasses} ${colorClasses}`}>
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
              <span>Loading...</span>
            </div>
          ) : (
            <>
              {mode} DATA
              {isMock && <span className="ml-1 opacity-80">(Demo)</span>}
            </>
          )}
        </div>
      </div>
    );
  }
);

DataModeIndicator.displayName = 'DataModeIndicator';

export default DataModeIndicator;
