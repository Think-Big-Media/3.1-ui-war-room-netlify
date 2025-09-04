import React from 'react';
import { X, ExternalLink, Download, Share2 } from 'lucide-react';

interface AdCreative {
  headline: string;
  description: string;
  imageUrl?: string;
  callToAction: string;
  displayUrl?: string;
  finalUrl: string;
}

interface AdCampaign {
  id: string;
  name: string;
  platform: 'Google Ads' | 'Meta';
  status: 'Active' | 'Paused' | 'Ended';
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  cpc: number;
  creative?: AdCreative;
}

interface AdPreviewModalProps {
  isOpen: boolean;
  campaign: AdCampaign | null;
  onClose: () => void;
}

const AdPreviewModal: React.FC<AdPreviewModalProps> = ({ isOpen, campaign, onClose }) => {
  if (!isOpen || !campaign || !campaign.creative) return null;

  const renderGoogleAdsPreview = () => (
    <div className="bg-white rounded-lg shadow-xl max-w-2xl mx-auto">
      {/* Search Result Preview */}
      <div className="p-6">
        <h3 className="text-gray-600 text-sm mb-4 font-semibold">Search Result Preview</h3>
        <div className="border rounded-lg p-4 bg-gray-50">
          <div className="flex items-start gap-2">
            <span className="bg-yellow-400 text-black text-xs px-1.5 py-0.5 rounded font-bold">
              Ad
            </span>
            <div className="flex-1">
              <h3 className="text-blue-600 text-xl hover:underline cursor-pointer">
                {campaign.creative.headline}
              </h3>
              <div className="flex items-center gap-1 text-sm mt-1">
                <span className="text-green-700">{campaign.creative.displayUrl}</span>
              </div>
              <p className="text-gray-600 text-sm mt-2 leading-relaxed">
                {campaign.creative.description}
              </p>
            </div>
          </div>
        </div>

        {/* Display Ad Preview */}
        <h3 className="text-gray-600 text-sm mb-4 font-semibold mt-8">Display Ad Preview</h3>
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-8 text-white">
            <h2 className="text-2xl font-bold mb-2">{campaign.creative.headline}</h2>
            <p className="text-white/90 mb-4">{campaign.creative.description}</p>
            <button className="bg-white text-blue-600 px-3 py-1.5 rounded-md font-semibold hover:bg-blue-50 transition-colors">
              {campaign.creative.callToAction}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMetaPreview = () => (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Facebook Feed Preview */}
      <div className="bg-white rounded-lg shadow-xl overflow-hidden">
        <h3 className="text-gray-600 text-sm p-4 pb-0 font-semibold">Facebook Feed</h3>
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">C</span>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">Campaign 2024</p>
              <p className="text-xs text-gray-500">
                Sponsored · <span className="text-blue-600">Learn more</span>
              </p>
            </div>
            <button className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {campaign.creative.imageUrl && (
          <img
            src={campaign.creative.imageUrl}
            alt={campaign.creative.headline}
            className="w-full h-80 object-cover"
          />
        )}

        <div className="p-4">
          <h4 className="font-bold text-gray-900 text-lg mb-2">{campaign.creative.headline}</h4>
          <p className="text-gray-600 mb-4">{campaign.creative.description}</p>
          <div className="bg-gray-100 rounded-lg p-3 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                {new URL(campaign.creative.finalUrl).hostname}
              </p>
              <p className="text-xs text-gray-500">{campaign.creative.callToAction}</p>
            </div>
            <button className="bg-blue-600 text-white px-5 py-2 rounded-md font-semibold hover:bg-blue-700 transition-colors">
              {campaign.creative.callToAction}
            </button>
          </div>
        </div>

        <div className="px-4 pb-4 flex items-center justify-between text-gray-500 text-sm">
          <div className="flex gap-4">
            <span>👍 Like</span>
            <span>💬 Comment</span>
            <span>↗️ Share</span>
          </div>
        </div>
      </div>

      {/* Instagram Feed Preview */}
      <div className="bg-white rounded-lg shadow-xl overflow-hidden">
        <h3 className="text-gray-600 text-sm p-4 pb-0 font-semibold">Instagram Feed</h3>
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">C</span>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 text-sm">campaign2024</p>
              <p className="text-xs text-gray-500">Sponsored</p>
            </div>
            <button className="text-gray-600">
              <span className="text-xl">•••</span>
            </button>
          </div>
        </div>

        {campaign.creative.imageUrl && (
          <img
            src={campaign.creative.imageUrl}
            alt={campaign.creative.headline}
            className="w-full aspect-square object-cover"
          />
        )}

        <div className="p-4">
          <div className="flex items-center gap-4 mb-3">
            <span className="text-2xl">🤍</span>
            <span className="text-2xl">💬</span>
            <span className="text-2xl">📤</span>
            <span className="ml-auto text-2xl">🔖</span>
          </div>
          <p className="font-semibold text-sm mb-2">campaign2024</p>
          <p className="text-sm">
            <span className="font-semibold">{campaign.creative.headline}</span>{' '}
            {campaign.creative.description}
          </p>
          <button className="text-blue-600 text-sm mt-2 font-semibold">
            {campaign.creative.callToAction}
          </button>
        </div>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto fade-in"
      onClick={onClose}
    >
      <div
        className="bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gray-900/95 backdrop-blur border-b border-white/10 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Ad Preview</h2>
            <p className="text-white/60 text-sm mt-1">
              {campaign.name} • {campaign.platform}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="text-white/60 hover:text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Share"
            >
              <Share2 className="w-5 h-5" />
            </button>
            <button
              className="text-white/60 hover:text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Download"
            >
              <Download className="w-5 h-5" />
            </button>
            <a
              href={campaign.creative.finalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/60 hover:text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="View Landing Page"
            >
              <ExternalLink className="w-5 h-5" />
            </a>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white p-2 hover:bg-white/10 rounded-lg transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="p-6">
          {campaign.platform === 'Google Ads' ? renderGoogleAdsPreview() : renderMetaPreview()}

          {/* Performance Stats */}
          <div className="mt-8 bg-white/5 rounded-lg p-6">
            <h3 className="text-white font-semibold mb-4">Campaign Performance</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-white/60 text-sm">Impressions</p>
                <p className="text-white text-xl font-semibold">
                  {campaign.impressions.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-white/60 text-sm">Clicks</p>
                <p className="text-white text-xl font-semibold">
                  {campaign.clicks.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-white/60 text-sm">CTR</p>
                <p className="text-white text-xl font-semibold">{campaign.ctr.toFixed(2)}%</p>
              </div>
              <div>
                <p className="text-white/60 text-sm">CPC</p>
                <p className="text-white text-xl font-semibold">${campaign.cpc.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdPreviewModal;
