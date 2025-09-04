/**
 * Simple test for LoginForm component to verify test infrastructure
 */

import type React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { LoginForm } from '../LoginForm';
import { authApi } from '../../../services/authApi';
import { AuthProvider } from '../../../contexts/AuthContext';

// Create a test store
const createTestStore = () => {
  return configureStore({
    reducer: {
      [authApi.reducerPath]: authApi.reducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(authApi.middleware),
  });
};

// Mock useAuth hook
jest.mock('../../../contexts/AuthContext', () => ({
  ...jest.requireActual('../../../contexts/AuthContext'),
  useAuth: () => ({
    login: jest.fn(),
    isAuthenticated: false,
    clearError: jest.fn(),
    user: null,
    logout: jest.fn(),
    isLoading: false,
    error: null,
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('LoginForm Component - Simple Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render login form with heading', () => {
    const store = createTestStore();

    render(
      <Provider store={store}>
        <MemoryRouter>
          <LoginForm />
        </MemoryRouter>
      </Provider>
    );

    // Check if main heading is rendered
    expect(screen.getByRole('heading', { name: /sign in to war room/i })).toBeInTheDocument();
  });

  it('should render email and password fields', () => {
    const store = createTestStore();

    render(
      <Provider store={store}>
        <MemoryRouter>
          <LoginForm />
        </MemoryRouter>
      </Provider>
    );

    // Check form fields
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('should render submit button', () => {
    const store = createTestStore();

    render(
      <Provider store={store}>
        <MemoryRouter>
          <LoginForm />
        </MemoryRouter>
      </Provider>
    );

    // Check submit button
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });
});
