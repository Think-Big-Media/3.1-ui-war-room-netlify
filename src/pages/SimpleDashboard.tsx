/**
 * Simple Dashboard for testing
 */

import type React from 'react';

const SimpleDashboard: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">War Room Dashboard</h1>
      <p className="text-gray-600 mb-4">Welcome!</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h2 className="text-lg font-semibold mb-2">Volunteers</h2>
          <p className="text-3xl font-bold">2,847</p>
          <p className="text-sm text-green-600">+12.5%</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h2 className="text-lg font-semibold mb-2">Donations</h2>
          <p className="text-3xl font-bold">$124,560</p>
          <p className="text-sm text-green-600">+8.2%</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h2 className="text-lg font-semibold mb-2">Events</h2>
          <p className="text-3xl font-bold">18</p>
          <p className="text-sm text-red-600">-5.3%</p>
        </div>
      </div>

      <div className="mt-6 bg-blue-50 p-4 rounded-lg">
        <p className="text-blue-700">
          ✅ Dashboard is working! The full dashboard with all components is being loaded.
        </p>
      </div>
    </div>
  );
};

export default SimpleDashboard;
