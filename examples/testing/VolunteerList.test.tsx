/**
 * Example Jest/React Testing Library tests for VolunteerList component.
 * Shows patterns for:
 * - Component rendering tests
 * - User interaction testing
 * - API mocking
 * - Redux state testing
 * - Accessibility testing
 */

import type React from 'react';
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { axe, toHaveNoViolations } from 'jest-axe';

import { VolunteerList } from '../../../src/components/volunteers/VolunteerList';
import { store, setupStore } from '../../../src/store';
import { theme } from '../../../src/theme';
import { AuthContext } from '../../../src/contexts/AuthContext';
import { mockVolunteers, mockUser } from '../../fixtures/mockData';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Setup MSW server for API mocking
const server = setupServer(
  rest.get('/api/v1/volunteers', (req, res, ctx) => {
    const status = req.url.searchParams.get('status');
    const search = req.url.searchParams.get('search');
    const skip = parseInt(req.url.searchParams.get('skip') || '0');
    const limit = parseInt(req.url.searchParams.get('limit') || '100');

    let filteredVolunteers = [...mockVolunteers];

    // Apply filters
    if (status && status !== 'all') {
      filteredVolunteers = filteredVolunteers.filter(v => v.status === status);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filteredVolunteers = filteredVolunteers.filter(v =>
        v.firstName.toLowerCase().includes(searchLower) ||
        v.lastName.toLowerCase().includes(searchLower) ||
        v.email.toLowerCase().includes(searchLower),
      );
    }

    // Apply pagination
    const paginatedVolunteers = filteredVolunteers.slice(skip, skip + limit);

    return res(
      ctx.json({
        data: paginatedVolunteers,
        total: filteredVolunteers.length,
        totalPages: Math.ceil(filteredVolunteers.length / limit),
      }),
    );
  }),
);

// Enable API mocking
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Test utilities
const renderWithProviders = (
  component: React.ReactElement,
  {
    preloadedState = {},
    store = setupStore(preloadedState),
    authValue = {
      user: mockUser,
      hasPermission: (permission: string) => true,
      isAuthenticated: true,
    },
    ...renderOptions
  } = {},
) => {
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <Provider store={store}>
      <AuthContext.Provider value={authValue}>
        <ThemeProvider theme={theme}>
          <MemoryRouter>
            {children}
          </MemoryRouter>
        </ThemeProvider>
      </AuthContext.Provider>
    </Provider>
  );

  return {
    ...render(component, { wrapper: Wrapper, ...renderOptions }),
    store,
  };
};

describe('VolunteerList Component', () => {
  describe('Rendering', () => {
    it('should render volunteer list successfully', async () => {
      renderWithProviders(<VolunteerList />);

      // Wait for data to load
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      // Check if volunteers are displayed
      mockVolunteers.forEach(volunteer => {
        expect(screen.getByText(`${volunteer.firstName} ${volunteer.lastName}`)).toBeInTheDocument();
      });
    });

    it('should display loading state initially', () => {
      renderWithProviders(<VolunteerList />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should display error state on API failure', async () => {
      server.use(
        rest.get('/api/v1/volunteers', (req, res, ctx) => {
          return res(ctx.status(500), ctx.json({ message: 'Server error' }));
        }),
      );

      renderWithProviders(<VolunteerList />);

      await waitFor(() => {
        expect(screen.getByText(/Failed to load volunteers/i)).toBeInTheDocument();
      });
    });

    it('should display empty state when no volunteers', async () => {
      server.use(
        rest.get('/api/v1/volunteers', (req, res, ctx) => {
          return res(ctx.json({ data: [], total: 0, totalPages: 0 }));
        }),
      );

      renderWithProviders(<VolunteerList />);

      await waitFor(() => {
        expect(screen.getByText(/No volunteers found/i)).toBeInTheDocument();
      });
    });
  });

  describe('Filtering', () => {
    it('should filter volunteers by status', async () => {
      const user = userEvent.setup();
      renderWithProviders(<VolunteerList />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      // Open status filter
      const statusSelect = screen.getByLabelText(/Status/i);
      await user.click(statusSelect);

      // Select "Active" status
      const activeOption = screen.getByRole('option', { name: /Active/i });
      await user.click(activeOption);

      // Wait for filtered results
      await waitFor(() => {
        const volunteerCards = screen.getAllByTestId('volunteer-card');
        volunteerCards.forEach(card => {
          expect(within(card).getByText('active')).toBeInTheDocument();
        });
      });
    });

    it('should search volunteers by name', async () => {
      const user = userEvent.setup();
      renderWithProviders(<VolunteerList />);

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      // Type in search field
      const searchInput = screen.getByPlaceholderText(/Search volunteers/i);
      await user.type(searchInput, 'John');

      // Wait for debounced search
      await waitFor(() => {
        const results = screen.getAllByTestId('volunteer-card');
        expect(results.length).toBeLessThan(mockVolunteers.length);
        results.forEach(card => {
          const name = within(card).getByRole('heading').textContent;
          expect(name).toMatch(/John/i);
        });
      }, { timeout: 1000 });
    });

    it('should clear search when input is cleared', async () => {
      const user = userEvent.setup();
      renderWithProviders(<VolunteerList />);

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Search volunteers/i);

      // Search for something
      await user.type(searchInput, 'John');
      await waitFor(() => {
        expect(screen.getAllByTestId('volunteer-card').length).toBeLessThan(mockVolunteers.length);
      });

      // Clear search
      await user.clear(searchInput);
      await waitFor(() => {
        expect(screen.getAllByTestId('volunteer-card').length).toBe(mockVolunteers.length);
      });
    });
  });

  describe('Pagination', () => {
    it('should handle pagination correctly', async () => {
      const user = userEvent.setup();

      // Create many volunteers for pagination
      const manyVolunteers = Array.from({ length: 25 }, (_, i) => ({
        ...mockVolunteers[0],
        id: i + 1,
        email: `volunteer${i}@example.com`,
      }));

      server.use(
        rest.get('/api/v1/volunteers', (req, res, ctx) => {
          const skip = parseInt(req.url.searchParams.get('skip') || '0');
          const limit = parseInt(req.url.searchParams.get('limit') || '10');

          return res(ctx.json({
            data: manyVolunteers.slice(skip, skip + limit),
            total: manyVolunteers.length,
            totalPages: Math.ceil(manyVolunteers.length / limit),
          }));
        }),
      );

      renderWithProviders(<VolunteerList />);

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      // Check pagination is displayed
      const pagination = screen.getByRole('navigation', { name: /pagination/i });
      expect(pagination).toBeInTheDocument();

      // Go to page 2
      const page2Button = within(pagination).getByRole('button', { name: /2/i });
      await user.click(page2Button);

      // Verify different volunteers are shown
      await waitFor(() => {
        expect(screen.queryByText('volunteer0@example.com')).not.toBeInTheDocument();
        expect(screen.getByText('volunteer10@example.com')).toBeInTheDocument();
      });
    });
  });

  describe('User Interactions', () => {
    it('should handle volunteer card click', async () => {
      const user = userEvent.setup();
      const onSelectVolunteer = jest.fn();

      renderWithProviders(<VolunteerList onSelectVolunteer={onSelectVolunteer} />);

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      // Click on first volunteer card
      const firstVolunteerCard = screen.getAllByTestId('volunteer-card')[0];
      await user.click(firstVolunteerCard);

      expect(onSelectVolunteer).toHaveBeenCalledWith(mockVolunteers[0]);
    });

    it('should show edit button for users with permission', async () => {
      renderWithProviders(<VolunteerList />);

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      const editButtons = screen.getAllByLabelText(/edit/i);
      expect(editButtons.length).toBeGreaterThan(0);
    });

    it('should hide edit button for users without permission', async () => {
      const authValue = {
        user: mockUser,
        hasPermission: (permission: string) => false,
        isAuthenticated: true,
      };

      renderWithProviders(<VolunteerList />, { authValue });

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      const editButtons = screen.queryAllByLabelText(/edit/i);
      expect(editButtons.length).toBe(0);
    });

    it('should handle edit button click without propagation', async () => {
      const user = userEvent.setup();
      const onSelectVolunteer = jest.fn();

      renderWithProviders(<VolunteerList onSelectVolunteer={onSelectVolunteer} />);

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      // Click edit button
      const editButton = screen.getAllByLabelText(/edit/i)[0];
      await user.click(editButton);

      // Should not trigger card click
      expect(onSelectVolunteer).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = renderWithProviders(<VolunteerList />);

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      renderWithProviders(<VolunteerList />);

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      // Tab through interactive elements
      await user.tab();
      expect(screen.getByPlaceholderText(/Search volunteers/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText(/Status/i)).toHaveFocus();

      // Tab to first volunteer card
      await user.tab();
      await user.tab();
      const firstCard = screen.getAllByTestId('volunteer-card')[0];
      expect(firstCard).toHaveFocus();

      // Enter key should select volunteer
      const onSelectVolunteer = jest.fn();
      renderWithProviders(<VolunteerList onSelectVolunteer={onSelectVolunteer} />);

      await user.keyboard('{Enter}');
      expect(onSelectVolunteer).toHaveBeenCalled();
    });

    it('should announce loading and results to screen readers', async () => {
      renderWithProviders(<VolunteerList />);

      // Loading state should be announced
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-label');

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      // Results count should be announced
      expect(screen.getByText(/Showing \d+ volunteers/i)).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should debounce search input', async () => {
      const user = userEvent.setup();
      let apiCallCount = 0;

      server.use(
        rest.get('/api/v1/volunteers', (req, res, ctx) => {
          apiCallCount++;
          return res(ctx.json({ data: [], total: 0, totalPages: 0 }));
        }),
      );

      renderWithProviders(<VolunteerList />);

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      const initialCallCount = apiCallCount;
      const searchInput = screen.getByPlaceholderText(/Search volunteers/i);

      // Type quickly
      await user.type(searchInput, 'test search');

      // Should only make one additional API call after debounce
      await waitFor(() => {
        expect(apiCallCount).toBe(initialCallCount + 1);
      }, { timeout: 1000 });
    });

    it('should not re-render unnecessarily', async () => {
      const renderCount = jest.fn();

      const TestWrapper = () => {
        renderCount();
        return <VolunteerList />;
      };

      const { rerender } = renderWithProviders(<TestWrapper />);

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      const initialRenderCount = renderCount.mock.calls.length;

      // Re-render with same props
      rerender(<TestWrapper />);

      // Should not cause additional renders
      expect(renderCount.mock.calls.length).toBe(initialRenderCount);
    });
  });
});
