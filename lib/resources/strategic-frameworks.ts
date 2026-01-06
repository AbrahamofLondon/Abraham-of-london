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

// ... [Keep your FRAMEWORKS array exactly as provided] ...
export const FRAMEWORKS: Framework[] = [ 
    /* Your data here */ 
];

/**
 * INSTITUTIONAL GETTERS
 */

// MISSING PIECE: Explicitly export the full collection
export function getAllFrameworks(): Framework[] {
  return FRAMEWORKS;
}

export function getFrameworkBySlug(slug: string): Framework | null {
  return FRAMEWORKS.find((f) => f.slug === slug) ?? null;
}

export function getAllFrameworkSlugs(): string[] {
  return FRAMEWORKS.map((f) => f.slug);
}
