// Mock for framer-motion
const React = require('react');

const motion = {
  div: React.forwardRef((props, ref) => React.createElement('div', { ...props, ref })),
  span: React.forwardRef((props, ref) => React.createElement('span', { ...props, ref })),
  button: React.forwardRef((props, ref) => React.createElement('button', { ...props, ref })),
  section: React.forwardRef((props, ref) => React.createElement('section', { ...props, ref })),
  article: React.forwardRef((props, ref) => React.createElement('article', { ...props, ref })),
  h1: React.forwardRef((props, ref) => React.createElement('h1', { ...props, ref })),
  h2: React.forwardRef((props, ref) => React.createElement('h2', { ...props, ref })),
  h3: React.forwardRef((props, ref) => React.createElement('h3', { ...props, ref })),
  p: React.forwardRef((props, ref) => React.createElement('p', { ...props, ref })),
  ul: React.forwardRef((props, ref) => React.createElement('ul', { ...props, ref })),
  li: React.forwardRef((props, ref) => React.createElement('li', { ...props, ref })),
  img: React.forwardRef((props, ref) => React.createElement('img', { ...props, ref })),
};

const AnimatePresence = ({ children }) => children;

const useAnimation = () => ({
  start: jest.fn(),
  stop: jest.fn(),
  set: jest.fn(),
});

const useMotionValue = jest.fn(() => ({
  get: jest.fn(() => 0),
  set: jest.fn(),
  on: jest.fn(),
}));

const useTransform = jest.fn(() => ({
  get: jest.fn(() => 0),
  set: jest.fn(),
  on: jest.fn(),
}));

const useSpring = jest.fn(() => ({
  get: jest.fn(() => 0),
  set: jest.fn(),
  on: jest.fn(),
}));

const useScroll = jest.fn(() => ({
  scrollY: { get: jest.fn(() => 0), set: jest.fn(), on: jest.fn() },
  scrollX: { get: jest.fn(() => 0), set: jest.fn(), on: jest.fn() },
}));

const useViewportScroll = jest.fn(() => ({
  scrollY: { get: jest.fn(() => 0), set: jest.fn(), on: jest.fn() },
  scrollX: { get: jest.fn(() => 0), set: jest.fn(), on: jest.fn() },
}));

const useReducedMotion = jest.fn(() => false);

module.exports = {
  motion,
  AnimatePresence,
  useAnimation,
  useMotionValue,
  useTransform,
  useSpring,
  useScroll,
  useViewportScroll,
  useReducedMotion,
};
