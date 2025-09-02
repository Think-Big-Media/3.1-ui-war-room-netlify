/**
 * Debug Dashboard to test component loading
 */

import type React from 'react';
import { useState, useEffect } from 'react';

const DebugDashboard: React.FC = () => {
  const [status, setStatus] = useState<string[]>(['Dashboard component loaded']);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setStatus((prev) => [...prev, 'useEffect ran']);

    // Test imports
    try {
      // Test if components can be imported
      Promise.all([
        import('../components/dashboard/MetricCard').then(() => 'MetricCard loaded'),
        import('../components/dashboard/ActivityFeed').then(() => 'ActivityFeed loaded'),
        import('../components/dashboard/CampaignHealth').then(() => 'CampaignHealth loaded'),
        import('../components/dashboard/AnalyticsOverview').then(() => 'AnalyticsOverview loaded'),
      ])
        .then((results) => {
          setStatus((prev) => [...prev, ...results]);
        })
        .catch((err) => {
          setError(`Import error: ${err.message}`);
        });
    } catch (err: any) {
      setError(`Sync error: ${err.message}`);
    }
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Debug Dashboard</h1>

      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
        <h2 className="text-lg font-semibold mb-2">Status:</h2>
        <ul className="list-disc list-inside space-y-1">
          {status.map((item, idx) => (
            <li key={idx} className="text-green-600">
              {item}
            </li>
          ))}
        </ul>
      </div>

      {error && (
        <div className="bg-red-50 rounded-lg border border-red-200 p-4">
          <h2 className="text-lg font-semibold text-red-700 mb-2">Error:</h2>
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <div className="mt-4">
        <button
          onClick={() => (window.location.href = '/dashboard')}
          className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Go to Real Dashboard
        </button>
      </div>
    </div>
  );
};

export default DebugDashboard;
