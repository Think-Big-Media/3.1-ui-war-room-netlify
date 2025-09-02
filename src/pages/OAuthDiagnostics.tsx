/**
 * OAuth Diagnostics Page
 * Comprehensive testing and validation for OAuth configuration
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface DiagnosticResult {
  test: string;
  status: 'pending' | 'success' | 'error' | 'warning';
  message: string;
  details?: any;
}

export default function OAuthDiagnostics() {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostics = async () => {
    setIsRunning(true);
    setResults([]);

    const diagnostics: DiagnosticResult[] = [];

    // Test 1: Environment Variables
    diagnostics.push({
      test: 'Environment Variables',
      status: 'pending',
      message: 'Checking environment configuration...',
    });

    const envVars = {
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
      supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      googleAuth: import.meta.env.VITE_ENABLE_GOOGLE_AUTH,
      githubAuth: import.meta.env.VITE_ENABLE_GITHUB_AUTH,
    };

    if (envVars.supabaseUrl && envVars.supabaseKey) {
      diagnostics[diagnostics.length - 1] = {
        test: 'Environment Variables',
        status: 'success',
        message: 'All required environment variables are set',
        details: {
          supabaseUrl: `${envVars.supabaseUrl?.substring(0, 30)}...`,
          hasAnonKey: Boolean(envVars.supabaseKey),
          googleAuthEnabled: envVars.googleAuth,
          githubAuthEnabled: envVars.githubAuth,
        },
      };
    } else {
      diagnostics[diagnostics.length - 1] = {
        test: 'Environment Variables',
        status: 'error',
        message: 'Missing required environment variables',
        details: envVars,
      };
    }

    setResults([...diagnostics]);

    // Test 2: Supabase Connection
    diagnostics.push({
      test: 'Supabase Connection',
      status: 'pending',
      message: 'Testing Supabase client connection...',
    });

    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (error) {
        throw error;
      }

      diagnostics[diagnostics.length - 1] = {
        test: 'Supabase Connection',
        status: 'success',
        message: 'Successfully connected to Supabase',
        details: {
          hasSession: Boolean(session),
          clientInitialized: Boolean(supabase),
        },
      };
    } catch (error: any) {
      diagnostics[diagnostics.length - 1] = {
        test: 'Supabase Connection',
        status: 'error',
        message: 'Failed to connect to Supabase',
        details: error.message,
      };
    }

    setResults([...diagnostics]);

    // Test 3: OAuth Redirect URLs
    diagnostics.push({
      test: 'OAuth Redirect URLs',
      status: 'pending',
      message: 'Checking OAuth redirect configuration...',
    });

    const redirectUrls = {
      currentOrigin: window.location.origin,
      googleRedirect: `${window.location.origin}/auth/callback`,
      githubRedirect: `${window.location.origin}/auth/callback`,
      dashboardRedirect: `${window.location.origin}/dashboard`,
    };

    diagnostics[diagnostics.length - 1] = {
      test: 'OAuth Redirect URLs',
      status: 'warning',
      message: 'Ensure these URLs are configured in your OAuth providers',
      details: redirectUrls,
    };

    setResults([...diagnostics]);

    // Test 4: Test Google OAuth
    diagnostics.push({
      test: 'Google OAuth Configuration',
      status: 'pending',
      message: 'Testing Google OAuth setup...',
    });

    try {
      // We can't actually test OAuth without user interaction,
      // but we can check if the method exists and logs properly
      const testProvider = 'google';
      console.log('🧪 Testing OAuth provider:', testProvider);

      // Check if OAuth is enabled
      if (import.meta.env.VITE_ENABLE_GOOGLE_AUTH === 'true') {
        diagnostics[diagnostics.length - 1] = {
          test: 'Google OAuth Configuration',
          status: 'success',
          message: 'Google OAuth is enabled',
          details: {
            enabled: true,
            redirectUrl: `${window.location.origin}/auth/callback`,
          },
        };
      } else {
        diagnostics[diagnostics.length - 1] = {
          test: 'Google OAuth Configuration',
          status: 'warning',
          message: 'Google OAuth is not enabled in environment',
          details: {
            enabled: false,
            envVar: import.meta.env.VITE_ENABLE_GOOGLE_AUTH,
          },
        };
      }
    } catch (error: any) {
      diagnostics[diagnostics.length - 1] = {
        test: 'Google OAuth Configuration',
        status: 'error',
        message: 'Error checking Google OAuth',
        details: error.message,
      };
    }

    setResults([...diagnostics]);

    // Test 5: Network Connectivity
    diagnostics.push({
      test: 'Network Connectivity',
      status: 'pending',
      message: 'Testing network access to Supabase...',
    });

    try {
      // Try to fetch the Supabase health endpoint
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (supabaseUrl) {
        const response = await fetch(`${supabaseUrl}/rest/v1/`, {
          method: 'HEAD',
        });

        diagnostics[diagnostics.length - 1] = {
          test: 'Network Connectivity',
          status: response.ok ? 'success' : 'warning',
          message: response.ok
            ? 'Network connectivity is good'
            : 'Network request returned non-OK status',
          details: {
            status: response.status,
            statusText: response.statusText,
          },
        };
      }
    } catch (error: any) {
      diagnostics[diagnostics.length - 1] = {
        test: 'Network Connectivity',
        status: 'error',
        message: 'Network connectivity issue',
        details: error.message,
      };
    }

    setResults([...diagnostics]);
    setIsRunning(false);
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'pending':
        return '⏳';
    }
  };

  const getStatusColor = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return 'text-green-600 bg-green-50';
      case 'error':
        return 'text-red-600 bg-red-50';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50';
      case 'pending':
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">OAuth Diagnostics</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Diagnostic Tests</h2>
            <button
              onClick={runDiagnostics}
              disabled={isRunning}
              className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isRunning ? 'Running...' : 'Run Diagnostics'}
            </button>
          </div>

          <div className="space-y-4">
            {results.map((result, index) => (
              <div key={index} className={`p-4 rounded-lg ${getStatusColor(result.status)}`}>
                <div className="flex items-start">
                  <span className="text-2xl mr-3">{getStatusIcon(result.status)}</span>
                  <div className="flex-1">
                    <h3 className="font-semibold">{result.test}</h3>
                    <p className="text-sm mt-1">{result.message}</p>
                    {result.details && (
                      <pre className="mt-2 text-xs bg-white bg-opacity-50 p-2 rounded overflow-auto">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <a
              href="/test-auth"
              className="block w-full px-3 py-1.5 bg-gray-600 text-white rounded hover:bg-gray-700 text-center"
            >
              Go to Auth Test Page
            </a>
            <a
              href="/login"
              className="block w-full px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-center"
            >
              Go to Login Page
            </a>
            <button
              onClick={() => {
                localStorage.clear();
                sessionStorage.clear();
                window.location.reload();
              }}
              className="w-full px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Clear Storage & Reload
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
