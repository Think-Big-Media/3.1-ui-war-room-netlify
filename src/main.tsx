console.log('%c[DIAGNOSTIC] 2. main.tsx execution started', 'color: yellow;');

// CRITICAL: Import shim BEFORE React to ensure useSyncExternalStore is available
import 'use-sync-external-store/shim';
console.log('%c[DIAGNOSTIC] 2b. useSyncExternalStore shim loaded', 'color: orange;');

import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';
import * as Sentry from '@sentry/react';

import App from './App';
import { store } from './store';
import { initializeMonitoring, trackWebVitals } from './services/monitoring';
import './index.css';

// Initialize monitoring before anything else
initializeMonitoring();
trackWebVitals();

// @ts-ignore
if (window.React) {
  console.error('%c[DIAGNOSTIC] CRITICAL: Multiple React instances suspected! React is already on the window object before main.tsx executes.', 'color: red; font-weight: bold;');
}
// @ts-ignore
window.React = React;
console.log('%c[DIAGNOSTIC] 3. main.tsx imports complete. React has been attached to window.', 'color: yellow;');

// 🚨 CRITICAL DIAGNOSTIC MODE
// Set to 'minimal' to test pure React, 'full' for normal app
const DIAGNOSTIC_MODE = new URLSearchParams(window.location.search).get('debug') === 'minimal' ? 'minimal' : 'full';

console.log('🚀 DIAGNOSTIC MODE:', DIAGNOSTIC_MODE);
console.log('🚀 MAIN.TSX DIAGNOSTIC START');
console.log('==========================================');
console.log('🔧 React Version Check:', React.version);
console.log('🔧 React APIs Available:', {
  useSyncExternalStore: typeof React.useSyncExternalStore,
  useState: typeof React.useState,
  useEffect: typeof React.useEffect,
  StrictMode: typeof React.StrictMode,
});
console.log('🔧 Environment Variables:', {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL ? 'SET' : 'MISSING',
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'MISSING',
  VITE_ENCORE_API_URL: import.meta.env.VITE_ENCORE_API_URL ? 'SET' : 'MISSING',
});
console.log('🔧 Bundle Environment:', {
  NODE_ENV: import.meta.env.NODE_ENV,
  MODE: import.meta.env.MODE,
  PROD: import.meta.env.PROD,
  DEV: import.meta.env.DEV,
});
console.log('==========================================');

// 🧪 MINIMAL TEST MODE
if (DIAGNOSTIC_MODE === 'minimal') {
  console.log('🧪 LOADING MINIMAL DIAGNOSTIC MODE');
  
  // Load bundle integrity check first
  import('./debug-bundle-check').then(() => {
    console.log('✅ Bundle integrity check completed');
    
    // Then load minimal test
    return import('./debug-minimal');
  }).then(() => {
    console.log('✅ Minimal diagnostic loaded successfully');
  }).catch(error => {
    console.error('❌ Minimal diagnostic failed to load:', error);
  });
} else {
  console.log('🚀 LOADING FULL APPLICATION MODE');
  
  // Create a client for React Query
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        gcTime: 5 * 60 * 1000, // 5 minutes
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });

  // Check if we're in dark mode
  if (
    localStorage.theme === 'dark' ||
    (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
  ) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  console.log('%c[DIAGNOSTIC] 4. React render process initiated.', 'color: yellow;');
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <Sentry.ErrorBoundary fallback={<div>An error has occurred. Please refresh the page.</div>} showDialog>
        <Provider store={store}>
          <QueryClientProvider client={queryClient}>
            <BrowserRouter>
              <App />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  duration: 3000,
                  iconTheme: {
                    primary: '#22c55e',
                    secondary: '#fff',
                  },
                },
                error: {
                  duration: 5000,
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </BrowserRouter>
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </Provider>
      </Sentry.ErrorBoundary>
    </React.StrictMode>
  );
  
  console.log('✅ Full application rendered successfully');
}