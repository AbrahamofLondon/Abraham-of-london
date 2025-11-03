// components/MDXRenderer.tsx (FINAL ROBUST FIX)
import * as React from "react";
// ✅ FIX: Import the component map directly from its source file
import mdxComponents from "./mdx-components"; 
// ✅ FIX: Import the type definition for the components map
import type { MDXRemoteProps } from 'next-mdx-remote';
// ✅ FIX: Import the correct hook for contentlayer2
import { useMDXComponent } from "next-contentlayer2/hooks";

// ✅ FIX: Define the 'MdxComponents' type locally as an alias for the prop type
type MdxComponents = MDXRemoteProps['components'];

interface MDXRendererProps {
  code: string;
  components?: MdxComponents;
  [key: string]: unknown;
}

/**
 * Renders MDX content by merging the global component map (mdxComponents)
 * with any page-specific components.
 */
export function MDXRenderer({ code, components = {}, ...rest }: MDXRendererProps) {
  const MDXContent = useMDXComponent(code);

  // Merge the default component map with any page-specific components
  const allComponents = {
    ...mdxComponents,
    ...components,
  };

  return <MDXContent components={allComponents} {...rest} />;
}
