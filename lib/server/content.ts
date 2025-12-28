// lib/server/content.ts
import * as generated from "@/lib/contentlayer";

/**
 * - Canonical URL MUST come from `doc.url` if present, otherwise derived from flattenedPath/slug.
 * - `href` is treated as a CTA destination ONLY (never used for routing).
 * - `pickDoc` matches ONLY by canonical `url`.
 */

function pickArray<T = any>(...candidates: any[]): T[] {
  for (const c of candidates) {
    if (Array.isArray(c)) return c as T[];
  }
  return [];
}

function cleanPath(p: string): string {
  const s = String(p || "");
  if (!s) return "";
  // remove query/hash and trailing slash
  return s.split("#")[0]!.split("?")[0]!.replace(/\/+$/, "");
}

function lastPathSegment(flattenedPath?: string): string {
  const fp = cleanPath(flattenedPath || "");
  if (!fp) return "";
  const parts = fp.split("/").filter(Boolean);
  if (!parts.length) return "";
  const last = parts[parts.length - 1]!;
  if (last === "index") return parts[parts.length - 2] || "";
  return last;
}

function deriveUrl(doc: any, base: string): string {
  // 1) If doc.url exists and matches base, trust it
  const explicit = cleanPath(doc?.url || "");
  if (explicit && explicit.startsWith(base)) return explicit;

  // 2) Derive slug deterministically (never from href)
  const slug =
    cleanPath(doc?.slug || "") ||
    lastPathSegment(doc?._raw?.flattenedPath) ||
    "";

  return slug ? `${base}/${slug}` : base;
}

function pickDoc<T = any>(all: T[], urlPath: string): T | null {
  const target = cleanPath(urlPath);
  if (!target) return null;

  const doc = (all as any[]).find((d) => {
    const docUrl = cleanPath(d?.url || "");
    return docUrl === target;
  });

  return (doc as T) || null;
}

// ✅ Works whether exports are named or default-wrapped
const genAny = generated as any;
const defaultAny = genAny?.default as any;

function normalizeDoc(doc: any, base: string) {
  const url = deriveUrl(doc, base);

  // body normalization (keep it plain; avoid Proxies during export)
  const rawBody =
    (doc?.body && typeof doc.body === "object" && typeof doc.body.raw === "string" && doc.body.raw) ||
    (typeof doc?.content === "string" ? doc.content : "") ||
    "";

  return {
    ...doc,
    // Canonical route used by getStaticPaths + getStaticProps
    url,

    // Keep href as CTA only (do not let routing depend on it)
    href: typeof doc?.href === "string" ? doc.href : undefined,

    // Ensure body exists with raw
    body: doc?.body && typeof doc.body === "object" ? { ...doc.body, raw: rawBody } : { raw: rawBody },
  };
}

// ----------------------
// RESOURCES
// ----------------------
export async function getAllResources(): Promise<any[]> {
  const resources = pickArray(genAny.allResources, defaultAny?.allResources, defaultAny);
  return resources.map((doc: any) => normalizeDoc(doc, "/resources"));
}

export async function getResourceByUrlPath(urlPath: string): Promise<any | null> {
  const all = await getAllResources();
  return pickDoc(all, urlPath);
}

export async function getResourceBySlug(slug: string): Promise<any | null> {
  const s = cleanPath(slug).split("/").filter(Boolean).pop() || "";
  if (!s) return null;

  const all = await getAllResources();
  return all.find((doc: any) => cleanPath(doc?.slug || "") === s || lastPathSegment(doc?._raw?.flattenedPath) === s) || null;
}

// ----------------------
// SHORTS
// ----------------------
export async function getAllShorts(): Promise<any[]> {
  const shorts = pickArray(genAny.allShorts, defaultAny?.allShorts, defaultAny);
  return shorts.map((doc: any) => normalizeDoc(doc, "/shorts"));
}

export async function getShortByUrlPath(urlPath: string): Promise<any | null> {
  const all = await getAllShorts();
  return pickDoc(all, urlPath);
}