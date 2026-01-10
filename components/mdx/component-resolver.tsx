// components/mdx/component-resolver.ts
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
    const Component = (imported as any).default || imported;

    componentCache.set(componentName, Component);
    return Component;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Failed to load component ${componentName}:`, error);

    const Fallback: React.FC<any> = (props) => (
      <MissingComponent componentName={componentName} {...props} />
    );
    Fallback.displayName = `Fallback(${componentName})`;

    componentCache.set(componentName, Fallback);
    return Fallback;
  }
}

export function createDynamicComponent(componentName: string): React.FC<any> {
  const DynamicComponent: React.FC<any> = (props) => {
    const [Component, setComponent] = React.useState<React.ComponentType<any>>(
      () => {
        const InitialComponent: React.FC<any> = (innerProps) => (
          <MissingComponent componentName={componentName} {...innerProps} />
        );
        InitialComponent.displayName = `InitialComponent(${componentName})`;
        return InitialComponent;
      }
    );

    React.useEffect(() => {
      let alive = true;

      getComponent(componentName).then((C) => {
        if (!alive) return;
        setComponent(() => C);
      });

      return () => {
        alive = false;
      };
    }, []); // Empty dependency array - componentName is static per component instance

    return <Component {...props} />;
  };

  DynamicComponent.displayName = `DynamicComponent(${componentName})`;
  return DynamicComponent;
}

