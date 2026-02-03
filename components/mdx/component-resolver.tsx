// components/mdx/component-resolver.tsx
import * as React from "react";
import { MissingComponent } from "./MissingComponent";

// Cache for loaded components
const componentCache = new Map<string, React.ComponentType<any>>();

export async function getComponent(
  componentName: string
): Promise<React.ComponentType<any>> {
  if (componentCache.has(componentName)) {
    return componentCache.get(componentName)!;
  }

  try {
    const imported = await import(`@/components/mdx/${componentName}`);
    
    // FIX: Handle both default and named exports properly
    let Component: React.ComponentType<any>;
    
    if (typeof imported.default === 'function') {
      Component = imported.default;
    } else if (typeof imported[componentName] === 'function') {
      // Try named export matching componentName
      Component = imported[componentName];
    } else if (typeof imported === 'function') {
      Component = imported;
    } else {
      // If no valid component found, throw
      throw new Error(`No valid component found in module ${componentName}`);
    }

    // FIX: Ensure Component is actually a React component
    // and not an object or other invalid value
    if (typeof Component !== 'function') {
      throw new Error(`Exported value is not a valid React component: ${componentName}`);
    }

    componentCache.set(componentName, Component);
    return Component;
  } catch (error) {
    console.error(`Failed to load component ${componentName}:`, error);

    // FIX: Return a properly structured fallback component
    const Fallback: React.FC<any> = React.memo((props) => (
      <MissingComponent componentName={componentName} {...props} />
    ));
    Fallback.displayName = `Fallback(${componentName})`;

    componentCache.set(componentName, Fallback);
    return Fallback;
  }
}

// FIX: Simplify the dynamic component - no async loading during render
export function createDynamicComponent(componentName: string): React.FC<any> {
  const DynamicComponent: React.FC<any> = React.memo((props) => {
    const [Component, setComponent] = React.useState<React.ComponentType<any> | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
      let mounted = true;

      const loadComponent = async () => {
        try {
          const C = await getComponent(componentName);
          if (mounted) {
            setComponent(() => C);
          }
        } catch (error) {
          console.error(`Error loading component ${componentName}:`, error);
        } finally {
          if (mounted) {
            setIsLoading(false);
          }
        }
      };

      loadComponent();

      return () => {
        mounted = false;
      };
    }, []);

    // FIX: During SSR or initial render, return a placeholder
    // instead of trying to render a loading component that might break
    if (isLoading || !Component) {
      // Return null during SSR/initial render to avoid hydration mismatch
      // or return a simple span for client-side loading
      if (typeof window === 'undefined') {
        return null; // SSR - don't render anything
      }
      return <span data-mdx-loading={componentName} style={{ display: 'none' }} />;
    }

    // FIX: Ensure Component is actually callable
    try {
      return React.createElement(Component, props);
    } catch (error) {
      console.error(`Error rendering component ${componentName}:`, error);
      return <MissingComponent componentName={componentName} {...props} />;
    }
  });

  DynamicComponent.displayName = `DynamicComponent(${componentName})`;
  return DynamicComponent;
}

// FIX: Add a simpler synchronous resolver for static builds
export function getComponentSync(componentName: string): React.ComponentType<any> | null {
  // During static generation, we need to handle components differently
  // This is a simplified version that doesn't do dynamic imports
  
  // Check cache first
  if (componentCache.has(componentName)) {
    return componentCache.get(componentName)!;
  }
  
  // For static builds, we might need to pre-load all components
  // or use a different strategy. For now, return null.
  return null;
}