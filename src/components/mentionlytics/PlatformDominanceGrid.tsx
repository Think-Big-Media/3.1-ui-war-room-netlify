import React from 'react';
import { motion } from 'framer-motion';
import { Twitter, Facebook, Instagram, Youtube, MessageCircle, Newspaper } from 'lucide-react';
import { MentionlyticsData } from '../../services/mentionlytics';
import { useDataMode } from '../../hooks/useDataMode';

interface PlatformDominanceGridProps {
  data: MentionlyticsData | null;
}

export const PlatformDominanceGrid: React.FC<PlatformDominanceGridProps> = ({ data }) => {
  const { isLive } = useDataMode();

  const platforms = [
    {
      name: 'Twitter/X',
      icon: Twitter,
      color: '#1DA1F2',
      mentions: data?.platforms?.twitter || 3847,
      sentiment: 72,
      growth: '+23%',
      dominance: 'high' as const,
    },
    {
      name: 'Facebook',
      icon: Facebook,
      color: '#4267B2',
      mentions: data?.platforms?.facebook || 2156,
      sentiment: 68,
      growth: '+12%',
      dominance: 'medium' as const,
    },
    {
      name: 'Instagram',
      icon: Instagram,
      color: '#E1306C',
      mentions: data?.platforms?.instagram || 1893,
      sentiment: 81,
      growth: '+45%',
      dominance: 'high' as const,
    },
    {
      name: 'YouTube',
      icon: Youtube,
      color: '#FF0000',
      mentions: data?.platforms?.youtube || 945,
      sentiment: 65,
      growth: '-5%',
      dominance: 'low' as const,
    },
    {
      name: 'TikTok',
      icon: MessageCircle,
      color: '#000000',
      mentions: data?.platforms?.tiktok || 4201,
      sentiment: 89,
      growth: '+128%',
      dominance: 'very-high' as const,
    },
    {
      name: 'News',
      icon: Newspaper,
      color: '#6B7280',
      mentions: data?.platforms?.news || 567,
      sentiment: 55,
      growth: '+8%',
      dominance: 'low' as const,
    },
  ];

  const getDominanceColor = (dominance: string) => {
    switch (dominance) {
      case 'very-high':
        return 'from-green-600 to-green-400';
      case 'high':
        return 'from-blue-600 to-blue-400';
      case 'medium':
        return 'from-yellow-600 to-yellow-400';
      case 'low':
        return 'from-red-600 to-red-400';
      default:
        return 'from-gray-600 to-gray-400';
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-barlow font-semibold text-white text-sm">Platform Dominance</h3>
        {!isLive && (
          <span className="text-[9px] text-yellow-400 uppercase font-jetbrains">Mock Data</span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 flex-1">
        {platforms.map((platform, idx) => {
          const Icon = platform.icon;
          return (
            <motion.div
              key={platform.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className={`relative bg-gradient-to-br ${getDominanceColor(platform.dominance)} 
                         rounded-lg p-3 cursor-pointer hover:scale-105 transition-all duration-200`}
              whileHover={{ y: -2 }}
            >
              <div className="absolute inset-0 bg-black/20 rounded-lg" />

              <div className="relative z-10">
                <div className="flex items-start justify-between mb-2">
                  <Icon className="w-5 h-5 text-white/90" />
                  <span
                    className={`text-xs font-jetbrains font-bold ${
                      platform.growth.startsWith('+') ? 'text-green-300' : 'text-red-300'
                    }`}
                  >
                    {platform.growth}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] text-white/70 font-barlow uppercase">
                    {platform.name}
                  </div>
                  <div className="text-base font-bold text-white font-jetbrains">
                    {platform.mentions.toLocaleString()}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-[9px] text-white/60 font-barlow">Sentiment</div>
                    <div className="text-[10px] text-white font-jetbrains">
                      {platform.sentiment}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Activity indicator */}
              {platform.dominance === 'very-high' && (
                <div className="absolute top-2 right-2 w-2 h-2 bg-white rounded-full animate-pulse" />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-3 pt-2 border-t border-white/10">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-gradient-to-r from-green-600 to-green-400 rounded-full" />
          <span className="text-[9px] text-white/50 font-barlow">Very High</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-gradient-to-r from-blue-600 to-blue-400 rounded-full" />
          <span className="text-[9px] text-white/50 font-barlow">High</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-gradient-to-r from-yellow-600 to-yellow-400 rounded-full" />
          <span className="text-[9px] text-white/50 font-barlow">Medium</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-gradient-to-r from-red-600 to-red-400 rounded-full" />
          <span className="text-[9px] text-white/50 font-barlow">Low</span>
        </div>
      </div>
    </div>
  );
};
