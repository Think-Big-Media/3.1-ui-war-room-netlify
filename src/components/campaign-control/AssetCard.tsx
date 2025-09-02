// Asset Card Component

import type React from 'react';
import { Eye, Download, Share2 } from 'lucide-react';
import Card from '../shared/Card';
import { type Asset } from '../../types/campaign';
import { getAssetIcon } from './utils';

interface AssetCardProps {
  asset: Asset;
  onView?: (asset: Asset) => void;
  onDownload?: (asset: Asset) => void;
  onShare?: (asset: Asset) => void;
}

const AssetCard: React.FC<AssetCardProps> = ({ asset, onView, onDownload, onShare }) => {
  return (
    <Card className="cursor-pointer hoverable" padding="md" variant="glass">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          {getAssetIcon(asset.type)}
          <span className="text-white/80 text-sm font-medium uppercase font-mono">
            {asset.type}
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => onView?.(asset)}
            className="p-1 hover:bg-white/10 rounded transition-colors"
            title="View asset"
          >
            <Eye className="w-4 h-4 text-white/70" />
          </button>
          <button
            onClick={() => onDownload?.(asset)}
            className="p-1 hover:bg-white/10 rounded transition-colors"
            title="Download asset"
          >
            <Download className="w-4 h-4 text-white/70" />
          </button>
          <button
            onClick={() => onShare?.(asset)}
            className="p-1 hover:bg-white/10 rounded transition-colors"
            title="Share asset"
          >
            <Share2 className="w-4 h-4 text-white/70" />
          </button>
        </div>
      </div>

      <h4 className="font-medium text-white/95 mb-2">{asset.name}</h4>
      <p className="text-white/70 text-sm mb-5">{asset.category}</p>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-white/60">
          <span>Size: {asset.size}</span>
          <span>{asset.uploadDate}</span>
        </div>
        <div className="flex items-center space-x-2 pb-4">
          {asset.tags.map((tag, index) => (
            <span key={index} className="bg-white/20 text-white/80 px-2 py-1 rounded text-xs">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default AssetCard;
