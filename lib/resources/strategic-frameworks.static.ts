/* lib/resources/strategic-frameworks.static.ts */

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

export const FRAMEWORKS: Framework[] = [
  {
    key: "S-001",
    slug: "sovereignty-index",
    title: "The Sovereignty Index",
    oneLiner: "A diagnostic tool for measuring institutional autonomy against external volatility.",
    tier: ["Founder", "Board"],
    tag: "Protocol 01",
    accent: "gold",
    canonRoot: "The Architecture of Human Purpose",
    executiveSummary: [
      "Sovereignty is not isolation; it is the strategic management of dependencies.",
      "This framework quantifies your agency relative to external market nodes."
    ],
    useWhen: [
      "Assessing vendor concentration risk",
      "During institutional restructuring",
      "Evaluating geopolitical exposure"
    ],
    inputs: ["Vendor Audit", "Critical Infrastructure Map", "Capital Runway"],
    outputs: ["Sovereignty Ratio", "Dependency Hot-Map", "Redundancy Playbook"],
    operatingLogic: [
      { 
        title: "The Dependency Axial", 
        body: "Calculates the probability of institutional halt if any single node is severed." 
      }
    ],
    applicationPlaybook: [
      { step: "01", detail: "Identify the top 5 critical external nodes.", deliverable: "Node Inventory" },
      { step: "02", detail: "Simulate a 72-hour node blackout.", deliverable: "Impact Report" }
    ],
    metrics: [
      { metric: "Autonomy Ratio", whyItMatters: "Indicates time-to-halt.", reviewCadence: "Monthly" }
    ],
    boardQuestions: ["Is our agency borrowed or owned?"],
    failureModes: ["Treating digital services as utilities rather than strategic vulnerabilities."],
    whatToDoNext: ["Begin a Dark Node Audit with the CTO and Legal."],
    artifactHref: "/artifacts/sovereignty-index-v1.pdf"
  }
];

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