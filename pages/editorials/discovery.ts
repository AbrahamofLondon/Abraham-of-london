import { EDITORIAL_CATALOGUE } from "@/lib/editorial/catalogue";
import type { PublicationRecord } from "@/lib/editorial/types";

export type DiscoveredPublication = {
  slug: string;
  title: string;
  description?: string | null;
  cover?: string | null;
  category?: string | null;
  tier?: string | null;
  date?: string | null;
};

function normalizeString(value: unknown): string {
  return String(value ?? "").trim();
}

export function discoverPublications(): DiscoveredPublication[] {
  return EDITORIAL_CATALOGUE.map((entry: PublicationRecord) => ({
    slug: normalizeString(entry.slug),
    title: normalizeString(entry.title),
    description: normalizeString(entry.description || entry.subtitle || "") || null,
    cover: normalizeString(
      (entry as PublicationRecord & { cover?: string; coverImage?: string }).cover ||
        (entry as PublicationRecord & { cover?: string; coverImage?: string }).coverImage ||
        ""
    ) || null,
    category: normalizeString(entry.category || "Editorial") || "Editorial",
    tier: normalizeString(entry.tier || "public") || "public",
    date: normalizeString(entry.date || "") || null,
  })).sort((a, b) => {
    const aTime = a.date ? new Date(a.date).getTime() : 0;
    const bTime = b.date ? new Date(b.date).getTime() : 0;
    return bTime - aTime;
  });
}

export function getPublicationBySlug(slug: string): PublicationRecord | undefined {
  const needle = normalizeString(slug);
  if (!needle) return undefined;

  return EDITORIAL_CATALOGUE.find(
    (entry: PublicationRecord) => normalizeString(entry.slug) === needle
  );
}