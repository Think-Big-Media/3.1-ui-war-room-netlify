/**
 * Test Auth Page - Direct Supabase Connection Test
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface TestDetails {
  clientInitialized?: boolean;
  sessionCheck?: string;
  hasSession?: boolean;
  userEmail?: string;
  error?: string;
  currentUser?: string;
  env?: {
    url: string;
    anonKey: string;
  };
  [key: string]: any;
}

export default function TestAuth() {
  const [status, setStatus] = useState<string>('Initializing...');
  const [details, setDetails] = useState<TestDetails>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testSupabase = async () => {
      try {
        setStatus('Testing Supabase connection...');

        // Test 1: Check if client is initialized
        setDetails((prev: TestDetails) => ({ ...prev, clientInitialized: Boolean(supabase) }));

        // Test 2: Try to get session with timeout
        setStatus('Checking session...');
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout after 3s')), 3000)
        );

        try {
          const result = (await Promise.race([sessionPromise, timeoutPromise])) as any;
          setDetails((prev: TestDetails) => ({
            ...prev,
            sessionCheck: 'Success',
            hasSession: Boolean(result?.data?.session),
            userEmail: result?.data?.session?.user?.email || 'No user',
          }));
        } catch (timeoutErr) {
          const errorMessage = timeoutErr instanceof Error ? timeoutErr.message : 'Unknown error';
          setDetails((prev: TestDetails) => ({
            ...prev,
            sessionCheck: 'Timeout',
            error: errorMessage,
          }));
        }

        // Test 3: Check auth state
        setStatus('Checking auth state...');
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setDetails((prev: TestDetails) => ({ ...prev, currentUser: user?.email || 'None' }));

        // Test 4: Check environment variables
        setDetails((prev: TestDetails) => ({
          ...prev,
          env: {
            url: import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'Missing',
            anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Missing',
            googleAuth: import.meta.env.VITE_ENABLE_GOOGLE_AUTH,
            githubAuth: import.meta.env.VITE_ENABLE_GITHUB_AUTH,
          },
        }));

        setStatus('All tests complete');
      } catch (err: any) {
        console.error('Test error:', err);
        setError(err.message);
        setStatus('Test failed');
      }
    };

    testSupabase();
  }, []);

  const handleGoogleLogin = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        setError(`OAuth error: ${error.message}`);
      } else {
        setDetails((prev: TestDetails) => ({ ...prev, oauthResult: 'Redirecting...' }));
      }
    } catch (err: any) {
      setError(`OAuth exception: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Supabase Auth Test</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-4">
          <h2 className="font-semibold mb-2">Status: {status}</h2>
          {error && <div className="text-red-600 mb-4">Error: {error}</div>}

          <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
            {JSON.stringify(details, null, 2)}
          </pre>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <button
              onClick={handleGoogleLogin}
              className="w-full px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Test Google OAuth
            </button>
            <button
              onClick={() => (window.location.href = '/login')}
              className="w-full px-3 py-1.5 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Go to Login Page
            </button>
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
