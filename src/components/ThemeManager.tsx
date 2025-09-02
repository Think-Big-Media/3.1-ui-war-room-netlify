import React, { useEffect, useState } from 'react';

// Define theme styles directly in JavaScript to bypass all CSS issues
const THEMES = {
  'dark-slate': {
    name: '🌑 Dark Slate',
    style: {
      background:
        'linear-gradient(135deg, #0f172a 0%, #020617 25%, #000000 50%, #111111 75%, #000000 100%)',
      minHeight: '100vh',
      backgroundAttachment: 'fixed',
    },
  },
  'classic-blue': {
    name: '🌊 Classic Blue',
    style: {
      background: 'linear-gradient(135deg, #475569 0%, #334155 25%, #1e293b 75%, #0f172a 100%)',
      minHeight: '100vh',
      backgroundAttachment: 'fixed',
    },
  },
  'tactical-camo': {
    name: '🌲 Tactical Camo',
    style: {
      background: `
        linear-gradient(135deg, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.6) 25%, rgba(0, 0, 0, 0.7) 50%, rgba(0, 0, 0, 0.8) 75%, rgba(0, 0, 0, 0.9) 100%),
        repeating-linear-gradient(45deg, rgba(15, 80, 35, 0.4) 0px, rgba(15, 80, 35, 0.4) 60px, transparent 60px, transparent 120px),
        repeating-linear-gradient(135deg, rgba(20, 60, 30, 0.35) 0px, rgba(20, 60, 30, 0.35) 40px, transparent 40px, transparent 80px),
        repeating-linear-gradient(-30deg, rgba(146, 64, 14, 0.2) 0px, rgba(146, 64, 14, 0.2) 80px, transparent 80px, transparent 160px),
        radial-gradient(ellipse 300px 200px at 15% 25%, rgba(10, 40, 20, 0.5) 0%, rgba(15, 50, 25, 0.3) 50%, transparent 80%),
        radial-gradient(ellipse 400px 250px at 85% 75%, rgba(12, 45, 22, 0.45) 0%, rgba(18, 55, 28, 0.25) 40%, transparent 75%),
        linear-gradient(135deg, #052e16 0%, #14532d 25%, #166534 50%, #15803d 75%, #166534 100%)
      `,
      minHeight: '100vh',
      backgroundAttachment: 'fixed',
    },
  },
  'digital-camo': {
    name: '💻 Digital Camo',
    style: {
      background: `
        repeating-linear-gradient(0deg, rgba(75, 85, 99, 0.3) 0px, rgba(75, 85, 99, 0.3) 80px, transparent 80px, transparent 160px),
        repeating-linear-gradient(90deg, rgba(55, 65, 81, 0.25) 0px, rgba(55, 65, 81, 0.25) 80px, transparent 80px, transparent 160px),
        repeating-linear-gradient(45deg, rgba(107, 114, 128, 0.2) 0px, rgba(107, 114, 128, 0.2) 50px, transparent 50px, transparent 100px),
        radial-gradient(ellipse 300px 180px at 25% 75%, rgba(34, 197, 94, 0.15) 0%, transparent 70%),
        radial-gradient(ellipse 250px 250px at 75% 25%, rgba(22, 163, 74, 0.12) 0%, transparent 60%),
        linear-gradient(135deg, #111827 0%, #1f2937 25%, #374151 50%, #4b5563 75%, #6b7280 100%)
      `,
      minHeight: '100vh',
      backgroundAttachment: 'fixed',
    },
  },
};

const ThemeManager: React.FC = () => {
  const [currentTheme, setCurrentTheme] = useState<keyof typeof THEMES>('tactical-camo');
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Load saved theme
    const saved = localStorage.getItem('war-room-theme') as keyof typeof THEMES;
    if (saved && THEMES[saved]) {
      setCurrentTheme(saved);
      applyTheme(saved);
    } else {
      applyTheme('dark-slate');
    }
  }, []);

  const applyTheme = (theme: keyof typeof THEMES) => {
    const themeConfig = THEMES[theme];

    // Apply to both body AND root element to ensure it works
    const applyStyles = (element: HTMLElement) => {
      Object.assign(element.style, themeConfig.style);
    };

    applyStyles(document.body);

    const root = document.getElementById('root');
    if (root) {
      // Make root transparent so body shows through
      root.style.backgroundColor = 'transparent';
    }

    // Save preference
    localStorage.setItem('war-room-theme', theme);
    setCurrentTheme(theme);

    console.log('✅ Theme applied:', theme);
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed top-20 right-4 z-[60] p-2 rounded-lg bg-black/50 hover:bg-black/70 transition-all"
        title="Toggle theme selector"
      >
        🎨
      </button>

      {/* Theme Buttons */}
      {isVisible && (
        <div className="fixed top-32 right-4 z-50 flex flex-col gap-2">
          {Object.entries(THEMES).map(([key, theme]) => (
            <button
              key={key}
              onClick={() => applyTheme(key as keyof typeof THEMES)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                currentTheme === key
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                  : 'bg-black/50 text-white/70 hover:bg-black/70 hover:text-white backdrop-blur-sm'
              }`}
            >
              {theme.name}
            </button>
          ))}
        </div>
      )}
    </>
  );
};

export default ThemeManager;
