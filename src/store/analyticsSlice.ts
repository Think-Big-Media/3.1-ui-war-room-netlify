/**
 * Analytics Redux Slice
 * Manages analytics state including date ranges and filters
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ExportJobResponse } from '../types/analytics';

export interface AnalyticsState {
  dateRange: string;
  customDates: {
    startDate: string | null;
    endDate: string | null;
  };
  filters: {
    metric?: string;
    segment?: string;
  };
  activeExportJob: ExportJobResponse | null;
}

const initialState: AnalyticsState = {
  dateRange: '30d',
  customDates: {
    startDate: null,
    endDate: null,
  },
  filters: {},
  activeExportJob: null,
};

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    setDateRange: (state, action: PayloadAction<string>) => {
      state.dateRange = action.payload;
    },
    setCustomDates: (state, action: PayloadAction<{ startDate: string; endDate: string }>) => {
      state.customDates = action.payload;
    },
    setFilters: (state, action: PayloadAction<Partial<AnalyticsState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    setActiveExportJob: (state, action: PayloadAction<ExportJobResponse | null>) => {
      state.activeExportJob = action.payload;
    },
  },
});

export const { setDateRange, setCustomDates, setFilters, clearFilters, setActiveExportJob } =
  analyticsSlice.actions;
export default analyticsSlice.reducer;
