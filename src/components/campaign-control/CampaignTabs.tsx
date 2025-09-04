// Campaign Control Tab Navigation Component

import type React from 'react';
import { Target, FileText, Activity, BarChart3 } from 'lucide-react';
import { type CampaignTab } from '../../types/campaign';

interface CampaignTabsProps {
  activeTab: CampaignTab;
  onTabChange: (tab: CampaignTab) => void;
}

const CampaignTabs: React.FC<CampaignTabsProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'analytics' as CampaignTab, label: 'Ad Campaigns', icon: BarChart3 },
    {
      id: 'projects' as CampaignTab,
      label: 'Strategic Projects',
      icon: Target,
    },
    { id: 'assets' as CampaignTab, label: 'Asset Library', icon: FileText },
    { id: 'activity' as CampaignTab, label: 'Team Activity', icon: Activity },
  ];

  return (
    <div className="flex space-x-4 mb-6">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex items-center space-x-2 px-3 py-1.5 text-sm rounded-lg transition-all duration-200 ${
            activeTab === tab.id
              ? 'bg-white/20 text-white border border-white/30'
              : 'text-white/70 hover:text-white hover:bg-white/10'
          }`}
        >
          <tab.icon className="w-4 h-4" />
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
};

export default CampaignTabs;
