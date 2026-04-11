/* lib/pdf/renderers/brief-types.ts — INSTITUTIONAL BRIEF TYPE SYSTEM V4.0
   ---------------------------------------------------------------------------
   Canonical type system for premium brief parsing and PDF rendering.
   Rebuilt to align with the upgraded parser and block renderer.
   --------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------- */
/* Semantic Tones                                                             */
/* -------------------------------------------------------------------------- */

export type BriefTone =
  | "note"
  | "warning"
  | "strategy"
  | "success"
  | "critical";

/* -------------------------------------------------------------------------- */
/* Core Block Types                                                           */
/* -------------------------------------------------------------------------- */

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
  label: string;
  title?: string;
  body: string;
};

export type AppendixBlock = {
  type: "appendix";
  title: string;
  body: string;
};

export type DoctrineBlock = {
  type: "doctrine";
  index: string;
  title: string;
  body: string;
};

export type EvidenceBlock = {
  type: "evidence";
  label?: string;
  items: string[];
};

export type DividerBlock = {
  type: "divider";
};

/* -------------------------------------------------------------------------- */
/* Discriminated Union                                                        */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/* Inline Tokens                                                              */
/* -------------------------------------------------------------------------- */

export type InlineTextToken = {
  type: "text";
  value: string;
};

export type InlineBoldToken = {
  type: "bold";
  value: string;
};

export type InlineItalicToken = {
  type: "italic";
  value: string;
};

export type InlineLinkToken = {
  type: "link";
  label: string;
  href: string;
};

export type InlineToken =
  | InlineTextToken
  | InlineBoldToken
  | InlineItalicToken
  | InlineLinkToken;

/* -------------------------------------------------------------------------- */
/* Type Guards                                                                */
/* -------------------------------------------------------------------------- */

export function isHeadingBlock(block: BriefBlock): block is HeadingBlock {
  return block.type === "heading";
}

export function isParagraphBlock(block: BriefBlock): block is ParagraphBlock {
  return block.type === "paragraph";
}

export function isListBlock(block: BriefBlock): block is ListBlock {
  return block.type === "list";
}

export function isQuoteBlock(block: BriefBlock): block is QuoteBlock {
  return block.type === "quote";
}

export function isCalloutBlock(block: BriefBlock): block is CalloutBlock {
  return block.type === "callout";
}

export function isSidebarBlock(block: BriefBlock): block is SidebarBlock {
  return block.type === "sidebar";
}

export function isTableBlock(block: BriefBlock): block is TableBlock {
  return block.type === "table";
}

export function isExhibitBlock(block: BriefBlock): block is ExhibitBlock {
  return block.type === "exhibit";
}

export function isAppendixBlock(block: BriefBlock): block is AppendixBlock {
  return block.type === "appendix";
}

export function isDoctrineBlock(block: BriefBlock): block is DoctrineBlock {
  return block.type === "doctrine";
}

export function isEvidenceBlock(block: BriefBlock): block is EvidenceBlock {
  return block.type === "evidence";
}

export function isDividerBlock(block: BriefBlock): block is DividerBlock {
  return block.type === "divider";
}

/* -------------------------------------------------------------------------- */
/* Safe Constructors                                                          */
/* -------------------------------------------------------------------------- */

function safeString(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value.trim() || fallback;
  if (value === null || value === undefined) return fallback;
  return String(value).trim() || fallback;
}

function safeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => safeString(item))
    .filter(Boolean);
}

export function makeParagraphBlock(text: unknown): ParagraphBlock {
  return {
    type: "paragraph",
    text: safeString(text),
  };
}

export function makeHeadingBlock(
  level: unknown,
  text: unknown,
): HeadingBlock {
  const rawLevel = Number(level);
  const normalizedLevel: 1 | 2 | 3 =
    rawLevel === 1 || rawLevel === 2 || rawLevel === 3 ? rawLevel : 2;

  return {
    type: "heading",
    level: normalizedLevel,
    text: safeString(text),
  };
}

export function makeListBlock(
  items: unknown,
  ordered = false,
): ListBlock {
  return {
    type: "list",
    items: safeStringArray(items),
    ordered,
  };
}

export function makeCalloutBlock(
  text: unknown,
  options?: {
    title?: unknown;
    tone?: BriefTone;
  },
): CalloutBlock {
  return {
    type: "callout",
    text: safeString(text),
    title: safeString(options?.title) || undefined,
    tone: options?.tone,
  };
}

export function makeTableBlock(
  headers: unknown,
  rows: unknown,
  caption?: unknown,
): TableBlock {
  const safeHeaders = safeStringArray(headers);
  const safeRows = Array.isArray(rows)
    ? rows.map((row) => safeStringArray(row))
    : [];

  return {
    type: "table",
    headers: safeHeaders,
    rows: safeRows,
    caption: safeString(caption) || undefined,
  };
}