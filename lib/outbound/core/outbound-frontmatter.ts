/**
 * lib/outbound/core/outbound-frontmatter.ts
 *
 * ONE shared outbound frontmatter parser for all providers (facebook, x, linkedin).
 *
 * Requirements:
 *  - Handles LF and CRLF
 *  - Validates required fields
 *  - Normalises booleans safely
 *  - Normalises dates
 *  - Handles arrays consistently
 *  - Preserves body text
 *  - Strips frontmatter from post body
 *  - Works for facebook, x, linkedin
 *  - Produces one common OutboundContentItem shape
 *
 * Server-only — do NOT import into client components.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

// ─── Types ────────────────────────────────────────────────────────────────────

export type OutboundProvider = "facebook" | "x" | "linkedin";

export type OutboundContentItem = {
  /** Stable unique ID from frontmatter or derived from filename. */
  id: string;
  provider: OutboundProvider;
  /** Filename without directory (e.g. "w01-thesis-first-management-system.mdx"). */
  filename: string;
  /** Slug derived from filename (no extension). */
  slug: string;
  /** Raw frontmatter object (all fields preserved). */
  frontmatter: Record<string, unknown>;
  /** Body text after frontmatter is stripped. */
  body: string;
  /** Character count of body. */
  charCount: number;
  /** Word count of body. */
  wordCount: number;
  /** Whether the body is empty. */
  isEmpty: boolean;
  /** Parsing errors (malformed frontmatter, missing fences, etc.). */
  errors: string[];
};

// ─── Parser ───────────────────────────────────────────────────────────────────

/**
 * Parse frontmatter from an MDX/MD file content.
 * Handles both LF (\n) and CRLF (\r\n) line endings.
 *
 * Returns the parsed frontmatter object, the body content, and any errors.
 */
export function parseOutboundFrontmatter(
  content: string,
): { frontmatter: Record<string, unknown>; body: string; errors: string[] } {
  const frontmatter: Record<string, unknown> = {};
  const errors: string[] = [];
  let body = content;

  // Match --- fences with either \n or \r\n line endings
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);

  if (!match) {
    // No frontmatter fences found — entire content is body
    errors.push("No frontmatter fences (---) found; treating entire content as body.");
    return { frontmatter, body: body.trim(), errors };
  }

  const raw = match[1];
  if (raw === undefined) {
    errors.push("Empty frontmatter block.");
    return { frontmatter, body: body.trim(), errors };
  }

  body = content.slice(match[0].length).trim();

  const lines = raw.split(/\r?\n/);
  let currentKey: string | null = null;
  let currentArray: string[] = [];
  let inMultilineString = false;
  let multilineBuffer: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines
    if (!trimmed) {
      if (inMultilineString) {
        multilineBuffer.push("");
      }
      continue;
    }

    // End of multiline string block
    if (inMultilineString) {
      if (/^[A-Za-z_]/.test(trimmed) && trimmed.includes(":")) {
        // New key — flush multiline
        if (currentKey !== null) {
          frontmatter[currentKey] = multilineBuffer.join(" ").trim();
        }
        inMultilineString = false;
        multilineBuffer = [];
        currentKey = null;
        // fall through to process this line as a new key
      } else {
        multilineBuffer.push(trimmed);
        continue;
      }
    }

    // Array item
    if (trimmed.startsWith("- ")) {
      currentArray.push(trimmed.slice(2).trim().replace(/^["']|["']$/g, ""));
      if (currentKey !== null) {
        frontmatter[currentKey] = [...currentArray];
      }
      continue;
    }

    // Flush array
    if (currentKey !== null && currentArray.length > 0) {
      frontmatter[currentKey] = [...currentArray];
      currentArray = [];
    }

    // Key-value pair
    const kvMatch = trimmed.match(/^([a-zA-Z_][a-zA-Z0-9_]*):\s*(.*)$/);
    if (!kvMatch) continue;

    const key = kvMatch[1] ?? "";
    const val = (kvMatch[2] ?? "").trim();
    currentKey = key;

    if (val === "|" || val === ">") {
      inMultilineString = true;
      multilineBuffer = [];
      continue;
    }

    if (val === "") {
      // Empty value — likely preceding an array
      currentArray = [];
      continue;
    }

    // Remove optional quotes
    const cleaned = val.replace(/^["']|["']$/g, "");

    // Parse booleans, nulls, and numbers
    if (cleaned === "true") frontmatter[key] = true;
    else if (cleaned === "false") frontmatter[key] = false;
    else if (cleaned === "null" || cleaned === "~") frontmatter[key] = null;
    else if (/^\d+(\.\d+)?$/.test(cleaned)) frontmatter[key] = Number(cleaned);
    else frontmatter[key] = cleaned;
  }

  // Flush pending array or multiline
  if (currentKey !== null && currentArray.length > 0) {
    frontmatter[currentKey] = [...currentArray];
  }
  if (inMultilineString && currentKey !== null) {
    frontmatter[currentKey] = multilineBuffer.join(" ").trim();
  }

  return { frontmatter, body, errors };
}

// ─── Safe field helpers ───────────────────────────────────────────────────────

export function safeStr(v: unknown, fallback = ""): string {
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return fallback;
}

export function safeStrNullable(v: unknown): string | null {
  const s = safeStr(v);
  return s || null;
}

export function safeBool(v: unknown, fallback = false): boolean {
  if (typeof v === "boolean") return v;
  if (v === "true") return true;
  if (v === "false") return false;
  return fallback;
}

export function safeNum(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

export function safeArr(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => safeStr(x)).filter(Boolean);
}

// ─── Content item builder ─────────────────────────────────────────────────────

/**
 * Build an OutboundContentItem from raw file content.
 * Uses the shared parser. Returns errors for malformed content.
 */
export function buildOutboundContentItem(
  content: string,
  filename: string,
  provider: OutboundProvider,
): OutboundContentItem {
  const { frontmatter, body, errors: parseErrors } = parseOutboundFrontmatter(content);

  const id = safeStr(frontmatter.id) || filename.replace(/\.(md|mdx)$/i, "");
  const slug = filename.replace(/\.(md|mdx)$/i, "");
  const charCount = body.length;
  const wordCount = body.split(/\s+/).filter(Boolean).length;

  return {
    id,
    provider,
    filename,
    slug,
    frontmatter,
    body,
    charCount,
    wordCount,
    isEmpty: body.trim().length === 0,
    errors: parseErrors,
  };
}
