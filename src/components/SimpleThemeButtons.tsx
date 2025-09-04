import React from 'react';
import { useBackgroundTheme, type BackgroundTheme } from '../contexts/BackgroundThemeContext';

const SimpleThemeButtons: React.FC = () => {
  const { currentTheme, setTheme, availableThemes } = useBackgroundTheme();

  return (
    <div className="flex gap-2 flex-wrap mt-3">
      {availableThemes.map((theme) => (
        <button
          key={theme.id}
          onClick={() => {
            console.log('Setting theme to:', theme.id);
            setTheme(theme.id);
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
            currentTheme === theme.id
              ? 'bg-white/20 text-white border-white/40 shadow-md'
              : 'bg-white/5 text-white/70 border-white/20 hover:bg-white/10 hover:text-white hover:border-white/30'
          }`}
        >
          {theme.name}
        </button>
      ))}
    </div>
  );
};

export default SimpleThemeButtons;
