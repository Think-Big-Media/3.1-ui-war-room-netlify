import type React from 'react';
import { TrendingUp, Search, Activity, FileText, Zap, Share2 } from 'lucide-react';
import { BRAND_TOKENS } from '../../tokens/colors';

interface QuickAction {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  accentKey: keyof typeof BRAND_TOKENS;
}

const QuickActions: React.FC = () => {
  const actions: QuickAction[] = [
    {
      icon: TrendingUp,
      label: 'Viral Opps',
      accentKey: 'warRoom',
    },
    {
      icon: Search,
      label: 'Trend Opps',
      accentKey: 'intelligence',
    },
    {
      icon: Activity,
      label: 'Live Monitor',
      accentKey: 'liveMonitoring',
    },
    {
      icon: FileText,
      label: 'Make Content',
      accentKey: 'dashboard',
    },
    {
      icon: Share2,
      label: 'Social Media',
      accentKey: 'settings',
    },
    {
      icon: Zap,
      label: 'Alert Center',
      accentKey: 'alertCenter',
    },
  ];

  return (
    <div className="bg-black/15 backdrop-blur-lg rounded-2xl p-4 lg:p-6 border border-white/20 hover:bg-black/20 hoverable hover:scale-[1.02] transition-all duration-200 group fade-in">
      <div className="flex items-start justify-between mb-4 lg:mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 lg:p-3 bg-black/20 backdrop-blur-sm rounded-xl border border-white/20 hoverable transition-all duration-300">
            <Zap className="w-5 h-5 lg:w-6 lg:h-6 text-white/95" />
          </div>
          <h3 className="text-xl lg:text-2xl section-header tracking-wide">QUICK ACTIONS</h3>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {actions.map((action, index) => (
          <button
            key={index}
            className={`bg-black/20 backdrop-blur-sm rounded-xl p-4 lg:p-5 border border-white/20 hover:bg-white/0 hoverable hover:scale-[1.02] transition-all duration-200 flex flex-col items-center space-y-2 quick-action-${action.accentKey}`}
          >
            <action.icon className="w-6 h-6 lg:w-8 lg:h-8 quick-action-icon" />
            <span className="content-title text-white/90">{action.label}</span>
          </button>
        ))}
      </div>

      <div className="mt-4 lg:mt-6 pt-4 border-t border-white/20">
        <div className="flex items-center justify-between text-sm">
          <span className="footer-text text-white/75">Quick access to key features</span>
          <span className="footer-text status-active">Ready</span>
        </div>
      </div>
    </div>
  );
};

export default QuickActions;
