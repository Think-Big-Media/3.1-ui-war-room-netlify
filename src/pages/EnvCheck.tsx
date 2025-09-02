/**
 * Environment Check Page
 * Diagnostic page to verify environment variables
 */

import type React from 'react';

const EnvCheck: React.FC = () => {
  const envVars = {
    REACT_APP_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    REACT_APP_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
    REACT_APP_DEFAULT_ORG_ID: import.meta.env.VITE_DEFAULT_ORG_ID,
    REACT_APP_ENV: import.meta.env.VITE_ENV,
    REACT_APP_ENABLE_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS,
    REACT_APP_ENABLE_AUTOMATION: import.meta.env.VITE_ENABLE_AUTOMATION,
    REACT_APP_ENABLE_DOCUMENT_INTELLIGENCE: import.meta.env.VITE_ENABLE_DOCUMENT_INTELLIGENCE,
    REACT_APP_ENABLE_GOOGLE_AUTH: import.meta.env.VITE_ENABLE_GOOGLE_AUTH,
    REACT_APP_ENABLE_GITHUB_AUTH: import.meta.env.VITE_ENABLE_GITHUB_AUTH,
    NODE_ENV: import.meta.env.MODE,
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Environment Variables Check</h1>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Variable
                </th>
                <th className="px-3 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Value
                </th>
                <th className="px-3 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.entries(envVars).map(([key, value]) => (
                <tr key={key}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {key}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {value ? (
                      key.includes('KEY') ? (
                        `${value.substring(0, 20)}...`
                      ) : (
                        value
                      )
                    ) : (
                      <span className="text-red-500">undefined</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {value ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Set
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        Missing
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> After updating vite.config.ts, you need to restart the dev server
            for changes to take effect.
          </p>
        </div>
      </div>
    </div>
  );
};

export default EnvCheck;
