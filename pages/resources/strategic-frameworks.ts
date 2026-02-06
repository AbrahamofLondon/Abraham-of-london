/* lib/resources/strategic-frameworks.ts — UPDATED FOR SLUG RESOLUTION */
import prisma from "@/lib/prisma";

export const LIBRARY_HREF = "/resources/strategic-frameworks";

export interface OperatingLogic {
  title: string;
  body: string;
}

export interface PlaybookStep {
  step: number;
  detail: string;
  deliverable: string;
}

export interface Metric {
  metric: string;
  whyItMatters: string;
  reviewCadence: string;
}

export interface Framework {
  slug: string;
  title: string;
  oneLiner: string;
  tier: string[];
  tag?: string;
  accent?: 'gold' | 'emerald' | 'blue' | 'rose' | 'indigo';
  canonRoot?: string;
  executiveSummary?: string[];
  operatingLogic?: OperatingLogic[];
  applicationPlaybook?: PlaybookStep[];
  metrics?: Metric[];
  boardQuestions?: string[];
  failureModes?: string[];
  whatToDoNext?: string[];
  artifactHref?: string;
}

/**
 * 1. Hard-coded Foundations (The Canon Offshoots)
 */
const FOUNDATION_TRACK: Framework[] = [
  {
    slug: "sovereignty-index",
    title: "The Sovereignty Index",
    oneLiner: "A diagnostic tool for measuring institutional autonomy against external volatility.",
    tier: ["Founder", "Board"],
    tag: "Protocol 01",
    accent: "gold",
    canonRoot: "The Architecture of Human Purpose",
    executiveSummary: [
      "Sovereignty is not absolute; it is a measurable ratio of internal agency to external dependency.",
      "This framework provides a numerical baseline for institutional resilience."
    ],
    operatingLogic: [
      { title: "The Dependency Axial", body: "Identify the top 3 external nodes that, if severed, halt operations." }
    ],
    applicationPlaybook: [
      { step: 1, detail: "Audit external service dependencies.", deliverable: "Dependency Map" }
    ],
    metrics: [
      { metric: "Autonomy Ratio", whyItMatters: "Indicates survival time.", reviewCadence: "Quarterly" }
    ],
    boardQuestions: ["If our primary vendor pivots, do we exist?"],
    failureModes: ["Treating sovereignty as isolationism rather than resilience."],
    whatToDoNext: ["Run the Dependency Axial audit with your CTO."],
    artifactHref: "/artifacts/sovereignty-index-v1.pdf"
  }
];

/**
 * 2. Static Resolution
 */
export function getAllFrameworkSlugs(): string[] {
  return FOUNDATION_TRACK.map(f => f.slug);
}

export function getFrameworkBySlug(slug: string): Framework | undefined {
  return FOUNDATION_TRACK.find(f => f.slug === slug);
}

/**
 * 3. Dynamic Registry Integration
 */
export async function getServerFrameworkBySlug(slug: string): Promise<Framework | null> {
  // Logic to fetch from Prisma ContentMetadata if not found in Foundation Track
  return null; 
}