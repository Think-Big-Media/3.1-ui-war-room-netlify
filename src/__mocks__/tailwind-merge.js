// Mock for tailwind-merge
const twMerge = jest.fn((...classes) => {
  return classes.filter(Boolean).join(' ');
});

module.exports = {
  twMerge,
};
