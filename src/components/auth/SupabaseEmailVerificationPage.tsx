/**
 * Supabase Email Verification Page Component for War Room Platform
 * Handles email verification flow after user registration
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

interface LocationState {
  email?: string;
}

export function SupabaseEmailVerificationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  // Get email from navigation state
  const email = (location.state as LocationState)?.email || '';

  // Check if user is already verified on mount
  useEffect(() => {
    const checkVerificationStatus = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user?.email_confirmed_at) {
          setIsVerified(true);
          // Redirect to dashboard after 2 seconds
          setTimeout(() => {
            navigate('/dashboard', { replace: true });
          }, 2000);
        }
      } catch (err) {
        console.error('Verification check error:', err);
      }
    };

    checkVerificationStatus();
  }, [navigate]);

  // Listen for auth state changes (happens when email is verified)
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user?.email_confirmed_at) {
        setIsVerified(true);
        // Redirect to dashboard after showing success
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 2000);
      } else if (event === 'USER_UPDATED' && session?.user?.email_confirmed_at) {
        setIsVerified(true);
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 2000);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  // Handle resend verification email
  const handleResendEmail = async () => {
    if (!email) {
      setResendError('No email address available. Please register again.');
      return;
    }

    setIsResending(true);
    setResendError(null);
    setResendSuccess(false);

    try {
      // First, try to sign in to get a session
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
        },
      });

      if (signInError) {
        // If OTP fails, try resending verification for existing user
        const { error: resendError } = await supabase.auth.resend({
          type: 'signup',
          email,
        });

        if (resendError) {
          console.error('Resend error:', resendError);
          setResendError('Failed to resend verification email. Please try again.');
        } else {
          setResendSuccess(true);
          // Reset success message after 5 seconds
          setTimeout(() => setResendSuccess(false), 5000);
        }
      } else {
        setResendSuccess(true);
        setTimeout(() => setResendSuccess(false), 5000);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setResendError('An unexpected error occurred. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  // Show verification success page
  if (isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <div>
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-green-100">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Email verified successfully!
            </h2>
            <p className="mt-2 text-sm text-gray-600">Redirecting you to your dashboard...</p>
          </div>

          <div className="mt-4">
            <svg
              className="animate-spin h-8 w-8 text-blue-600 mx-auto"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
            <svg
              className="h-6 w-6 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Verify your email
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            We've sent a verification link to:
          </p>
          {email && <p className="mt-1 text-center text-sm font-medium text-gray-900">{email}</p>}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-blue-800">Check your inbox</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Click the verification link in your email to activate your account. If you don't
                  see the email, check your spam folder.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Resend success message */}
        {resendSuccess && (
          <div className="rounded-md bg-green-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-800">Verification email sent successfully!</p>
              </div>
            </div>
          </div>
        )}

        {/* Resend error message */}
        {resendError && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{resendError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Verification error message */}
        {verificationError && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{verificationError}</p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {/* Resend button */}
          <button
            onClick={handleResendEmail}
            disabled={isResending || !email}
            className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md ${
              isResending || !email
                ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                : 'text-blue-600 bg-white border-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            }`}
          >
            {isResending ? (
              <div className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Sending...
              </div>
            ) : (
              'Resend verification email'
            )}
          </button>

          {/* Back to login */}
          <div className="text-center">
            <a href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Back to sign in
            </a>
          </div>
        </div>

        {/* Additional help */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Having trouble?{' '}
            <a href="/contact" className="font-medium text-blue-600 hover:text-blue-500">
              Contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
