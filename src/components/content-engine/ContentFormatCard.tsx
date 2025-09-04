import type React from 'react';
import { Settings, Play } from 'lucide-react';
import Card from '../shared/Card';
import { type ContentFormat } from '../../types/content';
import { getCategoryBgClass, getStatusIcon, getStatusText } from './utils';

interface ContentFormatCardProps {
  format: ContentFormat;
  onToggle: (formatId: string, enabled: boolean) => void;
  onPublish: (contentId: string, platform: string) => void;
  delay?: number;
}

const ContentFormatCard: React.FC<ContentFormatCardProps> = ({
  format,
  onToggle,
  onPublish,
  delay = 0,
}) => {
  const IconComponent = format.icon;

  return (
    <div className="fade-in">
      <Card
        padding="md"
        variant="glass"
        className={`border-2 ${getCategoryBgClass(format.category)} ${
          !format.enabled ? 'opacity-60' : ''
        }`}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <IconComponent className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white/95">{format.title}</h3>
              <p className="text-sm text-white/70">{format.description}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusIcon(format.status)}
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={format.enabled}
                onChange={(e) => onToggle(format.id, e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500" />
            </label>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/60">Status:</span>
            <span className="text-white/90">{getStatusText(format.status)}</span>
          </div>

          <div className="text-sm text-white/70">
            <div>{format.authorityScore}</div>
            <div>{format.customerPsychology}</div>
            <div className="text-green-400">✓ {format.alignment}</div>
          </div>

          {format.enabled && (
            <div className="flex items-center space-x-2 pt-3 border-t border-white/10">
              <button
                onClick={() => onPublish(format.id, 'all')}
                className="flex-1 bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors"
              >
                <Play className="w-4 h-4" />
                <span className="text-sm">Publish</span>
              </button>
              <button className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors">
                <Settings className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default ContentFormatCard;
