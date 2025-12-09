"use client";

import * as React from "react";
import clsx from "clsx";

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
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundaryCore extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  override state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.props.onError?.(error, errorInfo);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  private renderDefaultFallback(error: Error): React.ReactNode {
    return (
      <div
        role="alert"
        className={clsx(
          "rounded-lg border border-red-200 bg-red-50 p-4 text-red-800",
          this.props.className
        )}
      >
        <h3 className="mb-2 font-semibold">Something went wrong</h3>
        <p className="mb-3 text-sm">
          {process.env.NODE_ENV === "development"
            ? error?.message || "Unknown error."
            : "This component failed to load."}
        </p>
        <button
          type="button"
          onClick={this.reset}
          className="inline-flex items-center rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400"
        >
          Try again
        </button>
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
  const pathname = "";
  return <ErrorBoundaryCore key={pathname} {...props} />;
}
