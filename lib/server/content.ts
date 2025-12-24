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
  return (
    all.find((d: any) => (d?.url || d?.href) === clean) ||
    all.find((d: any) => (d?.url || d?.href) === urlPath) ||
    null
  );
}

// ✅ Works whether exports are named or default-wrapped
const genAny = generated as any;
const defaultAny = genAny?.default as any;

export async function getAllResources() {
  return pickArray(genAny.allResources, defaultAny?.allResources, defaultAny);
}

export async function getResourceByUrlPath(urlPath: string) {
  const all = await getAllResources();
  return pickDoc(all, urlPath);
}

export async function getAllShorts() {
  return pickArray(genAny.allShorts, defaultAny?.allShorts, defaultAny);
}

export async function getShortByUrlPath(urlPath: string) {
  const all = await getAllShorts();
  return pickDoc(all, urlPath);
}