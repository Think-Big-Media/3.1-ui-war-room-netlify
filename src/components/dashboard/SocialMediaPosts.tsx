import React, { useState } from 'react';
import Card from '../shared/Card';
import SocialPostModal from './SocialPostModal';

interface SocialPost {
  id: string;
  imageUrl: string;
  platform: 'facebook' | 'instagram' | 'twitter' | 'linkedin';
  timestamp: string;
  keywords: string[];
}

const SocialMediaPosts: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<SocialPost | null>(null);

  const handlePostClick = (post: SocialPost) => {
    setSelectedPost(post);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPost(null);
  };

  // Mock data for social media posts related to user's keywords
  const socialPosts: SocialPost[] = [
    {
      id: '1',
      imageUrl:
        'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=120&h=120&fit=crop&crop=faces',
      platform: 'facebook',
      timestamp: '2025-08-30T16:30:00Z',
      keywords: ['politics', 'campaign'],
    },
    {
      id: '2',
      imageUrl:
        'https://images.unsplash.com/photo-1541872705-1f73c6400ec9?w=120&h=120&fit=crop&crop=center',
      platform: 'instagram',
      timestamp: '2025-08-30T15:45:00Z',
      keywords: ['voting', 'democracy'],
    },
    {
      id: '3',
      imageUrl:
        'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=120&h=120&fit=crop&crop=center',
      platform: 'twitter',
      timestamp: '2025-08-30T14:20:00Z',
      keywords: ['election', 'civic'],
    },
    {
      id: '4',
      imageUrl:
        'https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?w=120&h=120&fit=crop&crop=center',
      platform: 'facebook',
      timestamp: '2025-08-30T13:15:00Z',
      keywords: ['community', 'outreach'],
    },
    {
      id: '5',
      imageUrl:
        'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=120&h=120&fit=crop&crop=center',
      platform: 'instagram',
      timestamp: '2025-08-30T12:30:00Z',
      keywords: ['rally', 'support'],
    },
    {
      id: '6',
      imageUrl:
        'https://images.unsplash.com/photo-1590736969955-71cc94901144?w=120&h=120&fit=crop&crop=center',
      platform: 'linkedin',
      timestamp: '2025-08-30T11:45:00Z',
      keywords: ['policy', 'government'],
    },
    {
      id: '7',
      imageUrl:
        'https://images.unsplash.com/photo-1436450412740-6b988f486c6b?w=120&h=120&fit=crop&crop=center',
      platform: 'twitter',
      timestamp: '2025-08-30T10:20:00Z',
      keywords: ['grassroots', 'organizing'],
    },
    {
      id: '8',
      imageUrl:
        'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=120&h=120&fit=crop&crop=center',
      platform: 'facebook',
      timestamp: '2025-08-30T09:15:00Z',
      keywords: ['debate', 'discussion'],
    },
    {
      id: '9',
      imageUrl:
        'https://images.unsplash.com/photo-1569098644584-210bcd375b59?w=120&h=120&fit=crop&crop=center',
      platform: 'instagram',
      timestamp: '2025-08-30T08:30:00Z',
      keywords: ['campaign', 'trail'],
    },
    {
      id: '10',
      imageUrl:
        'https://images.unsplash.com/photo-1586772002917-ba855d68e146?w=120&h=120&fit=crop&crop=center',
      platform: 'twitter',
      timestamp: '2025-08-30T07:45:00Z',
      keywords: ['activism', 'change'],
    },
    {
      id: '11',
      imageUrl:
        'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=120&h=120&fit=crop&crop=center',
      platform: 'linkedin',
      timestamp: '2025-08-30T06:20:00Z',
      keywords: ['leadership', 'vision'],
    },
    {
      id: '12',
      imageUrl:
        'https://images.unsplash.com/photo-1551836022-8b2858c9c69b?w=120&h=120&fit=crop&crop=center',
      platform: 'facebook',
      timestamp: '2025-08-30T05:15:00Z',
      keywords: ['unity', 'together'],
    },
  ];

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

  return (
    <Card
      variant="glass"
      padding="md"
      className="social-media-posts hoverable hover:scale-[1.02] transition-all duration-200"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-barlow font-semibold text-white text-xs flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
          Recent Social Media Posts
        </h3>
        <span className="text-xs text-white/60">Related to your keywords</span>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {socialPosts.slice(0, 8).map((post) => (
          <div
            key={post.id}
            onClick={() => handlePostClick(post)}
            className="relative group cursor-pointer transform transition-all duration-200 hover:scale-[1.02]"
          >
            {/* 110x110 square image with proper spacing */}
            <div className="w-[110px] h-[110px] rounded-lg overflow-hidden bg-gray-800/50 border border-white/10 flex-shrink-0">
              <img
                src={post.imageUrl}
                alt="Social media post"
                className="w-full h-full object-cover transition-opacity duration-200 group-hover:opacity-80"
                loading="lazy"
              />
            </div>

            {/* Platform indicator - only visible on hover */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <span className="text-xs bg-black/60 backdrop-blur-sm rounded px-1.5 py-0.5">
                {getPlatformIcon(post.platform)}
              </span>
            </div>

            {/* Subtle glow effect on hover */}
            <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          </div>
        ))}
      </div>

      <div className="mt-4 text-center">
        <button className="text-xs text-blue-400 hover:text-blue-300 transition-colors duration-200 font-barlow uppercase tracking-wider">
          Load more posts →
        </button>
      </div>

      {/* Social Post Modal */}
      <SocialPostModal isOpen={isModalOpen} onClose={handleCloseModal} post={selectedPost} />
    </Card>
  );
};

export default SocialMediaPosts;
