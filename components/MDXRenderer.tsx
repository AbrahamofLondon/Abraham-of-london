// components/MDXRenderer.tsx
// Safe MDX renderer wrapper for next-mdx-remote v5.
// Server component by default; accepts serialized MDX and component map.

import React from "react";
import { MDXRemote } from "next-mdx-remote/rsc";
import type { MDXRemoteProps } from "next-mdx-remote/rsc";

export type MDXComponent = React.ComponentType<Record<string, unknown>>;

// Minimal default shortcodes/components map; extend upstream as needed.
const defaultComponents = {
  // Example shortcodes:
  // h2: (props) => <h2 className="font-serif text-2xl mt-8 mb-4" {...props} />,
  // Note: keep empty by default to avoid surprising overrides.
} as const satisfies MDXRemoteProps['components'];

export interface MDXRendererProps {
  /** The MDX source string (use next-mdx-remote/serialize for older API). */
  source: string;
  /** Optional component override map (merged over defaults). */
  components?: MDXRemoteProps['components'];
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
  if (!source) {
    return (
      <div className={className}>
        <p className="text-sm text-gray-500">No content.</p>
      </div>
    );
  }

  // Merge components with type assertion
  const merged = {
    ...defaultComponents,
    ...(components || {})
  } as MDXRemoteProps['components'];

  const content = <MDXRemote source={source} components={merged} />;

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