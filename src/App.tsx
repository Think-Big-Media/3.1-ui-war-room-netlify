/**
 * War Room Platform - Integrated Frontend
 * Builder.io structure + V2Dashboard + Theme System
 */

import React from 'react';
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

// Context Providers
import { SupabaseAuthProvider } from './contexts/SupabaseAuthContext';
import { BackgroundThemeProvider } from './contexts/BackgroundThemeContext';

// Styles
import './warroom.css';

function App() {
  // Apply saved theme on app load
  React.useEffect(() => {
    const savedTheme = localStorage.getItem('war-room-background-theme') || 'tactical-camo';
    document.body.classList.add(`war-room-${savedTheme}`);
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
              </ErrorBoundary>
            </Router>
          </NotificationProvider>
        </BackgroundThemeProvider>
      </SupabaseAuthProvider>
    </>
  );
}

export default App;
