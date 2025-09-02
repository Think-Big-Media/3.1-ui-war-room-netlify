// Mock Data Service for 3.0 UI (Frontend Only)
// This will be replaced with Leap.new backend API calls

export const mockDataService = {
  // Mock authentication
  auth: {
    signIn: async (email: string, password: string) => {
      console.log('Mock sign in:', email);
      return { user: { id: '1', email }, session: { token: 'mock-token' } };
    },
    signOut: async () => {
      console.log('Mock sign out');
      return { error: null };
    },
    getSession: async () => {
      return { session: null };
    },
    onAuthStateChange: (callback: any) => {
      // Mock auth state listener
      return { unsubscribe: () => {} };
    },
  },

  // Mock data fetching
  campaigns: {
    list: async () => {
      return {
        data: [
          { id: '1', name: 'Campaign 1', status: 'active' },
          { id: '2', name: 'Campaign 2', status: 'draft' },
        ],
      };
    },
  },

  // Mock alerts
  alerts: {
    list: async () => {
      return {
        data: [{ id: '1', message: 'System running smoothly', type: 'info' }],
      };
    },
  },
};

// Export as default for easy replacement
export default mockDataService;
