// Mock for analyticsSlice
const analyticsSlice = {
  name: 'analytics',
  reducer: jest.fn(
    (
      state = {
        dateRange: '7d',
        customDates: {
          startDate: null,
          endDate: null,
        },
        filters: {},
      }
    ) => state
  ),
  actions: {
    setDateRange: jest.fn(),
    setCustomDates: jest.fn(),
    setFilters: jest.fn(),
    clearFilters: jest.fn(),
  },
  caseReducers: {},
  getInitialState: jest.fn(() => ({
    dateRange: '7d',
    customDates: {
      startDate: null,
      endDate: null,
    },
    filters: {},
  })),
};

module.exports = {
  analyticsSlice,
};
