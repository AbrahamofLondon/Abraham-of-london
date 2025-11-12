import React from 'react';

// Error boundary for fallback components
class FallbackErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.warn('Fallback component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <div data-fallback-error />;
    }
    return this.props.children;
  }
}

// Safe wrapper for any component
export const withFallback = <P extends object>(
  Component: React.ComponentType<P>,
  Fallback: React.ComponentType<P> = () => <div data-safe-fallback />
) => {
  return (props: P) => (
    <FallbackErrorBoundary
      fallback={<Fallback {...props} />}
    >
      <Component {...props} />
    </FallbackErrorBoundary>
  );
};

// Comprehensive fallback implementations
export const safeFallbacks = {
  // Theme fallback
  useTheme: () => {
    try {
      // Try to use next-themes if available
      const { useTheme } = require('next-themes');
      return useTheme();
    } catch {
      return {
        theme: 'light',
        setTheme: () => console.warn('Theme not available'),
        resolvedTheme: 'light',
        systemTheme: 'light'
      };
    }
  },

  // Router fallback
  useRouter: () => {
    try {
      const { useRouter } = require('next/navigation');
      return useRouter();
    } catch {
      return {
        push: (path: string) => {
          console.warn('Router not available, would navigate to:', path);
          if (typeof window !== 'undefined') window.location.href = path;
        },
        pathname: '/',
        query: {},
        asPath: '/'
      };
    }
  },

  // Motion fallback with safe components
  motion: {
    div: withFallback(
      ({ children, ...props }: any) => React.createElement('div', props, children),
      ({ children, ...props }: any) => React.createElement('div', props, children)
    ),
    span: withFallback(
      ({ children, ...props }: any) => React.createElement('span', props, children),
      ({ children, ...props }: any) => React.createElement('span', props, children)
    ),
    // Add other motion elements as needed
  },

  // MDX components fallback
  mdx: {
    wrapper: ({ children }: any) => <div className="mdx-fallback-wrapper">{children}</div>,
    p: ({ children }: any) => <p className="mdx-fallback-p">{children}</p>,
    h1: ({ children }: any) => <h1 className="mdx-fallback-h1">{children}</h1>,
    h2: ({ children }: any) => <h2 className="mdx-fallback-h2">{children}</h2>,
    h3: ({ children }: any) => <h3 className="mdx-fallback-h3">{children}</h3>,
  },

  // ContentLayer fallbacks
  contentlayer: {
    allPosts: [],
    allBooks: [],
    allResources: [],
    allEvents: [],
    allDownloads: [],
    allPrints: []
  }
};

// Safe import function
export const safeImport = async <T>(importFn: () => Promise<T>, fallback: T): Promise<T> => {
  try {
    return await importFn();
  } catch (error) {
    console.warn('Safe import fallback triggered:', error);
    return fallback;
  }
};

// Safe require function
export const safeRequire = <T>(modulePath: string, fallback: T): T => {
  try {
    return require(modulePath);
  } catch (error) {
    console.warn(`Safe require fallback for ${modulePath}:`, error);
    return fallback;
  }
};

export default safeFallbacks;