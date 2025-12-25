// lib/server/content.ts
import * as generated from "@/lib/contentlayer";

function pickArray<T = any>(...candidates: any[]): T[] {
  for (const c of candidates) {
    if (Array.isArray(c)) return c as T[];
  }
  return [];
}

function pickDoc<T = any>(all: T[], urlPath: string): T | null {
  const clean = urlPath.replace(/\/+$/, "");
  const doc = all.find((d: any) => {
    const docUrl = d?.url || d?.href;
    if (!docUrl) return false;
    return docUrl === clean || docUrl === urlPath;
  });
  return doc || null;
}

// ✅ Works whether exports are named or default-wrapped
const genAny = generated as any;
const defaultAny = genAny?.default as any;

export async function getAllResources(): Promise<any[]> {
  const resources = pickArray(genAny.allResources, defaultAny?.allResources, defaultAny);
  return resources.map((doc: any) => ({
    ...doc,
    // Ensure consistent URL structure
    url: doc.url || doc.href || `/resources/${doc.slug || doc._raw?.flattenedPath?.split('/').pop() || ''}`,
    // Ensure body exists
    body: doc.body || { raw: doc.content || '' },
  }));
}

export async function getResourceByUrlPath(urlPath: string): Promise<any | null> {
  const all = await getAllResources();
  return pickDoc(all, urlPath);
}

export async function getAllShorts(): Promise<any[]> {
  const shorts = pickArray(genAny.allShorts, defaultAny?.allShorts, defaultAny);
  return shorts.map((doc: any) => ({
    ...doc,
    url: doc.url || doc.href || `/shorts/${doc.slug || doc._raw?.flattenedPath?.split('/').pop() || ''}`,
    body: doc.body || { raw: doc.content || '' },
  }));
}

export async function getShortByUrlPath(urlPath: string): Promise<any | null> {
  const all = await getAllShorts();
  return pickDoc(all, urlPath);
}

// Helper to get resource by slug directly
export async function getResourceBySlug(slug: string): Promise<any | null> {
  const all = await getAllResources();
  return all.find((doc: any) => doc.slug === slug) || null;
}