/**
 * War Room Platform - Application Entry Point
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './store';
import './index.css';

/**
 * ⚡ PRODUCTION FRONTEND CONFIGURATION ⚡
 *
 * 🎯 ACTIVE: App.tsx (Integrated Frontend)
 * - War Room Platform with integrated theme system
 * - Dashboard with CommandCenter and real-time monitoring
 * - Builder.io structure + V2Dashboard + Theme System
 * - Supabase auth and background theme provider
 *
 * ⚠️ DO NOT CHANGE THIS IMPORT unless migrating the entire frontend architecture
 */
import App from './App'; // ← INTEGRATED FRONTEND

// Alternative options (available but not in use):
// import App from './AppNoAuth';  // Testing version without auth
// import App from './AppSimple';  // Simplified version for testing
import { ErrorBoundary } from './components/ErrorBoundary';

// Get root element
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Failed to find the root element');
}

// Create root and render app
const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </Provider>
  </React.StrictMode>
);
