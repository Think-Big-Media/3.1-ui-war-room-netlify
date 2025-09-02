import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Target, Hash } from 'lucide-react';

interface ActiveCampaign {
  name: string;
  candidate: string;
  party: string;
  keywords: string[];
  competitors: Array<{
    name: string;
    party: string;
    keywords: string[];
  }>;
  setupDate: string;
  isActive: boolean;
}

export const ActiveCampaignWidget: React.FC = () => {
  const [campaign, setCampaign] = useState<ActiveCampaign | null>(null);

  useEffect(() => {
    // Load campaign data from localStorage
    const loadCampaign = () => {
      const stored = localStorage.getItem('warRoomActiveCampaign');
      if (stored) {
        try {
          setCampaign(JSON.parse(stored));
        } catch (error) {
          console.error('Error loading campaign data:', error);
        }
      }
    };

    loadCampaign();

    // Listen for storage changes (when campaign is updated)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'warRoomActiveCampaign') {
        loadCampaign();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  if (!campaign || !campaign.isActive) {
    return (
      <div className="bg-white/10 border border-white/20 rounded-lg p-4">
        <h3 className="text-white font-semibold mb-2">No Active Campaign</h3>
        <p className="text-white/60 text-sm">Set up a campaign to see tracking data</p>
      </div>
    );
  }

  const partyColors: Record<string, string> = {
    Republican: 'text-red-400',
    Democrat: 'text-blue-400',
    Independent: 'text-purple-400',
    Other: 'text-gray-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/10 border border-white/20 rounded-lg p-4"
    >
      <div className="flex items-center space-x-2 mb-3">
        <Target className="w-5 h-5 text-green-400" />
        <h3 className="text-white font-semibold">Active Campaign</h3>
        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">LIVE</span>
      </div>

      <div className="space-y-2">
        <div>
          <div className="text-sm text-white/60">Campaign</div>
          <div className="text-white font-medium">{campaign.name}</div>
        </div>

        <div>
          <div className="text-sm text-white/60">Candidate</div>
          <div className={`font-medium ${partyColors[campaign.party]}`}>
            {campaign.candidate} ({campaign.party})
          </div>
        </div>

        <div className="flex items-center space-x-4 text-xs text-white/60">
          <div className="flex items-center space-x-1">
            <Hash className="w-3 h-3" />
            <span>{campaign.keywords.length} keywords</span>
          </div>
          <div className="flex items-center space-x-1">
            <Users className="w-3 h-3" />
            <span>{campaign.competitors.length} competitors</span>
          </div>
        </div>

        {campaign.keywords.length > 0 && (
          <div>
            <div className="text-xs text-white/60 mb-1">Tracking Keywords</div>
            <div className="flex flex-wrap gap-1">
              {campaign.keywords.slice(0, 3).map((keyword, idx) => (
                <span key={idx} className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                  {keyword}
                </span>
              ))}
              {campaign.keywords.length > 3 && (
                <span className="text-xs text-white/40">+{campaign.keywords.length - 3} more</span>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
