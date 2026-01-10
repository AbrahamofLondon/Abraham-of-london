// lib/content-validators.ts

export interface BasicFrontmatter {
  title?: unknown;
  slug?: unknown;
  date?: unknown;
  tags?: unknown;
  [key: string]: unknown;
}

export function ensureString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

export function ensureStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((v) => (typeof v === "string" ? v.trim() : String(v)))
      .filter(Boolean);
  }
  return [];
}

export function normaliseSlug(value: unknown): string {
  const s = ensureString(value)
    .trim()
    .toLowerCase()
    .replace(/^[\/\s-]+|[\/\s-]+$/g, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/-+/g, "-");

  return s || "untitled";
}

export function validateBasicFrontmatter(
  input: BasicFrontmatter
): Required<Pick<BasicFrontmatter, "title" | "slug">> & BasicFrontmatter {
  const title = ensureString(input.title, "Untitled");
  const slug = normaliseSlug(input.slug ?? title);

  return {
    ...input,
    title,
    slug,
  };
}

export const contentValidators = {
  ensureString,
  ensureStringArray,
  normaliseSlug,
  validateBasicFrontmatter,
};

export default contentValidators;


