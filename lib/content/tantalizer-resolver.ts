// lib/content/tantalizer-resolver.ts — HARDENED (Intelligence Teaser Logic)

export interface Tantalizer {
  content: string;
  isTruncated: boolean;
  wordCount: number;
}

// Define a local type for Post-like objects
type AnyPost = {
  summary?: string;
  body?: {
    raw?: string;
  };
  content?: string;
  [key: string]: any;
};

/**
 * RESOLVE TANTALIZER
 * A bulletproof extraction engine for strategic teasers.
 * Handles missing body properties and malformed content gracefully.
 */
export function resolveTantalizer(post: AnyPost): Tantalizer {
  // 1. Check for explicit preview/summary fields in MDX frontmatter
  // Use optional chaining to prevent property access on undefined
  const explicitSummary = post?.summary || (post as any)?.preview;

  if (explicitSummary) {
    return {
      content: explicitSummary.trim(),
      isTruncated: true,
      wordCount: explicitSummary.split(/\s+/).filter(Boolean).length,
    };
  }

  // 2. Defensive Extraction: Extract raw body safely
  // post.body?.raw ensures that if 'body' is missing, it returns undefined instead of crashing
  const rawBody = post?.body?.raw || post?.content || "";
  
  // 3. Sanitization Pipeline
  const cleanBody = rawBody
    .replace(/^---[\s\S]*?---/, "") // Remove frontmatter if leaked into body
    .replace(/[#*`_~]/g, "")        // Strip Markdown symbols
    .replace(/\[.*\]\(.*\)/g, "")   // Strip Markdown links
    .replace(/\s+/g, " ")           // Normalize whitespace
    .trim();

  // If the body is effectively empty
  if (!cleanBody) {
    return {
      content: "Strategic briefing content pending initialization.",
      isTruncated: false,
      wordCount: 5,
    };
  }

  // 4. Intelligence Truncation (300 character limit)
  const limit = 300;
  const isTruncated = cleanBody.length > limit;
  const teaser = isTruncated 
    ? cleanBody.slice(0, limit).split(" ").slice(0, -1).join(" ").trim() + "..." 
    : cleanBody;

  return {
    content: teaser,
    isTruncated,
    wordCount: teaser.split(/\s+/).filter(Boolean).length,
  };
}