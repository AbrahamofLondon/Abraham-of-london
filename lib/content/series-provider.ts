// lib/content/series-provider.ts — HARDENED (Automated Knowledge Graph)
import { allPosts, Post } from "contentlayer/generated";
import { normalizeSlug } from "./shared";

interface SeriesLink {
  title: string;
  href: string;
  isCurrent: boolean;
  status: 'completed' | 'current' | 'locked';
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
  
  // 1. Find the current document
  const currentDoc = allPosts.find(p => 
    normalizeSlug(p.slug || p._raw.flattenedPath) === normalizedCurrent
  );

  if (!currentDoc?.series) return null;

  // 2. Extract and Sort the entire sequence
  const seriesDocs = allPosts
    .filter(p => p.series === currentDoc.series && !p.draft)
    .sort((a, b) => {
      // Priority 1: Manual 'order' field | Priority 2: Chronological date
      if (a.order !== undefined && b.order !== undefined) return a.order - b.order;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

  const totalSteps = seriesDocs.length;
  const currentIndex = seriesDocs.findIndex(p => 
    normalizeSlug(p.slug || p._raw.flattenedPath) === normalizedCurrent
  );

  // 3. Construct the Link Manifest
  const links: SeriesLink[] = seriesDocs.map((doc, index) => ({
    title: doc.title,
    href: `/${doc._raw.flattenedPath}`,
    isCurrent: index === currentIndex,
    status: index < currentIndex ? 'completed' : index === currentIndex ? 'current' : 'locked',
  }));

  return {
    seriesTitle: currentDoc.series,
    currentStep: currentIndex + 1,
    totalSteps,
    links,
  };
}