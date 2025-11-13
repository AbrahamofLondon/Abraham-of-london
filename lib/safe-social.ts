import * as React from "react";

export type SafeRenderProps = {
  children?: React.ReactNode;
  fallback?: React.ReactNode;
};

export function SafeRender({ children, fallback }: SafeRenderProps): JSX.Element {
  if (children === null || typeof children === "undefined") {
    return <>{fallback ?? <div data-safe-fallback />}</>;
  }
  return <>{children}</>;
}

export function withSafeFallback<P>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode
): React.FC<P> {
  const Wrapped: React.FC<P> = (props) => {
    try {
      return (
        <SafeRender fallback={fallback}>
          <Component {...(props as P)} />
        </SafeRender>
      );
    } catch {
      return <>{fallback ?? <div data-safe-fallback-error />}</>;
    }
  };
  Wrapped.displayName = `WithSafeFallback(${Component.displayName || Component.name || "Component"})`;
  return Wrapped;
}