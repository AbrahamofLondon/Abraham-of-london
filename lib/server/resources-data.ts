// lib/server/resources-data.ts
import {
  ensureDir,
  listMdFiles,
  fileToSlug,
  readFrontmatter,
  sortByDateDesc,
} from "@/lib/server/md-utils";

export type ResourceMeta = {
  slug: string;
  title: string;
  category?: string;
  excerpt?: string;
  description?: string;
  date?: string;
  tags?: string[];
  href?: string;  // /resources/[slug]
  [key: string]: unknown;
};

function loadAllResourcesFromFs(): ResourceMeta[] {
  const abs = ensureDir("resources");
  if (!abs) return [];

  const files = listMdFiles(abs);
  if (!files.length) return [];

  const items: ResourceMeta[] = files.map((absFile) => {
    const { data, content } = readFrontmatter(absFile);
    const rawSlug = (data.slug as string) || fileToSlug(absFile);

    const slug = String(rawSlug || "")
      .trim()
      .replace(/^\/+|\/+$/g, "");

    const title =
      (data.title as string | undefined) ||
      slug ||
      "Untitled resource";

    const category = (data.category as string | undefined) || undefined;

    const excerpt =
      (data.excerpt as string | undefined) ||
      (data.summary as string | undefined) ||
      (data.description as string | undefined) ||
      undefined;

    const description =
      (data.description as string | undefined) || undefined;

    const date = (data.date as string | undefined) || undefined;

    const tags = Array.isArray(data.tags)
      ? data.tags.map((t: unknown) => String(t))
      : undefined;

    return {
      slug,
      title,
      category,
      excerpt,
      description,
      date,
      tags,
      href: `/resources/${slug}`,
      content,
      ...data,
    };
  });

  return sortByDateDesc(items);
}

let RESOURCES_CACHE: ResourceMeta[] | null = null;

function allResources(): ResourceMeta[] {
  if (!RESOURCES_CACHE) {
    RESOURCES_CACHE = loadAllResourcesFromFs();
  }
  return RESOURCES_CACHE;
}

export function getAllResources(): ResourceMeta[] {
  return allResources();
}

export function getResourceSlugs(): string[] {
  return allResources().map((r) => r.slug);
}

export function getResourceBySlug(slug: string): ResourceMeta | undefined {
  const key = String(slug || "").toLowerCase();
  return allResources().find(
    (r) => String(r.slug || "").toLowerCase() === key,
  );
}

export function getResourcesBySlugs(slugs: string[]): ResourceMeta[] {
  const keys = new Set(slugs.map((s) => String(s || "").toLowerCase()));
  return allResources().filter((r) =>
    keys.has(String(r.slug || "").toLowerCase()),
  );
}

export function getAllContent(): ResourceMeta[] {
  return getAllResources();
}