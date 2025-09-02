/**
 * PageWrapper - Prevents page flashing on navigation
 * Wraps page content without animations
 */

import React from 'react';

interface PageWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export const PageWrapper: React.FC<PageWrapperProps> = ({ children, className = '' }) => {
  return <div className={`min-h-screen ${className}`}>{children}</div>;
};

export default PageWrapper;
