/**
 * ULTRA SIMPLE APP - NO EXTERNAL DEPENDENCIES
 * Tests if React works without Redux, Supabase, etc.
 */

import React from 'react';

function SimpleApp() {
  const [count, setCount] = React.useState(0);
  
  // Test useSyncExternalStore specifically
  const testExternalStore = React.useSyncExternalStore(
    () => () => {}, // subscribe
    () => 'test-value', // getSnapshot
    () => 'test-value' // getServerSnapshot
  );

  console.log('🧪 Simple App Rendered:', { 
    count, 
    testExternalStore,
    reactVersion: React.version 
  });

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>🧪 Ultra Simple React Test</h1>
      <p>React Version: {React.version}</p>
      <p>External Store Value: {testExternalStore}</p>
      <button onClick={() => setCount(c => c + 1)}>
        Count: {count}
      </button>
      <p>If you see this, React core is working!</p>
    </div>
  );
}

export default SimpleApp;