// components/MDXRenderer.tsx
// Safe MDX renderer wrapper for next-mdx-remote v5.
// Server component by default; accepts serialized MDX and component map.

import React from "react";
import { MDXRemote } from "next-mdx-remote";

export type MDXComponents = Record<string, React.ComponentType<any>>;

// Minimal default shortcodes/components map; extend upstream as needed.
const defaultComponents: MDXComponents = {
  // Example shortcodes:
  // h2: (props) => <h2 className="font-serif text-2xl mt-8 mb-4" {...props} />,
  // Note: keep empty by default to avoid surprising overrides.
};

export interface MDXRendererProps {
  /** The serialized MDX object (result of next-mdx-remote/serialize). */
  source: any;
  /** Optional component override map (merged over defaults). */
  components?: MDXComponents;
  /** Optional className for a wrapping element. */
  className?: string;
  /** If true, wraps content in an article.prose block for typography. */
  prose?: boolean;
}

/**
 * MDXRenderer
 * Usage:
 *   <MDXRenderer source={mdx} components={mdxComponents} prose />
 */
export default function MDXRenderer({
  source,
  components,
  className,
  prose = false,
}: MDXRendererProps) {
  if (!source) {
    return (
      <div className={className}>
        <p className="text-sm text-gray-500">No content.</p>
      </div>
    );
  }

  const merged = { ...defaultComponents, ...(components || {}) };

  const content = <MDXRemote {...source} components={merged} />;

  if (prose) {
    return (
      <article className={["prose prose-lg max-w-none", className].filter(Boolean).join(" ")}>
        {content}
      </article>
    );
    }
  return <div className={className}>{content}</div>;
}