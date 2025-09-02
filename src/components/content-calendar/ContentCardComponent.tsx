import type React from 'react';
import { Edit3 } from 'lucide-react';
import { type ContentCard } from '../../types/calendar';
import { getPlatformIcon, getPlatformColor, getStatusIcon } from './utils';

interface ContentCardComponentProps {
  content: ContentCard;
  isDetailed?: boolean;
  onEdit?: (content: ContentCard) => void;
}

const ContentCardComponent: React.FC<ContentCardComponentProps> = ({
  content,
  isDetailed = false,
  onEdit,
}) => {
  const PlatformIcon = getPlatformIcon(content.platform);

  if (isDetailed) {
    // Detailed view for day view
    return (
      <div
        className={`${getPlatformColor(content.platform)} rounded-lg p-4 flex items-center justify-between animate-in fade-in slide-in-from-left-5 duration-300`}
      >
        <div className="flex items-center space-x-3">
          <PlatformIcon className="w-5 h-5 text-white" />
          <div>
            <div className="text-white font-medium">{content.content}</div>
            <div className="text-white/70 text-sm">
              {content.time} • {content.type}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusIcon(content.status)}
          {onEdit && (
            <button
              onClick={() => onEdit(content)}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            >
              <Edit3 className="w-4 h-4 text-white" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Compact view for week/month view
  return (
    <div
      className={`absolute inset-1 ${getPlatformColor(content.platform)} rounded-md p-2 cursor-pointer animate-in fade-in zoom-in-95 duration-300`}
    >
      <div className="flex items-center justify-between mb-1">
        <PlatformIcon className="w-3 h-3 text-white" />
        {getStatusIcon(content.status)}
      </div>
      <div className="text-white text-xs font-medium truncate">{content.content}</div>
      <div className="text-white/70 text-xs">{content.time}</div>
    </div>
  );
};

export default ContentCardComponent;
