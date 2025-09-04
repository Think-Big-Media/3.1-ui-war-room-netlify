import { renderHook, act } from '@testing-library/react';
import { useWebSocket } from '../useWebSocket';

// Mock Redux hooks
jest.mock('../redux', () => ({
  useAppDispatch: () => jest.fn(),
  useAppSelector: () => ({}),
}));

// Mock analytics service
jest.mock('../../services/posthog', () => ({
  analytics: {
    track: jest.fn(),
    trackError: jest.fn(),
  },
}));

// Mock analytics API
jest.mock('../../services/analyticsApi', () => ({
  analyticsApi: {
    util: {
      updateQueryData: jest.fn(() => () => {}),
    },
  },
}));

// Mock global WebSocket
(global as any).WebSocket = jest.fn().mockImplementation(() => ({
  readyState: 1, // OPEN
  send: jest.fn(),
  close: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
}));

describe('useWebSocket', () => {
  const mockUrl = 'ws://localhost:8000/ws/analytics';
  const mockOptions = {
    autoReconnect: true,
    reconnectInterval: 5000,
    maxReconnectAttempts: 5,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('does not auto-connect on mount (currently disabled)', () => {
    const { result } = renderHook(() => useWebSocket(mockUrl, mockOptions));

    expect(result.current.isConnected).toBe(false);
    expect(global.WebSocket).not.toHaveBeenCalled();
  });

  it('provides connect and disconnect methods', () => {
    const { result } = renderHook(() => useWebSocket(mockUrl, mockOptions));

    expect(typeof result.current.connect).toBe('function');
    expect(typeof result.current.disconnect).toBe('function');
    expect(typeof result.current.sendMessage).toBe('function');
    expect(typeof result.current.subscribeToMetrics).toBe('function');
  });

  it('has initial state', () => {
    const { result } = renderHook(() => useWebSocket(mockUrl, mockOptions));

    expect(result.current.isConnected).toBe(false);
    expect(result.current.lastMessage).toBeNull();
  });

  it('warns when sending messages while disconnected', () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    const { result } = renderHook(() => useWebSocket(mockUrl, mockOptions));

    const testMessage = { type: 'test', data: 'hello' };

    act(() => {
      result.current.sendMessage(testMessage);
    });

    expect(consoleWarnSpy).toHaveBeenCalledWith('WebSocket is not connected');
    expect(result.current.lastMessage).toBeNull();

    consoleWarnSpy.mockRestore();
  });

  it('provides subscribeToMetrics method', () => {
    const { result } = renderHook(() => useWebSocket(mockUrl, mockOptions));
    const metrics = ['total_contacts', 'total_donations'];

    // Should not throw when called
    act(() => {
      result.current.subscribeToMetrics(metrics);
    });

    // Method should exist and be callable
    expect(typeof result.current.subscribeToMetrics).toBe('function');
  });

  it('handles connection attempt', () => {
    const { result } = renderHook(() => useWebSocket(mockUrl, mockOptions));

    // Should not throw when calling connect
    expect(() => {
      act(() => {
        result.current.connect();
      });
    }).not.toThrow();
  });

  it('handles disconnect method', () => {
    const { result } = renderHook(() => useWebSocket(mockUrl, mockOptions));

    // Should not throw when calling disconnect
    act(() => {
      result.current.disconnect();
    });

    // Should still be disconnected
    expect(result.current.isConnected).toBe(false);
  });

  it('cleans up on unmount', () => {
    const { result, unmount } = renderHook(() => useWebSocket(mockUrl, mockOptions));

    // Should not throw when unmounting
    expect(() => unmount()).not.toThrow();
  });

  it('accepts options parameter', () => {
    const customOptions = {
      autoReconnect: false,
      reconnectInterval: 10000,
      maxReconnectAttempts: 3,
    };

    const { result } = renderHook(() => useWebSocket(mockUrl, customOptions));

    // Should initialize without error
    expect(result.current.isConnected).toBe(false);
    expect(result.current.lastMessage).toBeNull();
  });

  it('handles empty options parameter', () => {
    const { result } = renderHook(() => useWebSocket(mockUrl, {}));

    // Should initialize with default options
    expect(result.current.isConnected).toBe(false);
    expect(result.current.lastMessage).toBeNull();
  });

  it('handles no options parameter', () => {
    const { result } = renderHook(() => useWebSocket(mockUrl));

    // Should initialize with default options
    expect(result.current.isConnected).toBe(false);
    expect(result.current.lastMessage).toBeNull();
  });
});
