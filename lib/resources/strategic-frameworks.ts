/* lib/resources/strategic-frameworks.ts */
import prisma from "@/lib/prisma";

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

/* -------------------------------------------------------------------------- */
/* RESOLUTION LOGIC                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Returns all available slugs for SSG (getStaticPaths)
 */
export function getAllFrameworkSlugs(): string[] {
  // Combine static foundation and potentially dynamic database slugs
  return FOUNDATION_TRACK.map(f => f.slug);
}

/**
 * Primary resolver for [slug].tsx (getStaticProps)
 */
export function getFrameworkBySlug(slug: string): Framework | undefined {
  return FOUNDATION_TRACK.find(f => f.slug === slug);
}

/**
 * Extended Resolver: Checks Static Registry first, then Database Metadata
 */
export async function getInstitutionalFramework(slug: string): Promise<Framework | null> {
  // 1. Check static briefs
  const staticMatch = getFrameworkBySlug(slug);
  if (staticMatch) return staticMatch;

  // 2. Check Database for dynamically added Briefs (from your 75+ portfolio)
  try {
    const meta = await prisma.contentMetadata.findUnique({
      where: { slug: `framework/${slug}` }
    });

    if (!meta) return null;

    // Typecast stored JSON to Framework interface
    return {
      slug,
      title: meta.title,
      oneLiner: meta.description || "",
      tier: (meta.requiredRoles as string[]) || ["Inner Circle"],
      ...((meta.payload as any) || {})
    };
  } catch (e) {
    console.error("Library Resolution Failure", e);
    return null;
  }
}