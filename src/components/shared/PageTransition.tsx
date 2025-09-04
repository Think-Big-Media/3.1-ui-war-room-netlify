/**
 * Luxurious Page Transition Component
 * Provides smooth, premium transitions between pages
 * Special handling for War Room transitions
 */

import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { usePerformanceMonitor } from '../../hooks/usePerformanceMonitor';

interface PageTransitionProps {
  children: React.ReactNode;
}

const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
  const location = useLocation();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [currentBg, setCurrentBg] = useState('bg-dashboard');
  const { logOptimizationTips } = usePerformanceMonitor('PageTransition');

  // Route to background mapping
  const getBackgroundClass = (pathname: string): string => {
    switch (pathname) {
      case '/':
        return 'bg-dashboard';
      case '/real-time-monitoring':
        return 'bg-live-monitoring';
      case '/campaign-control':
        return 'bg-war-room';
      case '/intelligence-hub':
        return 'bg-intelligence';
      case '/alert-center':
        return 'bg-alert-center';
      case '/settings':
        return 'bg-settings';
      default:
        return 'bg-dashboard';
    }
  };

  // Check if transitioning to/from War Room (includes CommandCenter and CampaignControl)
  const isWarRoomTransition = (pathname: string): boolean => {
    return (
      pathname === '/campaign-control' ||
      pathname === '/CommandCenter' ||
      pathname === '/command-center' ||
      pathname.includes('campaign-control') ||
      pathname.includes('command-center')
    );
  };

  // Get transition classes based on route
  const getTransitionClasses = (): string => {
    const baseClasses = ['page-transition-container'];

    // Disable ALL transitions for War Room
    if (isWarRoomTransition(location.pathname)) {
      return baseClasses.join(' ');
    }

    baseClasses.push('page-enter');

    if (isTransitioning) {
      baseClasses.push('page-enter-active');
    }

    return baseClasses.join(' ');
  };

  // Handle route changes with transitions
  useEffect(() => {
    // Skip all animation logic for War Room pages
    if (isWarRoomTransition(location.pathname)) {
      setIsTransitioning(false);
      const newBg = getBackgroundClass(location.pathname);
      setCurrentBg(newBg);
      return;
    }

    setIsTransitioning(true);

    // Update background class
    const newBg = getBackgroundClass(location.pathname);
    setCurrentBg(newBg);

    // Add stagger effect to cards (only for non-War Room pages)
    const cards = document.querySelectorAll('[class*="Card"], .card, [class*="card"]');
    cards.forEach((card, index) => {
      if (card instanceof HTMLElement) {
        card.style.animationDelay = `${index * 100}ms`;
        card.classList.add('cards-stagger');
        card.classList.add('fade-in');
      }
    });

    // Complete transition
    const transitionDuration = 800;
    const timer = setTimeout(() => {
      setIsTransitioning(false);
    }, transitionDuration);

    return () => {
      clearTimeout(timer);
    };
  }, [location.pathname]);

  // Log performance optimizations in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      logOptimizationTips();
    }
  }, [logOptimizationTips]);

  return (
    <>
      {/* Dynamic background */}
      <div className={`background-transition ${currentBg}`} />

      {/* Page content with transitions */}
      <div className={getTransitionClasses()}>{children}</div>
    </>
  );
};

export default PageTransition;
