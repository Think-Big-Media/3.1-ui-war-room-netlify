/**
 * Supabase Authentication Context for War Room Platform
 * Provides auth state and methods using Supabase Auth
 */

import React, { createContext, useContext, useEffect, useReducer, type ReactNode } from 'react';
import { type User, type Session, type AuthChangeEvent } from '@supabase/supabase-js';
import { supabase, auth, db } from '../lib/supabase';
import { type UserProfile } from '../services/supabaseAuthApi';

// Auth state types
interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  error: string | null;
}

// Auth actions
type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; session: Session; profile?: UserProfile } }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'AUTH_CLEAR_ERROR' }
  | { type: 'AUTH_UPDATE_PROFILE'; payload: UserProfile }
  | { type: 'AUTH_SESSION_REFRESH'; payload: { session: Session } };

// Auth context type
interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, metadata?: any) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  clearError: () => void;
  refreshSession: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
}

// Initial state
const initialState: AuthState = {
  isAuthenticated: false,
  isLoading: true,
  user: null,
  profile: null,
  session: null,
  error: null,
};

// Auth reducer
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case 'AUTH_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        isLoading: false,
        user: action.payload.user,
        session: action.payload.session,
        profile: action.payload.profile || null,
        error: null,
      };

    case 'AUTH_FAILURE':
      return {
        ...state,
        isAuthenticated: false,
        isLoading: false,
        user: null,
        profile: null,
        session: null,
        error: action.payload,
      };

    case 'AUTH_LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        isLoading: false,
        user: null,
        profile: null,
        session: null,
        error: null,
      };

    case 'AUTH_CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };

    case 'AUTH_UPDATE_PROFILE':
      return {
        ...state,
        profile: action.payload,
      };

    case 'AUTH_SESSION_REFRESH':
      return {
        ...state,
        session: action.payload.session,
      };

    default:
      return state;
  }
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider props
interface AuthProviderProps {
  children: ReactNode;
}

// Auth provider component
export function SupabaseAuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Fetch user profile
  const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await db.profiles
        .select('*, organizations(*)')
        .eq('id', userId)
        .single();

      if (error || !data) {
        return null;
      }

      return data as UserProfile;
    } catch (error) {
      return null;
    }
  };

  // Initialize auth state on mount
  useEffect(() => {
    let isSubscribed = true;

    const initializeAuth = async () => {
      // Only dispatch if component is still mounted
      if (isSubscribed) {
        dispatch({ type: 'AUTH_START' });
      }

      try {
        // Create a more robust timeout wrapper
        const withTimeout = async (promise: Promise<any>, timeoutMs: number) => {
          let timeoutId: NodeJS.Timeout;

          const timeoutPromise = new Promise((_, reject) => {
            timeoutId = setTimeout(() => {
              reject(new Error(`Operation timed out after ${timeoutMs}ms`));
            }, timeoutMs);
          });

          try {
            const result = await Promise.race([promise, timeoutPromise]);
            clearTimeout(timeoutId!);
            return result;
          } catch (error) {
            clearTimeout(timeoutId!);
            throw error;
          }
        };

        // Try to get session with 3-second timeout
        let sessionResult;
        try {
          sessionResult = await withTimeout(supabase.auth.getSession(), 3000);
        } catch (timeoutError) {
          // On timeout, assume no session
          if (isSubscribed) {
            dispatch({ type: 'AUTH_LOGOUT' });
          }
          return;
        }

        const {
          data: { session },
          error: sessionError,
        } = sessionResult || { data: { session: null }, error: null };

        if (sessionError) {
          if (isSubscribed) {
            dispatch({ type: 'AUTH_LOGOUT' });
          }
          return;
        }

        if (session?.user) {
          // Try to fetch profile with timeout
          let profile = null;
          try {
            profile = await withTimeout(fetchUserProfile(session.user.id), 3000);
          } catch (profileError) {
            // Continue without profile - it's not critical
          }

          if (isSubscribed) {
            dispatch({
              type: 'AUTH_SUCCESS',
              payload: { user: session.user, session, profile: profile || undefined },
            });
          }
        } else {
          if (isSubscribed) {
            dispatch({ type: 'AUTH_LOGOUT' });
          }
        }
      } catch (error) {
        if (isSubscribed) {
          dispatch({ type: 'AUTH_LOGOUT' });
        }
      }
    };

    // Initialize with a maximum wait time
    const maxWaitTimeout = setTimeout(() => {
      if (isSubscribed) {
        dispatch({ type: 'AUTH_LOGOUT' });
      }
    }, 10000); // 10 second maximum wait

    initializeAuth().finally(() => {
      clearTimeout(maxWaitTimeout);
    });

    // Cleanup function
    return () => {
      isSubscribed = false;
    };
  }, []);

  // Listen for auth state changes
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      switch (event) {
        case 'SIGNED_IN':
        case 'TOKEN_REFRESHED':
          if (session?.user) {
            const profile = await fetchUserProfile(session.user.id);
            dispatch({
              type: 'AUTH_SUCCESS',
              payload: { user: session.user, session, profile: profile || undefined },
            });
          }
          break;

        case 'SIGNED_OUT':
          dispatch({ type: 'AUTH_LOGOUT' });
          break;

        case 'USER_UPDATED':
          if (session?.user) {
            const profile = await fetchUserProfile(session.user.id);
            if (profile) {
              dispatch({ type: 'AUTH_UPDATE_PROFILE', payload: profile });
            }
          }
          break;

        default:
          break;
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Auth methods
  const signIn = async (email: string, password: string) => {
    dispatch({ type: 'AUTH_START' });

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (!data.user || !data.session) {
        throw new Error('Login failed');
      }

      // Fetch user profile
      const profile = await fetchUserProfile(data.user.id);

      // Update last login
      if (profile) {
        await db.profiles
          .update({
            last_login_at: new Date().toISOString(),
            last_login_ip: window.location.hostname,
          })
          .eq('id', data.user.id);
      }

      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user: data.user, session: data.session, profile: profile || undefined },
      });
    } catch (error: any) {
      dispatch({ type: 'AUTH_FAILURE', payload: error.message || 'Login failed' });
      throw error;
    }
  };

  const signUp = async (email: string, password: string, metadata?: any) => {
    dispatch({ type: 'AUTH_START' });

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: `${window.location.origin}/verify-email`,
        },
      });

      if (error) {
        throw error;
      }

      if (!data.user) {
        throw new Error('Registration failed');
      }

      // Note: User profile should be created via database trigger or Edge Function
      // to ensure it's created even if the client fails

      if (data.session) {
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { user: data.user, session: data.session },
        });
      } else {
        // User needs to verify email
        dispatch({ type: 'AUTH_LOGOUT' });
      }
    } catch (error: any) {
      dispatch({ type: 'AUTH_FAILURE', payload: error.message || 'Registration failed' });
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      dispatch({ type: 'AUTH_LOGOUT' });
    } catch (error: any) {
      // Even if server logout fails, clear local state
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!state.user) {
      throw new Error('Not authenticated');
    }

    try {
      const { data, error } = await db.profiles
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', state.user.id)
        .select('*, organizations(*)')
        .single();

      if (error || !data) {
        throw error || new Error('Failed to update profile');
      }

      dispatch({ type: 'AUTH_UPDATE_PROFILE', payload: data as UserProfile });
    } catch (error: any) {
      throw error;
    }
  };

  const refreshSession = async () => {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.refreshSession();

      if (error) {
        throw error;
      }

      if (session) {
        dispatch({ type: 'AUTH_SESSION_REFRESH', payload: { session } });
      }
    } catch (error) {
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  };

  const clearError = () => {
    dispatch({ type: 'AUTH_CLEAR_ERROR' });
  };

  // Permission checking methods
  const hasPermission = (permission: string): boolean => {
    if (!state.profile) {
      return false;
    }

    // Admin has all permissions
    if (state.profile.role === 'admin') {
      return true;
    }

    return state.profile.permissions.includes(permission);
  };

  const hasRole = (role: string): boolean => {
    return state.profile?.role === role;
  };

  const hasAnyRole = (roles: string[]): boolean => {
    return state.profile ? roles.includes(state.profile.role) : false;
  };

  // Context value
  const value: AuthContextType = {
    ...state,
    signIn,
    signUp,
    signOut,
    updateProfile,
    clearError,
    refreshSession,
    hasPermission,
    hasRole,
    hasAnyRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook to use auth context
export function useSupabaseAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }
  return context;
}

// Higher-order component for protecting routes with Supabase
interface RequireSupabaseAuthProps {
  children: ReactNode;
  fallback?: ReactNode;
  requiredRole?: string;
  requiredPermissions?: string[];
  requireEmailVerification?: boolean;
}

export function RequireSupabaseAuth({
  children,
  fallback = <div>Redirecting to login...</div>,
  requiredRole,
  requiredPermissions = [],
  requireEmailVerification = false,
}: RequireSupabaseAuthProps) {
  const { isAuthenticated, isLoading, user, profile, hasRole, hasPermission } = useSupabaseAuth();

  // Show loading state
  if (isLoading) {
    return <div>Loading...</div>;
  }

  // Not authenticated
  if (!isAuthenticated || !user) {
    return <>{fallback}</>;
  }

  // Email verification required
  if (requireEmailVerification && !user.email_confirmed_at) {
    return <div>Please verify your email address to continue.</div>;
  }

  // Wait for profile to load
  if (!profile) {
    return <div>Loading profile...</div>;
  }

  // Role check
  if (requiredRole && !hasRole(requiredRole)) {
    return <div>Access denied. Required role: {requiredRole}</div>;
  }

  // Permission checks
  const missingPermissions = requiredPermissions.filter((permission) => !hasPermission(permission));

  if (missingPermissions.length > 0) {
    return <div>Access denied. Missing permissions: {missingPermissions.join(', ')}</div>;
  }

  return <>{children}</>;
}

// Hook for conditional rendering based on permissions
export function useSupabasePermissions() {
  const { hasPermission, hasRole, hasAnyRole } = useSupabaseAuth();

  return {
    hasPermission,
    hasRole,
    hasAnyRole,
    canRead: (resource: string) => hasPermission(`${resource}.read`),
    canWrite: (resource: string) => hasPermission(`${resource}.write`),
    canDelete: (resource: string) => hasPermission(`${resource}.delete`),
    canAdmin: (resource: string) => hasPermission(`${resource}.admin`),
  };
}
