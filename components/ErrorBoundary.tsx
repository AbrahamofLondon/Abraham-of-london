// components/ErrorBoundary.tsx
"use client";

import * as React from "react";
import clsx from "clsx";
import { usePathname } from '...';

/* ============================================================================
   Types
   ============================================================================ */

export interface ErrorBoundaryRenderProps {
  error: Error;
  reset: () => void;
}

export interface ErrorBoundaryProps {
  /** Children to protect with the boundary */
  children: React.ReactNode;

  /**
   * Static fallback content when an error occurs.
   * If both `fallback` and `fallbackRender` are provided, `fallbackRender` wins.
   */
  fallback?: React.ReactNode;

  /**
   * Function that renders a fallback UI when an error occurs.
   * Receives `{ error, reset }`.
   */
  fallbackRender?: (props: ErrorBoundaryRenderProps) => React.ReactNode;

  /** Called when an error is caught */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;

  /** Called when the boundary is reset (e.g., user clicks "Try again") */
  onReset?: () => void;

  /**
   * Optional className applied to the default fallback wrapper.
   * Ignored if you supply your own fallback or fallbackRender.
   */
  className?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/* ============================================================================
   Core class boundary (required for React error boundaries)
   NOTE: With "noImplicitOverride": true, members that override base class
   members must include the `override` modifier.
   ============================================================================ */

class ErrorBoundaryCore extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  override state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log somewhere (Sentry/Datadog/etc.) if desired
    // console.error("ErrorBoundary caught:", error, errorInfo);
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
          this.props.className,
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

/* ============================================================================
   Wrapper to auto-reset on route changes (App Router)
   ============================================================================ */

export default function ErrorBoundary(
  props: ErrorBoundaryProps,
): React.JSX.Element {
  // When the route (pathname) changes, we remount the core boundary via key,
  // which resets any previous error state automatically.
  const pathname = usePathname() || "";
  return <ErrorBoundaryCore key={pathname} {...props} />;
}

/* ============================================================================
   Usage example (for reference)
   ----------------------------------------------------------------------------
   <ErrorBoundary
     fallbackRender={({ error, reset }) => (
       <MyFancyFallback error={error} onRetry={reset} />
     )}
     onError={(err, info) => reportError(err, info)}
     onReset={() => console.log("Boundary reset")}
   >
     <YourComponent />
   </ErrorBoundary>
   ============================================================================ */
