// lib/content.ts
// Content access + aesthetic metadata

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

export type AnyContent = Post | Book | Event | Download | Print | Resource;
export type CanonDoc = Canon;

/* -------------------------------------------------------------------------- */
/* AESTHETIC & THEME CONSTANTS                                                */
/* -------------------------------------------------------------------------- */

export const LIBRARY_AESTHETICS = {
  colors: {
    primary: {
      lapis: "#283B5C",
      saffron: "#DAA520",
      terracotta: "#B35441",
      parchment: "#F5F1E6",
      malachite: "#0B9E7C",
    },
    accents: {
      gilded: "#E8C170",
      indigo: "#4B0082",
    },
  },
  symbols: {
    wisdom: ["𓀲", "☿", "𓆓"],
    knowledge: "📜",
    portal: "𓇯",
    infinity: "∞",
  },
} as const;

/* -------------------------------------------------------------------------- */

export const CONTENT_CATEGORIES = {
  POSTS: {
    id: "strategic-insights",
    title: "Strategic Insights",
    description: "Timeless wisdom for modern challenges",
    icon: "𓆓",
    color: LIBRARY_AESTHETICS.colors.primary.lapis,
    signal: {
      subtle: "Illuminated manuscripts of contemporary thought",
      texture: "textured-parchment",
    },
  },

  BOOKS: {
    id: "curated-volumes",
    title: "Curated Volumes",
    description: "Bound knowledge for discerning minds",
    icon: "📚",
    color: LIBRARY_AESTHETICS.colors.primary.terracotta,
    signal: {
      subtle: "Scrolls of applied wisdom",
      texture: "leather-bound",
    },
  },

  EVENTS: {
    id: "scholarly-gatherings",
    title: "Scholarly Gatherings",
    description: "Conversations in curated spaces",
    icon: "𓇯",
    color: LIBRARY_AESTHETICS.colors.primary.malachite,
    signal: {
      subtle: "Symposiums for intellectual exchange",
      texture: "ceramic-tile",
    },
  },

  DOWNLOADS: {
    id: "tools-of-application",
    title: "Execution Tools",
    description: "Practical instruments for implementation",
    icon: "𓀲",
    color: LIBRARY_AESTHETICS.colors.accents.indigo,
    signal: {
      subtle: "Instruments of practical wisdom",
      texture: "woven-texture",
    },
  },

  PRINTS: {
    id: "art-of-knowledge",
    title: "Print Editions",
    description: "Visual manifestations of insight",
    icon: "𓍯",
    color: LIBRARY_AESTHETICS.colors.primary.saffron,
    signal: {
      subtle: "Illuminated visual treatises",
      texture: "gilded-edge",
    },
  },

  RESOURCES: {
    id: "scholars-toolkit",
    title: "Scholar's Toolkit",
    description: "Companion materials for deep study",
    icon: "☿",
    color: LIBRARY_AESTHETICS.colors.accents.gilded,
    signal: {
      subtle: "Auxiliary scrolls for the seeker",
      texture: "papyrus-texture",
    },
  },

  CANON: {
    id: "foundational-texts",
    title: "Foundational Texts",
    description: "Cornerstone principles and philosophies",
    icon: "∞",
    color: LIBRARY_AESTHETICS.colors.primary.malachite,
    signal: {
      subtle: "Pillars of perennial wisdom",
      texture: "stone-tablet",
    },
  },
} as const;

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                    */
/* -------------------------------------------------------------------------- */

interface AestheticItem {
  date?: string | null;
  // runtime discriminator we add below
  _kind?: "post" | "book" | "event" | "download" | "print" | "resource" | "canon";
}

function sortByDate<T extends AestheticItem>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => {
    const da = a.date ? new Date(a.date).getTime() : 0;
    const db = b.date ? new Date(b.date).getTime() : 0;
    return db - da; // newest first
  });
}

function applyAestheticSignature<T extends AestheticItem>(
  items: T[],
  category: keyof typeof CONTENT_CATEGORIES
) {
  return items.map((item) => ({
    ...item,
    aesthetic: CONTENT_CATEGORIES[category],
  }));
}

/* -------------------------------------------------------------------------- */
/* CONTENT ACCESSORS (EACH TAGGED WITH _kind)                                 */
/* -------------------------------------------------------------------------- */

// Posts - Strategic Insights
export function getAllPosts() {
  const posts = sortByDate(
    (allPosts as Post[]).filter((p) => !(p as any).draft)
  );
  return applyAestheticSignature(posts, "POSTS").map((p) => ({
    ...p,
    _kind: "post" as const,
  }));
}

export function getPostBySlug(slug: string) {
  return getAllPosts().find((p) => p.slug === slug) ?? null;
}

// Books - Curated Volumes
export function getAllBooks() {
  const books = sortByDate(allBooks as Book[]).filter(
    (b) => !(b as any).draft && (b as any).status !== "draft"
  );
  return applyAestheticSignature(books, "BOOKS").map((b) => ({
    ...b,
    _kind: "book" as const,
  }));
}

export function getBookBySlug(slug: string) {
  return getAllBooks().find((b) => b.slug === slug) ?? null;
}

// Events - Scholarly Gatherings
export function getAllEvents() {
  const events = sortByDate(allEvents as Event[]);
  return applyAestheticSignature(events, "EVENTS").map((e) => ({
    ...e,
    _kind: "event" as const,
  }));
}

export function getEventBySlug(slug: string) {
  return getAllEvents().find((e) => e.slug === slug) ?? null;
}

// Downloads - Execution Tools
export function getAllDownloads() {
  const downloads = sortByDate(allDownloads as Download[]);
  return applyAestheticSignature(downloads, "DOWNLOADS").map((d) => ({
    ...d,
    _kind: "download" as const,
  }));
}

export function getDownloadBySlug(slug: string) {
  return getAllDownloads().find((d) => d.slug === slug) ?? null;
}

// Prints - Art of Knowledge
export function getAllPrints() {
  const prints = sortByDate(allPrints as Print[]);
  return applyAestheticSignature(prints, "PRINTS").map((p) => ({
    ...p,
    _kind: "print" as const,
  }));
}

export function getPrintBySlug(slug: string) {
  return getAllPrints().find((p) => p.slug === slug) ?? null;
}

// Resources - Scholar's Toolkit
export function getAllResources() {
  const resources = sortByDate(allResources as Resource[]);
  return applyAestheticSignature(resources, "RESOURCES").map((r) => ({
    ...r,
    _kind: "resource" as const,
  }));
}

export function getResourceBySlug(slug: string) {
  return getAllResources().find((r) => r.slug === slug) ?? null;
}

// Canon - Foundational Texts
export function getAllCanonDocs() {
  const canonDocs = [...allCanons].filter((doc) => !(doc as any).draft);
  return applyAestheticSignature(canonDocs, "CANON").map((c) => ({
    ...c,
    _kind: "canon" as const,
  }));
}

export function getCanonBySlug(slug: string) {
  return getAllCanonDocs().find((doc) => doc.slug === slug) ?? null;
}

/* -------------------------------------------------------------------------- */
/* UNIFIED CONTENT ACCESS                                                     */
/* -------------------------------------------------------------------------- */

export function getAllContent() {
  return [
    ...getAllPosts(),
    ...getAllBooks(),
    ...getAllEvents(),
    ...getAllDownloads(),
    ...getAllPrints(),
    ...getAllResources(),
  ].sort((a, b) => {
    const da = a.date ? new Date(a.date).getTime() : 0;
    const db = b.date ? new Date(b.date).getTime() : 0;
    return db - da;
  });
}

/* -------------------------------------------------------------------------- */

export function getCategorySummary() {
  const posts = getAllPosts();
  const books = getAllBooks();
  const events = getAllEvents();
  const downloads = getAllDownloads();
  const prints = getAllPrints();
  const resources = getAllResources();
  const canon = getAllCanonDocs();

  const counts = {
    POSTS: posts.length,
    BOOKS: books.length,
    EVENTS: events.length,
    DOWNLOADS: downloads.length,
    PRINTS: prints.length,
    RESOURCES: resources.length,
    CANON: canon.length,
  } as const;

  return (Object.entries(CONTENT_CATEGORIES) as [
    keyof typeof CONTENT_CATEGORIES,
    (typeof CONTENT_CATEGORIES)[keyof typeof CONTENT_CATEGORIES]
  ][]).map(([key, config]) => {
    const latestItems =
      key === "POSTS"
        ? posts
        : key === "BOOKS"
        ? books
        : key === "EVENTS"
        ? events
        : key === "DOWNLOADS"
        ? downloads
        : key === "PRINTS"
        ? prints
        : key === "RESOURCES"
        ? resources
        : canon;

    return {
      id: config.id,
      title: config.title,
      description: config.description,
      icon: config.icon,
      color: config.color,
      count: counts[key],
      signal: config.signal,
      latestItems: latestItems.slice(0, 3),
    };
  });
}

/* -------------------------------------------------------------------------- */

export const SEASONAL_CURATIONS = {
  wisdomTheme: "Persian Library of Applied Wisdom",
  tactileSignals: {
    texture: "Embossed leather, gilded edges, hand-made paper",
    scent: "Notes of aged paper, sandalwood, and saffron",
    sound: "Subtle rustle of turning pages, distant fountain",
  },
  invitation: {
    visual: "Softly illuminated manuscripts on dark wood",
    text: "A sanctuary for the curious mind",
    action: "Dwell. Discover. Digest.",
  },
} as const;