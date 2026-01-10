"use client";

import * as React from "react";
import clsx from "clsx";
import { AlertTriangle, RefreshCw, XCircle } from "lucide-react";

export interface ErrorBoundaryRenderProps {
  error: Error;
  reset: () => void;
}

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  fallbackRender?: (props: ErrorBoundaryRenderProps) => React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  onReset?: () => void;
  className?: string;
  showReset?: boolean;
  errorType?: "pdf" | "dashboard" | "system" | "api";
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorCount: number;
}

class ErrorBoundaryCore extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  override state: ErrorBoundaryState = { 
    hasError: false, 
    error: null,
    errorCount: 0 
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { 
      hasError: true, 
      error,
      errorCount: 1 
    };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Increment error count on repeated errors
    this.setState(prev => ({ 
      errorCount: prev.errorCount + 1 
    }));
    
    // Log to console and call custom handler
    console.error("Dashboard Error:", error, errorInfo);
    this.props.onError?.(error, errorInfo);
    
    // Log to analytics if in production
    if (process.env.NODE_ENV === "production") {
      this.logErrorToAnalytics(error);
    }
  }

  private logErrorToAnalytics(error: Error) {
    // Implement your analytics logging here
    console.log("Analytics log:", {
      error: error.message,
      stack: error.stack?.substring(0, 200),
      component: "PDFDashboard",
      timestamp: new Date().toISOString(),
    });
  }

  reset = () => {
    this.setState({ 
      hasError: false, 
      error: null,
      errorCount: 0 
    });
    this.props.onReset?.();
  };

  private getErrorStyle(errorType?: string) {
    switch (errorType) {
      case "pdf":
        return "border-amber-200 bg-amber-50 text-amber-800";
      case "api":
        return "border-blue-200 bg-blue-50 text-blue-800";
      case "system":
        return "border-purple-200 bg-purple-50 text-purple-800";
      default:
        return "border-red-200 bg-red-50 text-red-800";
    }
  }

  private renderDefaultFallback(error: Error): React.ReactNode {
    const { errorType = "dashboard", showReset = true } = this.props;
    const errorStyle = this.getErrorStyle(errorType);

    return (
      <div
        role="alert"
        className={clsx(
          "rounded-xl border p-6 shadow-sm",
          errorStyle,
          this.props.className
        )}
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            {errorType === "pdf" ? (
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            ) : errorType === "api" ? (
              <XCircle className="h-5 w-5 text-blue-600" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600" />
            )}
          </div>
          
          <div className="flex-1">
            <h3 className="mb-2 font-bold text-lg">
              {errorType === "pdf" ? "PDF Processing Error" : 
               errorType === "api" ? "API Connection Issue" : 
               "Something went wrong"}
            </h3>
            
            <p className="mb-3 text-sm opacity-90">
              {process.env.NODE_ENV === "development" || errorType === "pdf"
                ? error?.message || "Unknown error occurred."
                : "This component failed to load. Our team has been notified."}
            </p>
            
            {error.stack && process.env.NODE_ENV === "development" && (
              <details className="mb-3">
                <summary className="text-xs cursor-pointer opacity-70">
                  Technical Details
                </summary>
                <pre className="mt-2 text-xs p-3 bg-black/5 rounded overflow-auto max-h-32">
                  {error.stack}
                </pre>
              </details>
            )}
            
            {this.state.errorCount > 1 && (
              <div className="text-xs opacity-70 mb-3">
                This error has occurred {this.state.errorCount} time(s).
              </div>
            )}

            <div className="flex items-center gap-3">
              {showReset && (
                <button
                  type="button"
                  onClick={this.reset}
                  className={clsx(
                    "inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium transition-all",
                    errorType === "pdf" 
                      ? "bg-amber-600 text-white hover:bg-amber-700"
                      : errorType === "api"
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-red-600 text-white hover:bg-red-700"
                  )}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try again
                </button>
              )}
              
              {errorType === "pdf" && (
                <button
                  type="button"
                  onClick={() => {
                    // Custom logic for PDF errors
                    window.dispatchEvent(new CustomEvent('pdf-error-retry'));
                    this.reset();
                  }}
                  className="rounded-lg border border-amber-300 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100"
                >
                  Reload PDF Engine
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  override render(): React.ReactNode {
    const { hasError, error } = this.state;

    if (hasError && error) {
      if (this.props.fallbackRender) {
        return this.props.fallbackRender({ error, reset: this.reset });
      }
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return this.renderDefaultFallback(error);
    }

    return this.props.children;
  }
}

export default function ErrorBoundary(
  props: ErrorBoundaryProps
): React.JSX.Element {
  // Use current path as key to reset on navigation
  const [pathname, setPathname] = React.useState("");
  
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setPathname(window.location.pathname);
    }
  }, []);

  return <ErrorBoundaryCore key={pathname} {...props} />;
}
