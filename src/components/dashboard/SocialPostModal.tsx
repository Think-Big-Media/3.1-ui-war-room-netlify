import React from 'react';
import { X, ExternalLink, Heart, MessageCircle, Share, Eye } from 'lucide-react';

interface SocialPost {
  id: string;
  imageUrl: string;
  platform: 'facebook' | 'instagram' | 'twitter' | 'linkedin';
  timestamp: string;
  keywords: string[];
}

interface SocialPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: SocialPost | null;
}

const SocialPostModal: React.FC<SocialPostModalProps> = ({ isOpen, onClose, post }) => {
  if (!isOpen || !post) return null;

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'facebook':
        return '📘';
      case 'instagram':
        return '📷';
      case 'twitter':
        return '🐦';
      case 'linkedin':
        return '💼';
      default:
        return '📱';
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'facebook':
        return 'border-blue-500/50 bg-blue-500/20';
      case 'instagram':
        return 'border-pink-500/50 bg-pink-500/20';
      case 'twitter':
        return 'border-sky-500/50 bg-sky-500/20';
      case 'linkedin':
        return 'border-blue-600/50 bg-blue-600/20';
      default:
        return 'border-gray-500/50 bg-gray-500/20';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Mock analytics data
  const mockAnalytics = {
    engagement: Math.floor(Math.random() * 500) + 50,
    reach: Math.floor(Math.random() * 5000) + 1000,
    likes: Math.floor(Math.random() * 200) + 20,
    comments: Math.floor(Math.random() * 50) + 5,
    shares: Math.floor(Math.random() * 30) + 2,
    sentimentScore: (Math.random() * 100).toFixed(1),
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-black/90 backdrop-blur-md border border-white/10 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className={`px-3 py-1.5 rounded-md border ${getPlatformColor(post.platform)}`}>
              <span className="text-sm font-medium font-barlow">
                {getPlatformIcon(post.platform)}{' '}
                {post.platform.charAt(0).toUpperCase() + post.platform.slice(1)}
              </span>
            </div>
            <span className="text-sm text-white/60 font-jetbrains">
              {formatTimestamp(post.timestamp)}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-md transition-colors duration-200"
          >
            <X className="w-5 h-5 text-white/70" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 space-y-4">
          {/* Large Image */}
          <div className="relative">
            <img
              src={post.imageUrl}
              alt="Social media post"
              className="w-full h-80 object-cover rounded-lg"
            />
            <button className="absolute top-3 right-3 p-2 bg-black/50 backdrop-blur-sm rounded-md hover:bg-black/70 transition-all duration-200">
              <ExternalLink className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Post Analytics */}
          <div className="bg-white/5 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-white/90 mb-3 font-barlow uppercase tracking-wider">
              Post Analytics
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <Eye className="w-4 h-4 text-blue-400 mr-1" />
                </div>
                <div className="text-lg font-bold text-blue-400 font-jetbrains">
                  {mockAnalytics.reach.toLocaleString()}
                </div>
                <div className="text-xs text-white/60 font-barlow">Reach</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <Heart className="w-4 h-4 text-red-400 mr-1" />
                </div>
                <div className="text-lg font-bold text-red-400 font-jetbrains">
                  {mockAnalytics.likes}
                </div>
                <div className="text-xs text-white/60 font-barlow">Likes</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <MessageCircle className="w-4 h-4 text-green-400 mr-1" />
                </div>
                <div className="text-lg font-bold text-green-400 font-jetbrains">
                  {mockAnalytics.comments}
                </div>
                <div className="text-xs text-white/60 font-barlow">Comments</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <Share className="w-4 h-4 text-purple-400 mr-1" />
                </div>
                <div className="text-lg font-bold text-purple-400 font-jetbrains">
                  {mockAnalytics.shares}
                </div>
                <div className="text-xs text-white/60 font-barlow">Shares</div>
              </div>
            </div>
          </div>

          {/* Engagement & Sentiment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-white/90 mb-2 font-barlow">
                Engagement Rate
              </h4>
              <div className="text-2xl font-bold text-orange-400 font-jetbrains">
                {mockAnalytics.engagement}
              </div>
              <div className="text-xs text-orange-300">interactions per 1K views</div>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-white/90 mb-2 font-barlow">
                Sentiment Score
              </h4>
              <div className="text-2xl font-bold text-green-400 font-jetbrains">
                +{mockAnalytics.sentimentScore}%
              </div>
              <div className="text-xs text-green-300">positive sentiment</div>
            </div>
          </div>

          {/* Keywords */}
          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-white/90 mb-3 font-barlow">
              Related Keywords
            </h4>
            <div className="flex flex-wrap gap-2">
              {post.keywords.map((keyword, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-blue-500/20 border border-blue-500/30 rounded text-xs text-blue-300 font-barlow"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-2">
            <button className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 hover:border-blue-500/50 rounded-lg py-2 px-4 text-sm font-medium text-blue-300 font-barlow transition-all duration-200">
              View Original Post
            </button>
            <button className="flex-1 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 hover:border-purple-500/50 rounded-lg py-2 px-4 text-sm font-medium text-purple-300 font-barlow transition-all duration-200">
              Similar Posts
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialPostModal;
