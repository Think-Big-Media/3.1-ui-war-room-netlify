import React from 'react';
import { motion } from 'framer-motion';
import { Users, TrendingUp, Target, Star } from 'lucide-react';
import { MentionlyticsData } from '../../services/mentionlytics';
import { useDataMode } from '../../hooks/useDataMode';

interface InfluencerPowerMatrixProps {
  data: MentionlyticsData | null;
}

interface Influencer {
  name: string;
  handle: string;
  followers: number;
  engagement: number;
  sentiment: number;
  category: 'champion' | 'amplifier' | 'watcher' | 'risk';
}

export const InfluencerPowerMatrix: React.FC<InfluencerPowerMatrixProps> = ({ data }) => {
  const { isLive } = useDataMode();

  // Mock influencers positioned on 2x2 matrix (Engagement vs Reach)
  const influencers: Influencer[] = [
    // High Engagement, High Reach - CHAMPIONS (top-right)
    {
      name: 'Sarah Political',
      handle: '@sarahpol',
      followers: 487000,
      engagement: 8.2,
      sentiment: 85,
      category: 'champion',
    },
    {
      name: 'Mike News',
      handle: '@mikenews24',
      followers: 325000,
      engagement: 7.5,
      sentiment: 72,
      category: 'champion',
    },

    // Low Engagement, High Reach - AMPLIFIERS (top-left)
    {
      name: 'Daily Politics',
      handle: '@dailypol',
      followers: 892000,
      engagement: 2.1,
      sentiment: 60,
      category: 'amplifier',
    },
    {
      name: 'News Bot',
      handle: '@newsbot',
      followers: 654000,
      engagement: 1.8,
      sentiment: 55,
      category: 'amplifier',
    },

    // High Engagement, Low Reach - WATCHERS (bottom-right)
    {
      name: 'Local Activist',
      handle: '@localact',
      followers: 12500,
      engagement: 12.3,
      sentiment: 92,
      category: 'watcher',
    },
    {
      name: 'Youth Leader',
      handle: '@youthled',
      followers: 8900,
      engagement: 15.7,
      sentiment: 88,
      category: 'watcher',
    },

    // Low Engagement, Low Reach - RISKS (bottom-left)
    {
      name: 'Angry Voter',
      handle: '@angryv',
      followers: 3200,
      engagement: 0.8,
      sentiment: 25,
      category: 'risk',
    },
    {
      name: 'Fake News',
      handle: '@fakenws',
      followers: 5600,
      engagement: 1.2,
      sentiment: 15,
      category: 'risk',
    },
  ];

  const quadrants = [
    {
      id: 'amplifier',
      label: 'AMPLIFIERS',
      desc: 'High Reach, Low Engagement',
      color: 'from-blue-600/20 to-blue-500/10',
      position: 'top-left',
    },
    {
      id: 'champion',
      label: 'CHAMPIONS',
      desc: 'High Reach, High Engagement',
      color: 'from-green-600/20 to-green-500/10',
      position: 'top-right',
    },
    {
      id: 'risk',
      label: 'RISKS',
      desc: 'Low Reach, Low Engagement',
      color: 'from-red-600/20 to-red-500/10',
      position: 'bottom-left',
    },
    {
      id: 'watcher',
      label: 'WATCHERS',
      desc: 'Low Reach, High Engagement',
      color: 'from-yellow-600/20 to-yellow-500/10',
      position: 'bottom-right',
    },
  ];

  const getQuadrantColor = (category: string) => {
    switch (category) {
      case 'champion':
        return 'bg-green-400 border-green-300';
      case 'amplifier':
        return 'bg-blue-400 border-blue-300';
      case 'watcher':
        return 'bg-yellow-400 border-yellow-300';
      case 'risk':
        return 'bg-red-400 border-red-300';
      default:
        return 'bg-gray-400 border-gray-300';
    }
  };

  const getPosition = (engagement: number, followers: number) => {
    // Normalize to 0-100 scale for positioning
    const x = Math.min(100, (engagement / 20) * 100); // Engagement 0-20%
    const y = 100 - Math.min(100, (followers / 1000000) * 100); // Followers 0-1M
    return { x, y };
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-barlow font-semibold text-white text-sm">Influencer Power Matrix</h3>
        {!isLive && (
          <span className="text-[9px] text-yellow-400 uppercase font-jetbrains">Mock Data</span>
        )}
      </div>

      {/* 2x2 Matrix Grid */}
      <div className="relative flex-1 min-h-[300px] bg-black/20 rounded-lg overflow-hidden">
        {/* Quadrant backgrounds */}
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
          {quadrants.map((quadrant) => (
            <div
              key={quadrant.id}
              className={`relative bg-gradient-to-br ${quadrant.color} border border-white/10`}
            >
              <div className="absolute top-2 left-2">
                <div className="text-[10px] font-bold text-white/70 font-barlow uppercase">
                  {quadrant.label}
                </div>
                <div className="text-[8px] text-white/40 font-jetbrains">{quadrant.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Axis labels */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-[9px] text-white/50 font-barlow uppercase">
          Engagement Rate →
        </div>
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -rotate-90 text-[9px] text-white/50 font-barlow uppercase">
          Reach →
        </div>

        {/* Influencer dots */}
        {influencers.map((influencer, idx) => {
          const pos = getPosition(influencer.engagement, influencer.followers);
          return (
            <motion.div
              key={influencer.handle}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              className={`absolute w-8 h-8 ${getQuadrantColor(influencer.category)} 
                         rounded-full border-2 cursor-pointer hover:scale-125 transition-all duration-200
                         flex items-center justify-center group`}
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
              whileHover={{ scale: 1.5, zIndex: 10 }}
            >
              {/* Tooltip on hover */}
              <div
                className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 
                            bg-black/90 rounded-lg p-2 pointer-events-none z-20
                            transition-opacity duration-200 min-w-[150px]"
              >
                <div className="text-[10px] font-bold text-white font-barlow">
                  {influencer.name}
                </div>
                <div className="text-[9px] text-white/70 font-jetbrains">{influencer.handle}</div>
                <div className="grid grid-cols-2 gap-1 mt-1">
                  <div className="text-[8px] text-white/50">
                    Followers: {(influencer.followers / 1000).toFixed(0)}K
                  </div>
                  <div className="text-[8px] text-white/50">Engage: {influencer.engagement}%</div>
                  <div className="text-[8px] text-white/50 col-span-2">
                    Sentiment: {influencer.sentiment}%
                  </div>
                </div>
                {/* Tooltip arrow */}
                <div
                  className="absolute top-full left-1/2 transform -translate-x-1/2 -translate-y-1
                              border-4 border-transparent border-t-black/90"
                />
              </div>

              {/* Icon based on category */}
              {influencer.category === 'champion' && <Star className="w-3 h-3 text-white" />}
              {influencer.category === 'amplifier' && <TrendingUp className="w-3 h-3 text-white" />}
              {influencer.category === 'watcher' && <Target className="w-3 h-3 text-white" />}
              {influencer.category === 'risk' && <Users className="w-3 h-3 text-white" />}
            </motion.div>
          );
        })}
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/10">
        <button className="text-[9px] text-blue-400 hover:text-blue-300 font-barlow uppercase transition-colors">
          Export List
        </button>
        <button className="text-[9px] text-green-400 hover:text-green-300 font-barlow uppercase transition-colors">
          Contact Champions
        </button>
        <button className="text-[9px] text-red-400 hover:text-red-300 font-barlow uppercase transition-colors">
          Monitor Risks
        </button>
      </div>
    </div>
  );
};
