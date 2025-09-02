// Mock for clsx
const clsx = jest.fn((...classes) => {
  return classes.flat().filter(Boolean).join(' ');
});

module.exports = {
  __esModule: true,
  default: clsx,
  clsx,
};
