/**
 * War Room Platform - Integrated Frontend
 * Builder.io structure + V2Dashboard + Theme System
 */

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';

// Core Pages - Builder Export
import Dashboard from './pages/Dashboard'; // Fresh 30Aug Dashboard with SWOT radar
import CommandCenter from './pages/CommandCenter';
import RealTimeMonitoring from './pages/RealTimeMonitoring';
import CampaignControl from './pages/CampaignControl';
import IntelligenceHub from './pages/IntelligenceHub';
import AlertCenter from './pages/AlertCenter';
import SettingsPage from './pages/SettingsPage';

// Additional Dashboard Routes - Temporarily commented out to avoid missing dependencies
// import AnalyticsDashboard from './pages/AnalyticsDashboard';
import { AdminDashboard } from './components/AdminDashboard';
// import AutomationDashboard from './pages/AutomationDashboard';
// import DocumentIntelligence from './pages/DocumentIntelligence';
// import ContentCalendarPage from './pages/ContentCalendarPage';
// import ContentEnginePage from './pages/ContentEnginePage';
// import InformationCenter from './pages/InformationCenter';
// import DebugDashboard from './pages/DebugDashboard';
import NotFound from './pages/NotFound';

// 🏛️ Marcus Aurelius - Health Monitoring
import MarcusAureliusHealthPage from './components/MarcusAureliusHealthPage';
import MarcusAureliusFloatingIndicator from './components/MarcusAureliusFloatingIndicator';

// Builder.io Integration - Temporarily commented out to avoid missing dependencies
// import BuilderPage from './pages/BuilderPage';

// Components
import { ErrorBoundary } from './components/ErrorBoundary';
import TickerTape from './components/TickerTape';
import { NotificationProvider } from './components/shared/NotificationSystem';
import FloatingChatBar from './components/FloatingChatBar';
import { DebugSidecar } from './components/DebugSidecar';
import { useDebugTrigger } from './hooks/useDebugTrigger';

// Context Providers
import { SupabaseAuthProvider } from './contexts/SupabaseAuthContext';
import { BackgroundThemeProvider } from './contexts/BackgroundThemeContext';

// Styles
import './warroom.css';

// AppContent component that can use routing hooks
function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDebugOpen, closeDebug, openDebug } = useDebugTrigger();
  const [isAdminMode, setIsAdminMode] = React.useState(false);
  
  // 🔍 DIAGNOSTIC: Log debug state changes
  console.log('🔍 [DIAGNOSTIC] AppContent - isDebugOpen state:', isDebugOpen);
  console.log('🔍 [DIAGNOSTIC] AppContent - current route:', location.pathname);
  console.log('🔍 [DIAGNOSTIC] AppContent - isAdminMode state:', isAdminMode);

  // Listen for admin mode changes from TopNavigation
  React.useEffect(() => {
    const handleAdminModeChange = (e: CustomEvent) => {
      console.log('🔧 [ADMIN] Admin mode change received:', e.detail);
      if (e.detail?.isAdminMode !== undefined) {
        const newAdminMode = e.detail.isAdminMode;
        setIsAdminMode(newAdminMode);
        
        // Auto-open debug panel when in admin mode and NOT on admin dashboard
        if (newAdminMode && location.pathname !== '/admin-dashboard') {
          console.log('🔧 [ADMIN] Auto-opening debug panel for admin mode');
          openDebug();
        } else if (!newAdminMode) {
          // Close debug panel when exiting admin mode
          console.log('🔧 [ADMIN] Closing debug panel - exited admin mode');
          closeDebug();
        }
      }
    };

    window.addEventListener('admin-mode-change', handleAdminModeChange as EventListener);
    
    return () => {
      window.removeEventListener('admin-mode-change', handleAdminModeChange as EventListener);
    };
  }, [location.pathname, openDebug, closeDebug]);

  // Auto-open debug panel when navigating to different pages while in admin mode
  React.useEffect(() => {
    if (isAdminMode && location.pathname !== '/admin-dashboard') {
      console.log('🔧 [ADMIN] Auto-opening debug panel - navigated to:', location.pathname);
      openDebug();
    }
  }, [location.pathname, isAdminMode, openDebug]);
  
  return (
    <>
      <Routes>
        {/* Admin Dashboard Route */}
        <Route path="/admin-dashboard" element={
          <AdminDashboard 
            isOpen={true}
            onClose={() => navigate('/')}
            onNavigationClick={() => {/* Handle navigation mode switch */}}
          />
        } />
        
        {/* Command Center - Fresh 30-Aug with SWOT radar */}
        <Route path="/" element={<Dashboard />} />
        <Route path="/command-center" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />{' '}
        {/* Legacy route for compatibility */}
        {/* Core Navigation Routes */}
        <Route path="/command-center" element={<CommandCenter />} />
        <Route path="/real-time-monitoring" element={<RealTimeMonitoring />} />
        <Route path="/campaign-control" element={<CampaignControl />} />
        <Route path="/intelligence-hub" element={<IntelligenceHub />} />
        <Route path="/alert-center" element={<AlertCenter />} />
        <Route path="/settings" element={<SettingsPage />} />
        
        {/* 🏛️ Marcus Aurelius - Health Monitoring */}
        <Route path="/marcus-aurelius" element={<MarcusAureliusHealthPage />} />
        
        {/* 404 Fallback */}
        <Route path="*" element={<NotFound />} />
      </Routes>

      {/* Global Components */}
      <TickerTape />
      {/* Only show FloatingChatBar when NOT on admin dashboard (PageLayout handles it there) */}
      {location.pathname !== '/admin-dashboard' && (
        <FloatingChatBar 
          onSendMessage={() => {}}
          isAdminMode={false}
          pageContext={location.pathname}
        />
      )}
      
      {/* 🏛️ Marcus Aurelius - Floating Health Indicator - DISABLED temporarily */}
      {/* {location.pathname !== '/admin-dashboard' && <MarcusAureliusFloatingIndicator />} */}
      
      {/* Admin System - Debug Sidecar (Bottom Panel Mode) */}
      {location.pathname !== '/admin-dashboard' && (
        <div>
          {console.log('🔍 [DIAGNOSTIC] Rendering DebugSidecar with isOpen:', isDebugOpen)}
          <DebugSidecar isOpen={isDebugOpen} onClose={closeDebug} />
        </div>
      )}
    </>
  );
}

function App() {
  console.log('%c[DIAGNOSTIC] 5. App.tsx component function is executing.', 'color: yellow;');
  
  // 🔍 DIAGNOSTIC: Global marker for our enhanced code
  console.log('%c🔍 [CLEOPATRA-ENHANCED] This is the enhanced admin system version!', 'color: red; font-weight: bold; font-size: 14px;');
  (window as any).CLEOPATRA_ADMIN_VERSION = 'v2.0-enhanced';
  
  // Apply saved theme on app load
  React.useEffect(() => {
    const savedTheme = localStorage.getItem('war-room-background-theme') || 'tactical-camo';
    document.body.classList.add(`war-room-${savedTheme}`);
  }, []);

  // CRITICAL: Health check on load to prevent zombie frontend
  React.useEffect(() => {
    const checkBackendHealth = async () => {
      const backendUrl = import.meta.env.VITE_ENCORE_API_URL;
      if (!backendUrl) {
        console.warn('⚠️ No backend URL configured - skipping health check');
        return;
      }
      
      // Browser-compatible timeout using AbortController
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      try {
        const response = await fetch(`${backendUrl}/api/v1/health`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          signal: controller.signal
        });
        
        if (!response.ok || response.headers.get('content-type')?.includes('text/html')) {
          console.error('⚠️ Backend health check failed - serving HTML instead of JSON');
          // TODO: Show maintenance page or error boundary
        } else {
          const data = await response.json();
          console.log('✅ Backend health check passed:', data);
        }
      } catch (error) {
        console.error('❌ Backend unreachable:', error);
        // TODO: Show "Unable to Connect" page
      } finally {
        clearTimeout(timeoutId);
      }
    };
    
    checkBackendHealth();
  }, []);
  
  useEffect(() => {
    console.log('%c[DIAGNOSTIC] 6. App.tsx component has successfully mounted (useEffect).', 'color: green; font-weight: bold;');
  }, []);
  
  return (
    <>
      <SupabaseAuthProvider>
        <BackgroundThemeProvider>
          <NotificationProvider>
            <Router>
              <ErrorBoundary>
                <AppContent />
              </ErrorBoundary>
            </Router>
          </NotificationProvider>
        </BackgroundThemeProvider>
      </SupabaseAuthProvider>
    </>
  );
}

export default App;
