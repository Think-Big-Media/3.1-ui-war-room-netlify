/**
 * Auth Callback Page
 * Handles OAuth redirects from providers
 */

import type React from 'react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the session from the URL
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error('Auth callback error:', error);
          navigate(`/login?error=${encodeURIComponent(error.message)}`);
          return;
        }

        if (session) {
          console.log('Auth successful, redirecting to dashboard...');
          navigate('/dashboard');
        } else {
          console.log('No session found, redirecting to login...');
          navigate('/login');
        }
      } catch (err) {
        console.error('Unexpected error in auth callback:', err);
        navigate('/login?error=Authentication failed');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
        <p className="mt-4 text-gray-600">Completing authentication...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
