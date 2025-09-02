import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const CommandStatusBar: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handlePlatformClick = (platform: string) => {
    switch (platform) {
      case 'meta':
        navigate('/campaign-control');
        break;
      case 'google':
        navigate('/campaign-control');
        break;
      case 'social':
        navigate('/real-time-monitoring');
        break;
      case 'analytics':
        navigate('/intelligence-hub');
        break;
      default:
        break;
    }
  };

  const handleMetricClick = (metric: string) => {
    switch (metric) {
      case 'mentions':
        navigate('/real-time-monitoring');
        break;
      case 'alerts':
        navigate('/alert-center');
        break;
      case 'opportunities':
        navigate('/intelligence-hub?category=opportunity');
        break;
      case 'threats':
        navigate('/intelligence-hub?category=threat');
        break;
      default:
        break;
    }
  };

  const formatTime = (date: Date) => {
    return (
      date.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'America/New_York',
      }) + ' EST'
    );
  };

  return (
    <div>
      <div className="relative h-12 flex items-center justify-between px-6 border border-white/20 bg-black/20 backdrop-blur-xl rounded-lg">
        {/* Left positioned - Platform indicators moved 40px more to the left */}
        <div className="absolute left-4 flex items-baseline gap-3">
          <div
            onClick={() => handlePlatformClick('meta')}
            className="flex items-baseline gap-2 bg-green-500/20 px-3 py-1.5 rounded-md border border-green-500/30 cursor-pointer hover:bg-green-500/30 hover:border-green-500/50 transition-all duration-200 transform hover:scale-105"
          >
            <span className="text-xs text-green-400 leading-none">●</span>
            <span className="text-sm text-green-300 font-medium font-condensed uppercase tracking-wider leading-none">
              META
            </span>
          </div>
          <div
            onClick={() => handlePlatformClick('google')}
            className="flex items-baseline gap-2 bg-blue-500/20 px-3 py-1.5 rounded-md border border-blue-500/30 cursor-pointer hover:bg-blue-500/30 hover:border-blue-500/50 transition-all duration-200 transform hover:scale-105"
          >
            <span className="text-xs text-blue-400 leading-none">●</span>
            <span className="text-sm text-blue-300 font-medium font-condensed uppercase tracking-wider leading-none">
              GOOGLE
            </span>
          </div>
          <div
            onClick={() => handlePlatformClick('social')}
            className="flex items-baseline gap-2 bg-purple-500/20 px-3 py-1.5 rounded-md border border-purple-500/30 cursor-pointer hover:bg-purple-500/30 hover:border-purple-500/50 transition-all duration-200 transform hover:scale-105"
          >
            <span className="text-xs text-purple-400 leading-none">●</span>
            <span className="text-sm text-purple-300 font-medium font-condensed uppercase tracking-wider leading-none">
              SOCIAL
            </span>
          </div>
          <div
            onClick={() => handlePlatformClick('analytics')}
            className="flex items-baseline gap-2 bg-orange-500/20 px-3 py-1.5 rounded-md border border-orange-500/30 cursor-pointer hover:bg-orange-500/30 hover:border-orange-500/50 transition-all duration-200 transform hover:scale-105"
          >
            <span className="text-xs text-orange-400 leading-none">●</span>
            <span className="text-sm text-orange-300 font-medium font-condensed uppercase tracking-wider leading-none">
              ANALYTICS
            </span>
          </div>
        </div>

        {/* Right positioned - Metrics aligned with dashboard content */}
        <div className="absolute right-[200px] flex items-baseline gap-3">
          <div
            onClick={() => handleMetricClick('mentions')}
            className="bg-gray-700/50 px-3 py-1.5 rounded-md border border-gray-600/50 flex items-baseline cursor-pointer hover:bg-gray-600/60 hover:border-gray-500/60 transition-all duration-200 transform hover:scale-105"
          >
            <span className="text-xs font-bold text-white font-jetbrains leading-none">236</span>
            <span className="text-sm text-gray-400 ml-1.5 font-condensed uppercase tracking-wider leading-none">MENTIONS</span>
          </div>

          <div
            onClick={() => handleMetricClick('alerts')}
            className="bg-orange-500/20 px-3 py-1.5 rounded-md border border-orange-500/30 flex items-baseline cursor-pointer hover:bg-orange-500/30 hover:border-orange-500/50 transition-all duration-200 transform hover:scale-105"
          >
            <span className="text-xs font-bold text-orange-400 font-jetbrains leading-none">9</span>
            <span className="text-sm text-orange-300 ml-1.5 font-condensed uppercase tracking-wider leading-none">ALERTS</span>
          </div>

          <div
            onClick={() => handleMetricClick('opportunities')}
            className="bg-green-500/20 px-3 py-1.5 rounded-md border border-green-500/30 hidden lg:flex items-baseline cursor-pointer hover:bg-green-500/30 hover:border-green-500/50 transition-all duration-200 transform hover:scale-105"
          >
            <span className="text-xs font-bold text-green-400 font-jetbrains leading-none">18</span>
            <span className="text-sm text-green-300 ml-1.5 font-condensed uppercase tracking-wider leading-none">
              OPPORTUNITIES
            </span>
          </div>

          <div
            onClick={() => handleMetricClick('threats')}
            className="bg-red-500/20 px-3 py-1.5 rounded-md border border-red-500/30 hidden xl:flex items-baseline cursor-pointer hover:bg-red-500/30 hover:border-red-500/50 transition-all duration-200 transform hover:scale-105"
          >
            <span className="text-xs font-bold text-red-400 font-jetbrains leading-none">3</span>
            <span className="text-sm text-red-300 ml-1.5 font-condensed uppercase tracking-wider leading-none">THREATS</span>
          </div>
        </div>

        {/* Far right - Time display aligned with dashboard content */}
        <div className="absolute right-4 flex items-center gap-4">
          {/* Vertical separator */}
          <div className="h-6 w-px bg-gray-600"></div>

          {/* Time display - no container, white text */}
          <span className="text-sm font-jetbrains font-bold text-white">{formatTime(currentTime)}</span>
        </div>
      </div>
    </div>
  );
};

export default CommandStatusBar;
