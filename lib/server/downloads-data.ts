// lib/server/downloads-data.ts
import {
  ensureDir,
  listMdFiles,
  fileToSlug,
  readFrontmatter,
  sortByDateDesc,
} from "@/lib/server/md-utils";

export type DownloadMeta = {
  slug: string;
  title: string;
  category?: string;
  excerpt?: string;
  description?: string;
  date?: string;
  tags?: string[];
  fileUrl?: string;
  buttonLabel?: string;
  href?: string;   // /downloads/[slug]
  [key: string]: unknown;
};

export type DownloadFieldKey = keyof DownloadMeta;

// ------------------------------
// Internal FS loader
// ------------------------------

function loadAllDownloadsFromFs(): DownloadMeta[] {
  const abs = ensureDir("downloads");
  if (!abs) return [];

  const files = listMdFiles(abs);
  if (!files.length) return [];

  const items: DownloadMeta[] = files.map((absFile) => {
    const { data, content } = readFrontmatter(absFile);
    const rawSlug = (data.slug as string) || fileToSlug(absFile);

    const slug = String(rawSlug || "")
      .trim()
      .replace(/^\/+|\/+$/g, "");

    const title =
      (data.title as string | undefined) ||
      slug ||
      "Untitled download";

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

    const fileUrl =
      (data.fileUrl as string | undefined) ||
      (data.file as string | undefined) ||
      (data.downloadUrl as string | undefined) ||
      undefined;

    const buttonLabel =
      (data.buttonLabel as string | undefined) ||
      (data.ctaLabel as string | undefined) ||
      undefined;

    return {
      slug,
      title,
      category,
      excerpt,
      description,
      date,
      tags,
      fileUrl,
      buttonLabel,
      href: `/downloads/${slug}`,
      content,
      ...data,
    };
  });

  return sortByDateDesc(items);
}

// Cache
let DOWNLOADS_CACHE: DownloadMeta[] | null = null;

function allDownloads(): DownloadMeta[] {
  if (!DOWNLOADS_CACHE) {
    DOWNLOADS_CACHE = loadAllDownloadsFromFs();
  }
  return DOWNLOADS_CACHE;
}

// ------------------------------
// Public API
// ------------------------------

export function getAllDownloads(): DownloadMeta[] {
  return allDownloads();
}

export function getDownloadSlugs(): string[] {
  return allDownloads().map((d) => d.slug);
}

export function getDownloadBySlug(slug: string): DownloadMeta | undefined {
  const key = String(slug || "").toLowerCase();
  return allDownloads().find(
    (d) => String(d.slug || "").toLowerCase() === key,
  );
}

export function getDownloadsBySlugs(slugs: string[]): DownloadMeta[] {
  const keys = new Set(slugs.map((s) => String(s || "").toLowerCase()));
  return allDownloads().filter((d) =>
    keys.has(String(d.slug || "").toLowerCase()),
  );
}

// If some of your downloads have associated resources (e.g. "related resources"),
// you can extract those slugs from frontmatter; otherwise, this safely returns [].
export function extractResourceSlugs(): string[] {
  const downloads = allDownloads();
  const out = new Set<string>();

  for (const d of downloads) {
    const resources = (d as any).resources;
    if (!resources) continue;
    const arr = Array.isArray(resources) ? resources : [];
    for (const r of arr) {
      if (r && typeof r.slug === "string") {
        out.add(r.slug.trim());
      }
    }
  }

  return Array.from(out);
}

// Keep API symmetrical with events-data
export function getAllContent(): DownloadMeta[] {
  return getAllDownloads();
}