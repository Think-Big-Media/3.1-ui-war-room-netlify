/**
 * Strategic Accessibility Tests
 * Tests our motion preference improvements
 */

import { renderHook, act } from '@testing-library/react';
import { useReducedMotion, getAnimationClass } from '../useReducedMotion';

// Mock window.matchMedia
const createMockMatchMedia = (matches: boolean) => {
  return jest.fn().mockImplementation((query) => ({
    matches,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }));
};

describe('useReducedMotion Hook - Accessibility Tests', () => {
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  test('should detect when user prefers reduced motion', () => {
    // Mock prefers-reduced-motion: reduce
    window.matchMedia = createMockMatchMedia(true);

    const { result } = renderHook(() => useReducedMotion());

    expect(result.current).toBe(true);
  });

  test('should detect when user allows motion', () => {
    // Mock prefers-reduced-motion: no-preference
    window.matchMedia = createMockMatchMedia(false);

    const { result } = renderHook(() => useReducedMotion());

    expect(result.current).toBe(false);
  });

  test('should handle missing matchMedia gracefully', () => {
    // Mock missing matchMedia (older browsers)
    window.matchMedia = undefined as any;

    const { result } = renderHook(() => useReducedMotion());

    // Should default to false (allow motion) when matchMedia not available
    expect(result.current).toBe(false);
  });

  test('should listen for media query changes', () => {
    const mockAddEventListener = jest.fn();
    const mockRemoveEventListener = jest.fn();

    window.matchMedia = jest.fn().mockImplementation(() => ({
      matches: false,
      addEventListener: mockAddEventListener,
      removeEventListener: mockRemoveEventListener,
    }));

    const { unmount } = renderHook(() => useReducedMotion());

    // Should set up event listener
    expect(mockAddEventListener).toHaveBeenCalledWith('change', expect.any(Function));

    unmount();

    // Should clean up event listener
    expect(mockRemoveEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });

  test('should handle legacy addListener/removeListener', () => {
    const mockAddListener = jest.fn();
    const mockRemoveListener = jest.fn();

    // Mock older browser that doesn't have addEventListener
    window.matchMedia = jest.fn().mockImplementation(() => ({
      matches: false,
      addEventListener: undefined,
      removeEventListener: undefined,
      addListener: mockAddListener,
      removeListener: mockRemoveListener,
    }));

    const { unmount } = renderHook(() => useReducedMotion());

    // Should use legacy addListener
    expect(mockAddListener).toHaveBeenCalledWith(expect.any(Function));

    unmount();

    // Should use legacy removeListener
    expect(mockRemoveListener).toHaveBeenCalledWith(expect.any(Function));
  });

  test('should update when preference changes', () => {
    let mockMatches = false;
    let changeHandler: (event: any) => void;

    window.matchMedia = jest.fn().mockImplementation(() => ({
      matches: mockMatches,
      addEventListener: jest.fn().mockImplementation((event, handler) => {
        if (event === 'change') {
          changeHandler = handler;
        }
      }),
      removeEventListener: jest.fn(),
    }));

    const { result } = renderHook(() => useReducedMotion());

    // Initially false
    expect(result.current).toBe(false);

    // Simulate user changing preference
    act(() => {
      mockMatches = true;
      changeHandler({ matches: true });
    });

    // Should update to true
    expect(result.current).toBe(true);
  });
});

describe('getAnimationClass Utility - Accessibility Tests', () => {
  test('should return animation class when motion is allowed', () => {
    const result = getAnimationClass(
      false, // prefersReducedMotion = false
      'animate-bounce transition-all',
      'static-fallback'
    );

    expect(result).toBe('animate-bounce transition-all');
  });

  test('should return static class when motion is reduced', () => {
    const result = getAnimationClass(
      true, // prefersReducedMotion = true
      'animate-bounce transition-all',
      'static-fallback'
    );

    expect(result).toBe('static-fallback');
  });

  test('should return empty string as fallback when motion is reduced', () => {
    const result = getAnimationClass(
      true, // prefersReducedMotion = true
      'animate-bounce transition-all'
      // No static class provided
    );

    expect(result).toBe('');
  });

  test('should handle empty animation class', () => {
    const result = getAnimationClass(
      false, // prefersReducedMotion = false
      '', // empty animation class
      'static-fallback'
    );

    expect(result).toBe('');
  });
});

/**
 * Integration Tests with Components
 */
describe('useReducedMotion Integration Tests', () => {
  test('should work correctly with MetricCard component pattern', () => {
    // Test the pattern used in MetricCard
    window.matchMedia = createMockMatchMedia(true); // User prefers reduced motion

    const { result } = renderHook(() => useReducedMotion());
    const prefersReducedMotion = result.current;

    // Simulate the MetricCard usage
    const hoverClass = getAnimationClass(
      prefersReducedMotion,
      'hover:shadow-xl transition-all duration-300',
      'hover:shadow-lg'
    );

    const scaleClass = getAnimationClass(
      prefersReducedMotion,
      'group-hover:scale-110 transition-transform duration-300',
      ''
    );

    expect(hoverClass).toBe('hover:shadow-lg'); // Reduced motion version
    expect(scaleClass).toBe(''); // No scaling animation
  });

  test('should work correctly when motion is allowed', () => {
    window.matchMedia = createMockMatchMedia(false); // User allows motion

    const { result } = renderHook(() => useReducedMotion());
    const prefersReducedMotion = result.current;

    const hoverClass = getAnimationClass(
      prefersReducedMotion,
      'hover:shadow-xl transition-all duration-300',
      'hover:shadow-lg'
    );

    const scaleClass = getAnimationClass(
      prefersReducedMotion,
      'group-hover:scale-110 transition-transform duration-300',
      ''
    );

    expect(hoverClass).toBe('hover:shadow-xl transition-all duration-300'); // Full animation
    expect(scaleClass).toBe('group-hover:scale-110 transition-transform duration-300'); // Full scaling
  });
});
