// lib/mdx-components.ts
import { mdxComponents as components } from "@/components/mdx";

// Export the named member requested by your previous build attempts
export const mdxComponents = components;

// Export default as required by the Next.js MDX provider pattern
export default function useMDXComponents(currentComponents: any): any {
  return {
    ...currentComponents,
    ...mdxComponents,
  };
}