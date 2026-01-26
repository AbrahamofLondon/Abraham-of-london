// components/ErrorBoundary.tsx - PRODUCTION READY
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Mail } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showReset?: boolean;
  showContact?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
      retryCount: 0
    };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({
      error,
      errorInfo
    });

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Log to error tracking service in production
    if (process.env.NODE_ENV === 'production' && this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // You can also send to your error tracking service here
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }

  handleRetry = (): void => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  handleReset = (): void => {
    // Clear local storage or reset app state if needed
    localStorage.removeItem('innerCircleError');
    sessionStorage.clear();
    
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    });
    
    // Optionally reload the page
    window.location.reload();
  };

  override render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              {/* Error Header */}
              <div className="bg-gradient-to-r from-red-50 to-orange-50 p-6 border-b border-red-100">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-8 h-8 text-red-600" />
                  </div>
                </div>
                <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
                  Something went wrong
                </h1>
                <p className="text-center text-gray-600">
                  We apologize for the inconvenience. Our team has been notified.
                </p>
              </div>

              {/* Error Details */}
              <div className="p-6">
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Error Details:</h3>
                    <div className="bg-gray-900 text-red-400 p-4 rounded-lg overflow-auto max-h-40">
                      <pre className="text-xs">
                        {this.state.error.toString()}
                      </pre>
                      {this.state.errorInfo && (
                        <pre className="text-xs mt-2 text-gray-400">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      )}
                    </div>
                  </div>
                )}

                {/* User Message */}
                <div className="mb-6">
                  <p className="text-gray-700 mb-4">
                    This might be due to a temporary issue or an unexpected error in the application.
                  </p>
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      <strong>Tip:</strong> Try refreshing the page or clearing your browser cache if the problem persists.
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={this.handleRetry}
                    className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    <RefreshCw className="w-5 h-5 mr-2" />
                    Try Again {this.state.retryCount > 0 && `(${this.state.retryCount})`}
                  </button>

                  {this.props.showReset && (
                    <button
                      onClick={this.handleReset}
                      className="w-full flex items-center justify-center px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                    >
                      Reset Application
                    </button>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => window.location.href = '/'}
                      className="flex items-center justify-center px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                    >
                      <Home className="w-4 h-4 mr-2" />
                      Go Home
                    </button>

                    {this.props.showContact && (
                      <button
                        onClick={() => window.location.href = '/contact'}
                        className="flex items-center justify-center px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        Contact Support
                      </button>
                    )}
                  </div>
                </div>

                {/* Support Info */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-sm text-gray-600 text-center">
                    Need immediate assistance?{' '}
                    <a
                      href="mailto:support@abrahamoflondon.org"
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Email our support team
                    </a>
                  </p>
                  <p className="text-xs text-gray-500 text-center mt-2">
                    Error ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}
                  </p>
                </div>
              </div>
            </div>

            {/* Technical Info (for debugging) */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 text-center">
                <details className="text-sm text-gray-500">
                  <summary className="cursor-pointer hover:text-gray-700">
                    Technical Information
                  </summary>
                  <div className="mt-2 p-3 bg-gray-100 rounded-lg text-left">
                    <div>
                      <strong>URL:</strong> {window.location.href}
                    </div>
                    <div>
                      <strong>User Agent:</strong> {navigator.userAgent}
                    </div>
                    <div>
                      <strong>Timestamp:</strong> {new Date().toISOString()}
                    </div>
                  </div>
                </details>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

// Hook for functional components
export function useErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null);

  const showError = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  return { error, showError, clearError };
}

// Higher Order Component for error handling
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  return function WithErrorBoundaryWrapper(props: P) {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };
}