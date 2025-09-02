// Mock for analyticsApi service
const analyticsApi = {
  reducer: jest.fn(),
  reducerPath: 'analyticsApi',
  middleware: jest.fn(),
  endpoints: {
    getDashboardData: {
      useQuery: jest.fn(() => ({
        data: {
          totalDonations: 45000,
          activeVolunteers: 120,
          eventsHosted: 8,
          campaignReach: 15000,
        },
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      })),
    },
    getMetrics: {
      useQuery: jest.fn(() => ({
        data: [],
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      })),
    },
  },
  util: {
    resetApiState: jest.fn(),
  },
  injectEndpoints: jest.fn(),
};

module.exports = {
  analyticsApi,
};
