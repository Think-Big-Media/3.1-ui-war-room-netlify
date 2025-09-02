import React from 'react';
import { motion } from 'framer-motion';
import { Shield, AlertTriangle, Star, Target } from 'lucide-react';
import { MentionlyticsData } from '../../services/mentionlytics';
import { useDataMode } from '../../hooks/useDataMode';

interface RiskQualityIndicatorsProps {
  data: MentionlyticsData | null;
}

export const RiskQualityIndicators: React.FC<RiskQualityIndicatorsProps> = ({ data }) => {
  const { isLive } = useDataMode();

  const crisisRisk = data?.risk?.crisisLevel || 23;
  const qualityScore = data?.quality?.engagementQuality || 87;
  const threatLevel = data?.risk?.threatLevel || 'LOW';
  const opportunityCount = data?.opportunities?.active || 12;

  const getRiskColor = (risk: number) => {
    if (risk >= 70) return 'text-red-400';
    if (risk >= 40) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getThreatColor = (level: string) => {
    switch (level.toUpperCase()) {
      case 'HIGH':
        return 'text-red-400';
      case 'MEDIUM':
        return 'text-yellow-400';
      case 'LOW':
        return 'text-green-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: 0.3 }}
      className="h-full flex flex-col"
    >
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-barlow font-semibold text-white text-xs">Risk & Quality</h4>
        {!isLive && (
          <span className="text-[8px] text-yellow-400 uppercase font-jetbrains">Mock</span>
        )}
      </div>

      <div className="flex-1 space-y-3">
        {/* Crisis Risk */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-3 h-3 text-red-400" />
            <span className="text-[9px] text-white/70 font-barlow uppercase">Crisis</span>
          </div>
          <div className="text-right">
            <div className={`text-sm font-bold font-jetbrains ${getRiskColor(crisisRisk)}`}>
              {crisisRisk}
            </div>
            <div className="text-[8px] text-white/50 font-barlow">risk</div>
          </div>
        </div>

        {/* Quality Score */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="w-3 h-3 text-blue-400" />
            <span className="text-[9px] text-white/70 font-barlow uppercase">Quality</span>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-blue-400 font-jetbrains">{qualityScore}</div>
            <div className="text-[8px] text-white/50 font-barlow">score</div>
          </div>
        </div>

        {/* Threat Level */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-3 h-3 text-gray-400" />
            <span className="text-[9px] text-white/70 font-barlow uppercase">Threat</span>
          </div>
          <div className="text-right">
            <div className={`text-sm font-bold font-jetbrains ${getThreatColor(threatLevel)}`}>
              {threatLevel}
            </div>
            <div className="text-[8px] text-white/50 font-barlow">level</div>
          </div>
        </div>
      </div>

      {/* Overall status indicator */}
      <div className="mt-2 pt-2 border-t border-white/10">
        <div className="flex items-center justify-between">
          <span className="text-[8px] text-white/50 font-barlow uppercase">Status</span>
          <div className="flex items-center gap-1">
            <div
              className={`w-2 h-2 rounded-full ${
                crisisRisk < 30
                  ? 'bg-green-400'
                  : crisisRisk < 60
                    ? 'bg-yellow-400'
                    : 'bg-red-400 animate-pulse'
              }`}
            />
            <span className="text-[9px] text-white/70 font-barlow">
              {crisisRisk < 30 ? 'Secure' : crisisRisk < 60 ? 'Watchful' : 'Alert'}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
