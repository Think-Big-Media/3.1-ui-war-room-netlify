/**
 * Supabase Client Configuration for War Room Platform
 * Provides authenticated access to Supabase services
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Environment variables with fallback for development
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Check if we have placeholder values
const hasPlaceholders =
  supabaseUrl === 'your-supabase-url' || supabaseAnonKey === 'your-supabase-anon-key';

// Comprehensive debug logging with deployment safety
console.log('🔧 Supabase Client Initialization:');
console.log('==========================================');
console.log('📍 URL from env:', supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'MISSING');
console.log(
  '🔑 Anon key from env:',
  supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'MISSING'
);
console.log('🌐 Environment Check:');
console.log('  - Has window object:', typeof window !== 'undefined');
console.log('  - Is browser context:', typeof window !== 'undefined' && window.location);
console.log('🌐 OAuth Configuration:');
console.log('  - Google Auth Enabled:', import.meta.env.VITE_ENABLE_GOOGLE_AUTH);
console.log('  - GitHub Auth Enabled:', import.meta.env.VITE_ENABLE_GITHUB_AUTH);

// 🚨 DEPLOYMENT FIX: Only access window.location in browser context
const currentOrigin =
  typeof window !== 'undefined' ? window.location.origin : 'https://example.com';
console.log('  - Current Origin:', currentOrigin);
console.log('  - Expected Redirect:', `${currentOrigin}/auth/callback`);
console.log('==========================================');

// 🚨 DEPLOYMENT FIX: Declare variables before conditional blocks
let finalUrl: string;
let finalKey: string;

if (!supabaseUrl || !supabaseAnonKey || hasPlaceholders) {
  console.warn('⚠️ Supabase not configured - using dummy values for development');
  console.warn('⚠️ This is safe for development/deployment but auth will not work');

  // Use dummy values to prevent crash during development
  const dummyUrl = 'https://xyzcompany.supabase.co';
  const dummyKey =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5emNvbXBhbnkiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYyNzIwODU0MSwibmF0IjoxNjI3MjA4NTQxLCJleHAiOjE5NzQzNjMzNDEsImV4cCI6MTk3NDM2MzM0MX0.dummy_key_for_development_only';

  finalUrl = hasPlaceholders ? dummyUrl : supabaseUrl || dummyUrl;
  finalKey = hasPlaceholders ? dummyKey : supabaseAnonKey || dummyKey;

  console.log('🔧 Using dummy Supabase config for deployment safety');
} else {
  finalUrl = supabaseUrl;
  finalKey = supabaseAnonKey;
  console.log('✅ Using real Supabase config');
}

// Create Supabase client with type safety
console.log('🚀 Creating Supabase client...');
export const supabase = createClient<Database>(finalUrl!, finalKey!, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: {
      getItem: (key: string) => {
        if (typeof window !== 'undefined') {
          return window.localStorage.getItem(key);
        }
        return null;
      },
      setItem: (key: string, value: string) => {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, value);
        }
      },
      removeItem: (key: string) => {
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(key);
        }
      },
    },
  },
  global: {
    headers: {
      'x-client-info': 'war-room-web',
    },
  },
  db: {
    schema: 'public',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Auth helpers
export const auth = {
  // Sign up with email
  signUp: async (email: string, password: string, metadata?: any) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: `${window.location.origin}/verify-email`,
      },
    });
    return { data, error };
  },

  // Sign in with email
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  // Sign out
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // Get current user
  getUser: async () => {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    return { user, error };
  },

  // Get session
  getSession: async () => {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    return { session, error };
  },

  // Reset password
  resetPassword: async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { data, error };
  },

  // Update password
  updatePassword: async (newPassword: string) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return { data, error };
  },

  // Verify OTP
  verifyOtp: async (email: string, token: string) => {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });
    return { data, error };
  },

  // Update user metadata
  updateUser: async (attributes: any) => {
    const { data, error } = await supabase.auth.updateUser(attributes);
    return { data, error };
  },

  // OAuth sign in
  signInWithOAuth: async (provider: 'google' | 'facebook' | 'github') => {
    console.log('🔐 OAuth Login Attempt:', {
      provider,
      timestamp: new Date().toISOString(),
      origin: window.location.origin,
      redirectTo: `${window.location.origin}/dashboard`,
      authEnabled:
        provider === 'google'
          ? import.meta.env.VITE_ENABLE_GOOGLE_AUTH
          : provider === 'github'
            ? import.meta.env.VITE_ENABLE_GITHUB_AUTH
            : 'N/A',
    });

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
          scopes: provider === 'google' ? 'email profile' : undefined,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        console.error('❌ OAuth Error Response:', {
          provider,
          error: error.message,
          status: error.status,
          details: error,
        });
      } else {
        console.log('✅ OAuth Success:', {
          provider,
          url: data?.url ? `${data.url.substring(0, 100)}...` : 'No URL',
          hasProvider: Boolean(data?.provider),
        });
      }

      return { data, error };
    } catch (exception: any) {
      console.error('💥 OAuth Exception:', {
        provider,
        message: exception.message,
        stack: exception.stack,
      });
      return { data: null, error: exception };
    }
  },
};

// Database helpers
export const db = {
  // Organizations
  organizations: supabase.from('organizations'),

  // Users (profiles)
  profiles: supabase.from('profiles'),

  // Contacts
  contacts: supabase.from('contacts'),

  // Volunteers
  volunteers: supabase.from('volunteers'),

  // Events
  events: supabase.from('events'),

  // Donations
  donations: supabase.from('donations'),

  // Event registrations
  eventRegistrations: supabase.from('event_registrations'),

  // Volunteer shifts
  volunteerShifts: supabase.from('volunteer_shifts'),

  // Platform admin tables
  featureFlags: supabase.from('feature_flags'),
  auditLogs: supabase.from('audit_logs'),
};

// Storage helpers
export const storage = {
  // Avatar storage
  avatars: supabase.storage.from('avatars'),

  // Document storage
  documents: supabase.storage.from('documents'),

  // Organization assets
  orgAssets: supabase.storage.from('org-assets'),

  // Upload file
  uploadFile: async (bucket: string, path: string, file: File) => {
    const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });
    return { data, error };
  },

  // Get public URL
  getPublicUrl: (bucket: string, path: string) => {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  },

  // Download file
  downloadFile: async (bucket: string, path: string) => {
    const { data, error } = await supabase.storage.from(bucket).download(path);
    return { data, error };
  },

  // Delete file
  deleteFile: async (bucket: string, paths: string[]) => {
    const { data, error } = await supabase.storage.from(bucket).remove(paths);
    return { data, error };
  },
};

// Realtime helpers
export const realtime = {
  // Subscribe to table changes
  subscribeToTable: (table: string, callback: (payload: any) => void, filter?: string) => {
    const channel = supabase
      .channel(`public:${table}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          filter,
        },
        callback
      )
      .subscribe();

    return channel;
  },

  // Subscribe to specific record
  subscribeToRecord: (table: string, id: string, callback: (payload: any) => void) => {
    return realtime.subscribeToTable(table, callback, `id=eq.${id}`);
  },

  // Unsubscribe from channel
  unsubscribe: async (channel: any) => {
    await supabase.removeChannel(channel);
  },

  // Broadcast custom event
  broadcast: async (channel: string, event: string, payload: any) => {
    const result = await supabase.channel(channel).send({
      type: 'broadcast',
      event,
      payload,
    });
    return { error: (result as any).error || null };
  },
};

// RPC functions (Edge Functions)
export const functions = {
  // Call an edge function
  invoke: async (functionName: string, options?: any) => {
    const { data, error } = await supabase.functions.invoke(functionName, options);
    return { data, error };
  },

  // Common functions
  getAnalyticsDashboard: async (orgId: string, dateRange: any) => {
    return functions.invoke('get-analytics-dashboard', {
      body: { orgId, dateRange },
    });
  },

  processDocument: async (documentId: string) => {
    return functions.invoke('process-document', {
      body: { documentId },
    });
  },

  sendNotification: async (notification: any) => {
    return functions.invoke('send-notification', {
      body: notification,
    });
  },
};

// Helper to check if user has permission
export const checkPermission = async (permission: string): Promise<boolean> => {
  const { user } = await auth.getUser();
  if (!user) {
    return false;
  }

  // Get user profile with permissions
  const { data: profile } = await db.profiles
    .select('role, permissions')
    .eq('id', user.id)
    .single();

  if (!profile) {
    return false;
  }

  // Admin has all permissions
  if (profile.role === 'admin') {
    return true;
  }

  // Check specific permission
  return profile.permissions?.includes(permission) || false;
};

// Helper to get user's organization
export const getUserOrganization = async () => {
  const { user } = await auth.getUser();
  if (!user) {
    return null;
  }

  const { data: profile } = await db.profiles
    .select('*, organizations(*)')
    .eq('id', user.id)
    .single();

  return profile?.organizations;
};

// Export types
export type SupabaseClient = typeof supabase;
export type { Database };
