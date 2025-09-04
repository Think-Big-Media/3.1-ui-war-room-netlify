/**
 * Comprehensive test suite for RegisterForm component
 * Tests: rendering, validation, password strength, form submission, error handling
 */

import type React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { RegisterForm } from '../RegisterForm';
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
const renderWithProviders = (ui: React.ReactElement, { route = '/register' } = {}) => {
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

describe('RegisterForm Component', () => {
  const mockNavigate = jest.fn();

  // Default mock auth context values
  const defaultAuthValues = {
    isAuthenticated: false,
    user: null,
    login: jest.fn(),
    logout: jest.fn(),
    clearError: jest.fn(),
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
    it('should render registration form with all fields', () => {
      renderWithProviders(<RegisterForm />);

      // Check heading
      expect(
        screen.getByRole('heading', { name: /create your war room account/i })
      ).toBeInTheDocument();
      expect(screen.getByText(/join the campaign command center/i)).toBeInTheDocument();

      // Check form fields
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/i accept the terms and conditions/i)).toBeInTheDocument();

      // Check submit button
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();

      // Check login link
      expect(screen.getByText(/sign in here/i)).toBeInTheDocument();
    });

    it('should redirect to dashboard if already authenticated', () => {
      (authContext.useAuth as jest.Mock).mockReturnValue({
        ...defaultAuthValues,
        isAuthenticated: true,
      });

      renderWithProviders(<RegisterForm />);

      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });
  });

  describe('Form Validation', () => {
    it('should validate required fields', async () => {
      const user = userEvent.setup();
      renderWithProviders(<RegisterForm />);

      // Try to submit empty form
      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      // Check for required field errors
      await waitFor(() => {
        expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
        expect(screen.getByText(/last name is required/i)).toBeInTheDocument();
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
        expect(screen.getByText(/username is required/i)).toBeInTheDocument();
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
        expect(screen.getByText(/you must accept the terms and conditions/i)).toBeInTheDocument();
      });
    });

    it('should validate email format', async () => {
      const user = userEvent.setup();
      renderWithProviders(<RegisterForm />);

      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'invalid-email');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      });
    });

    it('should validate username format', async () => {
      const user = userEvent.setup();
      renderWithProviders(<RegisterForm />);

      // Test username too short
      const usernameInput = screen.getByLabelText(/username/i);
      await user.type(usernameInput, 'ab');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/username must be at least 3 characters/i)).toBeInTheDocument();
      });

      // Test username with special characters
      await user.clear(usernameInput);
      await user.type(usernameInput, 'user@name');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/username can only contain letters, numbers, and underscores/i)
        ).toBeInTheDocument();
      });
    });

    it('should validate phone number format', async () => {
      const user = userEvent.setup();
      renderWithProviders(<RegisterForm />);

      const phoneInput = screen.getByLabelText(/phone number/i);
      await user.type(phoneInput, '123'); // Too short

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid phone number/i)).toBeInTheDocument();
      });
    });

    it('should validate password confirmation', async () => {
      const user = userEvent.setup();
      renderWithProviders(<RegisterForm />);

      const passwordInput = screen.getByLabelText('Password');
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      await user.type(passwordInput, 'Password123!');
      await user.type(confirmPasswordInput, 'DifferentPassword123!');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      });
    });

    it('should clear errors when form values change', async () => {
      const user = userEvent.setup();
      renderWithProviders(<RegisterForm />);

      // Submit empty form to trigger errors
      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
      });

      // Type in first name field
      const firstNameInput = screen.getByLabelText(/first name/i);
      await user.type(firstNameInput, 'J');

      // Error should be cleared
      expect(screen.queryByText(/first name is required/i)).not.toBeInTheDocument();
    });
  });

  describe('Password Strength Indicator', () => {
    it('should show weak password strength', async () => {
      const user = userEvent.setup();
      renderWithProviders(<RegisterForm />);

      const passwordInput = screen.getByLabelText('Password');
      await user.type(passwordInput, 'weak');

      // Check for weak indicator
      await waitFor(() => {
        expect(screen.getByText(/weak/i)).toBeInTheDocument();
        expect(screen.getByText(/use at least 8 characters/i)).toBeInTheDocument();
      });
    });

    it('should show fair password strength', async () => {
      const user = userEvent.setup();
      renderWithProviders(<RegisterForm />);

      const passwordInput = screen.getByLabelText('Password');
      await user.type(passwordInput, 'password123');

      // Check for fair indicator
      await waitFor(() => {
        expect(screen.getByText(/fair/i)).toBeInTheDocument();
      });
    });

    it('should show good password strength', async () => {
      const user = userEvent.setup();
      renderWithProviders(<RegisterForm />);

      const passwordInput = screen.getByLabelText('Password');
      await user.type(passwordInput, 'Password123');

      // Check for good indicator
      await waitFor(() => {
        expect(screen.getByText(/good/i)).toBeInTheDocument();
      });
    });

    it('should show strong password strength', async () => {
      const user = userEvent.setup();
      renderWithProviders(<RegisterForm />);

      const passwordInput = screen.getByLabelText('Password');
      await user.type(passwordInput, 'SuperSecure123!@#');

      // Check for strong indicator
      await waitFor(() => {
        expect(screen.getByText(/strong/i)).toBeInTheDocument();
      });
    });
  });

  describe('Password Visibility Toggle', () => {
    it('should toggle password visibility', async () => {
      const user = userEvent.setup();
      renderWithProviders(<RegisterForm />);

      const passwordInput = screen.getByLabelText('Password');
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const toggleButtons = screen.getAllByRole('button', { name: '' }); // Eye icon buttons

      // Initially passwords should be hidden
      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(confirmPasswordInput).toHaveAttribute('type', 'password');

      // Click to show passwords
      await user.click(toggleButtons[0]);
      expect(passwordInput).toHaveAttribute('type', 'text');
      expect(confirmPasswordInput).toHaveAttribute('type', 'text');

      // Click again to hide passwords
      await user.click(toggleButtons[0]);
      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(confirmPasswordInput).toHaveAttribute('type', 'password');
    });
  });

  describe('Form Submission', () => {
    it('should successfully register a new user', async () => {
      const user = userEvent.setup();
      const store = createTestStore();

      // Mock successful registration response
      const mockUser = {
        id: '1',
        email: 'john.doe@example.com',
        username: 'johndoe',
        first_name: 'John',
        last_name: 'Doe',
        full_name: 'John Doe',
        role: 'user',
        permissions: [],
        is_active: true,
        is_verified: false,
        two_factor_enabled: false,
        org_id: '123',
        created_at: '2024-01-01',
      };

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser,
      });

      render(
        <Provider store={store}>
          <BrowserRouter>
            <RegisterForm />
          </BrowserRouter>
        </Provider>
      );

      // Fill in the form
      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.type(screen.getByLabelText(/last name/i), 'Doe');
      await user.type(screen.getByLabelText(/email address/i), 'john.doe@example.com');
      await user.type(screen.getByLabelText(/username/i), 'johndoe');
      await user.type(screen.getByLabelText(/phone number/i), '555-123-4567');
      await user.type(screen.getByLabelText('Password'), 'SecurePassword123!');
      await user.type(screen.getByLabelText(/confirm password/i), 'SecurePassword123!');
      await user.click(screen.getByLabelText(/i accept the terms and conditions/i));

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      // Verify API call
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/v1/auth/register'),
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('john.doe@example.com'),
          })
        );
      });

      // Verify navigation to email verification
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/email-verification', {
          state: { email: 'john.doe@example.com' },
        });
      });
    });

    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
      renderWithProviders(<RegisterForm />);

      // Mock a delayed response
      global.fetch = jest
        .fn()
        .mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));

      // Fill in valid form
      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.type(screen.getByLabelText(/last name/i), 'Doe');
      await user.type(screen.getByLabelText(/email address/i), 'john@example.com');
      await user.type(screen.getByLabelText(/username/i), 'johndoe');
      await user.type(screen.getByLabelText('Password'), 'Password123!');
      await user.type(screen.getByLabelText(/confirm password/i), 'Password123!');
      await user.click(screen.getByLabelText(/i accept the terms and conditions/i));

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      // Check loading state
      expect(screen.getByText(/creating account.../i)).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });

    it('should handle email already exists error', async () => {
      const user = userEvent.setup();
      renderWithProviders(<RegisterForm />);

      // Mock 409 conflict response
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({ detail: 'Email already registered' }),
      });

      // Fill and submit form
      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.type(screen.getByLabelText(/last name/i), 'Doe');
      await user.type(screen.getByLabelText(/email address/i), 'existing@example.com');
      await user.type(screen.getByLabelText(/username/i), 'johndoe');
      await user.type(screen.getByLabelText('Password'), 'Password123!');
      await user.type(screen.getByLabelText(/confirm password/i), 'Password123!');
      await user.click(screen.getByLabelText(/i accept the terms and conditions/i));
      await user.click(screen.getByRole('button', { name: /create account/i }));

      // Check error message
      await waitFor(() => {
        expect(screen.getByText(/this email is already registered/i)).toBeInTheDocument();
      });
    });

    it('should handle username already exists error', async () => {
      const user = userEvent.setup();
      renderWithProviders(<RegisterForm />);

      // Mock 409 conflict response
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({ detail: 'Username already taken' }),
      });

      // Fill and submit form (minimal for test)
      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.type(screen.getByLabelText(/last name/i), 'Doe');
      await user.type(screen.getByLabelText(/email address/i), 'john@example.com');
      await user.type(screen.getByLabelText(/username/i), 'existinguser');
      await user.type(screen.getByLabelText('Password'), 'Password123!');
      await user.type(screen.getByLabelText(/confirm password/i), 'Password123!');
      await user.click(screen.getByLabelText(/i accept the terms and conditions/i));
      await user.click(screen.getByRole('button', { name: /create account/i }));

      // Check error message
      await waitFor(() => {
        expect(screen.getByText(/this username is already taken/i)).toBeInTheDocument();
      });
    });

    it('should handle generic server errors', async () => {
      const user = userEvent.setup();
      renderWithProviders(<RegisterForm />);

      // Mock network error
      global.fetch = jest.fn().mockRejectedValueOnce(new Error('Network error'));

      // Fill and submit minimal valid form
      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.type(screen.getByLabelText(/last name/i), 'Doe');
      await user.type(screen.getByLabelText(/email address/i), 'john@example.com');
      await user.type(screen.getByLabelText(/username/i), 'johndoe');
      await user.type(screen.getByLabelText('Password'), 'Password123!');
      await user.type(screen.getByLabelText(/confirm password/i), 'Password123!');
      await user.click(screen.getByLabelText(/i accept the terms and conditions/i));
      await user.click(screen.getByRole('button', { name: /create account/i }));

      // Check error message
      await waitFor(() => {
        expect(screen.getByText(/registration failed. please try again/i)).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('should navigate to login page', () => {
      renderWithProviders(<RegisterForm />);

      const loginLink = screen.getByText(/sign in here/i);
      expect(loginLink).toHaveAttribute('href', '/login');
    });

    it('should link to terms and conditions', () => {
      renderWithProviders(<RegisterForm />);

      const termsLink = screen.getByText(/terms and conditions/i);
      expect(termsLink).toHaveAttribute('href', '/terms');
      expect(termsLink).toHaveAttribute('target', '_blank');
    });
  });

  describe('Accessibility', () => {
    it('should have proper form structure and labels', () => {
      renderWithProviders(<RegisterForm />);

      // All inputs should have associated labels
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();

      // Checkbox should be properly labeled
      expect(
        screen.getByRole('checkbox', { name: /i accept the terms and conditions/i })
      ).toBeInTheDocument();

      // Submit button should be properly labeled
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      renderWithProviders(<RegisterForm />);

      // Tab through form elements
      await user.tab();
      expect(screen.getByLabelText(/first name/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText(/last name/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText(/email address/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText(/username/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText(/phone number/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText('Password')).toHaveFocus();

      // Continue tabbing through remaining elements
    });
  });
});
