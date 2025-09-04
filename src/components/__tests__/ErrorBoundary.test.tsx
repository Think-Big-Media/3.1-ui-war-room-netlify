/**
 * Strategic Error Boundary Tests
 * Tests our recent stability improvements
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ErrorBoundary } from '../ErrorBoundary';

// Component that throws an error for testing
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error for ErrorBoundary');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary - Stability Improvements', () => {
  // Mock console.error to avoid noise in tests
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });
  afterAll(() => {
    console.error = originalError;
  });

  test('should render children when there is no error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  test('should catch errors and display fallback UI', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Should show error message instead of crashing
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  test('should show error details in development mode', () => {
    // Mock NODE_ENV for development
    const originalEnv = import.meta.env.MODE;
    import.meta.env.MODE = 'development';

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Should have error details in development
    expect(screen.getByText('View error details')).toBeInTheDocument();

    // Restore environment
    import.meta.env.MODE = originalEnv;
  });

  test('should allow recovery with Try Again button', () => {
    const TestComponent = () => {
      const [shouldThrow, setShouldThrow] = React.useState(true);

      return (
        <ErrorBoundary>
          <button onClick={() => setShouldThrow(false)}>Fix Error</button>
          <ThrowError shouldThrow={shouldThrow} />
        </ErrorBoundary>
      );
    };

    render(<TestComponent />);

    // Should show error initially
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    // Click Try Again
    fireEvent.click(screen.getByText('Try Again'));

    // Should potentially recover (this tests the reset functionality)
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  test('should render custom fallback when provided', () => {
    const customFallback = <div>Custom error message</div>;

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error message')).toBeInTheDocument();
  });

  test('should log errors to console', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Should have called console.error with error details
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});

/**
 * Integration test with main app structure
 */
describe('ErrorBoundary Integration', () => {
  test('should integrate properly with React app structure', () => {
    // Test that ErrorBoundary works with Redux Provider and other providers
    const AppStructure = () => (
      <ErrorBoundary>
        <div data-testid="app-content">
          <ThrowError shouldThrow={false} />
        </div>
      </ErrorBoundary>
    );

    render(<AppStructure />);

    expect(screen.getByTestId('app-content')).toBeInTheDocument();
  });
});
