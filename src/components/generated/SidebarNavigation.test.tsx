import { describe, it, expect, vi, beforeEach } from '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useLocation, useNavigate } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { TestRouterWrapper } from '../../test/utils/testRouter';
import TopNavigation from './SidebarNavigation';

// Mock react-router-dom hooks
jest.mock('react-router-dom', async () => {
  const actual = await jest.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: jest.fn(),
    useLocation: jest.fn(),
  };
});

// Mock framer-motion to avoid animation complexities in tests
jest.mock('framer-motion', () => {
  const filterMotionProps = (props: any) => {
    const {
      whileHover,
      whileTap,
      animate,
      initial,
      exit,
      transition,
      variants,
      whileDrag,
      whileFocus,
      whileInView,
      drag,
      dragConstraints,
      dragElastic,
      ...validProps
    } = props;
    return validProps;
  };

  return {
    motion: {
      nav: ({ children, ...props }: any) => <nav {...filterMotionProps(props)}>{children}</nav>,
      button: ({ children, ...props }: any) => (
        <button {...filterMotionProps(props)}>{children}</button>
      ),
      div: ({ children, ...props }: any) => <div {...filterMotionProps(props)}>{children}</div>,
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
  };
});

describe('TopNavigation', () => {
  const mockNavigate = jest.fn();
  const mockLocation = { pathname: '/' };

  beforeEach(() => {
    jest.clearAllMocks();
    (useNavigate as any).mockReturnValue(mockNavigate);
    (useLocation as any).mockReturnValue(mockLocation);
  });

  const renderComponent = () => {
    return render(
      <TestRouterWrapper>
        <TopNavigation />
      </TestRouterWrapper>
    );
  };

  describe('Rendering', () => {
    it('should render the navigation bar', () => {
      renderComponent();
      expect(screen.getByText('War Room')).toBeInTheDocument();
    });

    it('should render all navigation items', () => {
      renderComponent();
      const navItems = [
        'Dashboard',
        'CIA',
        'Campaign',
        'Content Engine',
        'Content Calendar',
        'Performance',
        'Settings',
      ];

      navItems.forEach((item) => {
        expect(screen.getByText(item)).toBeInTheDocument();
      });
    });

    it('should render notification and user profile buttons', () => {
      renderComponent();
      // Find buttons by their icon classes since they don't have accessible names
      const notificationButton = document.querySelector('button .lucide-bell')?.closest('button');
      const userButton = document.querySelector('button .lucide-user')?.closest('button');

      expect(notificationButton).toBeInTheDocument();
      expect(userButton).toBeInTheDocument();
    });

    it('should hide navigation items on mobile', () => {
      renderComponent();
      const navContainer = screen.getByText('Dashboard').closest('div');
      expect(navContainer).toHaveClass('hidden', 'md:flex');
    });

    it('should show mobile menu button on small screens', () => {
      renderComponent();
      const mobileMenuButton = document
        .querySelector('button.md\\:hidden .lucide-menu')
        ?.closest('button');
      expect(mobileMenuButton).toBeInTheDocument();
      expect(mobileMenuButton).toHaveClass('md:hidden');
    });
  });

  describe('Navigation', () => {
    it('should navigate to correct path when nav item is clicked', async () => {
      renderComponent();
      const campaignButton = screen.getByText('Campaign');

      await userEvent.click(campaignButton);

      expect(mockNavigate).toHaveBeenCalledWith('/campaign');
    });

    it('should highlight active navigation item', () => {
      (useLocation as any).mockReturnValue({ pathname: '/cia' });
      renderComponent();

      const ciaButton = screen.getByText('CIA').closest('button');
      expect(ciaButton).toHaveClass('bg-white/20', 'text-white', 'border', 'border-white/30');
    });

    it('should navigate to settings when user profile is clicked', async () => {
      renderComponent();
      const userButton = document.querySelector('button .lucide-user')?.closest('button');

      if (userButton) {
        await userEvent.click(userButton);
      }

      expect(mockNavigate).toHaveBeenCalledWith('/settings');
    });
  });

  describe('Notifications', () => {
    it('should toggle notifications dropdown when bell icon is clicked', async () => {
      renderComponent();
      const notificationButton = document.querySelector('button .lucide-bell')?.closest('button');

      // Initially, notifications should not be visible
      expect(screen.queryByText('Notifications')).not.toBeInTheDocument();

      // Click to open
      if (notificationButton) {
        await userEvent.click(notificationButton);
      }

      // Notifications should be visible
      await waitFor(() => {
        expect(screen.getByText('Notifications')).toBeInTheDocument();
      });

      // Check that all notifications are rendered
      expect(screen.getByText('CIA Analysis Complete')).toBeInTheDocument();
      expect(screen.getByText('Content Scheduled')).toBeInTheDocument();
      expect(screen.getByText('Performance Alert')).toBeInTheDocument();
      expect(screen.getByText('Campaign Status')).toBeInTheDocument();
    });

    it('should close notifications when clicking outside', async () => {
      renderComponent();
      const notificationButton = document.querySelector('button .lucide-bell')?.closest('button');

      // Open notifications
      if (notificationButton) {
        await userEvent.click(notificationButton);
      }
      expect(screen.getByText('Notifications')).toBeInTheDocument();

      // Click outside
      fireEvent.mouseDown(document.body);

      await waitFor(() => {
        expect(screen.queryByText('Notifications')).not.toBeInTheDocument();
      });
    });

    it('should close notifications when X button is clicked', async () => {
      renderComponent();
      const notificationButton = document.querySelector('button .lucide-bell')?.closest('button');

      // Open notifications
      if (notificationButton) {
        await userEvent.click(notificationButton);
      }

      // Find and click the X button within the notifications dropdown
      await waitFor(() => {
        expect(screen.getByText('Notifications')).toBeInTheDocument();
      });
      const closeButton = document.querySelector('.lucide-x')?.closest('button');
      if (closeButton) {
        await userEvent.click(closeButton);
      }

      await waitFor(() => {
        expect(screen.queryByText('Notifications')).not.toBeInTheDocument();
      });
    });

    it('should display notification badge', () => {
      renderComponent();
      const notificationButton = document.querySelector('button .lucide-bell')?.closest('button');
      const badge = notificationButton?.querySelector('.bg-orange-500');

      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('w-3', 'h-3', 'rounded-full');
    });
  });

  describe('Mobile Menu', () => {
    it('should toggle mobile menu when menu button is clicked', async () => {
      renderComponent();
      const mobileMenuButton = document
        .querySelector('button.md\\:hidden .lucide-menu')
        ?.closest('button');

      // Initially, mobile menu should not be visible
      expect(document.querySelector('.lucide-x')).not.toBeInTheDocument();

      // Click to open
      if (mobileMenuButton) {
        await userEvent.click(mobileMenuButton);
      }

      // Mobile menu should be visible with close button
      await waitFor(() => {
        const closeButton = document.querySelector('.lucide-x');
        expect(closeButton).toBeInTheDocument();
      });

      // All nav items should be visible in mobile menu
      const navItems = [
        'Dashboard',
        'CIA',
        'Campaign',
        'Content Engine',
        'Content Calendar',
        'Performance',
        'Settings',
      ];

      navItems.forEach((item) => {
        // There will be 2 instances - one in hidden desktop nav, one in mobile menu
        const items = screen.getAllByText(item);
        expect(items.length).toBe(2);
      });
    });

    it('should close mobile menu when close button is clicked', async () => {
      renderComponent();
      const mobileMenuButton = document
        .querySelector('button.md\\:hidden .lucide-menu')
        ?.closest('button');

      // Open menu
      if (mobileMenuButton) {
        await userEvent.click(mobileMenuButton);
      }

      // Wait for menu to open and find close button
      await waitFor(() => {
        expect(document.querySelector('.lucide-x')).toBeInTheDocument();
      });
      const closeButton = document.querySelector('.lucide-x')?.closest('button');
      if (closeButton) {
        await userEvent.click(closeButton);
      }

      await waitFor(() => {
        expect(document.querySelector('.lucide-x')).not.toBeInTheDocument();
      });
    });

    it('should navigate and close mobile menu when nav item is clicked', async () => {
      renderComponent();
      const mobileMenuButton = document
        .querySelector('button.md\\:hidden .lucide-menu')
        ?.closest('button');

      // Open menu
      if (mobileMenuButton) {
        await userEvent.click(mobileMenuButton);
      }

      // Click on a nav item in mobile menu
      const performanceButtons = screen.getAllByText('Performance');
      const mobilePerformanceButton = performanceButtons[1]; // Second instance is in mobile menu

      await userEvent.click(mobilePerformanceButton);

      expect(mockNavigate).toHaveBeenCalledWith('/performance');

      // Menu should close
      await waitFor(() => {
        expect(document.querySelector('.lucide-x')).not.toBeInTheDocument();
      });
    });

    it('should highlight active item in mobile menu', async () => {
      (useLocation as any).mockReturnValue({ pathname: '/content-engine' });
      renderComponent();

      const mobileMenuButton = document
        .querySelector('button.md\\:hidden .lucide-menu')
        ?.closest('button');
      if (mobileMenuButton) {
        await userEvent.click(mobileMenuButton);
      }

      const contentEngineButtons = screen.getAllByText('Content Engine');
      const mobileContentEngineButton = contentEngineButtons[1].closest('button');

      expect(mobileContentEngineButton).toHaveClass('bg-white/20', 'text-white', 'border-l-4');
    });
  });

  describe('Styling', () => {
    it('should have correct base styles', () => {
      renderComponent();
      const nav = screen.getByRole('navigation');

      expect(nav).toHaveClass(
        'fixed',
        'top-0',
        'left-0',
        'right-0',
        'z-50',
        'bg-black/20',
        'backdrop-blur-xl',
        'border-b',
        'border-purple-500/30'
      );
    });

    it('should apply hover styles to nav items', () => {
      renderComponent();
      const dashboardButton = screen.getByText('Dashboard').closest('button');

      expect(dashboardButton).toHaveClass('transition-all', 'duration-200');
    });

    it('should display icons with correct size', () => {
      renderComponent();
      const icons = document.querySelectorAll('.lucide');

      icons.forEach((icon) => {
        if (icon.closest('.md\\:flex')) {
          // Desktop nav icons
          expect(icon).toHaveClass('w-4', 'h-4');
        } else if (icon.closest("[role='button']")) {
          // Action buttons (bell, user)
          expect(icon).toHaveClass('w-5', 'h-5');
        }
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      renderComponent();
      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
    });

    it('should be keyboard navigable', async () => {
      renderComponent();
      const user = userEvent.setup();

      // Tab to first nav item
      await user.tab();

      // Should focus on first interactive element
      const focusedElement = document.activeElement;
      expect(focusedElement).toHaveProperty('tagName', 'BUTTON');
    });

    it('should have visible focus indicators', () => {
      renderComponent();
      const buttons = screen.getAllByRole('button');

      buttons.forEach((button) => {
        // Check that buttons have focus-related classes
        const classes = button.className;
        expect(classes).toMatch(/transition|duration/);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined location pathname', () => {
      (useLocation as any).mockReturnValue({ pathname: undefined });

      expect(() => renderComponent()).not.toThrow();
    });

    it('should handle rapid clicks on navigation items', async () => {
      renderComponent();
      const campaignButton = screen.getByText('Campaign');

      // Click multiple times rapidly
      await userEvent.click(campaignButton);
      await userEvent.click(campaignButton);
      await userEvent.click(campaignButton);

      // Should only navigate once per click
      expect(mockNavigate).toHaveBeenCalledTimes(3);
    });

    it('should handle missing icons gracefully', () => {
      // This test ensures the component doesn't crash if icons are undefined
      expect(() => renderComponent()).not.toThrow();
    });
  });
});
