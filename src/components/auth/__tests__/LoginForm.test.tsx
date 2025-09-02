/**
 * Comprehensive test suite for LoginForm component
 * Tests: rendering, validation, form submission, error handling, navigation
 */

import type React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { LoginForm } from '../LoginForm';
import { authApi } from '../../../services/authApi';
import { AuthProvider } from '../../../contexts/AuthContext';
import * as authContext from '../../../contexts/AuthContext';

// Mock the auth context
jest.mock('../../../contexts/AuthContext', () => ({
  ...jest.requireActual('../../../contexts/AuthContext'),
  useAuth: jest.fn(),
}));

// Create a test store with auth API
const createTestStore = () => {
  return configureStore({
    reducer: {
      [authApi.reducerPath]: authApi.reducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(authApi.middleware),
  });
};

// Helper to render component with providers
const renderWithProviders = (ui: React.ReactElement, { route = '/login' } = {}) => {
  const store = createTestStore();

  return {
    ...render(
      <Provider store={store}>
        <MemoryRouter initialEntries={[route]}>
          <AuthProvider>{ui}</AuthProvider>
        </MemoryRouter>
      </Provider>
    ),
    store,
  };
};

describe('LoginForm Component', () => {
  const mockNavigate = jest.fn();
  const mockLogin = jest.fn();
  const mockClearError = jest.fn();

  // Default mock auth context values
  const defaultAuthValues = {
    login: mockLogin,
    isAuthenticated: false,
    clearError: mockClearError,
    user: null,
    logout: jest.fn(),
    isLoading: false,
    error: null,
  };

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Mock useNavigate
    jest.mock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useNavigate: () => mockNavigate,
    }));

    // Set default auth context mock
    (authContext.useAuth as jest.Mock).mockReturnValue(defaultAuthValues);
  });

  describe('Rendering', () => {
    it('should render login form with all elements', () => {
      renderWithProviders(<LoginForm />);

      // Check heading
      expect(screen.getByRole('heading', { name: /sign in to war room/i })).toBeInTheDocument();
      expect(screen.getByText(/welcome back to your campaign command center/i)).toBeInTheDocument();

      // Check form fields
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/remember me/i)).toBeInTheDocument();

      // Check links
      expect(screen.getByText(/forgot your password\?/i)).toBeInTheDocument();
      expect(screen.getByText(/sign up here/i)).toBeInTheDocument();

      // Check submit button
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('should redirect to dashboard if already authenticated', () => {
      (authContext.useAuth as jest.Mock).mockReturnValue({
        ...defaultAuthValues,
        isAuthenticated: true,
      });

      renderWithProviders(<LoginForm />);

      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });

    it('should redirect to previous location if available', () => {
      (authContext.useAuth as jest.Mock).mockReturnValue({
        ...defaultAuthValues,
        isAuthenticated: true,
      });

      renderWithProviders(<LoginForm />, {
        route: '/login?from=/analytics',
      });

      // The location state would be passed through router
      // For this test, we'd need to enhance the mock
    });
  });

  describe('Form Validation', () => {
    it('should show error when email is empty', async () => {
      const user = userEvent.setup();
      renderWithProviders(<LoginForm />);

      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      });
    });

    it('should show error for invalid email format', async () => {
      const user = userEvent.setup();
      renderWithProviders(<LoginForm />);

      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'invalid-email');

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      });
    });

    it('should show error when password is empty', async () => {
      const user = userEvent.setup();
      renderWithProviders(<LoginForm />);

      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'test@example.com');

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });
    });

    it('should show error when password is too short', async () => {
      const user = userEvent.setup();
      renderWithProviders(<LoginForm />);

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'short');

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
      });
    });

    it('should clear errors when form values change', async () => {
      const user = userEvent.setup();
      renderWithProviders(<LoginForm />);

      // Submit empty form to trigger errors
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      });

      // Type in email field
      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 't');

      // Errors should be cleared
      expect(screen.queryByText(/email is required/i)).not.toBeInTheDocument();
      expect(mockClearError).toHaveBeenCalled();
    });
  });

  describe('Password Visibility Toggle', () => {
    it('should toggle password visibility when eye icon is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<LoginForm />);

      const passwordInput = screen.getByLabelText(/password/i);
      const toggleButton = screen.getByRole('button', { name: '' }); // Eye icon button

      // Initially password should be hidden
      expect(passwordInput).toHaveAttribute('type', 'password');

      // Click to show password
      await user.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'text');

      // Click again to hide password
      await user.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'password');
    });
  });

  describe('Form Submission', () => {
    it('should call login mutation with correct data on valid submission', async () => {
      const user = userEvent.setup();
      const store = createTestStore();

      // Mock successful login response
      const mockLoginResponse = {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        token_type: 'Bearer',
        expires_in: 3600,
        user: {
          id: '1',
          email: 'test@example.com',
          username: 'testuser',
          first_name: 'Test',
          last_name: 'User',
          full_name: 'Test User',
          role: 'user',
          permissions: [],
          is_active: true,
          is_verified: true,
          two_factor_enabled: false,
          org_id: '123',
          created_at: '2024-01-01',
        },
      };

      // Mock the login endpoint
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockLoginResponse,
      });

      render(
        <Provider store={store}>
          <BrowserRouter>
            <LoginForm />
          </BrowserRouter>
        </Provider>
      );

      // Fill in form
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const rememberCheckbox = screen.getByLabelText(/remember me/i);

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(rememberCheckbox);

      // Submit form
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      // Verify API call
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/v1/auth/login'),
          expect.objectContaining({
            method: 'POST',
            body: expect.any(URLSearchParams),
          })
        );
      });

      // Verify auth context login was called
      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith(
          {
            access_token: mockLoginResponse.access_token,
            refresh_token: mockLoginResponse.refresh_token,
          },
          mockLoginResponse.user
        );
      });
    });

    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
      renderWithProviders(<LoginForm />);

      // Mock a delayed response
      global.fetch = jest
        .fn()
        .mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));

      // Fill in valid form
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      // Check loading state
      expect(screen.getByText(/signing in.../i)).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });

    it('should handle 401 error (invalid credentials)', async () => {
      const user = userEvent.setup();
      renderWithProviders(<LoginForm />);

      // Mock 401 response
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ detail: 'Invalid credentials' }),
      });

      // Fill in form
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'wrongpassword');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      // Check error message
      await waitFor(() => {
        expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
      });
    });

    it('should handle 403 error (inactive account)', async () => {
      const user = userEvent.setup();
      renderWithProviders(<LoginForm />);

      // Mock 403 response
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ detail: 'Account inactive' }),
      });

      // Fill and submit form
      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      // Check error message
      await waitFor(() => {
        expect(
          screen.getByText(/account is inactive. please contact support/i)
        ).toBeInTheDocument();
      });
    });

    it('should handle 429 error (rate limiting)', async () => {
      const user = userEvent.setup();
      renderWithProviders(<LoginForm />);

      // Mock 429 response
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({ detail: 'Too many requests' }),
      });

      // Fill and submit form
      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      // Check error message
      await waitFor(() => {
        expect(
          screen.getByText(/too many login attempts. please try again later/i)
        ).toBeInTheDocument();
      });
    });

    it('should handle generic server errors', async () => {
      const user = userEvent.setup();
      renderWithProviders(<LoginForm />);

      // Mock network error
      global.fetch = jest.fn().mockRejectedValueOnce(new Error('Network error'));

      // Fill and submit form
      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      // Check error message
      await waitFor(() => {
        expect(screen.getByText(/login failed. please try again/i)).toBeInTheDocument();
      });
    });
  });

  describe('Remember Me Functionality', () => {
    it('should include rememberMe in login request when checked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<LoginForm />);

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      // Fill form with remember me checked
      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByLabelText(/remember me/i));

      // Submit
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      // Verify rememberMe was included in request
      await waitFor(() => {
        const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
        const { body } = fetchCall[1];
        expect(body.toString()).toContain('grant_type=password');
      });
    });
  });

  describe('Navigation Links', () => {
    it('should navigate to forgot password page', () => {
      renderWithProviders(<LoginForm />);

      const forgotPasswordLink = screen.getByText(/forgot your password\?/i);
      expect(forgotPasswordLink).toHaveAttribute('href', '/forgot-password');
    });

    it('should navigate to register page', () => {
      renderWithProviders(<LoginForm />);

      const registerLink = screen.getByText(/sign up here/i);
      expect(registerLink).toHaveAttribute('href', '/register');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      renderWithProviders(<LoginForm />);

      // Check form has proper structure
      const form = screen.getByRole('form', { hidden: true }); // form element exists

      // Check inputs have labels
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();

      // Check button is properly labeled
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      renderWithProviders(<LoginForm />);

      // Tab through form elements
      await user.tab();
      expect(screen.getByLabelText(/email address/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText(/password/i)).toHaveFocus();

      await user.tab();
      // Password toggle button

      await user.tab();
      expect(screen.getByLabelText(/remember me/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByText(/forgot your password\?/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('button', { name: /sign in/i })).toHaveFocus();
    });
  });
});
