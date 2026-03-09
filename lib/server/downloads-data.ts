// lib/server/downloads-data.ts — SSOT ALIGNED (MDX: content/downloads/*)
import "server-only";

import {
  getMdxCollectionMeta,
  getMdxDocumentBySlug,
  type MdxMeta,
  type MdxDocument,
} from "@/lib/server/mdx-collections";

import type { Download } from "@/types/index";
import { safeSlice } from "@/lib/utils/safe";

export type DownloadWithContent = Download & { content: string };

function s(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

function b(v: unknown): boolean | undefined {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v === 1;
  if (typeof v === "string") {
    const x = v.toLowerCase().trim();
    if (["true", "yes", "1"].includes(x)) return true;
    if (["false", "no", "0"].includes(x)) return false;
  }
  return undefined;
}

function a(v: unknown): string[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const out = v.filter((x) => typeof x === "string") as string[];
  return out.length ? out : undefined;
}

function n(v: unknown): number | undefined {
  if (typeof v === "number") return Number.isFinite(v) ? v : undefined;
  if (typeof v === "string") {
    const x = parseInt(v, 10);
    return Number.isFinite(x) ? x : undefined;
  }
  return undefined;
}

function fromMdxMeta(meta: MdxMeta): Download {
  const m: any = meta as any;

  const slug = s(m.slug) || "";
  const title = s(m.title) || "Untitled Download";

  return {
    slug,
    title,
    description: s(m.description),
    excerpt: s(m.excerpt) || s(m.description),
    date: s(m.date),
    author: s(m.author),
    category: s(m.category),
    tags: a(m.tags),
    featured: b(m.featured),
    coverImage: s(m.coverImage) || s(m.image),
    draft: b(m.draft),
    published: m.published === undefined ? true : b(m.published),
    fileName: s(m.fileName),
    fileSize: s(m.fileSize) || n(m.fileSize)?.toString(),
    fileFormat: s(m.fileFormat),
    fileUrl: s(m.fileUrl),
    downloadUrl: s(m.downloadUrl),
    version: s(m.version),
    versionDate: s(m.versionDate),
    requirements: a(m.requirements),
    compatibility: a(m.compatibility),
    changelog: a(m.changelog),
    _raw: m._raw,
    url: s(m.url),
    type: "download",
  } as any;
}

function fromMdxDocument(doc: MdxDocument): DownloadWithContent {
  const d: any = doc as any;
  const meta = fromMdxMeta(d);

  return {
    ...(meta as any),
    content: typeof d.content === "string" ? d.content : "",
    body: d.body || undefined,
  } as any;
}

export async function getAllDownloadsMeta(): Promise<Download[]> {
  try {
    const metas = await getMdxCollectionMeta("downloads");
    return (metas || [])
      .map(fromMdxMeta)
      .filter((x: any) => x?.slug && x?.title);
  } catch (e) {
    console.error("[downloads-data] getAllDownloadsMeta failed:", e);
    return [];
  }
}

export async function getMdxDownloadsMeta(): Promise<Download[]> {
  return getAllDownloadsMeta();
}

export async function getDownloadBySlug(
  slug: string
): Promise<DownloadWithContent | null> {
  try {
    const doc = await getMdxDocumentBySlug("downloads", slug);
    if (!doc) return null;
    return fromMdxDocument(doc);
  } catch (e) {
    console.error(`[downloads-data] getDownloadBySlug failed (${slug}):`, e);
    return null;
  }
}

export async function getMdxDownloadBySlug(
  slug: string
): Promise<DownloadWithContent | null> {
  return getDownloadBySlug(slug);
}

export async function getPublishedDownloads(): Promise<Download[]> {
  const all = await getAllDownloadsMeta();
  return all.filter((d: any) => d?.draft !== true && d?.published !== false);
}

export async function getFeaturedDownloads(): Promise<Download[]> {
  const all = await getPublishedDownloads();
  return all.filter((d: any) => d?.featured === true);
}

export async function getMdxFeaturedDownloads(): Promise<Download[]> {
  return getFeaturedDownloads();
}

export async function getRecentDownloads(limit = 20): Promise<Download[]> {
  const all = await getPublishedDownloads();
  const sorted = [...all].sort((a: any, b: any) => {
    const da = a?.date ? new Date(a.date).getTime() : 0;
    const db = b?.date ? new Date(b.date).getTime() : 0;
    return db - da;
  });
  return safeSlice(sorted, 0, limit);
}

export default {
  getAllDownloadsMeta,
  getMdxDownloadsMeta,
  getDownloadBySlug,
  getMdxDownloadBySlug,
  getPublishedDownloads,
  getFeaturedDownloads,
  getMdxFeaturedDownloads,
  getRecentDownloads,
};