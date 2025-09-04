import React, { useState, useEffect } from 'react';

const ThemeButtons: React.FC = () => {
  const [currentTheme, setCurrentTheme] = useState('tactical-camo');

  useEffect(() => {
    // Load saved theme
    const saved = localStorage.getItem('war-room-background-theme');
    if (saved) {
      setCurrentTheme(saved);
      applyTheme(saved);
    }
  }, []);

  const applyTheme = (theme: string) => {
    // Remove all theme classes
    document.body.classList.remove(
      'war-room-classic-blue',
      'war-room-tactical-camo',
      'war-room-digital-camo',
      'war-room-dark-slate'
    );

    // Add the new theme class
    document.body.classList.add(`war-room-${theme}`);

    // Save to localStorage
    localStorage.setItem('war-room-background-theme', theme);
    setCurrentTheme(theme);

    console.log('Theme applied:', theme);
  };

  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-2">
      <button
        onClick={() => applyTheme('classic-blue')}
        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
          currentTheme === 'classic-blue'
            ? 'bg-sky-500 text-white shadow-lg'
            : 'bg-black/50 text-white/70 hover:bg-black/70 hover:text-white'
        }`}
      >
        🌊 Classic Blue
      </button>

      <button
        onClick={() => applyTheme('tactical-camo')}
        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
          currentTheme === 'tactical-camo'
            ? 'bg-green-600 text-white shadow-lg'
            : 'bg-black/50 text-white/70 hover:bg-black/70 hover:text-white'
        }`}
      >
        🌲 Tactical Camo
      </button>

      <button
        onClick={() => applyTheme('digital-camo')}
        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
          currentTheme === 'digital-camo'
            ? 'bg-gray-600 text-white shadow-lg'
            : 'bg-black/50 text-white/70 hover:bg-black/70 hover:text-white'
        }`}
      >
        💻 Digital Camo
      </button>

      <button
        onClick={() => applyTheme('dark-slate')}
        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
          currentTheme === 'dark-slate'
            ? 'bg-slate-700 text-white shadow-lg'
            : 'bg-black/50 text-white/70 hover:bg-black/70 hover:text-white'
        }`}
      >
        🌑 Dark Slate
      </button>
    </div>
  );
};

export default ThemeButtons;
