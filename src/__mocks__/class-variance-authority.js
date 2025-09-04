// Mock for class-variance-authority
const cva = jest.fn((base, config) => {
  return jest.fn((props) => {
    // Return base class or concatenated classes for testing
    if (typeof base === 'string') {
      return base;
    }
    if (Array.isArray(base)) {
      return base.join(' ');
    }
    return 'mocked-class';
  });
});

module.exports = {
  cva,
  type: {
    VariantProps: 'any',
  },
};
