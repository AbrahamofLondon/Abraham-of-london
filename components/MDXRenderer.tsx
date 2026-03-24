// components/MDXRenderer.tsx
// Safe MDX renderer wrapper using next-contentlayer2.
// Server component by default; accepts MDX source string.

import React from "react";
import { useMDXComponent } from "next-contentlayer2/hooks";

export type MDXComponent = React.ComponentType<Record<string, unknown>>;

// Minimal default shortcodes/components map; extend upstream as needed.
const defaultComponents = {
  // Example shortcodes:
  // h2: (props) => <h2 className="font-serif text-2xl mt-8 mb-4" {...props} />,
  // Note: keep empty by default to avoid surprising overrides.
} as const;

export interface MDXRendererProps {
  /** The MDX source string */
  source: string;
  /** Optional component override map (merged over defaults). */
  components?: Record<string, React.ComponentType<any>>;
  /** Optional className for a wrapping element. */
  className?: string;
  /** If true, wraps content in an article.prose block for typography. */
  prose?: boolean;
}

/**
 * MDXRenderer
 * Usage:
 *   <MDXRenderer source={mdxSource} components={mdxComponents} prose />
 */
export default function MDXRenderer({
  source,
  components,
  className,
  prose = false,
}: MDXRendererProps) {
  const MDXContent = useMDXComponent(source);

  if (!source) {
    return (
      <div className={className}>
        <p className="text-sm text-gray-500">No content.</p>
      </div>
    );
  }

  // Merge components
  const merged = {
    ...defaultComponents,
    ...(components || {})
  };

  const content = MDXContent ? <MDXContent components={merged} /> : null;

  if (prose) {
    return (
      <article
        className={["prose prose-lg max-w-none", className]
          .filter(Boolean)
          .join(" ")}
      >
        {content}
      </article>
    );
  }

  return <div className={className}>{content}</div>;
}