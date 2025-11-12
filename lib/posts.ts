// lib/posts.ts
import fs from "fs";
import path from "path";
import {
  ensureDir,
  listMdFiles,
  fileToSlug,
  readFrontmatter,
  sortByDateDesc,
} from "./fs-utils";

export type PostMeta = {
  slug: string;
  title?: string;
  date?: string;              // ISO-ish preferred
  excerpt?: string;
  category?: string;
  tags?: string[];
  coverImage?: string;
  author?: string;
  readTime?: string;
  coverAspect?: string;
  coverFit?: string;
  coverPosition?: string;
  subtitle?: string;
  ogDescription?: string;

  // common flags we’ll respect if present
  draft?: boolean;
  published?: boolean;
};

export type Post = PostMeta & { body?: string; content?: string };

type AnyRecord = Record<string, unknown>;

function pickFields(src: AnyRecord, fields?: string[]) {
  if (!fields || fields.length === 0) return { ...src };
  const out: AnyRecord = {};
  for (const f of fields) out[f] = src[f];
  return out;
}

function normaliseBool(v: unknown): boolean | undefined {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (s === "true" || s === "1" || s === "yes") return true;
    if (s === "false" || s === "0" || s === "no") return false;
  }
  return undefined;
}

function isDraftLike(meta: AnyRecord): boolean {
  // Prefer explicit flags if present
  const draft = normaliseBool(meta.draft);
  if (draft === true) return true;
  const published = normaliseBool(meta.published);
  if (published === false) return true;

  // Heuristic: missing/empty title + future date could be treated as draft,
  // but we’ll avoid magic here—explicit flags rule.
  return false;
}

// Normalise parameter: string[] | { includeDrafts?: boolean; fields?: string[] }
function normalizeFieldsArg(
  arg?: string[] | { includeDrafts?: boolean; fields?: string[] },
): { fields?: string[]; includeDrafts?: boolean } {
  if (!arg) return {};
  if (Array.isArray(arg)) return { fields: arg };
  const { includeDrafts, fields } = arg;
  return { includeDrafts, fields };
}

function coerceArray<T = unknown>(v: unknown): T[] | undefined {
  return Array.isArray(v) ? (v as T[]) : undefined;
}

function toPostMeta(slug: string, data: AnyRecord): PostMeta {
  // Defensive copies + gentle coercions
  const tags = coerceArray<string>(data.tags) ?? undefined;

  const meta: PostMeta = {
    slug,
    title: typeof data.title === "string" ? data.title : undefined,
    date: typeof data.date === "string" ? data.date : undefined,
    excerpt: typeof data.excerpt === "string" ? data.excerpt : undefined,
    category: typeof data.category === "string" ? data.category : undefined,
    tags,
    coverImage:
      typeof data.coverImage === "string" ? data.coverImage : undefined,
    author: typeof data.author === "string" ? data.author : undefined,
    readTime: typeof data.readTime === "string" ? data.readTime : undefined,
    coverAspect:
      typeof data.coverAspect === "string" ? data.coverAspect : undefined,
    coverFit: typeof data.coverFit === "string" ? data.coverFit : undefined,
    coverPosition:
      typeof data.coverPosition === "string" ? data.coverPosition : undefined,
    subtitle: typeof data.subtitle === "string" ? data.subtitle : undefined,
    ogDescription:
      typeof data.ogDescription === "string" ? data.ogDescription : undefined,
    draft: normaliseBool(data.draft),
    published: normaliseBool(data.published),
  };

  return meta;
}

/** Generic: returns array of items (always includes slug) from a collection dir */
export function getAllContent(
  collection: string,
  fieldsOrOpts?: string[] | { includeDrafts?: boolean; fields?: string[] },
): { slug: string; [k: string]: unknown }[] {
  const { fields, includeDrafts } = normalizeFieldsArg(fieldsOrOpts);
  const abs = ensureDir(collection);
  if (!abs) return [];

  const files = listMdFiles(abs);
  const items = files
    .map((absFile) => {
      const slug = fileToSlug(absFile);
      const { data, content } = readFrontmatter(absFile);
      const meta = toPostMeta(slug, data ?? {});
      const shape: AnyRecord = { ...meta };

      if (fields?.includes("content") || fields?.includes("body")) {
        shape.content = content;
        shape.body = content;
      }

      // Respect draft/published flags unless includeDrafts===true
      if (!includeDrafts && isDraftLike(meta)) return null;

      const picked = pickFields(shape, fields);
      picked.slug = slug; // always
      return picked;
    })
    .filter(Boolean) as AnyRecord[];

  // Sort by date desc using your helper (assumes it can handle missing/invalid dates)
  return sortByDateDesc(items as any);
}

/** Generic: returns one document (or null) */
export function getContentBySlug(
  collection: string,
  slug: string,
  fieldsOrOpts?: string[] | { withContent?: boolean; fields?: string[] },
): { slug: string; body?: string; content?: string; [k: string]: unknown } | null {
  const abs = ensureDir(collection);
  if (!abs) return null;

  // Accept slugs with or without nested dirs; our guess looks in the collection root
  const guessFiles = [
    path.join(abs, `${slug}.mdx`),
    path.join(abs, `${slug}.md`),
  ];
  const found = guessFiles.find((f) => {
    try {
      return fs.existsSync(f);
    } catch {
      return false;
    }
  });
  if (!found) return null;

  const { data, content } = readFrontmatter(found);

  let withContent = false;
  let fields: string[] | undefined;
  if (Array.isArray(fieldsOrOpts)) {
    fields = fieldsOrOpts;
    withContent = fields.includes("content") || fields.includes("body");
  } else if (fieldsOrOpts) {
    fields = fieldsOrOpts.fields;
    withContent =
      !!fieldsOrOpts.withContent ||
      !!(fields && (fields.includes("content") || fields.includes("body")));
  }

  const meta = toPostMeta(slug, data ?? {});
  const shape: AnyRecord = { ...meta };
  if (withContent) {
    shape.body = content;
    shape.content = content;
  }

  const picked = pickFields(shape, fields);
  picked.slug = slug;
  if (withContent) {
    picked.body = content;
    picked.content = content;
  }
  return picked;
}

/** Blog/posts convenience. Supports legacy { includeDrafts, fields } */
export function getAllPosts(
  fieldsOrOpts?: string[] | { includeDrafts?: boolean; fields?: string[] },
): Post[] {
  const { fields, includeDrafts } = normalizeFieldsArg(fieldsOrOpts);

  // Look in /content/blog and /content/posts (whatever ensureDir resolves)
  const dirs = ["blog", "posts"].map(ensureDir).filter(Boolean) as string[];

  let items: Post[] = [];
  for (const d of dirs) {
    // Convert absolute back to collection-relative for getAllContent
    const rel = d.replace(/.*[/\\]content[/\\]/, "");
    const chunk = getAllContent(rel, { fields, includeDrafts }) as any[];
    items = items.concat(chunk as Post[]);
  }

  // Dedup by slug (first wins)
  const seen = new Set<string>();
  const out: Post[] = [];
  for (const p of items) {
    if (!seen.has(p.slug)) {
      seen.add(p.slug);
      out.push(p);
    }
  }

  return sortByDateDesc(out as any);
}