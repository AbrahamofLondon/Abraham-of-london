// lib/server/strategies-data.ts — SSOT ALIGNED (MDX: content/strategy/*)
import "server-only";

import {
  getMdxCollectionMeta,
  getMdxDocumentBySlug,
  type MdxMeta,
  type MdxDocument,
} from "@/lib/server/mdx-collections";

import type { Strategy } from "@/types/index";
import { safeSlice } from "@/lib/utils/safe";

export type StrategyWithContent = Strategy & { content: string };

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

function fromMdxMeta(meta: MdxMeta): Strategy {
  const m: any = meta as any;
  return {
    slug: s(m.slug) || "",
    title: s(m.title) || "Untitled Strategy",

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

    strategyType: s(m.strategyType) as any,
    framework: s(m.framework),
    methodology: s(m.methodology),
    steps: a(m.steps),
    phases: a(m.phases),
    kpis: a(m.kpis),

    _raw: m._raw,
    url: s(m.url),
    type: "strategy",
  } as any;
}

function fromMdxDocument(doc: MdxDocument): StrategyWithContent {
  const d: any = doc as any;
  const meta = fromMdxMeta(d);
  return {
    ...(meta as any),
    content: typeof d.content === "string" ? d.content : "",
    body: d.body || undefined,
  } as any;
}

export async function getAllStrategiesMeta(): Promise<Strategy[]> {
  try {
    // ✅ folder is content/strategy (not content/strategies)
    const metas = await getMdxCollectionMeta("strategy");
    return (metas || []).map(fromMdxMeta).filter((x: any) => x?.slug && x?.title);
  } catch (e) {
    console.error("[strategies-data] getAllStrategiesMeta failed:", e);
    return [];
  }
}

export async function getStrategyBySlug(slug: string): Promise<StrategyWithContent | null> {
  try {
    const doc = await getMdxDocumentBySlug("strategy", slug);
    if (!doc) return null;
    return fromMdxDocument(doc);
  } catch (e) {
    console.error(`[strategies-data] getStrategyBySlug failed (${slug}):`, e);
    return null;
  }
}

export async function getPublishedStrategies(): Promise<Strategy[]> {
  const all = await getAllStrategiesMeta();
  return all.filter((s: any) => s?.draft !== true && (s?.published !== false));
}

export async function getFeaturedStrategies(): Promise<Strategy[]> {
  const all = await getPublishedStrategies();
  return all.filter((s: any) => s?.featured === true);
}

export async function getRecentStrategies(limit = 20): Promise<Strategy[]> {
  const all = await getPublishedStrategies();
  const sorted = [...all].sort((a: any, b: any) => {
    const da = a?.date ? new Date(a.date).getTime() : 0;
    const db = b?.date ? new Date(b.date).getTime() : 0;
    return db - da;
  });
  return safeSlice(sorted, 0, limit);
}

export default {
  getAllStrategiesMeta,
  getStrategyBySlug,
  getPublishedStrategies,
  getFeaturedStrategies,
  getRecentStrategies,
};