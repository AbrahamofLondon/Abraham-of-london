export type EditorialSeriesStatus = "DRAFT" | "PUBLISHED";

export type EditorialSeriesPart = {
  order: number;
  slug: string;
  title: string;
  excerpt: string;
  readTime: string;
  status: EditorialSeriesStatus;
  mdxSlug: string;
};

export type EditorialSeries = {
  id: string;
  slug: string;
  title: string;
  descriptor: string;
  partCount: number;
  status: EditorialSeriesStatus;
  parts: EditorialSeriesPart[];
};

const mindsClayParts: EditorialSeriesPart[] = [
  {
    order: 1,
    slug: "the-living-basket",
    title: "The Living Basket",
    excerpt:
      "Before memory became storage, it was carried in rhythm, story, breath, and the people trusted to keep weaving it.",
    readTime: "10 min read",
    status: "PUBLISHED",
    mdxSlug: "the-living-basket",
  },
  {
    order: 2,
    slug: "the-first-external-hard-drive",
    title: "The First External Hard Drive",
    excerpt:
      "In Uruk, a reed touched wet clay and memory discovered it could leave the skull without leaving the world.",
    readTime: "10 min read",
    status: "PUBLISHED",
    mdxSlug: "the-first-external-hard-drive",
  },
  {
    order: 3,
    slug: "the-hand-that-thinks",
    title: "The Hand That Thinks",
    excerpt:
      "The page does not merely receive a thought. Under the pressure of the hand, it helps make one.",
    readTime: "10 min read",
    status: "PUBLISHED",
    mdxSlug: "the-hand-that-thinks",
  },
  {
    order: 4,
    slug: "the-locked-room",
    title: "The Locked Room",
    excerpt:
      "An oral tradition is a river. An archive is a room. The room can preserve a civilisation and still require a key.",
    readTime: "11 min read",
    status: "PUBLISHED",
    mdxSlug: "the-locked-room",
  },
  {
    order: 5,
    slug: "the-loud-silence",
    title: "The Loud Silence",
    excerpt:
      "When the page multiplied, the reading room went quiet, and silence became one of print's loudest revolutions.",
    readTime: "11 min read",
    status: "PUBLISHED",
    mdxSlug: "the-loud-silence",
  },
  {
    order: 6,
    slug: "the-river-of-sand",
    title: "The River of Sand",
    excerpt:
      "The scroll carries us forward grain by grain, until attention forgets what solid ground feels like.",
    readTime: "11 min read",
    status: "PUBLISHED",
    mdxSlug: "the-river-of-sand",
  },
  {
    order: 7,
    slug: "the-answering-archive",
    title: "The Answering Archive",
    excerpt:
      "The archive once waited for search. Now it answers back, and the human task is to hear fluency without mistaking it for wisdom.",
    readTime: "11 min read",
    status: "PUBLISHED",
    mdxSlug: "the-answering-archive",
  },
  {
    order: 8,
    slug: "the-conductors-baton",
    title: "The Conductor's Baton",
    excerpt:
      "When the room fills with instruments, authorship becomes a question of judgment, responsibility, and who lifts the baton.",
    readTime: "12 min read",
    status: "PUBLISHED",
    mdxSlug: "the-conductors-baton",
  },
  {
    order: 9,
    slug: "the-vessel-and-the-voice",
    title: "The Vessel and the Voice",
    excerpt:
      "Every vessel shapes the voice that enters it. The human task is to choose with care.",
    readTime: "12 min read",
    status: "PUBLISHED",
    mdxSlug: "the-vessel-and-the-voice",
  },
];

const editorialSeriesRegistry: EditorialSeries[] = [
  {
    id: "editorial-series-the-minds-clay",
    slug: "the-minds-clay",
    title: "The Mind's Clay",
    descriptor:
      "A nine-part editorial work on the cognitive technologies that have shaped human memory, attention, authorship, and judgment.",
    partCount: mindsClayParts.length,
    status: "PUBLISHED",
    parts: mindsClayParts,
  },
];

export function getEditorialSeriesCatalogue(): EditorialSeries[] {
  return editorialSeriesRegistry;
}

export function getEditorialSeriesBySlug(slug: string): EditorialSeries | null {
  return editorialSeriesRegistry.find((series) => series.slug === slug) ?? null;
}

export function getEditorialSeriesPart(
  series: EditorialSeries,
  partSlug: string,
): EditorialSeriesPart | null {
  return series.parts.find((part) => part.slug === partSlug) ?? null;
}

export function getEditorialSeriesPartNeighbors(
  series: EditorialSeries,
  partOrder: number,
): {
  previous: EditorialSeriesPart | null;
  next: EditorialSeriesPart | null;
} {
  return {
    previous: series.parts.find((part) => part.order === partOrder - 1) ?? null,
    next: series.parts.find((part) => part.order === partOrder + 1) ?? null,
  };
}

export function formatEditorialSeriesPartNumber(order: number): string {
  const labels = [
    "Zero",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
  ];

  return labels[order] ?? String(order);
}
