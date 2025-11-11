// components/FontErrorBoundary.tsx
"use client";

import * as React from "react";

interface FontErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: { componentStack: string }) => void;
}

interface FontErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

/**
 * Lightweight client-only “font error boundary”.
 * Listens for window error + unhandledrejection and switches to a soft fallback UI
 * when a font-related error is detected (keywords in message/name).
 *
 * Note: This is not a React class error boundary; it’s purpose-built for font loading.
 */
export default function FontErrorBoundary({
  children,
  fallback,
  onError,
}: FontErrorBoundaryProps): React.JSX.Element {
  const [state, setState] = React.useState<FontErrorBoundaryState>({
    hasError: false,
  });

  React.useEffect(() => {
    // Guard: Only in browser
    if (typeof window === "undefined") return;

    const looksLikeFontError = (msg?: unknown, name?: unknown) => {
      const m = String(msg || "").toLowerCase();
      const n = String(name || "").toLowerCase();
      return (
        m.includes("font") ||
        m.includes("fontload") ||
        m.includes("font-face") ||
        n.includes("font") ||
        n.includes("fontload")
      );
    };

    const handleError = (event: ErrorEvent) => {
      if (looksLikeFontError(event.message, event.error?.name)) {
        const err =
          event.error instanceof Error
            ? event.error
            : new Error(event.message || "Font loading error");
        setState({ hasError: true, error: err });
        onError?.(err, { componentStack: err.stack ?? "" });
      }
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason: unknown = event.reason;
      const message =
        (typeof reason?.message === "string" && reason.message) ||
        (typeof reason === "string" ? reason : "");
      const name =
        (typeof reason?.name === "string" && reason.name) || undefined;

      if (looksLikeFontError(message, name)) {
        const err =
          reason instanceof Error
            ? reason
            : new Error(message || "Font loading error");
        setState({ hasError: true, error: err });
        onError?.(err, { componentStack: err.stack ?? "" });
      }
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, [onError]);

  if (state.hasError) {
    return (
      <>
        {fallback ?? (
          <div className="p-4 border border-orange-300 bg-orange-50 rounded-lg text-orange-800">
            <h3 className="font-bold mb-2">Font Loading Issue</h3>
            <p className="text-sm">
              Custom fonts failed to load. Falling back to system fonts.
            </p>
          </div>
        )}
        {/* Still render children so the page remains usable with fallback fonts */}
        {children}
      </>
    );
  }

  return <>{children}</>;
}
