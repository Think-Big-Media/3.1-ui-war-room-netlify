/**
 * Supabase Authentication API Service for War Room Platform
 * Replaces custom backend auth with Supabase Auth
 */

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { supabase, auth, db } from '../lib/supabase';
import type { User, Session, AuthError } from '@supabase/supabase-js';

// Types
export interface LoginRequest {
  email: string;
  password: string;
  deviceName?: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  username: string;
  organizationId?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  role: string;
  permissions: string[];
  is_active: boolean;
  is_verified: boolean;
  two_factor_enabled: boolean;
  org_id: string;
  created_at: string;
  updated_at?: string;
  organization?: any;
}

export interface AuthResponse {
  user: User | null;
  session: Session | null;
  profile?: UserProfile;
  error?: AuthError | null;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  new_password: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

// Supabase Auth API using RTK Query
export const supabaseAuthApi = createApi({
  reducerPath: 'supabaseAuthApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/' }), // We're using Supabase client directly
  tagTypes: ['User', 'Profile', 'Session'],
  endpoints: (builder) => ({
    // Authentication endpoints
    login: builder.mutation<AuthResponse, LoginRequest>({
      queryFn: async ({ email, password }) => {
        try {
          // Sign in with Supabase
          const { data: authData, error: authError } = await auth.signIn(email, password);

          if (authError) {
            return { error: { status: 401, data: authError.message } };
          }

          if (!authData.user) {
            return { error: { status: 401, data: 'Login failed' } };
          }

          // Get user profile
          const { data: profile, error: profileError } = await db.profiles
            .select('*, organizations(*)')
            .eq('id', authData.user.id)
            .single();

          if (profileError) {
            console.error('Profile fetch error:', profileError);
          }

          // Update last login
          if (profile) {
            await db.profiles
              .update({
                last_login_at: new Date().toISOString(),
                last_login_ip: window.location.hostname,
              })
              .eq('id', authData.user.id);
          }

          return {
            data: {
              user: authData.user,
              session: authData.session,
              profile: profile as UserProfile,
            },
          };
        } catch (error) {
          return { error: { status: 500, data: 'Login failed' } };
        }
      },
      invalidatesTags: ['User', 'Session', 'Profile'],
    }),

    register: builder.mutation<AuthResponse, RegisterRequest>({
      queryFn: async (userData) => {
        try {
          // Sign up with Supabase
          const { data: authData, error: authError } = await auth.signUp(
            userData.email,
            userData.password,
            {
              full_name: `${userData.firstName} ${userData.lastName}`,
              phone: userData.phone,
              username: userData.username,
            }
          );

          if (authError) {
            return { error: { status: 400, data: authError.message } };
          }

          if (!authData.user) {
            return { error: { status: 400, data: 'Registration failed' } };
          }

          // Create user profile
          const { data: profile, error: profileError } = await db.profiles
            .insert({
              id: authData.user.id,
              email: userData.email,
              full_name: `${userData.firstName} ${userData.lastName}`,
              phone: userData.phone,
              org_id: userData.organizationId || import.meta.env.VITE_DEFAULT_ORG_ID || '',
              role: 'member',
              permissions: [],
              is_active: true,
              is_verified: false,
            })
            .select('*, organizations(*)')
            .single();

          if (profileError) {
            console.error('Profile creation error:', profileError);
            // Try to delete the auth user if profile creation fails
            await supabase.auth.admin.deleteUser(authData.user.id);
            return { error: { status: 500, data: 'Failed to create user profile' } };
          }

          return {
            data: {
              user: authData.user,
              session: authData.session,
              profile: profile as UserProfile,
            },
          };
        } catch (error) {
          return { error: { status: 500, data: 'Registration failed' } };
        }
      },
      invalidatesTags: ['User', 'Profile'],
    }),

    logout: builder.mutation<{ message: string }, void>({
      queryFn: async () => {
        try {
          const { error } = await auth.signOut();

          if (error) {
            return { error: { status: 500, data: error.message } };
          }

          return { data: { message: 'Successfully logged out' } };
        } catch (error) {
          return { error: { status: 500, data: 'Logout failed' } };
        }
      },
      invalidatesTags: ['User', 'Session', 'Profile'],
    }),

    // Profile endpoints
    getCurrentUser: builder.query<UserProfile | null, void>({
      queryFn: async () => {
        try {
          const { user, error: userError } = await auth.getUser();

          if (userError || !user) {
            return { data: null };
          }

          const { data: profile, error: profileError } = await db.profiles
            .select('*, organizations(*)')
            .eq('id', user.id)
            .single();

          if (profileError || !profile) {
            return { data: null };
          }

          return { data: profile as UserProfile };
        } catch (error) {
          return { error: { status: 500, data: 'Failed to fetch user' } };
        }
      },
      providesTags: ['User', 'Profile'],
    }),

    updateProfile: builder.mutation<UserProfile, Partial<UserProfile>>({
      queryFn: async (updates) => {
        try {
          const { user } = await auth.getUser();

          if (!user) {
            return { error: { status: 401, data: 'Not authenticated' } };
          }

          // Update auth metadata if email changed
          if (updates.email) {
            const { error: authError } = await auth.updateUser({
              email: updates.email,
            });

            if (authError) {
              return { error: { status: 400, data: authError.message } };
            }
          }

          // Update profile
          const { data: profile, error: profileError } = await db.profiles
            .update({
              ...updates,
              updated_at: new Date().toISOString(),
            })
            .eq('id', user.id)
            .select('*, organizations(*)')
            .single();

          if (profileError || !profile) {
            return { error: { status: 500, data: 'Failed to update profile' } };
          }

          return { data: profile as UserProfile };
        } catch (error) {
          return { error: { status: 500, data: 'Failed to update profile' } };
        }
      },
      invalidatesTags: ['Profile'],
    }),

    // Password management
    forgotPassword: builder.mutation<{ message: string }, PasswordResetRequest>({
      queryFn: async ({ email }) => {
        try {
          const { error } = await auth.resetPassword(email);

          if (error) {
            return { error: { status: 400, data: error.message } };
          }

          return {
            data: {
              message: 'If the email exists, a password reset link has been sent',
            },
          };
        } catch (error) {
          return { error: { status: 500, data: 'Failed to send reset email' } };
        }
      },
    }),

    resetPassword: builder.mutation<{ message: string }, { newPassword: string }>({
      queryFn: async ({ newPassword }) => {
        try {
          const { error } = await auth.updatePassword(newPassword);

          if (error) {
            return { error: { status: 400, data: error.message } };
          }

          return {
            data: {
              message: 'Password reset successfully. Please login with your new password.',
            },
          };
        } catch (error) {
          return { error: { status: 500, data: 'Failed to reset password' } };
        }
      },
    }),

    changePassword: builder.mutation<{ message: string }, ChangePasswordRequest>({
      queryFn: async ({ current_password, new_password }) => {
        try {
          // Supabase doesn't have a direct way to verify current password
          // We need to re-authenticate first
          const { user } = await auth.getUser();

          if (!user?.email) {
            return { error: { status: 401, data: 'Not authenticated' } };
          }

          // Try to sign in with current password to verify it
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: user.email,
            password: current_password,
          });

          if (signInError) {
            return { error: { status: 400, data: 'Current password is incorrect' } };
          }

          // Update to new password
          const { error: updateError } = await auth.updatePassword(new_password);

          if (updateError) {
            return { error: { status: 400, data: updateError.message } };
          }

          return { data: { message: 'Password changed successfully' } };
        } catch (error) {
          return { error: { status: 500, data: 'Failed to change password' } };
        }
      },
    }),

    // Email verification
    verifyEmail: builder.mutation<{ message: string }, { token: string }>({
      queryFn: async ({ token }) => {
        try {
          // In Supabase, email verification is handled via magic link
          // The token would be in the URL and handled by Supabase automatically
          const { user } = await auth.getUser();

          if (!user) {
            return { error: { status: 401, data: 'Not authenticated' } };
          }

          // Update profile to mark as verified
          await db.profiles
            .update({
              is_verified: true,
              email_verified_at: new Date().toISOString(),
            })
            .eq('id', user.id);

          return { data: { message: 'Email verified successfully' } };
        } catch (error) {
          return { error: { status: 500, data: 'Failed to verify email' } };
        }
      },
      invalidatesTags: ['User', 'Profile'],
    }),

    resendVerification: builder.mutation<{ message: string }, void>({
      queryFn: async () => {
        try {
          const { user } = await auth.getUser();

          if (!user?.email) {
            return { error: { status: 401, data: 'Not authenticated' } };
          }

          // Resend verification email through Supabase
          const { error } = await supabase.auth.resend({
            type: 'signup',
            email: user.email,
          });

          if (error) {
            return { error: { status: 400, data: error.message } };
          }

          return { data: { message: 'Verification email sent' } };
        } catch (error) {
          return { error: { status: 500, data: 'Failed to resend verification' } };
        }
      },
    }),
  }),
});

// Export hooks
export const {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useGetCurrentUserQuery,
  useUpdateProfileMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useChangePasswordMutation,
  useVerifyEmailMutation,
  useResendVerificationMutation,
} = supabaseAuthApi;

// Auth utility functions for Supabase
export const authUtils = {
  // Session management
  getSession: async () => {
    const { session } = await auth.getSession();
    return session;
  },

  // User management
  getCurrentUser: async (): Promise<UserProfile | null> => {
    const { user } = await auth.getUser();
    if (!user) {
      return null;
    }

    const { data: profile } = await db.profiles
      .select('*, organizations(*)')
      .eq('id', user.id)
      .single();

    return profile as UserProfile;
  },

  // Authentication checks
  isAuthenticated: async (): Promise<boolean> => {
    const { session } = await auth.getSession();
    return Boolean(session);
  },

  // Permission checks
  hasPermission: async (permission: string): Promise<boolean> => {
    const profile = await authUtils.getCurrentUser();
    if (!profile) {
      return false;
    }

    // Admin has all permissions
    if (profile.role === 'admin') {
      return true;
    }

    return profile.permissions.includes(permission);
  },

  hasRole: async (role: string): Promise<boolean> => {
    const profile = await authUtils.getCurrentUser();
    return profile?.role === role;
  },

  hasAnyRole: async (roles: string[]): Promise<boolean> => {
    const profile = await authUtils.getCurrentUser();
    return profile ? roles.includes(profile.role) : false;
  },

  // OAuth providers
  signInWithGoogle: () => auth.signInWithOAuth('google'),
  signInWithFacebook: () => auth.signInWithOAuth('facebook'),
  signInWithGitHub: () => auth.signInWithOAuth('github'),
};
