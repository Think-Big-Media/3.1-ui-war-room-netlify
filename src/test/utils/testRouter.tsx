import type React from 'react';
import { MemoryRouter } from 'react-router-dom';

export const TestRouterWrapper: React.FC<
  React.PropsWithChildren<{ initialEntries?: string[] }>
> = ({ children, initialEntries = ['/'] }) => {
  return <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>;
};

export default TestRouterWrapper;
