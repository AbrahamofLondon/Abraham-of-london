import fs from "fs";
import path from "path";
import {
  ensureDir, listMdFiles, fileToSlug, readFrontmatter, sortByDateDesc
} from "./fs-utils";

export type PostMeta = {
  slug: string;
  title?: string;
  date?: string;
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
};

export type Post = PostMeta & { body?: string; content?: string };

type AnyRecord = Record<string, any>;

function pickFields(src: AnyRecord, fields?: string[]) {
  if (!fields || fields.length === 0) return { ...src };
  const out: AnyRecord = {};
  for (const f of fields) out[f] = src[f];
  return out;
}

// Normalize parameter: string[] | { includeDrafts?: boolean; fields?: string[] }
function normalizeFieldsArg(
  arg?: string[] | { includeDrafts?: boolean; fields?: string[] }
): { fields?: string[]; includeDrafts?: boolean } {
  if (!arg) return {};
  if (Array.isArray(arg)) return { fields: arg };
  const { includeDrafts, fields } = arg;
  return { includeDrafts, fields };
}

/** Generic: returns array of items (always includes slug) from a collection dir */
export function getAllContent(
  collection: string,
  fieldsOrOpts?: string[] | { includeDrafts?: boolean; fields?: string[] }
): { slug: string; [k: string]: any }[] {
  const { fields } = normalizeFieldsArg(fieldsOrOpts);
  const abs = ensureDir(collection);
  if (!abs) return [];
  const files = listMdFiles(abs);
  const items = files.map((absFile) => {
    const slug = fileToSlug(absFile);
    const { data, content } = readFrontmatter(absFile);
    const meta: AnyRecord = { slug, ...data };
    if (fields?.includes("content") || fields?.includes("body")) {
      meta.content = content; meta.body = content;
    }
    // Always include slug, even if fields provided
    const picked = pickFields(meta, fields);
    picked.slug = slug;
    return picked;
  });
  return sortByDateDesc(items as any);
}

/** Generic: returns one document (or null) */
export function getContentBySlug(
  collection: string,
  slug: string,
  fieldsOrOpts?: string[] | { withContent?: boolean; fields?: string[] }
): { slug: string; body?: string; content?: string; [k: string]: any } | null {
  const abs = ensureDir(collection);
  if (!abs) return null;

  const guessFiles = [path.join(abs, `${slug}.mdx`), path.join(abs, `${slug}.md`)];
  const found = guessFiles.find(f => { try { return fs.existsSync(f); } catch { return false; } });
  if (!found) return null;

  const { data, content } = readFrontmatter(found);

  let withContent = false;
  let fields: string[] | undefined;
  if (Array.isArray(fieldsOrOpts)) {
    fields = fieldsOrOpts;
    withContent = fields.includes("content") || fields.includes("body");
  } else if (fieldsOrOpts) {
    fields = fieldsOrOpts.fields;
    withContent = !!fieldsOrOpts.withContent || !!(fields && (fields.includes("content") || fields.includes("body")));
  }

  const meta: AnyRecord = { slug, ...data };
  if (withContent) { meta.body = content; meta.content = content; }

  const picked = pickFields(meta, fields);
  picked.slug = slug;
  if (withContent) { picked.body = content; picked.content = content; }
  return picked;
}

/** Blog/posts convenience. Supports legacy { includeDrafts, fields } */
export function getAllPosts(
  fieldsOrOpts?: string[] | { includeDrafts?: boolean; fields?: string[] }
): Post[] {
  const { fields } = normalizeFieldsArg(fieldsOrOpts);
  const dirs = ["blog", "posts"].map(ensureDir).filter(Boolean) as string[];
  let items: Post[] = [];
  for (const d of dirs) {
    const rel = d.replace(/.*[/\\\\]content[/\\\\]/, "");
    const chunk = getAllContent(rel, fields) as any[];
    items = items.concat(chunk as Post[]);
  }
  // Dedup by slug
  const seen = new Set<string>();
  const out: Post[] = [];
  for (const p of items) {
    if (!seen.has(p.slug)) { seen.add(p.slug); out.push(p); }
  }
  return sortByDateDesc(out);
}
