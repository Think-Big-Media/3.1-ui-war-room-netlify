import type React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { AnalyticsDashboard } from '../AnalyticsDashboard';
import { analyticsApi as api } from '../../services/analyticsApi';

// Mock the API slice
jest.mock('../../services/analyticsApi', () => ({
  analyticsApi: {
    useGetDashboardQuery: jest.fn(),
    useGetMetricCardsQuery: jest.fn(),
    reducer: (state = {}) => state,
    middleware: (getDefaultMiddleware: any) => getDefaultMiddleware(),
  },
}));

// Mock the WebSocket hook
jest.mock('../../hooks/useWebSocket', () => ({
  useWebSocket: jest.fn(() => ({
    connected: true,
    lastMessage: null,
    sendMessage: jest.fn(),
  })),
}));

// Mock components to avoid complex rendering
jest.mock('../../components/analytics/MetricCard', () => ({
  MetricCard: ({ title, value }: any) => (
    <div data-testid="metric-card">
      {title}: {value}
    </div>
  ),
}));

jest.mock('../../components/analytics/DonationChart', () => ({
  DonationChart: ({ data }: any) => <div data-testid="dashboard-chart">Donation Trends</div>,
}));

jest.mock('../../components/analytics/VolunteerGrowthChart', () => ({
  VolunteerGrowthChart: ({ data }: any) => (
    <div data-testid="dashboard-chart">Volunteer Growth</div>
  ),
}));

jest.mock('../../components/analytics/ActivityFeed', () => ({
  ActivityFeed: ({ activities }: any) => (
    <div data-testid="activity-feed">{activities?.length || 0} activities</div>
  ),
}));

jest.mock('../../components/analytics/DateRangeFilter', () => ({
  DateRangeFilter: ({ onChange }: any) => (
    <div
      data-testid="date-range-filter"
      onClick={() =>
        onChange({
          from: new Date('2025-01-01'),
          to: new Date('2025-01-08'),
        })
      }
    >
      Date Filter
    </div>
  ),
}));

const mockStore = configureStore({
  reducer: {
    analyticsApi: api.reducer,
    auth: (state = { user: { permissions: ['analytics.view'] } }) => state,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(api.middleware),
});

const renderWithProvider = (component: React.ReactElement) => {
  return render(<Provider store={mockStore}>{component}</Provider>);
};

describe('AnalyticsDashboard', () => {
  const mockAnalyticsData = {
    metrics: {
      totalContacts: 1250,
      totalVolunteers: 89,
      totalDonations: 45600,
      totalEvents: 23,
      avgDonation: 125.5,
      contactGrowthRate: 15.2,
      volunteerGrowthRate: 8.5,
      donationGrowthRate: 22.1,
    },
    charts: {
      donationTrend: [
        { date: '2025-01-01', amount: 1200 },
        { date: '2025-01-02', amount: 1500 },
      ],
      volunteerGrowth: [
        { date: '2025-01-01', count: 85 },
        { date: '2025-01-02', count: 89 },
      ],
    },
    activities: [
      {
        id: '1',
        type: 'donation',
        message: 'John Doe donated $100',
        timestamp: '2025-01-08T10:00:00Z',
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (api.useGetDashboardQuery as jest.Mock).mockReturnValue({
      data: mockAnalyticsData,
      isLoading: false,
      error: null,
    });
  });

  it('renders dashboard title', () => {
    renderWithProvider(<AnalyticsDashboard />);
    expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
  });

  it('renders date range filter', () => {
    renderWithProvider(<AnalyticsDashboard />);
    expect(screen.getByTestId('date-range-filter')).toBeInTheDocument();
  });

  it('renders metric cards', () => {
    renderWithProvider(<AnalyticsDashboard />);

    const metricCards = screen.getAllByTestId('metric-card');
    expect(metricCards).toHaveLength(5); // totalContacts, totalVolunteers, totalDonations, totalEvents, avgDonation

    expect(screen.getByText(/Total Contacts: 1,250/)).toBeInTheDocument();
    expect(screen.getByText(/Total Volunteers: 89/)).toBeInTheDocument();
    expect(screen.getByText(/Total Donations: \$45,600/)).toBeInTheDocument();
    expect(screen.getByText(/Total Events: 23/)).toBeInTheDocument();
    expect(screen.getByText(/Average Donation: \$125.50/)).toBeInTheDocument();
  });

  it('renders dashboard charts', () => {
    renderWithProvider(<AnalyticsDashboard />);

    const charts = screen.getAllByTestId('dashboard-chart');
    expect(charts).toHaveLength(2); // donation trend and volunteer growth

    expect(screen.getByText('Donation Trends')).toBeInTheDocument();
    expect(screen.getByText('Volunteer Growth')).toBeInTheDocument();
  });

  it('renders activity feed', () => {
    renderWithProvider(<AnalyticsDashboard />);

    expect(screen.getByTestId('activity-feed')).toBeInTheDocument();
    expect(screen.getByText('1 activities')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    (api.useGetDashboardQuery as jest.Mock).mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    });

    renderWithProvider(<AnalyticsDashboard />);

    expect(screen.getByTestId('dashboard-skeleton')).toBeInTheDocument();
  });

  it('shows error state', () => {
    (api.useGetDashboardQuery as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
      error: { message: 'Failed to load analytics' },
    });

    renderWithProvider(<AnalyticsDashboard />);

    expect(screen.getByText('Error loading analytics')).toBeInTheDocument();
    expect(screen.getByText('Failed to load analytics')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('shows permission error when user lacks analytics permission', () => {
    const storeWithoutPermission = configureStore({
      reducer: {
        analyticsApi: api.reducer,
        auth: (state = { user: { permissions: [] } }) => state,
      },
      middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(api.middleware),
    });

    render(
      <Provider store={storeWithoutPermission}>
        <AnalyticsDashboard />
      </Provider>
    );

    expect(screen.getByText('Access Denied')).toBeInTheDocument();
    expect(screen.getByText('You do not have permission to view analytics')).toBeInTheDocument();
  });

  it('updates data when date range changes', async () => {
    const mockRefetch = jest.fn();
    (api.useGetDashboardQuery as jest.Mock).mockReturnValue({
      data: mockAnalyticsData,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    renderWithProvider(<AnalyticsDashboard />);

    const dateFilter = screen.getByTestId('date-range-filter');
    dateFilter.click();

    await waitFor(() => {
      expect(mockRefetch).toHaveBeenCalled();
    });
  });

  it('handles WebSocket connection status', () => {
    const mockUseWebSocket = require('../../hooks/useWebSocket').useWebSocket;
    mockUseWebSocket.mockReturnValue({
      connected: false,
      lastMessage: null,
      sendMessage: jest.fn(),
    });

    renderWithProvider(<AnalyticsDashboard />);

    expect(screen.getByTestId('connection-status')).toHaveClass('text-red-500');
  });

  it('renders export button', () => {
    renderWithProvider(<AnalyticsDashboard />);

    expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument();
  });

  it('handles real-time updates', () => {
    const newActivity = {
      id: '2',
      type: 'volunteer',
      message: 'Jane Smith signed up',
      timestamp: '2025-01-08T11:00:00Z',
    };

    const mockUseWebSocket = require('../../hooks/useWebSocket').useWebSocket;
    mockUseWebSocket.mockReturnValue({
      connected: true,
      lastMessage: { data: newActivity },
      sendMessage: jest.fn(),
    });

    renderWithProvider(<AnalyticsDashboard />);

    // The component should handle the new message and update the activity feed
    expect(screen.getByTestId('activity-feed')).toBeInTheDocument();
  });

  it('formats metric values correctly', () => {
    renderWithProvider(<AnalyticsDashboard />);

    // Check that large numbers are formatted with commas
    expect(screen.getByText(/1,250/)).toBeInTheDocument(); // totalContacts
    expect(screen.getByText(/\$45,600/)).toBeInTheDocument(); // totalDonations
    expect(screen.getByText(/\$125\.50/)).toBeInTheDocument(); // avgDonation
  });
});
