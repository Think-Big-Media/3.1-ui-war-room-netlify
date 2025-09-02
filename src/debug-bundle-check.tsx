/**
 * CRITICAL DIAGNOSTIC: Bundle Integrity Check
 * Checks if there are multiple React instances or bundle conflicts
 */

import React from 'react';

console.log('🔍 BUNDLE INTEGRITY CHECK START');
console.log('==========================================');

// Check if React is available globally
console.log('🔧 Global React Check:', {
  windowReact: typeof (window as any).React,
  importedReact: typeof React,
  reactVersion: React.version,
});

// Check for multiple React instances
const reactInstances = [];
if ((window as any).React) reactInstances.push('window.React');
if (React) reactInstances.push('import React');

console.log('🔧 React Instances Found:', reactInstances);

// Check React hooks availability in detail
console.log('🔧 React Hooks Availability:', {
  useState: typeof React.useState,
  useEffect: typeof React.useEffect,
  useSyncExternalStore: typeof React.useSyncExternalStore,
  useCallback: typeof React.useCallback,
  useMemo: typeof React.useMemo,
  useRef: typeof React.useRef,
  useContext: typeof React.useContext,
});

// Check if the React object has all expected properties
const reactKeys = Object.keys(React);
console.log('🔧 React Object Keys Count:', reactKeys.length);
console.log('🔧 React Object Keys (first 10):', reactKeys.slice(0, 10));

// Test if we can create elements
try {
  const testElement = React.createElement('div', { id: 'test' }, 'Hello');
  console.log('✅ React.createElement works:', typeof testElement);
} catch (error) {
  console.error('❌ React.createElement failed:', error);
}

// Check React internal version
console.log('🔧 React Internal Version:', React.version);

// Check if React has been mangled/minified incorrectly
const isMinified = React.toString().length < 100;
console.log('🔧 React Bundle Analysis:', {
  isMinified,
  reactToString: React.toString().substring(0, 100),
});

console.log('==========================================');
console.log('🔍 BUNDLE INTEGRITY CHECK COMPLETE');

export {};