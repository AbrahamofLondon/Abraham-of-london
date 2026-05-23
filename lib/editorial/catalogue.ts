import type { PublicationRecord } from "./types";
import { normalizeUserTier } from "@/lib/access/tier-policy";

function normalizeTag(tag: string): string {
  return String(tag || "").trim().toLowerCase();
}

function normalizePublicationTier(tier: string): PublicationRecord["tier"] {
  return normalizeUserTier(tier || "public") as PublicationRecord["tier"];
}

function sortCatalogue(items: PublicationRecord[]): PublicationRecord[] {
  return [...items].sort((a, b) => {
    const aTime = a.date ? new Date(a.date).getTime() : 0;
    const bTime = b.date ? new Date(b.date).getTime() : 0;
    return bTime - aTime;
  });
}

export const EDITORIAL_CATALOGUE: PublicationRecord[] = sortCatalogue([
  {
    slug: "ultimate-purpose-of-man",
    contentId: "CB-ED-001",
    title: "The Ultimate Purpose of Man",
    subtitle: "Strategic Editorial — The Mandate of Alignment",
    description:
      "A flagship editorial on human purpose, from Eden's design to modern civilisation—written for leaders who refuse to drift.",
    author: "Abraham of London",
    date: "2026-02-12",
    version: "3.1.0",
    status: "Canonical Orientation",
    category: "Theology / Strategy",
    readingTime: "30 minutes",
    tier: "public",

    coverImage: "/assets/images/books/ultimate-purpose-cover.jpg",
    socialImage: "/assets/images/books/ultimate-purpose-social.jpg",

    pdfPath: "/downloads/ultimate-purpose-of-man-editorial",
    epubPath: "/epubs/ultimate-purpose-of-man-editorial.epub",
    previewPath: "/api/editorials/preview/ultimate-purpose-of-man-editorial",

    previewEnabled: true,
    epubEnabled: true,
    printEnabled: false,
    vaultEnabled: false,
    innerCircleEnabled: false,

    tags: [
      "purpose",
      "leadership",
      "theology",
      "strategy",
      "governance",
      "civilisation",
    ],

    citation: {
      citationTitle:
        "The Ultimate Purpose of Man: Strategic Editorial — The Mandate of Alignment",
      citationAuthor: "Abraham of London",
      citationPublisher: "Abraham of London",
      citationYear: "2026",
      canonicalUrl:
        "https://www.abrahamoflondon.org/editorials/ultimate-purpose-of-man",
      doi: "10.54210/aol.2026.001",
    },

    convergenceNote:
      "This editorial is not a campaign piece. It is the convergence text beneath the Canon: the governing statement from which the wider Abraham of London estate draws its concern for purpose, order, drift, judgement, formation, civilisation, and the responsibility of leadership.",
  },
]);

export function getPublicationCatalogue(): PublicationRecord[] {
  return [...EDITORIAL_CATALOGUE];
}

export function getPublicationBySlug(
  slug: string,
): PublicationRecord | undefined {
  const normalized = String(slug || "").trim().toLowerCase();
  if (!normalized) return undefined;

  return EDITORIAL_CATALOGUE.find(
    (entry) => entry.slug.trim().toLowerCase() === normalized,
  );
}

export function getPublicationsByTier(
  tier: PublicationRecord["tier"],
): PublicationRecord[] {
  const normalized = normalizePublicationTier(tier);
  return EDITORIAL_CATALOGUE.filter(
    (entry) => normalizePublicationTier(entry.tier) === normalized,
  );
}

export function getPublicPublications(): PublicationRecord[] {
  return EDITORIAL_CATALOGUE.filter(
    (entry) => normalizePublicationTier(entry.tier) === "public",
  );
}

export function getPublicationsWithTag(tag: string): PublicationRecord[] {
  const normalized = normalizeTag(tag);
  if (!normalized) return [];

  return EDITORIAL_CATALOGUE.filter((entry) =>
    entry.tags.some((entryTag) => normalizeTag(entryTag) === normalized),
  );
}
