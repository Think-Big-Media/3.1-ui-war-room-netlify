/**
 * Error Boundary Component - Prevents component crashes from killing entire demo
 * Provides user-friendly fallback UI and error reporting
 */

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 [ErrorBoundary] Component crashed:', error);
    console.error('🔍 [ErrorBoundary] Error details:', errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Report error for demo monitoring
    if (typeof window !== 'undefined' && (window as any).postHog) {
      (window as any).postHog.capture('component_error_boundary_triggered', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      });
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default demo-safe fallback UI
      return (
        <div className="error-boundary-fallback bg-slate-800 border border-slate-600 rounded-lg p-6 m-4">
          <div className="flex items-center space-x-3 mb-4">
            <div className="flex-shrink-0">
              <AlertTriangle className="w-8 h-8 text-yellow-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                Component Temporarily Unavailable
              </h3>
              <p className="text-sm text-slate-300 mt-1">
                Don't worry! The rest of your dashboard is still working perfectly.
              </p>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={this.handleRetry}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </button>

            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-slate-300 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            >
              <Home className="w-4 h-4 mr-2" />
              Refresh Dashboard
            </button>
          </div>

          {/* Error details for debugging (hidden in production) */}
          {this.props.showDetails && this.state.error && (
            <details className="mt-4 text-xs">
              <summary className="cursor-pointer text-slate-400 hover:text-white">
                Technical Details (for developers)
              </summary>
              <pre className="mt-2 p-3 bg-slate-900 text-red-400 rounded text-xs overflow-auto max-h-40">
                {this.state.error.message}
                {'\n\n'}
                {this.state.error.stack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

// Convenient wrapper components for specific use cases
export const DashboardErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary
    onError={(error, errorInfo) => {
      console.warn('🎯 [Dashboard] Component error caught - dashboard continues to work', error);
    }}
    showDetails={process.env.NODE_ENV === 'development'}
  >
    {children}
  </ErrorBoundary>
);

export const WidgetErrorBoundary: React.FC<{ children: ReactNode; widgetName?: string }> = ({
  children,
  widgetName = 'Widget',
}) => (
  <ErrorBoundary
    fallback={
      <div className="widget-error-fallback bg-slate-700 border border-slate-500 rounded p-4 text-center">
        <AlertTriangle className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
        <p className="text-sm text-slate-300">{widgetName} is temporarily unavailable</p>
        <p className="text-xs text-slate-400 mt-1">Other widgets continue to work normally</p>
      </div>
    }
    onError={(error, errorInfo) => {
      console.warn(
        `🔧 [${widgetName}] Widget error caught - other widgets continue to work`,
        error
      );
    }}
  >
    {children}
  </ErrorBoundary>
);
