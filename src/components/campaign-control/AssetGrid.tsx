// Asset Grid Component

import type React from 'react';
import AssetCard from './AssetCard';
import { type Asset } from '../../types/campaign';
import { createLogger } from '../../utils/logger';

const logger = createLogger('AssetGrid');

interface AssetGridProps {
  assets: Asset[];
}

const AssetGrid: React.FC<AssetGridProps> = ({ assets }) => {
  const handleAssetView = (asset: Asset) => {
    logger.info('View asset:', asset.name);
    // Handle asset viewing
  };

  const handleAssetDownload = (asset: Asset) => {
    logger.info('Download asset:', asset.name);
    // Handle asset download
  };

  const handleAssetShare = (asset: Asset) => {
    logger.info('Share asset:', asset.name);
    // Handle asset sharing
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-5 duration-300">
      {assets.map((asset) => (
        <AssetCard
          key={asset.id}
          asset={asset}
          onView={handleAssetView}
          onDownload={handleAssetDownload}
          onShare={handleAssetShare}
        />
      ))}
    </div>
  );
};

export default AssetGrid;
