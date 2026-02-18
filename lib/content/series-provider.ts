// lib/content/series-provider.ts — HARDENED (Automated Knowledge Graph)
import { allPosts } from "contentlayer/generated";
import { normalizeSlug } from "./shared";

// Define the Post type locally (safe, stable)
type Post = {
  _id: string;
  _raw: {
    sourceFilePath: string;
    sourceFileName: string;
    sourceFileDir: string;
    contentType: string;
    flattenedPath: string;
  };
  type: string;
  title: string;
  slug?: string;
  series?: string;
  order?: number;
  draft?: boolean;
  published?: boolean;
  date?: string;
  [key: string]: any;
};

interface SeriesLink {
  title: string;
  href: string;
  isCurrent: boolean;
  status: "completed" | "current" | "locked";
}

interface SeriesData {
  seriesTitle: string;
  currentStep: number;
  totalSteps: number;
  links: SeriesLink[];
}

/**
 * SCALABLE SERIES RESOLUTION
 * Automatically builds the intelligence chain for any given dispatch.
 */
export function getSeriesData(currentSlug: string): SeriesData | null {
  const normalizedCurrent = normalizeSlug(currentSlug);

  const posts = (allPosts as unknown as Post[]) ?? [];

  // 1) Current doc
  const currentDoc = posts.find(
    (p) => normalizeSlug(p.slug || p._raw.flattenedPath) === normalizedCurrent
  );

  if (!currentDoc?.series) return null;

  // 2) Full sequence
  const seriesDocs = posts
    .filter((p) => p.series === currentDoc.series && !p.draft)
    .sort((a, b) => {
      if (a.order !== undefined && b.order !== undefined) return a.order - b.order;
      return new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime();
    });

  const totalSteps = seriesDocs.length;

  const currentIndex = seriesDocs.findIndex(
    (p) => normalizeSlug(p.slug || p._raw.flattenedPath) === normalizedCurrent
  );

  // 3) Link manifest
  const links: SeriesLink[] = seriesDocs.map((doc, index) => ({
    title: doc.title,
    href: `/${doc._raw.flattenedPath}`,
    isCurrent: index === currentIndex,
    status: index < currentIndex ? "completed" : index === currentIndex ? "current" : "locked",
  }));

  return {
    seriesTitle: currentDoc.series,
    currentStep: Math.max(1, currentIndex + 1),
    totalSteps,
    links,
  };
}