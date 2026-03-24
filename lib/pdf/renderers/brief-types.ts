/* lib/pdf/renderers/brief-types.ts — INSTITUTIONAL BRIEF TYPE SYSTEM V3.1 */

/**
 * Tones define the semantic background and accent colors for callouts,
 * aligning with the Institutional design tokens (Strategy, Critical, etc.)
 */
export type BriefTone = "note" | "warning" | "strategy" | "success" | "critical";

export type HeadingBlock = {
  type: "heading";
  level: 1 | 2 | 3;
  text: string;
};

export type ParagraphBlock = {
  type: "paragraph";
  text: string;
};

export type ListBlock = {
  type: "list";
  items: string[];
  ordered?: boolean;
};

export type QuoteBlock = {
  type: "quote";
  text: string;
  attribution?: string;
};

export type CalloutBlock = {
  type: "callout";
  title?: string;
  text: string;
  tone?: BriefTone;
};

export type SidebarBlock = {
  type: "sidebar";
  title?: string;
  text: string;
};

export type TableBlock = {
  type: "table";
  headers: string[];
  rows: string[][];
  caption?: string;
};

export type ExhibitBlock = {
  type: "exhibit";
  label: string; // e.g., "Exhibit A"
  title?: string;
  body: string;
};

export type AppendixBlock = {
  type: "appendix";
  title: string;
  body: string;
};

/**
 * DoctrineBlock: Used for the [Surrender] Framework Principles.
 * The 'index' typically holds Roman numerals (I, II, III) or 4D codes.
 */
export type DoctrineBlock = {
  type: "doctrine";
  index: string; 
  title: string;
  body: string;
};

/**
 * EvidenceBlock: Specifically for the Evidence Panels in intelligence briefs.
 */
export type EvidenceBlock = {
  type: "evidence";
  label?: string;
  items: string[];
};

export type DividerBlock = {
  type: "divider";
};

/**
 * Discriminated Union of all possible content blocks within a Brief.
 */
export type BriefBlock =
  | HeadingBlock
  | ParagraphBlock
  | ListBlock
  | QuoteBlock
  | CalloutBlock
  | SidebarBlock
  | TableBlock
  | ExhibitBlock
  | AppendixBlock
  | DoctrineBlock
  | EvidenceBlock
  | DividerBlock;

export type ParsedBriefDocument = {
  blocks: BriefBlock[];
};

/**
 * InlineToken: Used by the renderer to handle markdown-style 
 * formatting (Bold, Italic, Links) within a text string.
 */
export type InlineToken =
  | { type: "text"; value: string }
  | { type: "bold"; value: string }
  | { type: "italic"; value: string }
  | { type: "link"; label: string; href: string };