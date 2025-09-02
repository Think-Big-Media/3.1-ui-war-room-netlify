import React, { useState, useEffect, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../shared/Card';
import { MessageCircle, Heart, Share2, TrendingUp, Clock } from 'lucide-react';
import { mentionlyticsService, type MentionlyticsMention } from '../../services/mentionlytics/mentionlyticsService';

interface SocialPost extends MentionlyticsMention {
  isBreaking?: boolean;
  imageUrl: string;
}

export const LiveIntelligence: React.FC = memo(() => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);

  // Image URLs for visual enhancement
  const imageUrls = [
    'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=120&h=120&fit=crop&crop=faces',
    'https://images.unsplash.com/photo-1541872705-1f73c6400ec9?w=120&h=120&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=120&h=120&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?w=120&h=120&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=120&h=120&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1590736969955-71cc94901144?w=120&h=120&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1436450412740-6b988f486c6b?w=120&h=120&fit=crop&crop=center',
  ];

  // Load initial data from mentionlytics
  useEffect(() => {
    const loadPosts = async () => {
      try {
        const mentions = await mentionlyticsService.getMentionsFeed(10);
        const enhancedPosts = mentions.map((mention, index) => ({
          ...mention,
          isBreaking: index === 0 && mention.sentiment === 'positive', // Mark first positive as breaking
          imageUrl: imageUrls[index % imageUrls.length],
        }));
        setPosts(enhancedPosts);
      } catch (error) {
        console.error('Error loading Live Intelligence posts:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, []);

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'border-l-emerald-400 bg-emerald-400/5';
      case 'negative':
        return 'border-l-rose-400 bg-rose-400/5';
      default:
        return 'border-l-slate-400 bg-slate-400/5';
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'twitter':
        return (
          <div className="w-full h-full bg-black rounded-md flex items-center justify-center">
            <svg className="w-3 h-3 fill-white" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </div>
        );
      case 'facebook':
        return (
          <div className="w-full h-full bg-[#1877F2] rounded-md flex items-center justify-center">
            <svg className="w-3 h-3 fill-white" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </div>
        );
      case 'instagram':
        return (
          <div className="w-full h-full bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#FCB045] rounded-md flex items-center justify-center">
            <svg className="w-3 h-3 fill-white" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
          </div>
        );
      case 'news':
        return (
          <div className="w-full h-full bg-[#FF6600] rounded-md flex items-center justify-center">
            <svg className="w-3 h-3 fill-white" viewBox="0 0 24 24">
              <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/>
            </svg>
          </div>
        );
      case 'blog':
        return (
          <div className="w-full h-full bg-[#21759B] rounded-md flex items-center justify-center">
            <svg className="w-3 h-3 fill-white" viewBox="0 0 24 24">
              <path d="M21.469 6.825c.84 1.537 1.318 3.3 1.318 5.175 0 3.979-2.156 7.456-5.363 9.325l3.295-9.527c.615-1.54.82-2.771.82-3.864 0-.405-.026-.78-.07-1.109m-7.981.105c.647-.03 1.232-.105 1.232-.105.582-.075.514-.93-.067-.899 0 0-1.755.135-2.88.135-1.064 0-2.85-.135-2.85-.135-.584-.031-.661.854-.082.899 0 0 .541.075 1.115.105l1.65 4.53-2.31 6.942L3.055 6.93c.649-.03 1.234-.105 1.234-.105.585-.075.516-.93-.065-.899 0 0-1.746.135-2.874.135-.2 0-.438-.008-.681-.023C2.635 3.44 5.208 1.807 8.605 1.807c2.188 0 4.165.845 5.652 2.235-.2-.013-.402-.029-.597-.029-1.112 0-1.899.967-1.899 2.006 0 .932.549 1.726 1.136 2.663.467.759.9 1.738.9 3.151 0 .84-.244 1.875-.646 3.292l-.848 2.844-3.072-9.13zm-2.142 19.008c-2.582 0-4.947-.996-6.69-2.616l3.573-10.38 3.66 10.03c.026.06.057.117.092.17-.537.298-1.101.563-1.635.796zm11.312-4.011c3.006-1.704 5.042-4.914 5.042-8.618 0-1.039-.205-2.03-.574-2.94L17.676 21.93c.498-.308.974-.646 1.426-1.009z"/>
            </svg>
          </div>
        );
      case 'tiktok':
        return (
          <div className="w-full h-full bg-black rounded-md flex items-center justify-center">
            <svg className="w-3 h-3 fill-white" viewBox="0 0 24 24">
              <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-full h-full bg-slate-600 rounded-md flex items-center justify-center">
            <svg className="w-3 h-3 fill-white" viewBox="0 0 24 24">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
            </svg>
          </div>
        );
    }
  };

  // Live updates from mentionlytics
  useEffect(() => {
    if (posts.length === 0) return; // Wait for initial load

    const interval = setInterval(() => {
      // Update engagement numbers to simulate live activity
      setPosts((prev) =>
        prev.map((post) => ({
          ...post,
          engagement: post.engagement + Math.floor(Math.random() * 10),
        }))
      );
    }, 30000); // Update every 30 seconds

    // Subscribe to live feed for new mentions
    const unsubscribe = mentionlyticsService.subscribeToLiveFeed((newMention) => {
      const enhancedMention = {
        ...newMention,
        isBreaking: newMention.sentiment === 'positive' && Math.random() > 0.7, // Random breaking news
        imageUrl: imageUrls[Math.floor(Math.random() * imageUrls.length)],
      };
      
      setPosts((prev) => [enhancedMention, ...prev].slice(0, 10)); // Keep latest 10
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [posts.length, imageUrls]);

  // Handle clicking on a post - navigate to detailed view
  const handlePostClick = (post: SocialPost) => {
    // Navigate to real-time monitoring with specific filters for this post
    navigate(`/real-time-monitoring?platform=${post.platform}&sentiment=${post.sentiment}&author=${encodeURIComponent(post.author)}`);
  };

  return (
    <Card
      variant="glass"
      padding="sm"
      className="live-intelligence hoverable hover:scale-[1.02] transition-all duration-200"
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-condensed font-semibold text-white text-sm flex items-center gap-2 uppercase tracking-wider">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
          LIVE INTELLIGENCE
        </h3>
        <div className="flex items-center gap-1 text-xs text-emerald-400 font-jetbrains uppercase">
          <div className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse"></div>
          LIVE
        </div>
      </div>

      <div className="space-y-2 h-[600px] overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-white/60 text-sm">Loading intelligence...</div>
          </div>
        ) : (
          posts.map((post, index) => (
            <div
              key={`${post.id}-${index}`}
              onClick={() => handlePostClick(post)}
              className={`relative p-2 rounded-lg border-l-2 ${getSentimentColor(post.sentiment)} hover:bg-white/5 transition-all duration-200 cursor-pointer hover:scale-[1.01]`}
            >
              {/* Platform Icon - Top Left Corner, 25% height */}
              <div className="absolute top-2 left-2 w-6 h-6 z-10">
                {getPlatformIcon(post.platform)}
              </div>

              <div className="flex gap-3 h-full">
                {/* Square Image - Fixed 130x130 pixels */}
                <div className="flex-shrink-0 py-2">
                  <img
                    src={post.imageUrl}
                    alt={`Post by ${post.author}`}
                    className="w-[130px] h-[130px] object-cover bg-gray-800/50 border border-white/10"
                    style={{borderRadius: '10px'}}
                    loading="lazy"
                  />
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-start gap-2">
                      <div>
                        <span className="text-sm font-semibold text-white">{post.author}</span>
                        <div className="flex items-center gap-2 text-[11px] text-white/60">
                          <Clock className="w-2.5 h-2.5" />
                          {new Date(post.timestamp).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-sky-400">
                      <TrendingUp className="w-2.5 h-2.5" />
                      <span className="font-barlow-condensed font-bold">{post.engagement.toLocaleString()}</span>
                    </div>
                  </div>

                  <p className="text-sm text-white/80 leading-relaxed my-2" style={{lineHeight: '1.4', minHeight: '2.8em', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'}}>{post.text}</p>

                  {/* Single row: Sentiment badges on left, Social metrics on right - with bottom padding */}
                  <div className="flex items-center justify-between mt-2 mb-2">
                    <div className="flex items-center gap-3">
                      <div
                        className={`text-[10px] px-2 py-1 rounded uppercase font-semibold ${
                          post.sentiment === 'positive'
                            ? 'bg-emerald-400/20 text-emerald-400'
                            : post.sentiment === 'negative'
                              ? 'bg-rose-400/20 text-rose-400'
                              : 'bg-slate-400/20 text-slate-400'
                        }`}
                      >
                        {post.sentiment}
                      </div>
                      {post.isBreaking && (
                        <div className="text-[10px] bg-rose-400/20 text-rose-400 border border-rose-400/30 px-2 py-1 rounded uppercase font-bold animate-pulse">
                          BREAKING
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-white/50">
                      <div className="flex items-center gap-1 text-xs">
                        <MessageCircle className="w-3 h-3" />
                        <span className="font-jetbrains">{Math.floor(post.engagement * 0.3)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        <Heart className="w-3 h-3" />
                        <span className="font-jetbrains">{Math.floor(post.engagement * 0.6)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        <Share2 className="w-3 h-3" />
                        <span className="font-jetbrains">{Math.floor(post.engagement * 0.1)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-2 pt-2 border-t border-white/10 flex justify-between text-center">
        <div>
          <div className="text-xs font-bold text-white font-barlow-condensed">{posts.length}</div>
          <div className="text-[9px] text-white/60 uppercase font-jetbrains">ACTIVE</div>
        </div>
        <div>
          <div className="text-xs font-bold text-emerald-400 font-barlow-condensed">
            {posts.filter((p) => p.sentiment === 'positive').length}
          </div>
          <div className="text-[9px] text-white/60 uppercase font-jetbrains">POSITIVE</div>
        </div>
        <div>
          <div className="text-xs font-bold text-sky-400 font-barlow-condensed">
            {posts.reduce((sum, p) => sum + p.engagement, 0).toLocaleString()}
          </div>
          <div className="text-[9px] text-white/60 uppercase font-jetbrains">TOTAL REACH</div>
        </div>
      </div>
    </Card>
  );
});

LiveIntelligence.displayName = 'LiveIntelligence';
