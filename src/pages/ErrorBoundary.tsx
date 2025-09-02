import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    console.error('Error stack:', error.stack);
    console.error('Component stack:', errorInfo.componentStack);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-purple-700 to-purple-900">
          <div className="text-center text-white max-w-2xl mx-auto p-8">
            <h1 className="text-4xl font-bold mb-4">Something went wrong</h1>
            <p className="text-xl mb-4">Please try refreshing the page</p>
            {this.state.error && (
              <details className="mt-4 text-left bg-black/20 p-4 rounded-lg">
                <summary className="cursor-pointer text-orange-400">Show error details</summary>
                <pre className="mt-2 text-sm text-white/80 overflow-auto">
                  {this.state.error.toString()}
                </pre>
                <pre className="mt-2 text-sm text-white/60 overflow-auto">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
