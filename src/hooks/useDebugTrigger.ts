// 🔧 Simple Debug Trigger Hook - Extracted from DebugSidecar
import { useState, useEffect, useCallback } from 'react';

export const useDebugTrigger = () => {
  const [isDebugOpen, setIsDebugOpen] = useState(false);

  const openDebug = useCallback(() => {
    console.log('🔧 [DEBUG] Opening debug panel');
    setIsDebugOpen(true);
  }, []);

  const closeDebug = useCallback(() => {
    console.log('🔧 [DEBUG] Closing debug panel');
    setIsDebugOpen(false);
  }, []);

  useEffect(() => {
    let clickCount = 0;
    let clickTimer: NodeJS.Timeout;

    const handleClick = (e: MouseEvent) => {
      // Bottom-right corner trigger (100px square)
      if (e.clientX > window.innerWidth - 100 && e.clientY > window.innerHeight - 100) {
        clickCount++;

        if (clickCount === 1) {
          clickTimer = setTimeout(() => {
            clickCount = 0;
          }, 400); // 400ms window for double-click
        } else if (clickCount === 2) {
          clearTimeout(clickTimer);
          clickCount = 0;
          openDebug();
        }
      }
    };

    const handleKeydown = (e: KeyboardEvent) => {
      // Alt+Shift+D shortcut
      if (e.altKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        openDebug();
      }
      // Escape to close
      if (e.key === 'Escape' && isDebugOpen) {
        e.preventDefault();
        closeDebug();
      }
    };

    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKeydown);

    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleKeydown);
      if (clickTimer) clearTimeout(clickTimer);
    };
  }, [isDebugOpen, openDebug, closeDebug]);

  return {
    isDebugOpen,
    openDebug,
    closeDebug
  };
};