import React, { ComponentType, useState, useEffect } from 'react';

interface SafeComponentProps {
  component: ComponentType<any>;
  fallback?: React.ReactNode;
  [key: string]: any;
}

export const SafeComponentWrapper: React.FC<SafeComponentProps> = ({
  component: Component,
  fallback = null,
  ...props
}) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <>{fallback}</>;
  }

  return <Component {...props} />;
};

// Helper to create safe versions of components
export function makeSafe<T extends object>(Component: ComponentType<T>) {
  return function SafeWrappedComponent(props: T & { fallback?: React.ReactNode }) {
    const { fallback, ...rest } = props;
    return (
      <SafeComponentWrapper
        component={Component}
        fallback={fallback}
        {...rest as any}
      />
    );
  };
}