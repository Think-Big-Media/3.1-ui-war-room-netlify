/**
 * War Room Authentication Service API
 * Centralized API calls for user authentication and authorization
 */

import { User, LoginRequest, RegisterRequest, AuthResponse } from '../types/api';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Login user
 */
export async function loginUser(credentials: LoginRequest): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE}/api/v1/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    throw new Error('Login failed');
  }

  return response.json();
}

/**
 * Register new user
 */
export async function registerUser(userData: RegisterRequest): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE}/api/v1/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    throw new Error('Registration failed');
  }

  return response.json();
}

/**
 * Get current user profile
 */
export async function getCurrentUser(): Promise<User> {
  const token = localStorage.getItem('auth_token');
  const response = await fetch(`${API_BASE}/api/v1/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user profile');
  }

  return response.json();
}

/**
 * Logout user
 */
export async function logoutUser(): Promise<void> {
  const token = localStorage.getItem('auth_token');
  await fetch(`${API_BASE}/api/v1/auth/logout`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  localStorage.removeItem('auth_token');
}

/**
 * Refresh authentication token
 */
export async function refreshToken(): Promise<AuthResponse> {
  const refreshToken = localStorage.getItem('refresh_token');
  const response = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!response.ok) {
    throw new Error('Token refresh failed');
  }

  return response.json();
}
