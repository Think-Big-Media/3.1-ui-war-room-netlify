/**
 * ULTRA SIMPLE ENTRY POINT
 * No Redux, no Supabase, no external state management
 * Just React + one component to test useSyncExternalStore
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import SimpleApp from './App-simple';

console.log('🧪 SIMPLE MAIN START');
console.log('🔧 React available:', typeof React);
console.log('🔧 React.version:', React.version);
console.log('🔧 useSyncExternalStore available:', typeof React.useSyncExternalStore);

const root = document.getElementById('root');
if (!root) {
  console.error('❌ Root element not found');
} else {
  console.log('✅ Root element found, rendering...');
  ReactDOM.createRoot(root).render(<SimpleApp />);
}