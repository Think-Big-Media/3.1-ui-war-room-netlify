/**
 * Strategic Authentication Flow Tests
 * Tests resilience improvements and timeout handling
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SupabaseAuthProvider, useSupabaseAuth } from '../SupabaseAuthContext';

// Mock Supabase
jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
    },
  },
  auth: {},
  db: {
    profiles: {
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(),
          })),
        })),
      })),
    },
  },
}));

// Test component to access auth context
const TestComponent = () => {
  const { isLoading, isAuthenticated, user, error } = useSupabaseAuth();

  return (
    <div>
      <div data-testid="loading">{isLoading ? 'Loading' : 'Not Loading'}</div>
      <div data-testid="authenticated">
        {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
      </div>
      <div data-testid="user">{user ? user.email : 'No User'}</div>
      <div data-testid="error">{error || 'No Error'}</div>
    </div>
  );
};

describe('SupabaseAuthContext - Resilience Tests', () => {
  const mockSupabase = require('../../lib/supabase').supabase;

  beforeEach(() => {
    jest.clearAllMocks();
    // Default successful session mock
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });
  });

  test('should handle initialization timeout gracefully', async () => {
    // Mock a slow/hanging session check
    mockSupabase.auth.getSession.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 5000))
    );

    render(
      <SupabaseAuthProvider>
        <TestComponent />
      </SupabaseAuthProvider>
    );

    // Should start loading
    expect(screen.getByTestId('loading')).toHaveTextContent('Loading');

    // Should eventually timeout and stop loading (we implemented 3s timeout)
    await waitFor(
      () => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
      },
      { timeout: 4000 }
    );
  });

  test('should handle session errors without crashing', async () => {
    // Mock session error
    mockSupabase.auth.getSession.mockRejectedValue(new Error('Network error'));

    render(
      <SupabaseAuthProvider>
        <TestComponent />
      </SupabaseAuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
      expect(screen.getByTestId('authenticated')).toHaveTextContent('Not Authenticated');
    });

    // Should not crash the app
    expect(screen.getByTestId('error')).toBeInTheDocument();
  });

  test('should handle successful authentication flow', async () => {
    const mockUser = {
      id: 'user123',
      email: 'test@example.com',
      email_confirmed_at: new Date().toISOString(),
    };

    const mockSession = {
      user: mockUser,
      access_token: 'token123',
    };

    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });

    render(
      <SupabaseAuthProvider>
        <TestComponent />
      </SupabaseAuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
      expect(screen.getByTestId('authenticated')).toHaveTextContent('Authenticated');
      expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
    });
  });

  test('should handle profile fetch failures gracefully', async () => {
    const mockUser = {
      id: 'user123',
      email: 'test@example.com',
      email_confirmed_at: new Date().toISOString(),
    };

    const mockSession = {
      user: mockUser,
      access_token: 'token123',
    };

    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });

    // Mock profile fetch failure
    const mockDb = require('../../lib/supabase').db;
    mockDb.profiles.select.mockReturnValue({
      eq: jest.fn().mockReturnValue({
        single: jest.fn().mockRejectedValue(new Error('Profile fetch failed')),
      }),
    });

    render(
      <SupabaseAuthProvider>
        <TestComponent />
      </SupabaseAuthProvider>
    );

    await waitFor(() => {
      // Should still authenticate user even if profile fails
      expect(screen.getByTestId('authenticated')).toHaveTextContent('Authenticated');
      expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
    });
  });

  test('should cleanup subscriptions on unmount', async () => {
    const mockUnsubscribe = jest.fn();
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: mockUnsubscribe } },
    });

    const { unmount } = render(
      <SupabaseAuthProvider>
        <TestComponent />
      </SupabaseAuthProvider>
    );

    unmount();

    // Should call unsubscribe to prevent memory leaks
    expect(mockUnsubscribe).toHaveBeenCalled();
  });
});

/**
 * Permission and Role Tests
 */
describe('SupabaseAuthContext - Permissions', () => {
  test('should handle permission checking safely', async () => {
    const PermissionTestComponent = () => {
      const { hasPermission, hasRole } = useSupabaseAuth();

      return (
        <div>
          <div data-testid="admin-permission">
            {hasPermission('admin.write') ? 'Has Admin' : 'No Admin'}
          </div>
          <div data-testid="user-role">{hasRole('admin') ? 'Is Admin' : 'Not Admin'}</div>
        </div>
      );
    };

    render(
      <SupabaseAuthProvider>
        <PermissionTestComponent />
      </SupabaseAuthProvider>
    );

    await waitFor(() => {
      // Should safely return false when no user
      expect(screen.getByTestId('admin-permission')).toHaveTextContent('No Admin');
      expect(screen.getByTestId('user-role')).toHaveTextContent('Not Admin');
    });
  });
});
