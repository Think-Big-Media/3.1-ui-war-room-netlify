import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TestRouterWrapper } from '../../test/utils/testRouter';
import PageLayout from './PageLayout';

// Mock the imported components
jest.mock('../generated/SidebarNavigation', () => ({
  default: () => <nav data-testid="mock-navigation">Navigation</nav>,
}));

jest.mock('../generated/FloatingChatBar', () => ({
  default: ({ onSendMessage, placeholder }: any) => (
    <div data-testid="mock-chat-bar">
      <input
        data-testid="chat-input"
        placeholder={placeholder}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && e.currentTarget.value) {
            onSendMessage(e.currentTarget.value);
          }
        }}
      />
    </div>
  ),
}));

jest.mock('./GlobalFooter', () => ({
  default: () => <footer data-testid="mock-footer">Footer</footer>,
}));

// Mock console.log to verify it's being called
const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

describe('PageLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  const renderComponent = (props = {}) => {
    const defaultProps = {
      children: <div data-testid="page-content">Test Content</div>,
      pageTitle: 'Test Page',
      placeholder: 'Type your message...',
      ...props,
    };

    return render(
      <TestRouterWrapper>
        <PageLayout {...defaultProps} />
      </TestRouterWrapper>
    );
  };

  describe('Rendering', () => {
    it('should render all required components', () => {
      renderComponent();

      // Check all components are rendered
      expect(screen.getByTestId('mock-navigation')).toBeInTheDocument();
      expect(screen.getByTestId('page-content')).toBeInTheDocument();
      expect(screen.getByTestId('mock-chat-bar')).toBeInTheDocument();
      expect(screen.getByTestId('mock-footer')).toBeInTheDocument();
    });

    it('should render children content', () => {
      renderComponent({
        children: (
          <>
            <h1>Custom Title</h1>
            <p>Custom paragraph content</p>
          </>
        ),
      });

      expect(screen.getByText('Custom Title')).toBeInTheDocument();
      expect(screen.getByText('Custom paragraph content')).toBeInTheDocument();
    });

    it('should apply correct background gradient', () => {
      const { container } = renderComponent();
      // PageLayout is now theme-independent - each page sets its own gradient
      // So we just check that the layout structure is correct
      const layoutDiv = container.querySelector('.min-h-screen.w-full.flex.flex-col');

      expect(layoutDiv).toBeInTheDocument();
      expect(layoutDiv).toHaveClass(
        'min-h-screen',
        'w-full',
        'flex',
        'flex-col',
        'relative',
        'z-10'
      );
    });

    it('should have correct layout structure', () => {
      const { container } = renderComponent();

      // Check min-height and flex container
      const mainContainer = container.querySelector('.min-h-screen.flex.flex-col');
      expect(mainContainer).toBeInTheDocument();

      // Check main content area
      const mainElement = screen.getByRole('main');
      expect(mainElement).toHaveClass('flex-1', 'overflow-y-auto');
      expect(mainElement).toHaveStyle({
        paddingTop: '80px',
        paddingBottom: '180px',
        scrollBehavior: 'smooth',
        WebkitOverflowScrolling: 'touch',
      });
    });

    it('should position chat bar correctly', () => {
      const { container } = renderComponent();
      const chatBarContainer = container.querySelector('.fixed.bottom-12');

      expect(chatBarContainer).toBeInTheDocument();
      expect(chatBarContainer).toHaveClass(
        'fixed',
        'bottom-12',
        'left-0',
        'right-0',
        'z-50',
        'px-4',
        'lg:px-6'
      );
    });

    it('should apply max-width constraint to content', () => {
      const { container } = renderComponent();
      const contentContainer = container.querySelector('.max-w-7xl');

      expect(contentContainer).toBeInTheDocument();
      expect(contentContainer).toHaveClass('max-w-7xl', 'mx-auto', 'px-4', 'py-8');
    });
  });

  describe('Props', () => {
    it('should pass placeholder to chat bar', () => {
      renderComponent({ placeholder: 'Custom placeholder text' });

      const chatInput = screen.getByTestId('chat-input');
      expect(chatInput).toHaveAttribute('placeholder', 'Custom placeholder text');
    });

    it('should log page title on render', () => {
      renderComponent({ pageTitle: 'Analytics Dashboard' });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '🔍 PageLayout rendering for: Analytics Dashboard'
      );
    });

    it('should handle string children', () => {
      renderComponent({ children: 'Simple text content' });
      expect(screen.getByText('Simple text content')).toBeInTheDocument();
    });

    it('should handle null children', () => {
      renderComponent({ children: null });
      expect(screen.getByTestId('mock-footer')).toBeInTheDocument();
    });

    it('should handle array of children', () => {
      renderComponent({
        children: [<div key="1">First child</div>, <div key="2">Second child</div>],
      });
      expect(screen.getByText('First child')).toBeInTheDocument();
      expect(screen.getByText('Second child')).toBeInTheDocument();
    });
  });

  describe('Chat Integration', () => {
    it('should handle chat messages correctly', async () => {
      const user = userEvent.setup();
      renderComponent({ pageTitle: 'Test Page' });

      const chatInput = screen.getByTestId('chat-input') as HTMLInputElement;

      // Type and send a message
      await user.type(chatInput, 'Hello from test');
      await user.keyboard('{Enter}');

      expect(consoleLogSpy).toHaveBeenCalledWith('Message from Test Page:', 'Hello from test');
    });

    it('should include page context in chat messages', async () => {
      const user = userEvent.setup();
      renderComponent({ pageTitle: 'Performance Analytics' });

      const chatInput = screen.getByTestId('chat-input') as HTMLInputElement;

      await user.type(chatInput, 'Show me the metrics');
      await user.keyboard('{Enter}');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Message from Performance Analytics:',
        'Show me the metrics'
      );
    });
  });

  describe('Responsive Behavior', () => {
    it('should apply responsive padding to chat bar container', () => {
      const { container } = renderComponent();
      const chatBarContainer = container.querySelector('.fixed.bottom-12');

      expect(chatBarContainer).toHaveClass('px-4', 'lg:px-6');
    });

    it('should maintain layout on different screen sizes', () => {
      const { container } = renderComponent();

      // The layout should work on all screen sizes
      const mainContainer = container.querySelector('.min-h-screen');
      expect(mainContainer).toHaveClass('w-full');
    });
  });

  describe('Scrolling Behavior', () => {
    it('should enable smooth scrolling on main content', () => {
      renderComponent();
      const mainElement = screen.getByRole('main');

      expect(mainElement).toHaveStyle({
        scrollBehavior: 'smooth',
        WebkitOverflowScrolling: 'touch',
      });
    });

    it('should allow vertical scrolling but not horizontal', () => {
      renderComponent();
      const mainElement = screen.getByRole('main');

      expect(mainElement).toHaveClass('overflow-y-auto');
      expect(mainElement).not.toHaveClass('overflow-x-auto');
    });
  });

  describe('Z-Index Layering', () => {
    it('should have correct z-index hierarchy', () => {
      const { container } = renderComponent();

      // Main content should have proper z-index
      const mainContent = container.querySelector('.min-h-screen.w-full.flex.flex-col');
      expect(mainContent).toBeInTheDocument();
      expect(mainContent).toHaveClass('z-10');

      // Chat bar should be on top
      const chatBar = container.querySelector('.fixed.bottom-12');
      expect(chatBar).toBeInTheDocument();
      expect(chatBar).toHaveClass('z-50');
    });
  });

  describe('Footer Integration', () => {
    it('should render footer inside scrollable content', () => {
      renderComponent();

      const mainElement = screen.getByRole('main');
      const footer = screen.getByTestId('mock-footer');

      // Footer should be inside main content area
      expect(mainElement).toContainElement(footer);
    });

    it('should position footer after children content', () => {
      const { container } = renderComponent();

      const contentContainer = container.querySelector('.max-w-7xl');
      const children = contentContainer?.children;

      // Footer should be the last child
      expect(children?.[children.length - 1]).toBe(screen.getByTestId('mock-footer'));
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long page titles', () => {
      const longTitle = 'A'.repeat(200);
      renderComponent({ pageTitle: longTitle });

      expect(consoleLogSpy).toHaveBeenCalledWith(`🔍 PageLayout rendering for: ${longTitle}`);
    });

    it('should handle empty placeholder', () => {
      renderComponent({ placeholder: '' });

      const chatInput = screen.getByTestId('chat-input');
      expect(chatInput).toHaveAttribute('placeholder', '');
    });

    it('should handle complex nested children', () => {
      renderComponent({
        children: (
          <div>
            <section>
              <article>
                <h1>Nested Content</h1>
                <div>
                  <p>Deep nesting test</p>
                </div>
              </article>
            </section>
          </div>
        ),
      });

      expect(screen.getByText('Deep nesting test')).toBeInTheDocument();
    });

    it('should not break with undefined props', () => {
      // This should not throw an error
      expect(() => {
        render(
          <TestRouterWrapper>
            <PageLayout pageTitle="Test" placeholder="Test">
              Content
            </PageLayout>
          </TestRouterWrapper>
        );
      }).not.toThrow();
    });
  });
});
