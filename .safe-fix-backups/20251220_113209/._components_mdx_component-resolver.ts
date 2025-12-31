// components/mdx/component-resolver.ts
import * as React from "react";
import { MissingComponent } from "./MissingComponent";

// Type for component imports
type ComponentModule = { default: React.ComponentType<any> } | React.ComponentType<any>;

// Cache for loaded components
const componentCache = new Map<string, React.ComponentType<any>>();

// Function to dynamically import components
export async function getComponent(
  componentName: string
): Promise<React.ComponentType<any>> {
  // Check cache first
  if (componentCache.has(componentName)) {
    return componentCache.get(componentName)!;
  }

  try {
    // Try to import the component
    const module = await import(`@/components/mdx/${componentName}`);
    const Component = module.default || module;
    
    // Cache it
    componentCache.set(componentName, Component);
    return Component;
  } catch (error) {
    // Return a fallback component
    const Fallback: React.FC<any> = (props) => (
      <MissingComponent componentName={componentName} {...props} />
    );
    
    componentCache.set(componentName, Fallback);
    return Fallback;
  }
}

// Create a component that loads dynamically
export function createDynamicComponent(componentName: string): React.FC<any> {
  return function DynamicComponent(props) {
    const [Component, setComponent] = React.useState<React.ComponentType<any>>(() => {
      return () => <MissingComponent componentName={componentName} {...props} />;
    });

    React.useEffect(() => {
      getComponent(componentName).then(setComponent);
    }, [componentName]);

    return <Component {...props} />;
  };
}
