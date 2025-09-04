/**
 * Redux store configuration
 */

import { configureStore } from '@reduxjs/toolkit';
import { authApi } from '../services/authApi';
import { supabaseAuthApi } from '../services/supabaseAuthApi';
import { analyticsApi } from '../services/analyticsApi';
import { platformAdminApi } from '../api/platformAdmin';
import analyticsReducer from './analyticsSlice';
import authReducer from './slices/authSlice';

export const store = configureStore({
  reducer: {
    // Add slice reducers
    auth: authReducer,
    analytics: analyticsReducer,
    // Add API reducers
    [authApi.reducerPath]: authApi.reducer,
    [supabaseAuthApi.reducerPath]: supabaseAuthApi.reducer,
    [analyticsApi.reducerPath]: analyticsApi.reducer,
    [platformAdminApi.reducerPath]: platformAdminApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(authApi.middleware)
      .concat(supabaseAuthApi.middleware)
      .concat(analyticsApi.middleware)
      .concat(platformAdminApi.middleware),
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
