// lib/stringUtils.ts — Content-first String Utilities (client + pages-safe)
// No server-only directives, no lib/server imports. Safe everywhere.

export type Nullable<T> = T | null | undefined;

/* -----------------------------------------------------------------------------
  Core helpers
----------------------------------------------------------------------------- */

export function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

export function safeString(v: unknown, fallback = ""): string {
  if (typeof v === "string") return v;
  if (v === null || v === undefined) return fallback;
  return String(v);
}

export function trimOrNull(v: unknown): string | null {
  const s = safeString(v, "").trim();
  return s ? s : null;
}

export function normalizeWhitespace(input: unknown): string {
  return safeString(input, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function safeLower(input: unknown): string {
  return normalizeWhitespace(input).toLowerCase();
}

/* -----------------------------------------------------------------------------
  Slug + path helpers (content pages)
----------------------------------------------------------------------------- */

export function stripDiacritics(input: string): string {
  return input.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
}

/**
 * slugify("Hello World!") -> "hello-world"
 */
export function slugify(input: unknown): string {
  const s = stripDiacritics(normalizeWhitespace(input));
  return s
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

/**
 * normalizeSlug: removes leading/trailing slashes, backslashes, and .md/.mdx
 * Keeps nested routes: "pages/about/team.mdx" -> "pages/about/team"
 */
export function normalizeSlug(input: unknown): string {
  return safeString(input, "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/\.(md|mdx)$/i, "")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/\/{2,}/g, "/");
}

export function ensureLeadingSlash(path: unknown): string {
  const s = normalizeSlug(path);
  return s ? `/${s}` : "/";
}

export function stripQueryAndHash(url: unknown): string {
  return safeString(url, "").split("#")[0]?.split("?")[0] || "";
}

/* -----------------------------------------------------------------------------
  Content excerpting (MDX/blog/pages)
----------------------------------------------------------------------------- */

export function stripHtml(input: unknown): string {
  return safeString(input, "").replace(/<[^>]*>/g, " ");
}

export function stripMarkdown(input: unknown): string {
  const s = safeString(input, "");
  return s
    .replace(/```[\s\S]*?```/g, " ") // code blocks
    .replace(/`[^`]*`/g, " ") // inline code
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ") // images
    .replace(/\[[^\]]*\]\([^)]*\)/g, " ") // links
    .replace(/[*_~>#-]+/g, " ") // common markdown tokens
    .replace(/\s+/g, " ")
    .trim();
}

export function truncate(input: unknown, max = 160): string {
  const s = normalizeWhitespace(input);
  if (s.length <= max) return s;
  return s.slice(0, Math.max(0, max - 1)).trimEnd() + "…";
}

export function excerptFromContent(input: unknown, max = 160): string {
  const plain = normalizeWhitespace(stripMarkdown(stripHtml(input)));
  return truncate(plain, max);
}

/* -----------------------------------------------------------------------------
  Case transforms (titles, labels, nav)
----------------------------------------------------------------------------- */

export function titleCase(input: unknown): string {
  const s = normalizeWhitespace(input);
  if (!s) return "";
  return s
    .toLowerCase()
    .split(" ")
    .map((w) => (w ? w[0]!.toUpperCase() + w.slice(1) : ""))
    .join(" ");
}

export function camelCase(input: unknown): string {
  const s = normalizeWhitespace(input);
  if (!s) return "";
  const parts = s
    .replace(/[^a-zA-Z0-9 ]+/g, " ")
    .split(" ")
    .filter(Boolean);
  if (parts.length === 0) return "";
  return (
    parts[0]!.toLowerCase() +
    parts
      .slice(1)
      .map((p) => p[0]!.toUpperCase() + p.slice(1).toLowerCase())
      .join("")
  );
}

/* -----------------------------------------------------------------------------
  Collections helpers (tags, categories)
----------------------------------------------------------------------------- */

export function uniqueStrings(values: unknown[]): string[] {
  const set = new Set<string>();
  for (const v of values || []) {
    const s = safeString(v, "").trim();
    if (s) set.add(s);
  }
  return Array.from(set);
}

export function uniqueLower(values: unknown[]): string[] {
  const set = new Set<string>();
  for (const v of values || []) {
    const s = safeLower(v);
    if (s) set.add(s);
  }
  return Array.from(set);
}

/* -----------------------------------------------------------------------------
  Date parsing helper (content sorting)
----------------------------------------------------------------------------- */

export function safeTime(value?: unknown): number {
  if (value === null || value === undefined) return 0;
  const t = Date.parse(String(value));
  return Number.isFinite(t) ? t : 0;
}