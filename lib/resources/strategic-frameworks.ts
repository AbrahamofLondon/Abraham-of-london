/* lib/resources/strategic-frameworks.ts */

export type FrameworkTier = "Board" | "Founder" | "Household";
export type FrameworkAccent = "gold" | "emerald" | "blue" | "rose" | "indigo";

export type Framework = {
  key: string;
  slug: string;
  title: string;
  oneLiner: string;
  tier: FrameworkTier[];
  tag: string;
  canonRoot: string;
  executiveSummary: string[];
  useWhen: string[];
  inputs: string[];
  outputs: string[];
  operatingLogic: Array<{ title: string; body: string }>;
  applicationPlaybook: Array<{ step: string; detail: string; deliverable: string }>;
  metrics: Array<{ metric: string; whyItMatters: string; reviewCadence: string }>;
  boardQuestions: string[];
  failureModes: string[];
  whatToDoNext: string[];
  artifactHref?: string;
  accent: FrameworkAccent;
};

export const LIBRARY_HREF = "/resources/strategic-frameworks";

// KEEP YOUR DATA EXACTLY AS-IS
export const FRAMEWORKS: Framework[] = [
  /* Your data here */
];

/**
 * INSTITUTIONAL GETTERS (CANONICAL)
 */
export function getAllFrameworks(): Framework[] {
  return FRAMEWORKS;
}

export function getFrameworkBySlug(slug: string): Framework | null {
  const s = String(slug || "").trim().replace(/^\/+/, "").replace(/\/+$/, "");
  if (!s) return null;
  return FRAMEWORKS.find((f) => f.slug === s) ?? null;
}

export function getAllFrameworkSlugs(): string[] {
  return FRAMEWORKS.map((f) => f.slug);
}

/**
 * CONTRACT EXPORTS (PAGES EXPECT THESE NAMES)
 * - pages/resources/strategic-frameworks/index.tsx imports getServerAllFrameworks
 * - pages/resources/strategic-frameworks/[slug].tsx imports getServerFrameworkBySlug
 */
export const getServerAllFrameworks = getAllFrameworks;
export const getServerFrameworkBySlug = getFrameworkBySlug;