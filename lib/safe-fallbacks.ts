// lib/safe-fallbacks.ts
import React from "react";

// Error boundary for fallback components
type FallbackErrorBoundaryProps = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

type FallbackErrorBoundaryState = {
  hasError: boolean;
};

class FallbackErrorBoundary extends React.Component<
  FallbackErrorBoundaryProps,
  FallbackErrorBoundaryState
> {
  constructor(props: FallbackErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.warn("Fallback component error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <div data-fallback-error />;
    }
    return this.props.children;
  }
}

// Safe wrapper for any component
export function withFallback<P extends object>(
  Component: React.ComponentType<P>,
  Fallback?: React.ComponentType<P>
) {
  const SafeFallback: React.ComponentType<P> =
    Fallback ??
    ((() => <div data-safe-fallback />) as React.ComponentType<P>);

  const Wrapped: React.FC<P> = (props: P) => (
    <FallbackErrorBoundary fallback={<SafeFallback {...props} />}>
      <Component {...props} />
    </FallbackErrorBoundary>
  );

  Wrapped.displayName = `WithFallback(${
    (Component as any).displayName || Component.name || "Component"
  })`;

  return Wrapped;
}

// Comprehensive fallback implementations
export const safeFallbacks = {
  // Theme fallback
  useTheme: () => {
    try {
      // Try to use next-themes if available
      // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
      const { useTheme } = require("next-themes");
      return useTheme();
    } catch {
      return {
        theme: "light",
        setTheme: () => console.warn("Theme not available"),
        resolvedTheme: "light",
        systemTheme: "light",
      };
    }
  },

  // Router fallback
  useRouter: () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
      const { useRouter } = require("next/navigation");
      return useRouter();
    } catch {
      return {
        push: (path: string) => {
          console.warn("Router not available, would navigate to:", path);
          if (typeof window !== "undefined") window.location.href = path;
        },
        pathname: "/",
        query: {} as Record<string, unknown>,
        asPath: "/",
      };
    }
  },

  // Motion fallback with safe components
  motion: {
    div: withFallback(
      ({ children, ...props }: { children?: React.ReactNode }) =>
        React.createElement("div", props, children),
      ({ children, ...props }: { children?: React.ReactNode }) =>
        React.createElement("div", props, children)
    ),
    span: withFallback(
      ({ children, ...props }: { children?: React.ReactNode }) =>
        React.createElement("span", props, children),
      ({ children, ...props }: { children?: React.ReactNode }) =>
        React.createElement("span", props, children)
    ),
    // Add other motion elements as needed
  },

  // MDX components fallback
  mdx: {
    wrapper: ({ children }: { children?: React.ReactNode }) => (
      <div className="mdx-fallback-wrapper">{children}</div>
    ),
    p: ({ children }: { children?: React.ReactNode }) => (
      <p className="mdx-fallback-p">{children}</p>
    ),
    h1: ({ children }: { children?: React.ReactNode }) => (
      <h1 className="mdx-fallback-h1">{children}</h1>
    ),
    h2: ({ children }: { children?: React.ReactNode }) => (
      <h2 className="mdx-fallback-h2">{children}</h2>
    ),
    h3: ({ children }: { children?: React.ReactNode }) => (
      <h3 className="mdx-fallback-h3">{children}</h3>
    ),
  },

  // ContentLayer fallbacks
  contentlayer: {
    allPosts: [] as unknown[],
    allBooks: [] as unknown[],
    allResources: [] as unknown[],
    allEvents: [] as unknown[],
    allDownloads: [] as unknown[],
    allPrints: [] as unknown[],
  },
};

// Safe import function
export async function safeImport<T>(
  importFn: () => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    return await importFn();
  } catch (error) {
    console.warn("Safe import fallback triggered:", error);
    return fallback;
  }
}

// Safe require function
export function safeRequire<T>(modulePath: string, fallback: T): T {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
    return require(modulePath);
  } catch (error) {
    console.warn(`Safe require fallback for ${modulePath}:`, error);
    return fallback;
  }
}

export default safeFallbacks;