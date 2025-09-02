/**
 * Comprehensive test suite for MetricCard component
 * Tests: rendering, data loading, trends, sparklines, error states
 */

import type React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { MetricCard } from '../MetricCard';
import { renderWithProviders } from '../../../utils/test-utils';

// Mock data for tests
const mockMetricData = {
  volunteers: {
    value: 1234,
    change: 12.5,
    trend: 'up' as const,
    sparkline: [
      { value: 1100 },
      { value: 1150 },
      { value: 1180 },
      { value: 1200 },
      { value: 1220 },
      { value: 1234 },
    ],
  },
  events: {
    value: 45,
    change: -5.2,
    trend: 'down' as const,
    sparkline: [
      { value: 50 },
      { value: 48 },
      { value: 47 },
      { value: 46 },
      { value: 45 },
      { value: 45 },
    ],
  },
  reach: {
    value: 15420,
    change: 0,
    trend: 'neutral' as const,
    sparkline: [
      { value: 15420 },
      { value: 15420 },
      { value: 15420 },
      { value: 15420 },
      { value: 15420 },
      { value: 15420 },
    ],
  },
  donations: {
    value: 48750,
    change: 23.1,
    trend: 'up' as const,
    sparkline: [
      { value: 38000 },
      { value: 40000 },
      { value: 42000 },
      { value: 45000 },
      { value: 47000 },
      { value: 48750 },
    ],
  },
};

describe('MetricCard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render volunteer metric card correctly', async () => {
      // Mock API response
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockMetricData,
      });

      renderWithProviders(
        <MetricCard title="Total Volunteers" metric="volunteers" icon="users" color="blue" />
      );

      // Check title
      expect(screen.getByText('Total Volunteers')).toBeInTheDocument();

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('1,234')).toBeInTheDocument();
        expect(screen.getByText('+12.5%')).toBeInTheDocument();
      });

      // Check trend icon
      const trendIcon = screen.getByTestId('trend-icon-up');
      expect(trendIcon).toBeInTheDocument();
    });

    it('should render event metric card with negative trend', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockMetricData,
      });

      renderWithProviders(
        <MetricCard title="Active Events" metric="events" icon="calendar" color="green" />
      );

      await waitFor(() => {
        expect(screen.getByText('45')).toBeInTheDocument();
        expect(screen.getByText('-5.2%')).toBeInTheDocument();
      });

      // Check down trend icon
      const trendIcon = screen.getByTestId('trend-icon-down');
      expect(trendIcon).toBeInTheDocument();
    });

    it('should render metric card with neutral trend', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockMetricData,
      });

      renderWithProviders(
        <MetricCard title="Total Reach" metric="reach" icon="trending-up" color="purple" />
      );

      await waitFor(() => {
        expect(screen.getByText('15,420')).toBeInTheDocument();
        expect(screen.getByText('0%')).toBeInTheDocument();
      });

      // Check neutral trend icon
      const trendIcon = screen.getByTestId('trend-icon-neutral');
      expect(trendIcon).toBeInTheDocument();
    });

    it('should format currency values correctly', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockMetricData,
      });

      renderWithProviders(
        <MetricCard title="Total Donations" metric="donations" icon="dollar-sign" color="yellow" />
      );

      await waitFor(() => {
        expect(screen.getByText('$48,750')).toBeInTheDocument();
        expect(screen.getByText('+23.1%')).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading skeleton while fetching data', () => {
      // Mock delayed response
      global.fetch = jest
        .fn()
        .mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));

      renderWithProviders(
        <MetricCard title="Total Volunteers" metric="volunteers" icon="users" color="blue" />
      );

      // Check for loading skeleton
      expect(screen.getByTestId('metric-card-skeleton')).toBeInTheDocument();
      expect(screen.queryByText('1,234')).not.toBeInTheDocument();
    });

    it('should transition from loading to loaded state', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockMetricData,
      });

      renderWithProviders(
        <MetricCard title="Total Volunteers" metric="volunteers" icon="users" color="blue" />
      );

      // Initially showing skeleton
      expect(screen.getByTestId('metric-card-skeleton')).toBeInTheDocument();

      // Wait for data to load
      await waitFor(() => {
        expect(screen.queryByTestId('metric-card-skeleton')).not.toBeInTheDocument();
        expect(screen.getByText('1,234')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      // Mock API error
      global.fetch = jest.fn().mockRejectedValueOnce(new Error('Network error'));

      renderWithProviders(
        <MetricCard title="Total Volunteers" metric="volunteers" icon="users" color="blue" />
      );

      await waitFor(() => {
        expect(screen.getByTestId('metric-card-error')).toBeInTheDocument();
        expect(screen.getByText('Failed to load')).toBeInTheDocument();
      });
    });

    it('should show retry button on error', async () => {
      global.fetch = jest.fn().mockRejectedValueOnce(new Error('Network error'));

      renderWithProviders(
        <MetricCard title="Total Volunteers" metric="volunteers" icon="users" color="blue" />
      );

      await waitFor(() => {
        const retryButton = screen.getByRole('button', { name: /retry/i });
        expect(retryButton).toBeInTheDocument();
      });
    });

    it('should retry fetching data when retry button is clicked', async () => {
      // First call fails, second succeeds
      global.fetch = jest
        .fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockMetricData,
        });

      const { user } = renderWithProviders(
        <MetricCard title="Total Volunteers" metric="volunteers" icon="users" color="blue" />
      );

      // Wait for error state
      await waitFor(() => {
        expect(screen.getByTestId('metric-card-error')).toBeInTheDocument();
      });

      // Click retry
      const retryButton = screen.getByRole('button', { name: /retry/i });
      await user.click(retryButton);

      // Should show data after retry
      await waitFor(() => {
        expect(screen.getByText('1,234')).toBeInTheDocument();
        expect(screen.queryByTestId('metric-card-error')).not.toBeInTheDocument();
      });
    });
  });

  describe('Sparkline Chart', () => {
    it('should render sparkline chart when data is available', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockMetricData,
      });

      renderWithProviders(
        <MetricCard title="Total Volunteers" metric="volunteers" icon="users" color="blue" />
      );

      await waitFor(() => {
        const sparkline = screen.getByTestId('metric-sparkline');
        expect(sparkline).toBeInTheDocument();
      });
    });

    it('should not render sparkline when data is empty', async () => {
      const emptyData = {
        volunteers: {
          value: 0,
          change: 0,
          trend: 'neutral' as const,
          sparkline: [],
        },
      };

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => emptyData,
      });

      renderWithProviders(
        <MetricCard title="Total Volunteers" metric="volunteers" icon="users" color="blue" />
      );

      await waitFor(() => {
        expect(screen.queryByTestId('metric-sparkline')).not.toBeInTheDocument();
      });
    });
  });

  describe('Date Range Integration', () => {
    it('should refetch data when date range changes', async () => {
      const fetchSpy = jest
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockMetricData,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            ...mockMetricData,
            volunteers: { ...mockMetricData.volunteers, value: 2000 },
          }),
        });

      global.fetch = fetchSpy;

      const initialState = {
        analytics: {
          dateRange: { start: '2024-01-01', end: '2024-01-31' },
        },
      };

      const store = createTestStore(initialState);

      renderWithProviders(
        <MetricCard title="Total Volunteers" metric="volunteers" icon="users" color="blue" />,
        { store }
      );

      // Initial load
      await waitFor(() => {
        expect(screen.getByText('1,234')).toBeInTheDocument();
      });

      // Update date range
      store.dispatch({
        type: 'analytics/setDateRange',
        payload: { start: '2024-02-01', end: '2024-02-29' },
      });

      // Should refetch with new date range
      await waitFor(() => {
        expect(screen.getByText('2,000')).toBeInTheDocument();
        expect(fetchSpy).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockMetricData,
      });

      renderWithProviders(
        <MetricCard title="Total Volunteers" metric="volunteers" icon="users" color="blue" />
      );

      await waitFor(() => {
        const card = screen.getByRole('article', { name: /total volunteers metric/i });
        expect(card).toBeInTheDocument();
      });
    });

    it('should announce trend changes to screen readers', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockMetricData,
      });

      renderWithProviders(
        <MetricCard title="Total Volunteers" metric="volunteers" icon="users" color="blue" />
      );

      await waitFor(() => {
        const trendText = screen.getByLabelText(/increased by 12.5%/i);
        expect(trendText).toBeInTheDocument();
      });
    });
  });

  describe('Color Themes', () => {
    it.each([
      ['blue', 'bg-blue-50', 'text-blue-600'],
      ['green', 'bg-green-50', 'text-green-600'],
      ['purple', 'bg-purple-50', 'text-purple-600'],
      ['yellow', 'bg-yellow-50', 'text-yellow-600'],
    ])('should apply %s color theme correctly', async (color, bgClass, textClass) => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockMetricData,
      });

      const { container } = renderWithProviders(
        <MetricCard title="Test Metric" metric="volunteers" icon="users" color={color as any} />
      );

      await waitFor(() => {
        const card = container.querySelector('.metric-card');
        expect(card).toHaveClass(bgClass);

        const value = screen.getByText('1,234');
        expect(value).toHaveClass(textClass);
      });
    });
  });
});
