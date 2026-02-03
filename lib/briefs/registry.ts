/* lib/briefs/registry.ts — MISSION CONTROL FOR 75 BRIEFS */

export interface BriefEntry {
  id: string;
  title: string;
  abstract: string;
  series: string;
  volume: number;
  date: string;
  classification: "Public" | "Inner Circle" | "Restricted";
  readingTime: string;
  tags: string[];
}

export const BRIEF_REGISTRY: BriefEntry[] = [
  {
    id: "frontier-resilience-01",
    title: "Institutional Resilience in Frontier Markets",
    abstract: "A framework for designing robust operational architectures in high-volatility environments.",
    series: "Frontier Strategy",
    volume: 1,
    date: "2026-01-15",
    classification: "Inner Circle",
    readingTime: "12 min",
    tags: ["Strategy", "Risk", "Emerging-Markets"]
  },
  // ... Imagine 74 more entries here
];

export function getBriefById(id: string) {
  return BRIEF_REGISTRY.find(b => b.id === id);
}