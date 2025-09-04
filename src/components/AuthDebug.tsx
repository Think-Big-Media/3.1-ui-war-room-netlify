/**
 * Auth Debug Component
 * Shows current authentication state
 */

import type React from 'react';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';

export const AuthDebug: React.FC = () => {
  const auth = useSupabaseAuth();

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 text-xs max-w-sm">
      <h3 className="font-semibold mb-2">Auth Debug</h3>
      <div className="space-y-1">
        <div>
          Loading:{' '}
          <span className={auth.isLoading ? 'text-yellow-600' : 'text-green-600'}>
            {String(auth.isLoading)}
          </span>
        </div>
        <div>
          Authenticated:{' '}
          <span className={auth.isAuthenticated ? 'text-green-600' : 'text-red-600'}>
            {String(auth.isAuthenticated)}
          </span>
        </div>
        <div>
          User: <span className="text-blue-600">{auth.user?.email || 'null'}</span>
        </div>
        <div>
          Session:{' '}
          <span className={auth.session ? 'text-green-600' : 'text-red-600'}>
            {auth.session ? 'active' : 'null'}
          </span>
        </div>
        {auth.error && <div className="text-red-600">Error: {auth.error}</div>}
      </div>
    </div>
  );
};
