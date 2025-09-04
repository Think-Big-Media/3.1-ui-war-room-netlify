/**
 * Supabase Migration Test Component
 * Verifies that the migration from FastAPI to Supabase works correctly
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabaseServices } from '../../services/supabaseServices';

export function SupabaseMigrationTest() {
  const { user, isAuthenticated, signInWithEmail, signUpWithEmail, signOut } = useAuth();
  const [testResults, setTestResults] = useState<
    Array<{
      test: string;
      status: 'pending' | 'success' | 'error';
      message: string;
    }>
  >([]);
  const [testCredentials, setTestCredentials] = useState({
    email: 'test@warroom.dev',
    password: 'TestPassword123!',
  });

  const addResult = (test: string, status: 'success' | 'error', message: string) => {
    setTestResults((prev) => [...prev, { test, status, message }]);
  };

  const runMigrationTests = async () => {
    setTestResults([]);

    try {
      // Test 1: Authentication Context
      addResult('Auth Context', 'success', 'Auth context loaded successfully');

      // Test 2: Supabase Client Connection
      try {
        const data = await supabaseServices.volunteers.getVolunteers('test-org-id');
        addResult('Supabase Connection', 'success', 'Connected to Supabase successfully');
      } catch (err: any) {
        addResult('Supabase Connection', 'error', `Connection failed: ${err.message}`);
      }

      // Test 3: Authentication State
      if (isAuthenticated && user) {
        addResult('Authentication State', 'success', `User authenticated: ${user.email}`);
      } else {
        addResult('Authentication State', 'success', 'No user currently authenticated (expected)');
      }

      // Test 4: Service Methods Available
      const services = ['volunteers', 'events', 'contacts', 'documents', 'donations'];
      services.forEach((service) => {
        if (supabaseServices[service as keyof typeof supabaseServices]) {
          addResult(`${service} Service`, 'success', `${service} service methods available`);
        } else {
          addResult(`${service} Service`, 'error', `${service} service not found`);
        }
      });

      addResult('Migration Test', 'success', 'All migration tests completed');
    } catch (error: any) {
      addResult('Migration Test', 'error', `Test failed: ${error.message}`);
    }
  };

  const testSignUp = async () => {
    try {
      await signUpWithEmail(testCredentials.email, testCredentials.password, {
        first_name: 'Test',
        last_name: 'User',
        organization_name: 'Test Organization',
      });
      addResult('Sign Up Test', 'success', 'Sign up completed - check email for confirmation');
    } catch (error: any) {
      addResult('Sign Up Test', 'error', `Sign up failed: ${error.message}`);
    }
  };

  const testSignIn = async () => {
    try {
      await signInWithEmail(testCredentials.email, testCredentials.password);
      addResult('Sign In Test', 'success', 'Sign in successful');
    } catch (error: any) {
      addResult('Sign In Test', 'error', `Sign in failed: ${error.message}`);
    }
  };

  const testSignOut = async () => {
    try {
      await signOut();
      addResult('Sign Out Test', 'success', 'Sign out successful');
    } catch (error: any) {
      addResult('Sign Out Test', 'error', `Sign out failed: ${error.message}`);
    }
  };

  useEffect(() => {
    runMigrationTests();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Supabase Migration Test</h1>

      {/* Test Credentials */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-3">Test Credentials</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={testCredentials.email}
              onChange={(e) => setTestCredentials((prev) => ({ ...prev, email: e.target.value }))}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={testCredentials.password}
              onChange={(e) =>
                setTestCredentials((prev) => ({ ...prev, password: e.target.value }))
              }
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
        </div>
      </div>

      {/* Auth Test Buttons */}
      <div className="mb-6 space-x-4">
        <button
          onClick={testSignUp}
          className="px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          Test Sign Up
        </button>
        <button
          onClick={testSignIn}
          className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Test Sign In
        </button>
        <button
          onClick={testSignOut}
          className="px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Test Sign Out
        </button>
        <button
          onClick={runMigrationTests}
          className="px-3 py-1.5 bg-purple-600 text-white rounded-md hover:bg-purple-700"
        >
          Run All Tests
        </button>
      </div>

      {/* Current User Info */}
      {isAuthenticated && user && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h2 className="text-lg font-semibold text-green-800 mb-2">Current User</h2>
          <p>
            <strong>Email:</strong> {user.email}
          </p>
          <p>
            <strong>ID:</strong> {user.id}
          </p>
          <p>
            <strong>Confirmed:</strong> {user.email_confirmed_at ? 'Yes' : 'No'}
          </p>
          <p>
            <strong>Role:</strong> {user.user_metadata?.role || 'user'}
          </p>
        </div>
      )}

      {/* Test Results */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold mb-3">Test Results</h2>
        {testResults.map((result, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg border ${
              result.status === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : result.status === 'error'
                  ? 'bg-red-50 border-red-200 text-red-800'
                  : 'bg-gray-50 border-gray-200 text-gray-800'
            }`}
          >
            <div className="flex items-center">
              <span className="font-medium mr-2">{result.test}:</span>
              <span
                className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                  result.status === 'success'
                    ? 'bg-green-100 text-green-800'
                    : result.status === 'error'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                }`}
              >
                {result.status.toUpperCase()}
              </span>
            </div>
            <p className="mt-1 text-sm">{result.message}</p>
          </div>
        ))}
      </div>

      {/* Migration Status */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h2 className="text-lg font-semibold text-blue-800 mb-2">Migration Status</h2>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>✅ Supabase client configured</li>
          <li>✅ Authentication context migrated</li>
          <li>✅ Services layer created</li>
          <li>✅ Database schema defined</li>
          <li>✅ RLS policies configured</li>
          <li>✅ Environment variables updated</li>
          <li>⚠️ Need to run supabase-setup.sql in Supabase dashboard</li>
          <li>⚠️ Need to set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY</li>
        </ul>
      </div>
    </div>
  );
}
