/**
 * Test suite for ForgotPasswordForm component
 * Tests: rendering, validation, form submission, success/error states
 */

import type React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { ForgotPasswordForm } from '../ForgotPasswordForm';

// Mock the auth API
jest.mock('../../../services/authApi', () => ({
  useForgotPasswordMutation: jest.fn(),
}));

// Create a test store with minimal setup
const createTestStore = () => {
  return configureStore({
    reducer: {
      // Simple reducer for testing
      auth: (state = {}, action) => state,
    },
  });
};

// Helper to render component with providers
const renderWithProviders = (ui: React.ReactElement) => {
  const store = createTestStore();

  return {
    ...render(
      <Provider store={store}>
        <MemoryRouter>{ui}</MemoryRouter>
      </Provider>
    ),
    store,
  };
};

describe('ForgotPasswordForm Component', () => {
  const mockForgotPasswordMutation = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock the hook to return our mock function
    const { useForgotPasswordMutation } = require('../../../services/authApi');
    useForgotPasswordMutation.mockReturnValue([
      mockForgotPasswordMutation,
      { isLoading: false, error: null },
    ]);
  });

  describe('Rendering', () => {
    it('should render forgot password form with all elements', () => {
      renderWithProviders(<ForgotPasswordForm />);

      // Check heading and description
      expect(screen.getByRole('heading', { name: /reset your password/i })).toBeInTheDocument();
      expect(
        screen.getByText(
          /enter your email address and we'll send you a link to reset your password/i
        )
      ).toBeInTheDocument();

      // Check form elements
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();

      // Check back to login link
      expect(screen.getByText(/sign in here/i)).toBeInTheDocument();
    });

    it('should have proper placeholder text', () => {
      renderWithProviders(<ForgotPasswordForm />);

      const emailInput = screen.getByLabelText(/email address/i);
      expect(emailInput).toHaveAttribute('placeholder', 'Enter your email address');
    });
  });

  describe('Form Validation', () => {
    it('should validate form fields', () => {
      renderWithProviders(<ForgotPasswordForm />);

      // Email input should have proper validation attributes
      const emailInput = screen.getByLabelText(/email address/i);
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('required');
    });

    it('should handle email input changes', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ForgotPasswordForm />);

      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'test@example.com');

      expect(emailInput).toHaveValue('test@example.com');
    });
  });

  describe('Form Submission', () => {
    it('should call forgot password mutation on valid form submission', async () => {
      const user = userEvent.setup();

      // Mock successful response
      mockForgotPasswordMutation.mockResolvedValueOnce({
        data: { message: 'Password reset link sent' },
      });

      renderWithProviders(<ForgotPasswordForm />);

      // Fill in email
      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'user@example.com');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      await user.click(submitButton);

      // Verify mutation was called
      await waitFor(() => {
        expect(mockForgotPasswordMutation).toHaveBeenCalledWith({
          email: 'user@example.com',
        });
      });

      // Check success message
      await waitFor(() => {
        expect(screen.getByText(/check your email/i)).toBeInTheDocument();
      });
    });

    it('should show loading state during submission', () => {
      // Mock loading state
      const { useForgotPasswordMutation } = require('../../../services/authApi');
      useForgotPasswordMutation.mockReturnValue([
        mockForgotPasswordMutation,
        { isLoading: true, error: null },
      ]);

      renderWithProviders(<ForgotPasswordForm />);

      const submitButton = screen.getByRole('button', { name: /send reset link/i });

      // Check loading state
      expect(screen.getByText(/sending reset link.../i)).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });

    it('should display success message after successful submission', async () => {
      const user = userEvent.setup();

      // Mock successful response
      mockForgotPasswordMutation.mockResolvedValueOnce({
        data: { message: 'Password reset link sent' },
      });

      renderWithProviders(<ForgotPasswordForm />);

      // Fill and submit
      await user.type(screen.getByLabelText(/email address/i), 'user@example.com');
      await user.click(screen.getByRole('button', { name: /send reset link/i }));

      // Wait for success message
      await waitFor(() => {
        expect(screen.getByText(/check your email/i)).toBeInTheDocument();
      });

      // Form should be replaced with success message
      expect(screen.queryByLabelText(/email address/i)).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /send reset link/i })).not.toBeInTheDocument();

      // Should have navigation buttons
      expect(screen.getByRole('link', { name: /back to login/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send another/i })).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should have link back to login page', () => {
      renderWithProviders(<ForgotPasswordForm />);

      const loginLink = screen.getByText(/sign in here/i);
      expect(loginLink).toHaveAttribute('href', '/login');
    });
  });

  describe('Accessibility', () => {
    it('should have proper form structure', () => {
      renderWithProviders(<ForgotPasswordForm />);

      // Email input should have label
      const emailInput = screen.getByLabelText(/email address/i);
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('required');

      // Submit button should be properly labeled
      expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ForgotPasswordForm />);

      // Tab to email input
      await user.tab();
      expect(screen.getByLabelText(/email address/i)).toHaveFocus();

      // Tab to submit button
      await user.tab();
      expect(screen.getByRole('button', { name: /send reset link/i })).toHaveFocus();

      // Tab to back link
      await user.tab();
      expect(screen.getByText(/sign in here/i)).toHaveFocus();
    });
  });
});
