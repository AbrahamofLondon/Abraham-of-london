// lib/content.ts
// Core content access + aesthetic metadata for the Library of Applied Wisdom.

import {
  allPosts,
  allBooks,
  allEvents,
  allDownloads,
  allPrints,
  allResources,
  allCanons,
} from "../.contentlayer/generated";

import type {
  Post,
  Book,
  Event,
  Download,
  Print,
  Resource,
  Canon,
} from "../.contentlayer/generated";

/* -------------------------------------------------------------------------- */
/* TYPES                                                                      */
/* -------------------------------------------------------------------------- */

export type AnyContent =
  | Post
  | Book
  | Event
  | Download
  | Print
  | Resource
  | Canon;

export type CanonDoc = Canon;

/* -------------------------------------------------------------------------- */
/* GENERAL HELPERS                                                            */
/* -------------------------------------------------------------------------- */

function sortByDate<T extends { date?: string | null }>(
  items: readonly T[],
): T[] {
  return [...items].sort((a, b) => {
    const da = a.date ? new Date(a.date).getTime() : 0;
    const db = b.date ? new Date(b.date).getTime() : 0;
    return db - da; // newest first
  });
}

/* -------------------------------------------------------------------------- */
/* RAW CONTENT ACCESSORS (NO AESTHETIC DECORATION)                            */
/* -------------------------------------------------------------------------- */

export function getAllPosts(): Post[] {
  return sortByDate(
    (allPosts as Post[]).filter((p) => !(p as any).draft),
  );
}

export function getPostBySlug(slug: string): Post | null {
  return getAllPosts().find((p) => p.slug === slug) ?? null;
}

export function getAllBooks(): Book[] {
  return sortByDate(allBooks as Book[]).filter(
    (b) => !(b as any).draft && (b as any).status !== "draft",
  );
}

export function getBookBySlug(slug: string): Book | null {
  return getAllBooks().find((b) => b.slug === slug) ?? null;
}

export function getAllEvents(): Event[] {
  return sortByDate(allEvents as Event[]);
}

export function getEventBySlug(slug: string): Event | null {
  return getAllEvents().find((e) => e.slug === slug) ?? null;
}

export function getAllDownloads(): Download[] {
  return sortByDate(allDownloads as Download[]);
}

export function getDownloadBySlug(slug: string): Download | null {
  return getAllDownloads().find((d) => d.slug === slug) ?? null;
}

export function getAllPrints(): Print[] {
  return sortByDate(allPrints as Print[]);
}

export function getPrintBySlug(slug: string): Print | null {
  return getAllPrints().find((p) => p.slug === slug) ?? null;
}

export function getAllResources(): Resource[] {
  return sortByDate(allResources as Resource[]);
}

export function getResourceBySlug(slug: string): Resource | null {
  return getAllResources().find((r) => r.slug === slug) ?? null;
}

export function getAllCanonDocs(): CanonDoc[] {
  return sortByDate(
    (allCanons as CanonDoc[]).filter((doc) => !(doc as any).draft),
  );
}

export function getCanonBySlug(slug: string): CanonDoc | null {
  return getAllCanonDocs().find((doc) => doc.slug === slug) ?? null;
}

/* -------------------------------------------------------------------------- */
/* UNIFIED CONTENT LIST (USED BY /content)                                    */
/* -------------------------------------------------------------------------- */

export function getAllContent(): AnyContent[] {
  return sortByDate([
    ...getAllPosts(),
    ...getAllBooks(),
    ...getAllEvents(),
    ...getAllDownloads(),
    ...getAllPrints(),
    ...getAllResources(),
    ...getAllCanonDocs(),
  ]);
}

/* -------------------------------------------------------------------------- */
/* AESTHETIC CONSTANTS – HARR0DS × ANCIENT PERSIAN LIBRARY                    */
/* -------------------------------------------------------------------------- */

export const LIBRARY_AESTHETICS = {
  colors: {
    primary: {
      lapis: "#283B5C", // Deep Persian blue
      saffron: "#DAA520", // Gold accent
      terracotta: "#B35441", // Earthy red
      parchment: "#F5F1E6", // Cream background
      malachite: "#0B9E7C", // Green accent
    },
    accents: {
      gilded: "#E8C170", // Soft gold
      indigo: "#4B0082", // Deep purple
    },
  },
  symbols: {
    wisdom: ["𓀲", "☿", "𓆓"],
    knowledge: "📜",
    portal: "𓇯",
    infinity: "∞",
  },
} as const;

export const CONTENT_CATEGORIES = {
  POSTS: {
    id: "strategic-insights",
    title: "Strategic Essays",
    description: "Timeless wisdom for modern challenges.",
    icon: "𓆓",
    color: LIBRARY_AESTHETICS.colors.primary.lapis,
    signal: {
      subtle: "Illuminated manuscripts of contemporary thought.",
      texture: "textured-parchment",
    },
  },

  BOOKS: {
    id: "curated-volumes",
    title: "Curated Volumes",
    description: "Bound knowledge for discerning minds.",
    icon: "📚",
    color: LIBRARY_AESTHETICS.colors.primary.terracotta,
    signal: {
      subtle: "Scrolls of applied wisdom.",
      texture: "leather-bound",
    },
  },

  EVENTS: {
    id: "scholarly-gatherings",
    title: "Live Sessions",
    description: "Conversations in curated spaces.",
    icon: "𓇯",
    color: LIBRARY_AESTHETICS.colors.primary.malachite,
    signal: {
      subtle: "Symposiums for strategic exchange.",
      texture: "ceramic-tile",
    },
  },

  DOWNLOADS: {
    id: "tools-of-application",
    title: "Execution Tools",
    description: "Practical instruments for implementation.",
    icon: "𓀲",
    color: LIBRARY_AESTHETICS.colors.accents.indigo,
    signal: {
      subtle: "Instruments of practical wisdom.",
      texture: "woven-texture",
    },
  },

  PRINTS: {
    id: "art-of-knowledge",
    title: "Print Editions",
    description: "Visual manifestations of insight.",
    icon: "𓍯",
    color: LIBRARY_AESTHETICS.colors.primary.saffron,
    signal: {
      subtle: "Illuminated visual treatises.",
      texture: "gilded-edge",
    },
  },

  RESOURCES: {
    id: "scholars-toolkit",
    title: "Core Resources",
    description: "Companion materials for deep study.",
    icon: "☿",
    color: LIBRARY_AESTHETICS.colors.accents.gilded,
    signal: {
      subtle: "Auxiliary scrolls for the seeker.",
      texture: "papyrus-texture",
    },
  },

  CANON: {
    id: "foundational-texts",
    title: "Canon Volumes",
    description: "Foundational texts of purpose, power & stewardship.",
    icon: "∞",
    color: LIBRARY_AESTHETICS.colors.primary.malachite,
    signal: {
      subtle: "Pillars of perennial wisdom.",
      texture: "stone-tablet",
    },
  },
} as const;

export const SEASONAL_CURATIONS = {
  wisdomTheme: "Persian Library of Applied Wisdom",
  tactileSignals: {
    texture: "Embossed leather, gilded edges, hand-made paper.",
    scent: "Notes of aged paper, sandalwood, and saffron.",
    sound: "Subtle rustle of turning pages, distant fountain.",
  },
  invitation: {
    visual: "Softly illuminated manuscripts on dark wood.",
    text: "A sanctuary for the curious mind.",
    action: "Dwell. Discover. Digest.",
  },
} as const;