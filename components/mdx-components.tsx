// components/mdx-components.tsx
import * as React from "react";

// ——— Core passthroughs you actually use in MDX ———
export const Grid: React.FC<React.PropsWithChildren<{ cols?: string; className?: string }>> = ({
  cols = "grid-cols-2",
  className = "",
  children,
}) => <div className={`grid ${cols} gap-6 ${className}`}>{children}</div>;

// If your MDX uses a Title component, define it here (safer than bare {title} vars)
export const Title: React.FC<React.PropsWithChildren> = ({ children }) => (
  <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">{children}</h1>
);

// Add any other MDX-only components you reference in posts (Card, Note, Rule, etc.)
export const Card: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ className="", children }) => (
  <div className={`rounded-2xl border p-4 md:p-6 ${className}`}>{children}</div>
);

// Map for next-mdx-remote
const mdxComponentMap = {
  Grid,
  Title,
  Card,
};

export type MdxComponentMap = typeof mdxComponentMap;

// Export BOTH default and named for flexibility
export default mdxComponentMap;
export const MDXComponents = mdxComponentMap;
