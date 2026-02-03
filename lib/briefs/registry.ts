/* ============================================================================
 * SOVEREIGN INTELLIGENCE REGISTRY [V1.0.0]
 * ============================================================================ */

export type Classification = "Public" | "Private" | "Restricted";

export interface BriefEntry {
  id: string;        // Vol ID (e.g., "brief-01")
  volume: number;
  title: string;
  series: string;    // e.g., "Institutional Design", "Market Intelligence"
  abstract: string;
  classification: Classification;
  readingTime: string;
  tags: string[];
  publishedAt: string;
}

export const BRIEF_REGISTRY: BriefEntry[] = [
  {
    id: "v1-resilience",
    volume: 1,
    title: "The Resilience Framework",
    series: "Institutional Design",
    abstract: "A fundamental re-evaluation of institutional stability within frontier markets.",
    classification: "Restricted",
    readingTime: "12 min",
    tags: ["Governance", "Stability", "Directorate"],
    publishedAt: "2026-01-15",
  },
  // ... We will expand this to all 75 assets
];

/**
 * Helper to fetch a brief by its unique ID
 */
export const getBriefById = (id: string): BriefEntry | undefined => {
  return BRIEF_REGISTRY.find((brief) => brief.id === id);
};