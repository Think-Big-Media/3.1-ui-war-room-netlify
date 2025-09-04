import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Zap, Activity } from 'lucide-react';
import { MentionlyticsData } from '../../services/mentionlytics';
import { useDataMode } from '../../hooks/useDataMode';

interface CampaignMomentumProps {
  data: MentionlyticsData | null;
}

export const CampaignMomentum: React.FC<CampaignMomentumProps> = ({ data }) => {
  const { isLive } = useDataMode();

  const velocity = data?.momentum?.velocity || 42;
  const viralCoeff = data?.momentum?.viralCoeff || 2.3;
  const trendScore = data?.momentum?.trendScore || 78;

  const getVelocityColor = (velocity: number) => {
    if (velocity >= 70) return 'text-green-400';
    if (velocity >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="h-full flex flex-col"
    >
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-barlow font-semibold text-white text-xs">Momentum</h4>
        {!isLive && (
          <span className="text-[8px] text-yellow-400 uppercase font-jetbrains">Mock</span>
        )}
      </div>

      <div className="flex-1 space-y-3">
        {/* Velocity */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-3 h-3 text-blue-400" />
            <span className="text-[9px] text-white/70 font-barlow uppercase">Velocity</span>
          </div>
          <div className="text-right">
            <div className={`text-sm font-bold font-jetbrains ${getVelocityColor(velocity)}`}>
              {velocity}
            </div>
            <div className="text-[8px] text-white/50 font-barlow">mph</div>
          </div>
        </div>

        {/* Viral Coefficient */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-3 h-3 text-purple-400" />
            <span className="text-[9px] text-white/70 font-barlow uppercase">Viral</span>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-purple-400 font-jetbrains">{viralCoeff}x</div>
            <div className="text-[8px] text-white/50 font-barlow">coeff</div>
          </div>
        </div>

        {/* Trend Score */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-3 h-3 text-orange-400" />
            <span className="text-[9px] text-white/70 font-barlow uppercase">Trend</span>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-orange-400 font-jetbrains">{trendScore}</div>
            <div className="text-[8px] text-white/50 font-barlow">score</div>
          </div>
        </div>
      </div>

      {/* Overall momentum indicator */}
      <div className="mt-2 pt-2 border-t border-white/10">
        <div className="flex items-center justify-between">
          <span className="text-[8px] text-white/50 font-barlow uppercase">Overall</span>
          <div className="flex items-center gap-1">
            <div
              className={`w-2 h-2 rounded-full ${velocity >= 50 ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`}
            />
            <span className="text-[9px] text-white/70 font-barlow">
              {velocity >= 50 ? 'Rising' : 'Building'}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
