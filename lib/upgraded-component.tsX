// lib/upgraded-component.ts
import * as React from "react";

/** Merge truthy class strings. */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/** Compose multiple refs (forwardRef helpers). */
export function composeRefs<T>(
  ...refs: Array<React.Ref<T> | undefined>
): React.RefCallback<T> {
  return (value: T) => {
    for (const ref of refs) {
      if (!ref) continue;
      if (typeof ref === "function") ref(value);
      else (ref as React.MutableRefObject<T | null>).current = value;
    }
  };
}

/** Simple memoize-by-key utility. */
export function memoize<K extends string | number, V>(factory: (key: K) => V) {
  const cache = new Map<K, V>();
  return (key: K): V => {
    if (cache.has(key)) return cache.get(key)!;
    const v = factory(key);
    cache.set(key, v);
    return v;
  };
}

/** Merge props safely (className last-wins; style shallow-merged). */
export function mergeProps<
  T extends Record<string, unknown>,
  U extends Record<string, unknown>,
>(a: T, b: U): T & U {
  const out = { ...a, ...b } as T & U;
  const aClass = (a as Record<string, unknown>).className as string | undefined;
  const bClass = (b as Record<string, unknown>).className as string | undefined;
  if (aClass || bClass) {
    (out as Record<string, unknown>).className = cn(aClass, bClass);
  }
  const aStyle = (a as Record<string, unknown>).style as
    | React.CSSProperties
    | undefined;
  const bStyle = (b as Record<string, unknown>).style as
    | React.CSSProperties
    | undefined;
  if (aStyle || bStyle) {
    (out as Record<string, unknown>).style = {
      ...(aStyle || {}),
      ...(bStyle || {}),
    };
  }
  return out;
}

/** Polymorphic types (for components that accept an "as" prop). */
export type ElementTypeProp =
  | keyof JSX.IntrinsicElements
  | React.JSXElementConstructor<any>;

export type PolymorphicProps<E extends ElementTypeProp, P> = P &
  Omit<React.ComponentPropsWithRef<E>, keyof P | "as"> & { as?: E };

export function forwardRefWithAs<P, DefaultTag extends ElementTypeProp = "div">(
  render: <E extends ElementTypeProp = DefaultTag>(
    props: PolymorphicProps<E, P>,
    ref: React.Ref<Element>
  ) => React.ReactElement | null
) {
  return React.forwardRef(render) as <E extends ElementTypeProp = DefaultTag>(
    props: PolymorphicProps<E, P> & { ref?: React.Ref<Element> }
  ) => React.ReactElement | null;
}

/** Client-only wrapper (SSR returns null). */
export const ClientOnly: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ children, fallback = null }) => {
  const [ready, setReady] = React.useState(false);
  React.useEffect(() => setReady(true), []);
  return (ready ? children : fallback) as unknown as React.ReactElement;
};

/** No-op error boundary placeholder (keeps API surface stable). */
export function tryRender(
  nodeFactory: () => React.ReactNode,
  fallback?: React.ReactNode
) {
  try {
    return nodeFactory();
  } catch {
    return fallback ?? null;
  }
}

const api = {
  cn,
  composeRefs,
  memoize,
  mergeProps,
  forwardRefWithAs,
  ClientOnly,
  tryRender,
};

export default api;

