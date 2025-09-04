import React from 'react';
import { render, screen } from '@testing-library/react';
import { MetricCard } from '../analytics/MetricCard';
import { TrendingUp, TrendingDown } from 'lucide-react';

describe('MetricCard', () => {
  const defaultProps = {
    title: 'Total Donations',
    value: '$12,345',
    icon: <TrendingUp className="h-4 w-4" />,
  };

  it('renders title and value correctly', () => {
    render(<MetricCard {...defaultProps} />);

    expect(screen.getByText('Total Donations')).toBeInTheDocument();
    expect(screen.getByText('$12,345')).toBeInTheDocument();
  });

  it('renders with positive change indicator', () => {
    render(<MetricCard {...defaultProps} change={15.5} changeLabel="from last month" />);

    expect(screen.getByText('+15.5%')).toBeInTheDocument();
    expect(screen.getByText('from last month')).toBeInTheDocument();

    const changeElement = screen.getByText('+15.5%').parentElement;
    expect(changeElement).toHaveClass('text-green-600');
  });

  it('renders with negative change indicator', () => {
    render(<MetricCard {...defaultProps} change={-8.2} changeLabel="from last week" />);

    expect(screen.getByText('-8.2%')).toBeInTheDocument();
    expect(screen.getByText('from last week')).toBeInTheDocument();

    const changeElement = screen.getByText('-8.2%').parentElement;
    expect(changeElement).toHaveClass('text-red-600');
  });

  it('renders loading state', () => {
    render(<MetricCard {...defaultProps} loading />);

    expect(screen.getByTestId('metric-card-skeleton')).toBeInTheDocument();
    expect(screen.queryByText('Total Donations')).not.toBeInTheDocument();
    expect(screen.queryByText('$12,345')).not.toBeInTheDocument();
  });

  it('renders with custom icon', () => {
    const { container } = render(
      <MetricCard
        {...defaultProps}
        icon={<TrendingDown className="h-4 w-4" data-testid="custom-icon" />}
      />
    );

    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });

  it('handles zero change correctly', () => {
    render(<MetricCard {...defaultProps} change={0} changeLabel="no change" />);

    expect(screen.getByText('0%')).toBeInTheDocument();
    const changeElement = screen.getByText('0%').parentElement;
    expect(changeElement).toHaveClass('text-gray-600');
  });

  it('renders without change information', () => {
    render(<MetricCard {...defaultProps} />);

    expect(screen.queryByText('%')).not.toBeInTheDocument();
    expect(screen.queryByText('from')).not.toBeInTheDocument();
  });
});
