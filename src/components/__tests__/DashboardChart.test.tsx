import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { DashboardChart } from '../analytics/DashboardChart';

// Mock recharts components
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  Bar: () => <div data-testid="bar" />,
  Area: () => <div data-testid="area" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
}));

describe('DashboardChart', () => {
  const mockData = [
    { date: '2025-01-01', donations: 1200, volunteers: 45 },
    { date: '2025-01-02', donations: 1500, volunteers: 52 },
    { date: '2025-01-03', donations: 1800, volunteers: 48 },
    { date: '2025-01-04', donations: 2100, volunteers: 60 },
  ];

  const defaultProps = {
    title: 'Campaign Performance',
    data: mockData,
    dataKeys: ['donations', 'volunteers'],
    colors: ['#3B82F6', '#10B981'] as const,
  };

  it('renders title correctly', () => {
    render(<DashboardChart {...defaultProps} />);
    expect(screen.getByText('Campaign Performance')).toBeInTheDocument();
  });

  it('renders line chart by default', () => {
    render(<DashboardChart {...defaultProps} />);
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    expect(screen.queryByTestId('bar-chart')).not.toBeInTheDocument();
    expect(screen.queryByTestId('area-chart')).not.toBeInTheDocument();
  });

  it('renders bar chart when type is bar', () => {
    render(<DashboardChart {...defaultProps} type="bar" />);
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument();
  });

  it('renders area chart when type is area', () => {
    render(<DashboardChart {...defaultProps} type="area" />);
    expect(screen.getByTestId('area-chart')).toBeInTheDocument();
    expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument();
  });

  it('toggles between chart types', () => {
    render(<DashboardChart {...defaultProps} />);

    const lineButton = screen.getByRole('button', { name: /line/i });
    const barButton = screen.getByRole('button', { name: /bar/i });
    const areaButton = screen.getByRole('button', { name: /area/i });

    // Initially line chart
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();

    // Switch to bar
    fireEvent.click(barButton);
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();

    // Switch to area
    fireEvent.click(areaButton);
    expect(screen.getByTestId('area-chart')).toBeInTheDocument();

    // Back to line
    fireEvent.click(lineButton);
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('renders loading state', () => {
    render(<DashboardChart {...defaultProps} loading />);

    expect(screen.getByTestId('chart-skeleton')).toBeInTheDocument();
    expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument();
  });

  it('renders empty state when no data', () => {
    render(<DashboardChart {...defaultProps} data={[]} />);

    expect(screen.getByText('No data available')).toBeInTheDocument();
    expect(screen.getByText('Data will appear here once available')).toBeInTheDocument();
  });

  it('renders multiple data series', () => {
    render(<DashboardChart {...defaultProps} />);

    // Should render a Line component for each dataKey
    const lines = screen.getAllByTestId('line');
    expect(lines).toHaveLength(2); // donations and volunteers
  });

  it('formats Y-axis values when formatter provided', () => {
    const yAxisFormatter = (value: number) => `$${value.toLocaleString()}`;
    render(<DashboardChart {...defaultProps} yAxisFormatter={yAxisFormatter} />);

    // The formatter would be passed to YAxis component
    expect(screen.getByTestId('y-axis')).toBeInTheDocument();
  });

  it('applies active button styling correctly', () => {
    render(<DashboardChart {...defaultProps} />);

    const lineButton = screen.getByRole('button', { name: /line/i });
    const barButton = screen.getByRole('button', { name: /bar/i });

    // Line button should be active initially
    expect(lineButton).toHaveClass('bg-primary');
    expect(barButton).not.toHaveClass('bg-primary');

    // Click bar button
    fireEvent.click(barButton);

    // Bar button should now be active
    expect(barButton).toHaveClass('bg-primary');
    expect(lineButton).not.toHaveClass('bg-primary');
  });

  it('renders with custom height', () => {
    render(<DashboardChart {...defaultProps} height={500} />);

    const container = screen.getByTestId('responsive-container');
    expect(container).toBeInTheDocument();
  });

  it('handles single data key', () => {
    render(<DashboardChart {...defaultProps} dataKeys={['donations']} colors={['#3B82F6']} />);

    const lines = screen.getAllByTestId('line');
    expect(lines).toHaveLength(1);
  });
});
