/**
 * War Room Platform - Integrated Frontend
 * Builder.io structure + V2Dashboard + Theme System
 */

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

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
// import AutomationDashboard from './pages/AutomationDashboard';
// import DocumentIntelligence from './pages/DocumentIntelligence';
// import ContentCalendarPage from './pages/ContentCalendarPage';
// import ContentEnginePage from './pages/ContentEnginePage';
// import InformationCenter from './pages/InformationCenter';
// import DebugDashboard from './pages/DebugDashboard';
import NotFound from './pages/NotFound';

// Builder.io Integration - Temporarily commented out to avoid missing dependencies
// import BuilderPage from './pages/BuilderPage';

// Components
import { ErrorBoundary } from './components/ErrorBoundary';
import TickerTape from './components/TickerTape';
import { NotificationProvider } from './components/shared/NotificationSystem';
import FloatingChatBar from './components/FloatingChatBar';
import { DebugSidecar, useDebugTrigger } from './components/DebugSidecar';

// Context Providers
import { SupabaseAuthProvider } from './contexts/SupabaseAuthContext';
import { BackgroundThemeProvider } from './contexts/BackgroundThemeContext';

// Styles
import './warroom.css';

function App() {
  console.log('%c[DIAGNOSTIC] 5. App.tsx component function is executing.', 'color: yellow;');
  
  // Initialize debug trigger hook
  const { isDebugOpen, closeDebug } = useDebugTrigger();
  
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
              <Routes>
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
                {/* Additional Dashboard Routes - Temporarily disabled */}
                {/* <Route path="/analytics" element={<AnalyticsDashboard />} />
                <Route path="/automation" element={<AutomationDashboard />} />
                <Route path="/documents" element={<DocumentIntelligence />} />
                <Route path="/information-center" element={<InformationCenter />} />
                
                Content Management Routes
                <Route path="/content-calendar" element={<ContentCalendarPage />} />
                <Route path="/content-engine" element={<ContentEnginePage />} />
                
                Builder.io Routes
                <Route path="/builder/*" element={<BuilderPage />} />
                <Route path="/builder" element={<BuilderPage />} />
                
                Development Routes
                {import.meta.env.DEV && (
                  <Route path="/debug" element={<DebugDashboard />} />
                )} */}
                {/* 404 Fallback */}
                <Route path="*" element={<NotFound />} />
              </Routes>

              {/* Global Components */}
              <TickerTape />
              
              {/* Admin System - Debug Sidecar */}
              <DebugSidecar isOpen={isDebugOpen} onClose={closeDebug} />
              </ErrorBoundary>
            </Router>
          </NotificationProvider>
        </BackgroundThemeProvider>
      </SupabaseAuthProvider>
    </>
  );
}

export default App;
