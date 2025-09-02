import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ActivityFeed } from '../analytics/ActivityFeed';
import { type Activity } from '../../types/analytics';

describe('ActivityFeed', () => {
  const mockActivities: Activity[] = [
    {
      id: '1',
      type: 'donation',
      message: 'John Doe donated $100',
      timestamp: '2025-01-08T10:00:00Z',
      metadata: { amount: 100, donor: 'John Doe' },
    },
    {
      id: '2',
      type: 'volunteer',
      message: 'Jane Smith signed up to volunteer',
      timestamp: '2025-01-08T09:30:00Z',
      metadata: { volunteer: 'Jane Smith' },
    },
    {
      id: '3',
      type: 'event',
      message: 'New event created: Town Hall Meeting',
      timestamp: '2025-01-08T09:00:00Z',
      metadata: { event: 'Town Hall Meeting' },
    },
  ];

  it('renders activities correctly', () => {
    render(<ActivityFeed activities={mockActivities} />);

    expect(screen.getByText('John Doe donated $100')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith signed up to volunteer')).toBeInTheDocument();
    expect(screen.getByText('New event created: Town Hall Meeting')).toBeInTheDocument();
  });

  it('shows correct icons for activity types', () => {
    render(<ActivityFeed activities={mockActivities} />);

    expect(screen.getByTestId('icon-donation')).toBeInTheDocument();
    expect(screen.getByTestId('icon-volunteer')).toBeInTheDocument();
    expect(screen.getByTestId('icon-event')).toBeInTheDocument();
  });

  it('formats timestamps correctly', () => {
    render(<ActivityFeed activities={mockActivities} />);

    // Should show relative time (e.g., "2 hours ago")
    const timeElements = screen.getAllByTestId('activity-time');
    expect(timeElements).toHaveLength(3);
    timeElements.forEach((element) => {
      expect(element.textContent).toMatch(/ago$/);
    });
  });

  it('toggles auto-scroll on button click', () => {
    render(<ActivityFeed activities={mockActivities} />);

    const toggleButton = screen.getByRole('button', { name: /auto-scroll/i });

    // Initially should be paused
    expect(screen.getByTestId('pause-icon')).toBeInTheDocument();

    // Click to resume
    fireEvent.click(toggleButton);
    expect(screen.getByTestId('play-icon')).toBeInTheDocument();

    // Click to pause again
    fireEvent.click(toggleButton);
    expect(screen.getByTestId('pause-icon')).toBeInTheDocument();
  });

  it('renders loading state', () => {
    render(<ActivityFeed activities={[]} loading />);

    const skeletons = screen.getAllByTestId('activity-skeleton');
    expect(skeletons).toHaveLength(5); // Should show 5 skeleton items
  });

  it('shows empty state when no activities', () => {
    render(<ActivityFeed activities={[]} />);

    expect(screen.getByText('No recent activity')).toBeInTheDocument();
    expect(screen.getByText('Activities will appear here as they happen')).toBeInTheDocument();
  });

  it('limits displayed activities to maxItems', () => {
    const manyActivities = Array.from({ length: 20 }, (_, i) => ({
      id: `${i}`,
      type: 'donation' as const,
      message: `Activity ${i}`,
      timestamp: new Date().toISOString(),
    }));

    render(<ActivityFeed activities={manyActivities} maxItems={10} />);

    const activityItems = screen.getAllByTestId('activity-item');
    expect(activityItems).toHaveLength(10);
  });

  it('handles new activities being added', () => {
    const { rerender } = render(<ActivityFeed activities={mockActivities} />);

    expect(screen.getAllByTestId('activity-item')).toHaveLength(3);

    const newActivity: Activity = {
      id: '4',
      type: 'contact',
      message: 'New contact added: Bob Johnson',
      timestamp: new Date().toISOString(),
    };

    rerender(<ActivityFeed activities={[newActivity, ...mockActivities]} />);

    expect(screen.getAllByTestId('activity-item')).toHaveLength(4);
    expect(screen.getByText('New contact added: Bob Johnson')).toBeInTheDocument();
  });

  it('applies correct styling for different activity types', () => {
    render(<ActivityFeed activities={mockActivities} />);

    const donationIcon = screen.getByTestId('icon-donation');
    const volunteerIcon = screen.getByTestId('icon-volunteer');
    const eventIcon = screen.getByTestId('icon-event');

    expect(donationIcon.parentElement).toHaveClass('bg-green-100');
    expect(volunteerIcon.parentElement).toHaveClass('bg-blue-100');
    expect(eventIcon.parentElement).toHaveClass('bg-purple-100');
  });
});
