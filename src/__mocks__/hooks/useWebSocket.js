// Mock for useWebSocket hook
const mockWebSocketHook = {
  useWebSocket: jest.fn(() => ({
    connectionState: 'CLOSED',
    lastMessage: null,
    sendMessage: jest.fn(),
    clearMessages: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    isConnected: false,
    isConnecting: false,
    error: null,
  })),
  useAnalyticsWebSocket: jest.fn(() => ({
    activities: [],
    isConnected: false,
    isConnecting: false,
    error: null,
    connect: jest.fn(),
    disconnect: jest.fn(),
  })),
};

module.exports = mockWebSocketHook;
