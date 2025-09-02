/**
 * Simplified Auth Context for Debugging
 */

import type React from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface SimpleAuthContextType {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: any;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const SimpleAuthContext = createContext<SimpleAuthContextType | undefined>(undefined);

export function SimpleAuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🚀 Simple Auth: Starting initialization');

    // Simple timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      console.log('⏰ Simple Auth: Timeout reached, setting loading to false');
      setIsLoading(false);
    }, 3000);

    // Try to get session
    supabase.auth
      .getSession()
      .then(({ data: { session }, error }) => {
        console.log('✅ Simple Auth: Session check complete', { session: Boolean(session), error });
        if (session) {
          setUser(session.user);
          setIsAuthenticated(true);
        }
        setIsLoading(false);
        clearTimeout(timeout);
      })
      .catch((err) => {
        console.error('❌ Simple Auth: Error getting session', err);
        setError(err.message);
        setIsLoading(false);
        clearTimeout(timeout);
      });

    // Cleanup
    return () => clearTimeout(timeout);
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        throw error;
      }
      setUser(data.user);
      setIsAuthenticated(true);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <SimpleAuthContext.Provider
      value={{ isLoading, isAuthenticated, user, error, signIn, signOut }}
    >
      {children}
    </SimpleAuthContext.Provider>
  );
}

export const useSimpleAuth = () => {
  const context = useContext(SimpleAuthContext);
  if (!context) {
    throw new Error('useSimpleAuth must be used within SimpleAuthProvider');
  }
  return context;
};
