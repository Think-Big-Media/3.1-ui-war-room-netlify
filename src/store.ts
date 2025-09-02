/**
 * Redux Store Configuration
 * CRITICAL: This was missing and causing app crash on load
 */

import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { analyticsApi } from './services/analyticsApi';
import { baseApi } from './services/baseApi';

export const store = configureStore({
  reducer: {
    // RTK Query reducers
    [analyticsApi.reducerPath]: analyticsApi.reducer,
    [baseApi.reducerPath]: baseApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for serialization checks
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    })
      .concat(analyticsApi.middleware)
      .concat(baseApi.middleware),
});

// Enable refetch on focus/reconnect
setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;