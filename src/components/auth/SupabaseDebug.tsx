/**
 * Supabase Debug Component
 * Checks OAuth provider configuration
 */

import type React from 'react';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface DebugInfo {
  supabaseUrl?: string;
  projectId?: string;
  hasAnonKey: boolean;
  googleAuthEnabled?: string;
  githubAuthEnabled?: string;
  currentOrigin: string;
  expectedCallback: string;
  hasSession?: boolean;
  sessionProvider?: string;
  sessionError?: string;
}

export const SupabaseDebug: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<Partial<DebugInfo>>({});

  useEffect(() => {
    const checkSupabaseConfig = async () => {
      // Get Supabase configuration
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const projectId = supabaseUrl?.split('.')[0]?.split('//')[1];

      const info: DebugInfo = {
        supabaseUrl,
        projectId,
        hasAnonKey: Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY),
        googleAuthEnabled: import.meta.env.VITE_ENABLE_GOOGLE_AUTH,
        githubAuthEnabled: import.meta.env.VITE_ENABLE_GITHUB_AUTH,
        currentOrigin: window.location.origin,
        expectedCallback: `${supabaseUrl}/auth/v1/callback`,
        hasSession: false,
        sessionProvider: undefined,
        sessionError: undefined,
      };

      // Try to get auth settings (this might fail due to permissions)
      try {
        const { data: session } = await supabase.auth.getSession();
        info.hasSession = Boolean(session.session);
        info.sessionProvider = session.session?.user?.app_metadata?.provider;
      } catch (err) {
        info.sessionError = err instanceof Error ? err.message : String(err);
      }

      setDebugInfo(info);
    };

    checkSupabaseConfig();
  }, []);

  return (
    <div className="p-4 bg-gray-100 rounded-lg text-sm">
      <h3 className="font-semibold mb-2">🔍 Supabase OAuth Debug Info:</h3>
      <pre className="whitespace-pre-wrap bg-white p-3 rounded border border-gray-200">
        {JSON.stringify(debugInfo, null, 2)}
      </pre>

      <div className="mt-4 space-y-2">
        <h4 className="font-semibold">📋 Next Steps:</h4>
        <ol className="list-decimal list-inside space-y-1 text-xs">
          <li>
            Go to:{' '}
            <code className="bg-gray-200 px-1">
              https://supabase.com/dashboard/project/{debugInfo.projectId}/auth/providers
            </code>
          </li>
          <li>Enable Google provider and add OAuth credentials</li>
          <li>In Google Cloud Console, add these URLs:</li>
          <ul className="list-disc list-inside ml-4">
            <li>
              Authorized origin: <code className="bg-gray-200 px-1">{debugInfo.currentOrigin}</code>
            </li>
            <li>
              Redirect URI: <code className="bg-gray-200 px-1">{debugInfo.expectedCallback}</code>
            </li>
          </ul>
        </ol>
      </div>
    </div>
  );
};
