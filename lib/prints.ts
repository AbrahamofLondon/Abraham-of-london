// lib/prints.ts
// Prints data facade (MDX-backed)

import {
  getAllPrintsMeta,
  getPrintBySlug as getPrintBySlugServer,
} from "@/lib/server/prints-data";
import { safeSlice } from "@/lib/utils/safe";

export type Print = any;
export type PrintMeta = Print;
export type PrintFieldKey = keyof PrintMeta;

export async function getAllPrints(): Promise<PrintMeta[]> {
  try {
    const prints = await getAllPrintsMeta();
    return Array.isArray(prints) ? prints : [];
  } catch {
    return [];
  }
}

export async function getPrintBySlug(slug: string): Promise<Print | null> {
  try {
    const doc = await getPrintBySlugServer(slug);
    if (doc) return doc;

    const prints = await getAllPrints();
    return prints.find((p: any) => p?.slug === slug) || null;
  } catch {
    return null;
  }
}

export async function getPrintSlugs(): Promise<string[]> {
  const prints = await getAllPrints();
  return prints.map((p: any) => p?.slug).filter(Boolean);
}

export async function getPublicPrints(): Promise<PrintMeta[]> {
  const prints = await getAllPrints();
  return prints.filter((p: any) => {
    const isDraft = p?.draft === true;
    const isNotPublished = p?.published === false;
    const isStatusDraft = p?.status === "draft";
    return !(isDraft || isNotPublished || isStatusDraft);
  });
}

export async function getRecentPrints(limit = 12): Promise<PrintMeta[]> {
  const prints = await getPublicPrints();
  const sorted = [...prints].sort((a: any, b: any) => {
    const ta = a?.date ? Date.parse(String(a.date)) : 0;
    const tb = b?.date ? Date.parse(String(b.date)) : 0;
    return (Number.isFinite(tb) ? tb : 0) - (Number.isFinite(ta) ? ta : 0);
  });
  return safeSlice(sorted, 0, limit);
}