// lib/mdx-components.ts
// Thin re-export layer around components/mdx-components.ts
// Kept deliberately simple to avoid any parsing / TS edge cases.

import { mdxComponents } from "@/components/mdx-components";

export type MdxComponentsMap = typeof mdxComponents;

// Default map you can pass into MDX renderers (next-mdx-remote, etc.)
export const defaultMdxComponents = mdxComponents;

export { mdxComponents };