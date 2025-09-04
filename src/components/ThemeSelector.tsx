import React from 'react';
import { useBackgroundTheme } from '../contexts/BackgroundThemeContext';
import { Palette } from 'lucide-react';
import type { BackgroundTheme } from '../contexts/BackgroundThemeContext';

const ThemeSelector: React.FC = () => {
  const { currentTheme, setTheme, availableThemes } = useBackgroundTheme();

  const getThemeIcon = (themeId: BackgroundTheme) => {
    switch (themeId) {
      case 'classic-blue':
        return '🌊';
      case 'tactical-camo':
        return '🌲';
      case 'digital-camo':
        return '💻';
      case 'dark-slate':
        return '🌑';
      default:
        return '🎨';
    }
  };

  const getThemeButtonClasses = (themeId: BackgroundTheme) => {
    const isActive = currentTheme === themeId;
    const baseClasses =
      'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 backdrop-blur-md';

    if (isActive) {
      switch (themeId) {
        case 'classic-blue':
          return `${baseClasses} bg-sky-400/30 text-sky-300 border border-sky-400/50 shadow-lg shadow-sky-400/20`;
        case 'tactical-camo':
          return `${baseClasses} bg-emerald-400/30 text-emerald-300 border border-emerald-400/50 shadow-lg shadow-emerald-400/20`;
        case 'digital-camo':
          return `${baseClasses} bg-slate-400/30 text-slate-300 border border-slate-400/50 shadow-lg shadow-slate-400/20`;
        case 'dark-slate':
          return `${baseClasses} bg-violet-400/30 text-violet-300 border border-violet-400/50 shadow-lg shadow-violet-400/20`;
        default:
          return `${baseClasses} bg-white/20 text-white border border-white/30`;
      }
    } else {
      return `${baseClasses} bg-black/20 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white hover:border-white/20`;
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-black/40 backdrop-blur-xl rounded-xl border border-white/10 p-2">
        <div className="flex items-center gap-2 mb-2">
          <Palette className="w-3 h-3 text-white/60" />
          <span className="text-[10px] text-white/60 uppercase font-barlow font-semibold tracking-wider">
            Theme
          </span>
        </div>
        <div className="flex flex-col gap-1">
          {availableThemes.map((theme) => (
            <button
              key={theme.id}
              onClick={() => setTheme(theme.id)}
              className={getThemeButtonClasses(theme.id)}
              title={theme.description}
            >
              <span className="text-sm">{getThemeIcon(theme.id)}</span>
              <span className="font-barlow uppercase tracking-wide">{theme.name}</span>
              {currentTheme === theme.id && (
                <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse ml-auto" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ThemeSelector;
