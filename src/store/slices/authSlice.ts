import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'member' | 'viewer';
  organizationId: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
  permissions?: string[];
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  plan: 'free' | 'pro' | 'enterprise';
  features: string[];
}

export interface AuthState {
  user: User | null;
  organization: Organization | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  sessionToken: string | null;
}

const initialState: AuthState = {
  user: null,
  organization: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  sessionToken: null,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{
        user: User;
        organization: Organization;
        sessionToken: string;
      }>
    ) => {
      state.user = action.payload.user;
      state.organization = action.payload.organization;
      state.sessionToken = action.payload.sessionToken;
      state.isAuthenticated = true;
      state.error = null;
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    updateOrganization: (state, action: PayloadAction<Partial<Organization>>) => {
      if (state.organization) {
        state.organization = { ...state.organization, ...action.payload };
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.organization = null;
      state.isAuthenticated = false;
      state.sessionToken = null;
      state.error = null;
    },
  },
});

export const { setCredentials, updateUser, updateOrganization, setLoading, setError, logout } =
  authSlice.actions;

// Selectors
export const selectCurrentUser = (state: RootState) => state.auth.user;
export const selectCurrentOrganization = (state: RootState) => state.auth.organization;
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;
export const selectAuthLoading = (state: RootState) => state.auth.isLoading;
export const selectAuthError = (state: RootState) => state.auth.error;
export const selectSessionToken = (state: RootState) => state.auth.sessionToken;

export default authSlice.reducer;
