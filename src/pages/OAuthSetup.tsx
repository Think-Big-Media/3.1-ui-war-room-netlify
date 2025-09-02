/**
 * OAuth Setup Instructions
 */

import type React from 'react';
import { Link } from 'react-router-dom';

const OAuthSetup: React.FC = () => {
  const currentOrigin = window.location.origin;
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const projectId = supabaseUrl?.split('.')[0]?.split('//')[1];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">OAuth Setup Checklist</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">✅ Current Status</h2>
          <ul className="space-y-2">
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              Google OAuth enabled in Supabase
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              GitHub OAuth enabled in Supabase
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              Environment variables set to true
            </li>
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">🔗 Required URLs in Supabase</h2>
          <p className="mb-4">
            Go to:{' '}
            <a
              href={`https://supabase.com/dashboard/project/${projectId}/auth/url-configuration`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Supabase URL Configuration
            </a>
          </p>

          <div className="mb-4">
            <h3 className="font-semibold mb-2">Site URL:</h3>
            <code className="bg-gray-100 p-2 rounded block">{currentOrigin}</code>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Redirect URLs (add all of these):</h3>
            <ul className="space-y-2">
              <li>
                <code className="bg-gray-100 p-2 rounded block">{currentOrigin}</code>
              </li>
              <li>
                <code className="bg-gray-100 p-2 rounded block">{currentOrigin}/dashboard</code>
              </li>
              <li>
                <code className="bg-gray-100 p-2 rounded block">{currentOrigin}/auth/callback</code>
              </li>
              <li>
                <code className="bg-gray-100 p-2 rounded block">{currentOrigin}/login</code>
              </li>
            </ul>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">🔧 Google OAuth Setup</h2>
          <p className="mb-4">In Google Cloud Console:</p>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              Authorized JavaScript origins:{' '}
              <code className="bg-gray-100 px-2 py-1 rounded">{currentOrigin}</code>
            </li>
            <li>
              Authorized redirect URI:{' '}
              <code className="bg-gray-100 px-2 py-1 rounded">{supabaseUrl}/auth/v1/callback</code>
            </li>
          </ol>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">🔧 GitHub OAuth Setup</h2>
          <p className="mb-4">In GitHub OAuth App settings:</p>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              Homepage URL: <code className="bg-gray-100 px-2 py-1 rounded">{currentOrigin}</code>
            </li>
            <li>
              Authorization callback URL:{' '}
              <code className="bg-gray-100 px-2 py-1 rounded">{supabaseUrl}/auth/v1/callback</code>
            </li>
          </ol>
        </div>

        <div className="text-center">
          <Link
            to="/login"
            className="inline-block px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Login Page
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OAuthSetup;
