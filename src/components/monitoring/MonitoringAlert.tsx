// Monitoring Alert Component

import type React from 'react';
import { AlertCircle } from 'lucide-react';
import { createLogger } from '../../utils/logger';

const logger = createLogger('MonitoringAlert');

interface MonitoringAlertProps {
  title?: string;
  message?: string;
  actionText?: string;
  onAction?: () => void;
}

const MonitoringAlert: React.FC<MonitoringAlertProps> = ({
  title = 'Alert',
  message = 'Negative mentions about crime policy up 234% in last 12h — trending in District 8',
  actionText = 'RESPOND NOW',
  onAction,
}) => {
  const handleAction = () => {
    logger.info('Alert action triggered:', message);
    onAction?.();
  };

  return (
    <div className="mb-2">
      <div className="bg-red-500/20 rounded-lg p-4 flex items-center justify-between hoverable animate-in fade-in slide-in-from-bottom-2 hover:scale-[1.02] transition-all duration-200">
        <div className="flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <div className="flex items-center">
            <span
              className="text-red-400 font-medium font-condensed tracking-wide text-lg uppercase"
              style={{
                textRendering: 'optimizeLegibility',
                WebkitFontSmoothing: 'antialiased',
                MozOsxFontSmoothing: 'grayscale',
              }}
            >
              {title}
            </span>
            <span className="text-white/90 font-mono ml-5">{message}</span>
          </div>
        </div>
        {actionText && (
          <button onClick={handleAction} className="btn-secondary-alert">
            {actionText}
          </button>
        )}
      </div>
    </div>
  );
};

export default MonitoringAlert;
