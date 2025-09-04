/**
 * Authentication Context for War Room platform
 * Migrated to Supabase Auth - replaces FastAPI endpoints
 */

import React, { createContext, useContext, useEffect, useReducer, type ReactNode } from 'react';
import { supabase } from '../lib/supabase/client';
import {
  signIn,
  signOut,
  getCurrentUser,
  onAuthStateChange,
  type AuthState as SupabaseAuthState,
} from '../lib/supabase/auth';
import type { User } from '@supabase/supabase-js';

// Auth state types - migrated to Supabase
interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  session: any | null;
  error: string | null;
}

// Auth actions - updated for Supabase
type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; session: any } }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'AUTH_CLEAR_ERROR' }
  | { type: 'AUTH_UPDATE_USER'; payload: User };

// Auth context type - updated for Supabase
interface AuthContextType extends AuthState {
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, metadata?: any) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (user: User) => void;
  clearError: () => void;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  hasPermission: (permission: string) => boolean;
}

// Initial state - updated for Supabase
const initialState: AuthState = {
  isAuthenticated: false,
  isLoading: true,
  user: null,
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
        error: null,
      };

    case 'AUTH_FAILURE':
      return {
        ...state,
        isAuthenticated: false,
        isLoading: false,
        user: null,
        error: action.payload,
      };

    case 'AUTH_LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        isLoading: false,
        user: null,
        session: null,
        error: null,
      };

    case 'AUTH_CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };

    case 'AUTH_UPDATE_USER':
      return {
        ...state,
        user: action.payload,
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

// Auth provider component - migrated to Supabase
export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize Supabase auth state on mount
  useEffect(() => {
    dispatch({ type: 'AUTH_START' });

    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Session fetch error:', error);
        dispatch({ type: 'AUTH_FAILURE', payload: error.message });
      } else if (session) {
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { user: session.user, session },
        });
      } else {
        dispatch({ type: 'AUTH_LOGOUT' });
      }
    });

    // Listen to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);

      if (session) {
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { user: session.user, session },
        });
      } else {
        dispatch({ type: 'AUTH_LOGOUT' });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Auth methods - migrated to Supabase
  const signInWithEmail = async (email: string, password: string) => {
    try {
      dispatch({ type: 'AUTH_START' });
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      // Auth state will be updated via onAuthStateChange listener
    } catch (error: any) {
      dispatch({ type: 'AUTH_FAILURE', payload: error.message });
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string, metadata?: any) => {
    try {
      dispatch({ type: 'AUTH_START' });
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        throw error;
      }

      // Check if email confirmation is required
      if (!data.user?.email_confirmed_at) {
        dispatch({
          type: 'AUTH_FAILURE',
          payload: 'Please check your email to confirm your account',
        });
      }
    } catch (error: any) {
      dispatch({ type: 'AUTH_FAILURE', payload: error.message });
      throw error;
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      // Auth state will be updated via onAuthStateChange listener
    } catch (error: any) {
      console.error('Logout error:', error);
      // Force logout even if server call fails
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  };

  const updateUser = (user: User) => {
    dispatch({ type: 'AUTH_UPDATE_USER', payload: user });
  };

  const clearError = () => {
    dispatch({ type: 'AUTH_CLEAR_ERROR' });
  };

  // Role checking methods - using Supabase user metadata
  const hasRole = (role: string): boolean => {
    return state.user?.user_metadata?.role === role;
  };

  const hasAnyRole = (roles: string[]): boolean => {
    const userRole = state.user?.user_metadata?.role;
    return userRole ? roles.includes(userRole) : false;
  };

  const hasPermission = (permission: string): boolean => {
    const permissions = state.user?.user_metadata?.permissions || [];
    return Array.isArray(permissions) && permissions.includes(permission);
  };

  // Context value - updated for Supabase
  const value: AuthContextType = {
    ...state,
    signInWithEmail,
    signUpWithEmail,
    signOut: handleSignOut,
    updateUser,
    clearError,
    hasRole,
    hasAnyRole,
    hasPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Higher-order component for protecting routes
interface RequireAuthProps {
  children: ReactNode;
  fallback?: ReactNode;
  requiredRole?: string;
  requiredPermissions?: string[];
  requireEmailVerification?: boolean;
}

export function RequireAuth({
  children,
  fallback = <div>Redirecting to login...</div>,
  requiredRole,
  requiredPermissions = [],
  requireEmailVerification = false,
}: RequireAuthProps) {
  const { isAuthenticated, isLoading, user, hasRole, hasPermission } = useAuth();

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

  // Role check
  if (requiredRole && !hasRole(requiredRole)) {
    return <div>Access denied. Required role: {requiredRole}</div>;
  }

  // For now, only role-based access is implemented
  // Permissions can be added later via RLS policies or user metadata
  if (requiredPermissions.length > 0) {
    console.warn(
      'Permission-based access control not yet implemented with Supabase. Using role-based access only.'
    );
  }

  return <>{children}</>;
}

// Hook for conditional rendering based on roles - Supabase compatible
export function usePermissions() {
  const { hasRole, hasAnyRole } = useAuth();

  return {
    hasRole,
    hasAnyRole,
    // Role-based permissions (can be extended with RLS policies)
    isAdmin: () => hasRole('admin') || hasRole('platform_admin'),
    isUser: () => hasRole('user'),
    canManageOrg: () => hasRole('admin') || hasRole('platform_admin'),
    canViewReports: () => hasAnyRole(['admin', 'user']),
  };
}
