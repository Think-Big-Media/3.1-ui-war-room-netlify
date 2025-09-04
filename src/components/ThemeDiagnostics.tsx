import React, { useEffect, useState } from 'react';

const ThemeDiagnostics: React.FC = () => {
  const [diagnostics, setDiagnostics] = useState<string[]>([]);

  useEffect(() => {
    const logs: string[] = [];

    // 1. Check body classes
    const bodyClasses = Array.from(document.body.classList);
    logs.push(`Body classes: ${bodyClasses.join(', ') || 'NONE'}`);

    // 2. Check body computed style
    const bodyStyle = window.getComputedStyle(document.body);
    logs.push(`Body background: ${bodyStyle.background.substring(0, 100)}...`);
    logs.push(`Body backgroundColor: ${bodyStyle.backgroundColor}`);

    // 3. Check root element
    const rootEl = document.getElementById('root');
    if (rootEl) {
      const rootStyle = window.getComputedStyle(rootEl);
      logs.push(`Root background: ${rootStyle.background.substring(0, 100)}...`);
      logs.push(`Root backgroundColor: ${rootStyle.backgroundColor}`);
      logs.push(`Root classes: ${rootEl.className || 'NONE'}`);
    } else {
      logs.push('Root element NOT FOUND');
    }

    // 4. Check if CSS file is loaded
    const styleSheets = Array.from(document.styleSheets);
    const hasThemeCSS = styleSheets.some((sheet) => {
      try {
        return (
          sheet.href?.includes('background-themes') ||
          Array.from(sheet.cssRules || []).some((rule) =>
            rule.cssText?.includes('war-room-tactical-camo')
          )
        );
      } catch (e) {
        return false;
      }
    });
    logs.push(`Theme CSS loaded: ${hasThemeCSS ? 'YES' : 'NO'}`);

    // 5. Check localStorage
    const savedTheme = localStorage.getItem('war-room-background-theme');
    logs.push(`Saved theme: ${savedTheme || 'NONE'}`);

    // 6. Check for conflicting styles
    const allElements = document.querySelectorAll('*');
    let conflictingElements: string[] = [];
    allElements.forEach((el) => {
      const style = window.getComputedStyle(el);
      if (
        style.background &&
        style.background !== 'none' &&
        style.background !== 'rgba(0, 0, 0, 0)' &&
        el.tagName !== 'BODY' &&
        el.tagName !== 'HTML'
      ) {
        const id = el.id || el.className || el.tagName;
        if (!conflictingElements.includes(id)) {
          conflictingElements.push(id);
        }
      }
    });
    logs.push(`Elements with backgrounds: ${conflictingElements.slice(0, 5).join(', ')}...`);

    // 7. Check z-index
    const bodyZIndex = bodyStyle.zIndex;
    logs.push(`Body z-index: ${bodyZIndex || 'auto'}`);

    setDiagnostics(logs);

    // Log to console for debugging
    console.log('🔍 THEME DIAGNOSTICS:', logs);
  }, []);

  return (
    <div className="fixed bottom-20 left-4 z-[9999] bg-black/90 text-green-400 p-4 rounded-lg max-w-lg font-mono text-xs">
      <div className="text-yellow-400 mb-2 font-bold">🔍 THEME DIAGNOSTICS</div>
      {diagnostics.map((log, i) => (
        <div key={i} className="mb-1">
          {log}
        </div>
      ))}
    </div>
  );
};

export default ThemeDiagnostics;
