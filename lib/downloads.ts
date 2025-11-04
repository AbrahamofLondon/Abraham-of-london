import fs from "fs";
import path from "path";
import { ensureDir, listMdFiles, fileToSlug, readFrontmatter, sortByDateDesc } from "./fs-utils";

export type DownloadMeta = {
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
  href?: string; // required by DownloadsGrid consumer
};

export type DownloadItem = DownloadMeta & { body?: string; content?: string };

const COLLECTION = "downloads";

export function getAllDownloadSlugs(): string[] {
  const abs = ensureDir(COLLECTION);
  if (!abs) return [];
  return listMdFiles(abs).map(fileToSlug);
}

export function getAllDownloads(fields?: string[]): DownloadItem[] {
  const abs = ensureDir(COLLECTION);
  if (!abs) return [];
  const items = listMdFiles(abs).map((absFile) => {
    const slug = fileToSlug(absFile);
    const { data, content } = readFrontmatter(absFile);
    const href = (data?.href && String(data.href)) || `/downloads/${slug}`;
    const meta: any = { slug, href, ...data };
    if (fields?.includes("content") || fields?.includes("body")) {
      meta.body = content; meta.content = content;
    }
    return meta as DownloadItem;
  });
  return sortByDateDesc(items);
}

export function getDownloadBySlug(slug: string, fields?: string[]): DownloadItem | null {
  const abs = ensureDir(COLLECTION);
  if (!abs) return null;
  const guess = [".mdx", ".md"].map(ext => path.join(abs, `${slug}${ext}`));
  const found = guess.find(f => { try { return fs.existsSync(f); } catch { return false; }});
  if (!found) return null;
  const { data, content } = readFrontmatter(found);
  const href = (data?.href && String(data.href)) || `/downloads/${slug}`;
  const meta: any = { slug, href, ...data, body: content, content };
  if (fields?.length) {
    const picked: any = { slug, href };
    for (const f of fields) picked[f] = meta[f];
    return picked;
  }
  return meta as DownloadItem;
}
