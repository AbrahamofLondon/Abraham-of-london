/* lib/resources/strategic-frameworks.ts */
import { prisma } from "@/lib/prisma";

export const LIBRARY_HREF = "/resources/strategic-frameworks";

/* -------------------------------------------------------------------------- */
/* TYPES                                                                      */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/* REGISTRY: THE FOUNDATION TRACK (Static)                                    */
/* -------------------------------------------------------------------------- */

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
      "Sovereignty is the ratio of internal agency to external dependency.",
      "This index benchmarks your 'Survival Horizon'—the time your institution can operate if external nodes are severed."
    ],
    operatingLogic: [
      { 
        title: "The Dependency Axial", 
        body: "Identify critical nodes (Vendors, Talent, Capital) that lack immediate redundancy." 
      }
    ],
    applicationPlaybook: [
      { step: 1, detail: "Map primary external dependencies.", deliverable: "Dependency Map" },
      { step: 2, detail: "Calculate cost of node failure.", deliverable: "Risk Assessment" }
    ],
    metrics: [
      { metric: "Autonomy Ratio", whyItMatters: "Measures independence.", reviewCadence: "Quarterly" }
    ],
    boardQuestions: ["If our primary cloud provider pivots, do we exist?"],
    failureModes: ["Treating sovereignty as isolationism rather than resilience."],
    whatToDoNext: ["Execute a 'Dark Node' simulation with your executive team."],
    artifactHref: "/artifacts/sovereignty-index-v1.pdf"
  }
];

// Exported constant for the UI components
export const FRAMEWORKS = FOUNDATION_TRACK;

/* -------------------------------------------------------------------------- */
/* RESOLUTION LOGIC                                                           */
/* -------------------------------------------------------------------------- */

export function getAllFrameworkSlugs(): string[] {
  return FOUNDATION_TRACK.map(f => f.slug);
}

export function getFrameworkBySlug(slug: string): Framework | undefined {
  return FOUNDATION_TRACK.find(f => f.slug === slug);
}

export async function getInstitutionalFramework(slug: string): Promise<Framework | null> {
  const staticMatch = getFrameworkBySlug(slug);
  if (staticMatch) return staticMatch;

  try {
    const meta = await prisma.contentMetadata.findUnique({
      where: { slug: `framework/${slug}` }
    });

    if (!meta) return null;

    return {
      slug,
      title: meta.title,
      oneLiner: meta.description || "",
      tier: (meta.requiredRoles as any) || ["Inner Circle"],
      ...((meta.payload as any) || {})
    };
  } catch (e) {
    console.error("Library Resolution Failure", e);
    return null;
  }
}