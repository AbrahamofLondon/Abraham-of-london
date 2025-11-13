// lib/safe-fallbacks.tsx
import * as React from "react";

export function withSafeFallback<P>(
  Component: React.ComponentType<P>,
  Fallback?: React.ComponentType<P>,
) {

/**
 * Wrap a component so it never explodes the tree.
 * If render throws, it shows a minimal fallback instead.
 */
export function withSafeFallback<P>(
  Component: React.ComponentType<P>,
  fallback?: SafeFallback
): React.ComponentType<P> {
  const Wrapped: React.FC<P> = (props: P) => {
    try {
      return React.createElement(Component as React.ComponentType<P>, props);
    } catch {
      return (fallback as React.ReactElement) ?? React.createElement(DefaultFallback);
    }
  };
  Wrapped.displayName = `WithSafeFallback(${
    (Component as React.ComponentType & { displayName?: string }).displayName ||
    Component.name ||
    "Component"
  })`;
  return Wrapped;
}

/**
 * Render a child element safely. If building the element fails,
 * return the provided fallback (or a minimal default).
 */
export function renderSafely<P extends Record<string, unknown>>(
  Comp: React.ComponentType<P>,
  props: P,
  fallback?: SafeFallback
): React.ReactElement {
  try {
    return React.createElement(Comp, props);
  } catch {
    return (fallback as React.ReactElement) ?? React.createElement(DefaultFallback);
  }
}

/**
 * A tiny safe element creator for primitives – no JSX needed.
 */
export function el<K extends keyof JSX.IntrinsicElements>(
  tag: K,
  props?: JSX.IntrinsicElements[K] | null,
  ...children: React.ReactNode[]
): React.ReactElement {
  return React.createElement(tag, props ?? null, ...children);
}

/**
 * A prebuilt safe boundary you can drop around risky children.
 */
export const SafeBoundary: React.FC<{
  children: React.ReactNode;
  fallback?: SafeFallback;
}> = ({ children, fallback }) => {
  try {
    return <>{children}</> as unknown as React.ReactElement; // ok in .ts since it compiles via react-jsx
  } catch {
    return (fallback as React.ReactElement) ?? React.createElement(DefaultFallback);
  }
};