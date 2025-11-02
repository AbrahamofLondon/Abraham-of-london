// app/mdx-components.tsx
import type { MDXComponents } from "mdx/types";
import PullLine from "@/components/mdx/PullLine";
import Verse from "@/components/mdx/Verse";
import Rule from "@/components/mdx/Rule";
import Note from "@/components/mdx/Note";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    // Custom tags (usable directly in MDX)
    PullLine,
    Verse,
    Rule,
    Note,
    // Preserve/extend any passed-in components
    ...components,
  };
}
