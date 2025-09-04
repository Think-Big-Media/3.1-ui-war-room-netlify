// Mock for posthog-js
module.exports = {
  __esModule: true,
  default: {
    init: jest.fn(),
    identify: jest.fn(),
    capture: jest.fn(),
    reset: jest.fn(),
    shutdown: jest.fn(),
    loaded: true,
    isFeatureEnabled: jest.fn().mockReturnValue(false),
    getFeatureFlag: jest.fn().mockReturnValue(null),
    onFeatureFlags: jest.fn(),
    people: {
      set: jest.fn(),
      set_once: jest.fn(),
    },
  },
};
