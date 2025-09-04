// Mentions Stream Component

import type React from 'react';
import { useState, useRef, useEffect } from 'react';
import { Heart, MapPin, Globe, BarChart3, TrendingUp, MessageCircle, Share2, Clock } from 'lucide-react';
import Card from '../shared/Card';
import CustomDropdown from '../shared/CustomDropdown';
import { type Mention, type MonitoringFilters } from '../../types/monitoring';
import { getPlatformIcon, getSentimentIcon } from './utils';
import { createLogger } from '../../utils/logger';

const logger = createLogger('MentionsStream');

interface MentionsStreamProps {
  mentions: Mention[];
  filters: MonitoringFilters;
  onFiltersChange: (filters: MonitoringFilters) => void;
}

const MentionsStream: React.FC<MentionsStreamProps> = ({ mentions, filters, onFiltersChange }) => {
  const [showTopGradient, setShowTopGradient] = useState(false);
  const [showBottomGradient, setShowBottomGradient] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    
    // More stable thresholds to prevent constant updates
    setShowTopGradient(scrollTop > 30);
    setShowBottomGradient(scrollTop < scrollHeight - clientHeight - 30);
  };

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      // Initial check
      handleScroll();
      scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
      return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }
  }, []); // Remove mentions dependency to prevent re-initialization
  const handleAddToAlert = (mention: Mention) => {
    logger.info('Add mention to alert:', mention.username);
    // Handle adding mention to alert system
  };

  const handleGenerateResponse = (mention: Mention) => {
    logger.info('Generate response for mention:', mention.username);
    // Handle generating response to mention
  };

  // Dropdown options
  const sourceOptions = [
    { value: 'all', label: 'All Sources', icon: <Globe className="w-4 h-4" /> },
    { value: 'twitter', label: 'Twitter', icon: getPlatformIcon('twitter') },
    { value: 'facebook', label: 'Facebook', icon: getPlatformIcon('facebook') },
    { value: 'reddit', label: 'Reddit', icon: getPlatformIcon('reddit') },
    { value: 'news', label: 'News', icon: getPlatformIcon('news') },
  ];

  const sentimentOptions = [
    {
      value: 'all',
      label: 'All Sentiment',
      icon: <BarChart3 className="w-4 h-4" />,
    },
    {
      value: 'positive',
      label: 'Positive',
      icon: <TrendingUp className="w-4 h-4 text-green-400" />,
    },
    {
      value: 'negative',
      label: 'Negative',
      icon: getSentimentIcon('negative'),
    },
    { value: 'neutral', label: 'Neutral', icon: getSentimentIcon('neutral') },
  ];

  const regionOptions = [
    { value: 'all', label: 'All Regions', icon: <Globe className="w-4 h-4" /> },
    {
      value: 'District 3',
      label: 'District 3',
      icon: <MapPin className="w-4 h-4" />,
    },
    {
      value: 'District 7',
      label: 'District 7',
      icon: <MapPin className="w-4 h-4" />,
    },
    {
      value: 'Statewide',
      label: 'Statewide',
      icon: <MapPin className="w-4 h-4" />,
    },
  ];

  return (
    <Card
      padding="md"
      variant="glass"
      className="hoverable hover:scale-[1.02] transition-all duration-200"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="section-header tracking-wide ml-2">LIVE MENTIONS STREAM</h3>
        <div className="flex items-center space-x-2">
          <CustomDropdown
            value={filters.source}
            onChange={(value) => onFiltersChange({ ...filters, source: value })}
            options={sourceOptions}
            className="min-w-[140px]"
          />
          <CustomDropdown
            value={filters.sentiment}
            onChange={(value) => onFiltersChange({ ...filters, sentiment: value })}
            options={sentimentOptions}
            className="min-w-[140px]"
          />
          <CustomDropdown
            value={filters.region}
            onChange={(value) => onFiltersChange({ ...filters, region: value })}
            options={regionOptions}
            className="min-w-[140px]"
          />
        </div>
      </div>

      <div className="relative max-h-[512px] overflow-hidden">
        {/* Scrollable content with mask applied */}
        <div 
          ref={scrollContainerRef}
          className="space-y-3 max-h-[512px] overflow-y-auto custom-scrollbar"
          style={{
            maskImage: `linear-gradient(to bottom, 
              ${showTopGradient ? 'transparent 0%, rgba(0,0,0,1) 48px' : 'rgba(0,0,0,1) 0px'}, 
              rgba(0,0,0,1) calc(100% - 48px), 
              ${showBottomGradient ? 'transparent 100%' : 'rgba(0,0,0,1) 100%'}
            )`,
            WebkitMaskImage: `linear-gradient(to bottom, 
              ${showTopGradient ? 'transparent 0%, rgba(0,0,0,1) 48px' : 'rgba(0,0,0,1) 0px'}, 
              rgba(0,0,0,1) calc(100% - 48px), 
              ${showBottomGradient ? 'transparent 100%' : 'rgba(0,0,0,1) 100%'}
            )`
          }}
        >
        {mentions.map((mention) => {
          // Map mention properties to match LiveIntelligence format
          const post = {
            id: mention.id,
            platform: mention.platform,
            author: mention.username || mention.author || 'Unknown User',
            text: mention.content,
            sentiment: mention.sentiment,
            engagement: mention.engagement || 0,
            reach: mention.reach || 0,
            timestamp: mention.timestamp,
            imageUrl: `https://images.unsplash.com/photo-1557804506-669a67965ba0?w=80&h=80&fit=crop&crop=faces`
          };

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

          const getPlatformIconExpanded = (platform: string) => {
            switch (platform) {
              case 'twitter':
                return (
                  <div className="w-full h-full bg-black rounded-md flex items-center justify-center">
                    <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </div>
                );
              case 'facebook':
                return (
                  <div className="w-full h-full bg-[#1877F2] rounded-md flex items-center justify-center">
                    <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </div>
                );
              case 'instagram':
                return (
                  <div className="w-full h-full bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#FCB045] rounded-md flex items-center justify-center">
                    <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </div>
                );
              case 'news':
                return (
                  <div className="w-full h-full bg-[#FF6600] rounded-md flex items-center justify-center">
                    <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                      <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/>
                    </svg>
                  </div>
                );
              case 'reddit':
                return (
                  <div className="w-full h-full bg-[#FF4500] rounded-md flex items-center justify-center">
                    <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                      <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
                    </svg>
                  </div>
                );
              default:
                return (
                  <div className="w-full h-full bg-slate-600 rounded-md flex items-center justify-center">
                    <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                    </svg>
                  </div>
                );
            }
          };

          return (
            <div
              key={post.id}
              className={`relative p-4 rounded-lg border-l-2 ${getSentimentColor(post.sentiment)} hover:bg-white/5 transition-all duration-200 cursor-pointer hover:scale-[1.01]`}
            >
              {/* Platform Icon - Top Left Corner */}
              <div className="absolute top-3 left-3 w-8 h-8 z-10">
                {getPlatformIconExpanded(post.platform)}
              </div>

              <div className="flex gap-4 h-full">
                {/* Square Image - Fixed 130x130 pixels */}
                <div className="flex-shrink-0 py-2">
                  <img
                    src={post.imageUrl}
                    alt={`Post by ${post.author}`}
                    className="w-[200px] h-[200px] object-cover bg-gray-800/50 border border-white/10"
                    style={{borderRadius: '10px'}}
                    loading="lazy"
                  />
                </div>
                
                {/* Content - Expanded and more readable */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-2">
                      <div>
                        <span className="text-lg font-semibold text-white font-barlow">{post.author}</span>
                        <div className="flex items-center gap-2 text-sm text-white/60">
                          <Clock className="w-4 h-4" />
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

                    <div className="flex items-center gap-2 text-sm text-sky-400">
                      <TrendingUp className="w-4 h-4" />
                      <span className="font-jetbrains font-bold">{post.engagement.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Enhanced text with more context - expanded view */}
                  <p className="text-sm text-white/80 leading-tight my-3 whitespace-pre-wrap min-h-[3rem] font-barlow" style={{lineHeight: '1.4'}}>
                    {post.text}
                  </p>

                  {/* Sentiment badges - exact dashboard styling */}
                  <div className="flex items-center gap-3 mt-4">
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
                    {post.engagement > 1000 && (
                      <div className="text-[10px] bg-blue-400/20 text-blue-400 border border-blue-400/30 px-2 py-1 rounded uppercase font-bold">
                        TRENDING
                      </div>
                    )}
                  </div>

                  {/* Bottom row: Action buttons and social metrics at same level */}
                  <div className="flex items-center justify-between mt-4 mb-2">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleAddToAlert(mention)} 
                        className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-xs font-barlow font-semibold uppercase hover:bg-orange-500/30 transition-all duration-200"
                      >
                        ADD TO ALERT
                      </button>
                      <button
                        onClick={() => handleGenerateResponse(mention)}
                        className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-barlow font-semibold uppercase hover:bg-blue-500/30 transition-all duration-200"
                      >
                        GENERATE RESPONSE
                      </button>
                    </div>
                    
                    {/* Social metrics - bigger and uppercase */}
                    <div className="flex items-center gap-4 text-white/50">
                      <div className="flex items-center gap-1 text-sm">
                        <MessageCircle className="w-4 h-4" />
                        <span className="font-jetbrains font-bold">{Math.floor(post.engagement * 0.3)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <Heart className="w-4 h-4" />
                        <span className="font-jetbrains font-bold">{Math.floor(post.engagement * 0.6)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <Share2 className="w-4 h-4" />
                        <span className="font-jetbrains font-bold">{Math.floor(post.engagement * 0.1)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        </div>
      </div>
    </Card>
  );
};

export default MentionsStream;
