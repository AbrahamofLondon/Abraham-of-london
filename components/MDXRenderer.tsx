// components/MDXRenderer.tsx
import * as React from "react";
// Import the default components map and its type
import { mdxComponents, MdxComponents } from "./MdxComponents";

// IMPORTANT: the correct hook import for contentlayer2:
import { useMDXComponent } from "next-contentlayer2/hooks";

type MDXRendererProps = {
  /** MDX code from Contentlayer's computed .body.code */
  code: string;
  /** Optional: extra component overrides provided by the consuming page */
  components?: Partial<MdxComponents>;
};

export default function MDXRenderer({ code, components }: MDXRendererProps) {
  // Compiles the MDX code string into a React component
  const MDX = useMDXComponent(code);

  // Merge the default components with any overrides provided by the page
  const mergedComponents = {
    ...mdxComponents,
    ...components,
  };

  // Render the compiled MDX content with the merged components map
  return <MDX components={mergedComponents} />;
}

// Add display name to satisfy the 'react/display-name' rule
MDXRenderer.displayName = 'MDXRenderer';