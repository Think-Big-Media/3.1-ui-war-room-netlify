/**
 * Integration tests for complete authentication flow
 * Tests the full user journey from registration to login
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { rest } from 'msw';
import { setupServer } from 'msw/node';

// Import components
import { LoginForm } from '../../components/auth/LoginForm';
import { RegisterForm } from '../../components/auth/RegisterForm';
import { EmailVerificationPage } from '../../components/auth/EmailVerificationPage';
import { ForgotPasswordForm } from '../../components/auth/ForgotPasswordForm';
import { ResetPasswordForm } from '../../components/auth/ResetPasswordForm';
import { Dashboard } from '../../pages/Dashboard';
import { ProtectedRoute } from '../../components/auth/ProtectedRoute';

// Import context and services
import { AuthProvider } from '../../contexts/AuthContext';
import { authApi } from '../../services/authApi';
import { analyticsApi } from '../../services/analyticsApi';

// Create test store
const createTestStore = () => {
  return configureStore({
    reducer: {
      [authApi.reducerPath]: authApi.reducer,
      [analyticsApi.reducerPath]: analyticsApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(authApi.middleware, analyticsApi.middleware),
  });
};

// Mock server setup
const server = setupServer(
  // Auth endpoints
  rest.post('/api/v1/auth/register', (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        first_name: 'Test',
        last_name: 'User',
        full_name: 'Test User',
        role: 'user',
        permissions: [],
        is_active: true,
        is_verified: false,
        two_factor_enabled: false,
        org_id: '123',
        created_at: new Date().toISOString(),
      })
    );
  }),

  rest.post('/api/v1/auth/login', async (req, res, ctx) => {
    const body = await req.text();
    const params = new URLSearchParams(body);

    if (
      params.get('username') === 'test@example.com' &&
      params.get('password') === 'Password123!'
    ) {
      return res(
        ctx.status(200),
        ctx.json({
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
          token_type: 'bearer',
          expires_in: 3600,
          user: {
            id: '1',
            email: 'test@example.com',
            username: 'testuser',
            first_name: 'Test',
            last_name: 'User',
            full_name: 'Test User',
            role: 'user',
            permissions: ['analytics.view'],
            is_active: true,
            is_verified: true,
            two_factor_enabled: false,
            org_id: '123',
            created_at: new Date().toISOString(),
          },
        })
      );
    }

    return res(ctx.status(401), ctx.json({ detail: 'Invalid credentials' }));
  }),

  rest.post('/api/v1/auth/verify-email/:token', (req, res, ctx) => {
    if (req.params.token === 'valid-token') {
      return res(ctx.status(200), ctx.json({ message: 'Email verified successfully' }));
    }
    return res(ctx.status(400), ctx.json({ detail: 'Invalid token' }));
  }),

  rest.post('/api/v1/auth/forgot-password', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ message: 'Password reset email sent' }));
  }),

  rest.post('/api/v1/auth/reset-password', async (req, res, ctx) => {
    const { token } = await req.json();
    if (token === 'valid-reset-token') {
      return res(ctx.status(200), ctx.json({ message: 'Password reset successful' }));
    }
    return res(ctx.status(400), ctx.json({ detail: 'Invalid token' }));
  }),

  // Dashboard data
  rest.get('/api/v1/analytics/dashboard', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        overview: {
          total_volunteers: 1234,
          active_volunteers: 456,
          total_events: 78,
          upcoming_events: 12,
        },
      })
    );
  })
);

// Enable API mocking
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Test app wrapper
const TestApp = ({ initialRoute = '/login' }) => {
  const store = createTestStore();

  return (
    <Provider store={store}>
      <MemoryRouter initialEntries={[initialRoute]}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginForm />} />
            <Route path="/register" element={<RegisterForm />} />
            <Route path="/email-verification" element={<EmailVerificationPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordForm />} />
            <Route path="/reset-password" element={<ResetPasswordForm />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </Provider>
  );
};

describe('Authentication Flow Integration Tests', () => {
  describe('Complete Registration Flow', () => {
    it('should allow user to register and be redirected to email verification', async () => {
      const user = userEvent.setup();
      render(<TestApp initialRoute="/register" />);

      // Fill registration form
      await user.type(screen.getByLabelText(/first name/i), 'Test');
      await user.type(screen.getByLabelText(/last name/i), 'User');
      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/phone number/i), '555-123-4567');
      await user.type(screen.getByLabelText('Password'), 'Password123!');
      await user.type(screen.getByLabelText(/confirm password/i), 'Password123!');
      await user.click(screen.getByLabelText(/i accept the terms/i));

      // Submit form
      await user.click(screen.getByRole('button', { name: /create account/i }));

      // Should show email verification page
      await waitFor(() => {
        expect(screen.getByText(/verify your email/i)).toBeInTheDocument();
        expect(
          screen.getByText(/we've sent a verification email to test@example.com/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Complete Login Flow', () => {
    it('should allow user to login and access dashboard', async () => {
      const user = userEvent.setup();
      render(<TestApp initialRoute="/login" />);

      // Fill login form
      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'Password123!');

      // Submit form
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      // Should redirect to dashboard
      await waitFor(() => {
        expect(screen.getByText(/campaign dashboard/i)).toBeInTheDocument();
        expect(screen.getByText(/1,234/)).toBeInTheDocument(); // Total volunteers
      });
    });

    it('should prevent access to protected routes when not authenticated', async () => {
      render(<TestApp initialRoute="/dashboard" />);

      // Should redirect to login
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /sign in to war room/i })).toBeInTheDocument();
      });
    });
  });

  describe('Password Reset Flow', () => {
    it('should complete full password reset flow', async () => {
      const user = userEvent.setup();
      render(<TestApp initialRoute="/forgot-password" />);

      // Request password reset
      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.click(screen.getByRole('button', { name: /send reset link/i }));

      // Should show success message
      await waitFor(() => {
        expect(screen.getByText(/password reset link sent!/i)).toBeInTheDocument();
      });

      // Navigate to reset password page with token
      window.history.pushState({}, '', '/reset-password?token=valid-reset-token');
      render(<TestApp initialRoute="/reset-password?token=valid-reset-token" />);

      // Enter new password
      await user.type(screen.getByLabelText('New Password'), 'NewPassword123!');
      await user.type(screen.getByLabelText(/confirm new password/i), 'NewPassword123!');
      await user.click(screen.getByRole('button', { name: /reset password/i }));

      // Should show success and redirect to login
      await waitFor(() => {
        expect(screen.getByText(/password reset successful/i)).toBeInTheDocument();
      });
    });
  });

  describe('Email Verification Flow', () => {
    it('should verify email with valid token', async () => {
      const user = userEvent.setup();

      // Simulate clicking verification link
      render(<TestApp initialRoute="/email-verification?token=valid-token" />);

      // Should automatically verify
      await waitFor(() => {
        expect(screen.getByText(/email verified successfully/i)).toBeInTheDocument();
      });

      // Should show login link
      expect(screen.getByText(/proceed to login/i)).toBeInTheDocument();
    });

    it('should handle invalid verification token', async () => {
      render(<TestApp initialRoute="/email-verification?token=invalid-token" />);

      // Should show error
      await waitFor(() => {
        expect(screen.getByText(/invalid or expired verification token/i)).toBeInTheDocument();
      });
    });
  });

  describe('Session Management', () => {
    it('should maintain session across page refreshes', async () => {
      const user = userEvent.setup();
      const store = createTestStore();

      // Login first
      const { rerender } = render(
        <Provider store={store}>
          <MemoryRouter initialEntries={['/login']}>
            <AuthProvider>
              <LoginForm />
            </AuthProvider>
          </MemoryRouter>
        </Provider>
      );

      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'Password123!');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      // Wait for login to complete
      await waitFor(() => {
        expect(localStorage.getItem('access_token')).toBe('mock-access-token');
      });

      // Simulate page refresh by re-rendering
      rerender(
        <Provider store={store}>
          <MemoryRouter initialEntries={['/dashboard']}>
            <AuthProvider>
              <Routes>
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </AuthProvider>
          </MemoryRouter>
        </Provider>
      );

      // Should still have access to dashboard
      await waitFor(() => {
        expect(screen.getByText(/campaign dashboard/i)).toBeInTheDocument();
      });
    });

    it('should handle token expiration gracefully', async () => {
      const user = userEvent.setup();

      // Mock expired token response
      server.use(
        rest.get('/api/v1/auth/me', (req, res, ctx) => {
          return res(ctx.status(401), ctx.json({ detail: 'Token expired' }));
        })
      );

      // Set expired token in localStorage
      localStorage.setItem('access_token', 'expired-token');

      render(<TestApp initialRoute="/dashboard" />);

      // Should redirect to login
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /sign in to war room/i })).toBeInTheDocument();
      });

      // Token should be cleared
      expect(localStorage.getItem('access_token')).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      const user = userEvent.setup();

      // Mock network error
      server.use(
        rest.post('/api/v1/auth/login', (req, res) => {
          return res.networkError('Network error');
        })
      );

      render(<TestApp initialRoute="/login" />);

      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'Password123!');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/login failed. please try again/i)).toBeInTheDocument();
      });
    });

    it('should handle server errors with proper messaging', async () => {
      const user = userEvent.setup();

      // Mock server error
      server.use(
        rest.post('/api/v1/auth/register', (req, res, ctx) => {
          return res(ctx.status(500), ctx.json({ detail: 'Internal server error' }));
        })
      );

      render(<TestApp initialRoute="/register" />);

      // Fill minimal form
      await user.type(screen.getByLabelText(/first name/i), 'Test');
      await user.type(screen.getByLabelText(/last name/i), 'User');
      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText('Password'), 'Password123!');
      await user.type(screen.getByLabelText(/confirm password/i), 'Password123!');
      await user.click(screen.getByLabelText(/i accept the terms/i));

      await user.click(screen.getByRole('button', { name: /create account/i }));

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/registration failed. please try again/i)).toBeInTheDocument();
      });
    });
  });
});
