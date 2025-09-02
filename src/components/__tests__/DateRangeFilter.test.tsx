import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DateRangeFilter } from '../analytics/DateRangeFilter';
import { startOfDay, endOfDay, subDays, format } from 'date-fns';

// Mock date-fns to have consistent dates in tests
jest.mock('date-fns', () => ({
  ...jest.requireActual('date-fns'),
  startOfToday: () => new Date('2025-01-08T00:00:00Z'),
  endOfToday: () => new Date('2025-01-08T23:59:59Z'),
}));

describe('DateRangeFilter', () => {
  const mockOnChange = jest.fn();
  const today = new Date('2025-01-08T00:00:00Z');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with default preset (Last 7 days)', () => {
    render(<DateRangeFilter onChange={mockOnChange} />);

    expect(screen.getByText('Last 7 days')).toBeInTheDocument();
    expect(screen.getByTestId('calendar-icon')).toBeInTheDocument();
  });

  it('calls onChange with correct dates on mount', () => {
    render(<DateRangeFilter onChange={mockOnChange} />);

    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenCalledWith({
      from: startOfDay(subDays(today, 6)),
      to: endOfDay(today),
    });
  });

  it('opens dropdown when clicked', async () => {
    render(<DateRangeFilter onChange={mockOnChange} />);

    const button = screen.getByRole('button', { name: /last 7 days/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Today')).toBeInTheDocument();
      expect(screen.getByText('Yesterday')).toBeInTheDocument();
      expect(screen.getByText('Last 30 days')).toBeInTheDocument();
      expect(screen.getByText('Last 90 days')).toBeInTheDocument();
      expect(screen.getByText('This month')).toBeInTheDocument();
      expect(screen.getByText('Last month')).toBeInTheDocument();
      expect(screen.getByText('Custom range')).toBeInTheDocument();
    });
  });

  it('changes date range when preset is selected', async () => {
    render(<DateRangeFilter onChange={mockOnChange} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    const last30Days = await screen.findByText('Last 30 days');
    fireEvent.click(last30Days);

    expect(mockOnChange).toHaveBeenCalledWith({
      from: startOfDay(subDays(today, 29)),
      to: endOfDay(today),
    });

    expect(screen.getByText('Last 30 days')).toBeInTheDocument();
  });

  it('shows custom date pickers when custom range is selected', async () => {
    render(<DateRangeFilter onChange={mockOnChange} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    const customRange = await screen.findByText('Custom range');
    fireEvent.click(customRange);

    expect(screen.getByPlaceholderText('Start date')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('End date')).toBeInTheDocument();
    expect(screen.getByText('Apply')).toBeInTheDocument();
  });

  it('applies custom date range', async () => {
    const user = userEvent.setup();
    render(<DateRangeFilter onChange={mockOnChange} />);

    const button = screen.getByRole('button');
    await user.click(button);

    const customRange = await screen.findByText('Custom range');
    await user.click(customRange);

    const startInput = screen.getByPlaceholderText('Start date');
    const endInput = screen.getByPlaceholderText('End date');

    await user.clear(startInput);
    await user.type(startInput, '2025-01-01');

    await user.clear(endInput);
    await user.type(endInput, '2025-01-05');

    const applyButton = screen.getByText('Apply');
    await user.click(applyButton);

    expect(mockOnChange).toHaveBeenCalledWith({
      from: new Date('2025-01-01T00:00:00'),
      to: new Date('2025-01-05T23:59:59'),
    });

    expect(screen.getByText('Jan 1 - Jan 5, 2025')).toBeInTheDocument();
  });

  it('validates custom date range', async () => {
    const user = userEvent.setup();
    render(<DateRangeFilter onChange={mockOnChange} />);

    const button = screen.getByRole('button');
    await user.click(button);

    const customRange = await screen.findByText('Custom range');
    await user.click(customRange);

    const startInput = screen.getByPlaceholderText('Start date');
    const endInput = screen.getByPlaceholderText('End date');

    // Set end date before start date
    await user.clear(startInput);
    await user.type(startInput, '2025-01-05');

    await user.clear(endInput);
    await user.type(endInput, '2025-01-01');

    const applyButton = screen.getByText('Apply');
    await user.click(applyButton);

    // Should show error or not call onChange
    expect(screen.getByText('End date must be after start date')).toBeInTheDocument();
  });

  it('closes dropdown when clicking outside', async () => {
    render(
      <div>
        <DateRangeFilter onChange={mockOnChange} />
        <div data-testid="outside">Outside element</div>
      </div>
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Today')).toBeInTheDocument();
    });

    const outside = screen.getByTestId('outside');
    fireEvent.click(outside);

    await waitFor(() => {
      expect(screen.queryByText('Today')).not.toBeInTheDocument();
    });
  });

  it('highlights active preset', async () => {
    render(<DateRangeFilter onChange={mockOnChange} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    const last7Days = await screen.findByText('Last 7 days');
    expect(last7Days.parentElement).toHaveClass('bg-primary');

    const last30Days = screen.getByText('Last 30 days');
    expect(last30Days.parentElement).not.toHaveClass('bg-primary');
  });

  it('initializes with provided value', () => {
    const initialValue = {
      from: new Date('2025-01-01'),
      to: new Date('2025-01-05'),
    };

    render(<DateRangeFilter onChange={mockOnChange} value={initialValue} />);

    expect(screen.getByText('Jan 1 - Jan 5, 2025')).toBeInTheDocument();
    expect(mockOnChange).toHaveBeenCalledWith(initialValue);
  });

  it('formats date range correctly for different months', async () => {
    const user = userEvent.setup();
    render(<DateRangeFilter onChange={mockOnChange} />);

    const button = screen.getByRole('button');
    await user.click(button);

    const customRange = await screen.findByText('Custom range');
    await user.click(customRange);

    const startInput = screen.getByPlaceholderText('Start date');
    const endInput = screen.getByPlaceholderText('End date');

    await user.clear(startInput);
    await user.type(startInput, '2024-12-15');

    await user.clear(endInput);
    await user.type(endInput, '2025-01-15');

    const applyButton = screen.getByText('Apply');
    await user.click(applyButton);

    expect(screen.getByText('Dec 15, 2024 - Jan 15, 2025')).toBeInTheDocument();
  });
});
