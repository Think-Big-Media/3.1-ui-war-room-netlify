/**
 * Login Bypass Component
 * Debug tool to fix auth loading issues
 */

import type React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const LoginBypass: React.FC = () => {
  const navigate = useNavigate();
  const [debugInfo, setDebugInfo] = useState<string>('');

  const handleClearAndReload = () => {
    // Clear all storage
    localStorage.clear();
    sessionStorage.clear();

    // Clear cookies
    document.cookie.split(';').forEach((c) => {
      document.cookie = c
        .replace(/^ +/, '')
        .replace(/[=].*/, `=;expires=${new Date().toUTCString()};path=/`);
    });

    // Force reload to login
    window.location.href = '/login';
  };

  const handleDirectLogin = () => {
    // Navigate directly to login without reload
    navigate('/login');
  };

  const handleCheckStorage = () => {
    const info = {
      localStorage: Object.keys(localStorage).length,
      sessionStorage: Object.keys(sessionStorage).length,
      supabaseAuth: localStorage.getItem('supabase.auth.token'),
      cookies: document.cookie.length,
    };
    setDebugInfo(JSON.stringify(info, null, 2));
  };

  const handleForceTimeout = () => {
    // Simulate auth timeout
    const event = new Event('auth-timeout');
    window.dispatchEvent(event);
    window.location.reload();
  };

  return (
    <div className="fixed bottom-4 right-4 bg-red-50 border border-red-200 rounded-lg p-4 max-w-sm shadow-lg">
      <h3 className="font-semibold text-red-800 mb-2">🔧 Auth Debug Tools</h3>
      <div className="space-y-2">
        <button
          onClick={handleClearAndReload}
          className="w-full px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm transition-colors"
        >
          Clear All & Reload
        </button>
        <button
          onClick={handleDirectLogin}
          className="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm transition-colors"
        >
          Go to Login Page
        </button>
        <button
          onClick={handleCheckStorage}
          className="w-full px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm transition-colors"
        >
          Check Storage
        </button>
        <button
          onClick={handleForceTimeout}
          className="w-full px-3 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-sm transition-colors"
        >
          Force Timeout
        </button>
      </div>
      {debugInfo && (
        <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-32">
          {debugInfo}
        </pre>
      )}
    </div>
  );
};
