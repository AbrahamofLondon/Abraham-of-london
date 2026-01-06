// components/mdx/component-resolver.ts
import * as React from "react";
import { createDynamicComponent as componentResolver } from "./mdx/component-resolver";
import { MissingComponent } from "./MissingComponent";

// Cache for loaded components
const componentCache = new Map<string, React.ComponentType<any>>();

// Accept only safe JS identifier-ish names: Quote, Callout, PullLine, etc.
const SAFE_NAME = /^[A-Za-z][A-Za-z0-9_-]*$/;

function isSafeComponentName(name: string): boolean {
  return SAFE_NAME.test(name) && !name.includes(".") && !name.includes("/") && !name.includes("\\");
}

function makeFallback(componentName: string): React.ComponentType<any> {
  const Fallback: React.FC<any> = (props) => (
    <MissingComponent componentName={componentName} {...props} />
  );
  Fallback.displayName = `Missing(${componentName})`;
  return Fallback;
}

export async function getComponent(componentName: string): Promise<React.ComponentType<any>> {
  if (!componentName || typeof componentName !== "string" || !isSafeComponentName(componentName)) {
    const bad = String(componentName || "");
    const fb = makeFallback(bad || "Unknown");
    componentCache.set(bad || "Unknown", fb);
    return fb;
  }

  const cached = componentCache.get(componentName);
  if (cached) return cached;

  try {
    // Important: componentName must be a module basename WITHOUT extension
    // e.g. "@/components/mdx/Quote" -> should resolve Quote.tsx / Quote.ts
    const imported = await import(`@/components/mdx/${componentName}`);

    const Component =
      (imported as any)?.default ||
      (imported as any)?.[componentName] ||
      (imported as any);

    if (!Component) {
      const fb = makeFallback(componentName);
      componentCache.set(componentName, fb);
      return fb;
    }

    componentCache.set(componentName, Component);
    return Component;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Failed to load component ${componentName}:`, error);

    const fb = makeFallback(componentName);
    componentCache.set(componentName, fb);
    return fb;
  }
}

export function createDynamicComponent(componentName: string): React.FC<any> {
  const DynamicComponent: React.FC<any> = (props) => {
    const [Component, setComponent] = React.useState<React.ComponentType<any>>(() =>
      makeFallback(componentName),
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
      // componentName is stable per instance
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return <Component {...props} />;
  };

  DynamicComponent.displayName = `DynamicComponent(${componentName})`;
  return DynamicComponent;
}

export default function componentResolver(name: string) {
  // optional convenience export if you call componentResolver("Quote")
  return createDynamicComponent(name);
}