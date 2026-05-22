// lib/blog/series.ts
// Hardcoded blog series registry — mirrors the pattern of lib/editorial/series.ts
// Extend this file when new blog series are added.

export type BlogSeriesPart = {
  order: number;
  slug: string;           // matches frontmatter slug field (used for URLs)
  title: string;
  excerpt: string;
  readTime: string;
  status: "PUBLISHED" | "DRAFT";
};

export type BlogSeries = {
  slug: string;           // URL slug for the series hub
  title: string;
  description: string;
  excerpt: string;
  category: string;
  tags: string[];
  partCount: number;
  parts: BlogSeriesPart[];
};

// ─── Registry ────────────────────────────────────────────────────────────────

const BLOG_SERIES_REGISTRY: BlogSeries[] = [
  {
    slug: "the-burden-changes-hands",
    title: "The Burden Changes Hands",
    description:
      "Seven applied essays on memory, custody, and the intelligence that organisations build — or fail to build — over time. Derived from the intellectual terrain of The Mind's Clay.",
    excerpt:
      "The first act of institutional memory was a reed pressed into wet clay. What happened to the burden after it left the skull is still happening in every serious organisation in the world.",
    category: "Essays",
    tags: ["memory", "organisations", "institutional-intelligence", "knowledge-management"],
    partCount: 7,
    parts: [
      {
        order: 1,
        slug: "the-accountant-in-uruk",
        title: "The Accountant in Uruk",
        excerpt:
          "In a warehouse in Uruk, someone realised that clay could remember what the mind was struggling to hold. That was not an invention. It was a governance decision.",
        readTime: "11 min read",
        status: "PUBLISHED",
      },
      {
        order: 2,
        slug: "knowledge-can-wait-the-question-is-whether-it-should",
        title: "Knowledge Can Wait. The Question Is Whether It Should.",
        excerpt:
          "A record can outlast its author, survive its context, and speak into a world it never knew. That is the extraordinary promise of written knowledge. It is also the problem.",
        readTime: "12 min read",
        status: "PUBLISHED",
      },
      {
        order: 3,
        slug: "what-the-tablet-cannot-tell-you",
        title: "What the Tablet Cannot Tell You",
        excerpt:
          "Inscription is not validation. The record holds whatever was put into it — including error, assumption, and the confident wrongness of a world that no longer exists.",
        readTime: "11 min read",
        status: "PUBLISHED",
      },
      {
        order: 4,
        slug: "who-holds-the-stylus",
        title: "Who Holds the Stylus",
        excerpt:
          "Within three centuries of the first clay tablet, there were scribal schools in Uruk. The ability to write was not merely a skill. It was a position — and a form of institutional power.",
        readTime: "12 min read",
        status: "PUBLISHED",
      },
      {
        order: 5,
        slug: "the-slow-intelligence",
        title: "The Slow Intelligence",
        excerpt:
          "The staircase of cumulative argument is built slowly, one solid step at a time. Speed of retrieval is not the same as depth of understanding.",
        readTime: "11 min read",
        status: "PUBLISHED",
      },
      {
        order: 6,
        slug: "the-author-who-left-the-room",
        title: "The Author Who Left the Room",
        excerpt:
          "Every policy document, values statement, and operating procedure is an author who left the room. The question isn't whether it still speaks. It's whether anyone is listening critically.",
        readTime: "12 min read",
        status: "PUBLISHED",
      },
      {
        order: 7,
        slug: "the-enduring-archive",
        title: "The Enduring Archive",
        excerpt:
          "King Ashurbanipal sent scribes to copy every clay tablet he could find. Not because he expected to read them all. Because he understood that the accumulation itself had a kind of power.",
        readTime: "13 min read",
        status: "PUBLISHED",
      },
    ],
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getBlogSeriesCatalogue(): BlogSeries[] {
  return BLOG_SERIES_REGISTRY;
}

export function getBlogSeriesBySlug(slug: string): BlogSeries | null {
  return BLOG_SERIES_REGISTRY.find((s) => s.slug === slug) ?? null;
}

export function getBlogSeriesPart(
  series: BlogSeries,
  partSlug: string,
): BlogSeriesPart | null {
  return series.parts.find((p) => p.slug === partSlug) ?? null;
}

export function getBlogSeriesPartNeighbors(
  series: BlogSeries,
  order: number,
): { previous: BlogSeriesPart | null; next: BlogSeriesPart | null } {
  const sorted = [...series.parts].sort((a, b) => a.order - b.order);
  const idx = sorted.findIndex((p) => p.order === order);
  return {
    previous: idx > 0 ? (sorted[idx - 1] ?? null) : null,
    next: idx < sorted.length - 1 ? (sorted[idx + 1] ?? null) : null,
  };
}

export function formatBlogSeriesPartNumber(order: number): string {
  const words = [
    "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
  ];
  return words[order - 1] ?? String(order);
}

export function parseMins(readTime: string): number {
  const m = readTime.match(/(\d+)/);
  return m ? parseInt(m[1] ?? "0", 10) : 0;
}

export function formatTotalTime(minutes: number): string {
  if (minutes < 60) return `~${minutes} min`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `~${hrs} hr ${mins} min` : `~${hrs} hr`;
}
