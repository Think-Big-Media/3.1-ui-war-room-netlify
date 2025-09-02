/**
 * CRITICAL DIAGNOSTIC: Minimal React Test
 * Tests if React itself works without any external dependencies
 */

import React from 'react';
import ReactDOM from 'react-dom/client';

// 🔍 ULTRA-MINIMAL TEST COMPONENT
function MinimalTest() {
  console.log('🧪 MINIMAL COMPONENT RENDERING');
  console.log('🔧 React object in component:', React);
  console.log('🔧 useSyncExternalStore available:', typeof React.useSyncExternalStore);
  
  const [count, setCount] = React.useState(0);
  
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>🧪 MINIMAL REACT TEST</h1>
      <p>If you see this, React is working!</p>
      <button onClick={() => setCount(c => c + 1)}>
        Count: {count}
      </button>
      <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
        <p>React Version: {React.version}</p>
        <p>useSyncExternalStore: {typeof React.useSyncExternalStore}</p>
      </div>
    </div>
  );
}

// 🚨 CRITICAL TEST: Can we render without ANY external dependencies?
console.log('🧪 STARTING MINIMAL REACT TEST');
console.log('🔧 React object at startup:', React);
console.log('🔧 React.version:', React.version);
console.log('🔧 React.useSyncExternalStore:', typeof React.useSyncExternalStore);

try {
  const rootElement = document.getElementById('root');
  if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(<MinimalTest />);
    console.log('✅ MINIMAL REACT TEST: SUCCESS');
  } else {
    console.error('❌ MINIMAL REACT TEST: No root element found');
  }
} catch (error) {
  console.error('💥 MINIMAL REACT TEST: FAILED', error);
}