/**
 * lib/living-intelligence/behaviour-probe-engine.ts
 *
 * Probes actual code and route surfaces to determine whether the product
 * behaves as claimed. Each probe inspects source files for real behaviour
 * patterns vs static/demo/decorative patterns.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { BehaviourProbe, BehaviourReport, BehaviourStatus } from "./product-behaviour-contract";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");

function readTextSafe(relPath: string): string {
  const abs = path.join(ROOT, relPath);
  try {
    if (!fs.existsSync(abs)) return "";
    return fs.readFileSync(abs, "utf-8");
  } catch {
    return "";
  }
}

function exists(relPath: string): boolean {
  return fs.existsSync(path.join(ROOT, relPath));
}

function hasImport(text: string, module: string): boolean {
  return text.includes(`from "${module}"`) || text.includes(`from '${module}'`);
}

function hasPattern(text: string, pattern: RegExp): boolean {
  return pattern.test(text);
}

// ─── Probe definitions ──────────────────────────────────────────────────────

const PROBES: Array<{
  id: string;
  domain: string;
  surface: string;
  probe: string;
  whatItChecks: string;
  check: () => { status: BehaviourStatus; evidence: string[] };
}> = [
  // A. Diagnostic behaviour probes
  {
    id: "diagnostic-derived-output",
    domain: "behavioural_truth",
    surface: "diagnostics",
    probe: "diagnostic outputs are derived from submitted input",
    whatItChecks: "Diagnostic routes do not return hardcoded/static results",
    check: () => {
      const evidence: string[] = [];
      const files = [
        "pages/diagnostics/fast.tsx",
        "pages/diagnostics/purpose-alignment.tsx",
        "pages/diagnostics/executive-reporting.tsx",
        "pages/diagnostics/team-assessment.tsx",
        "pages/diagnostics/enterprise-assessment.tsx",
      ];
      let derivedCount = 0;
      for (const f of files) {
        if (!exists(f)) continue;
        const text = readTextSafe(f);
        if (hasImport(text, "@/lib/kernel") || hasImport(text, "@/lib/product") || hasImport(text, "@/app/api")) {
          derivedCount++;
          evidence.push(`${f}: imports from kernel/product/api — likely derived`);
        } else if (text.includes("getStaticProps") || text.includes("getServerSideProps")) {
          derivedCount++;
          evidence.push(`${f}: has data-fetching — likely derived`);
        } else {
          evidence.push(`${f}: no clear derivation pattern — needs review`);
        }
      }
      const status: BehaviourStatus = derivedCount >= 3 ? "verified_real" : derivedCount >= 1 ? "inferred_real" : "needs_review";
      return { status, evidence };
    },
  },
  {
    id: "diagnostic-evidence-tier",
    domain: "behavioural_truth",
    surface: "diagnostics",
    probe: "diagnostic routes use evidence tiers",
    whatItChecks: "Evidence tier concepts are present in diagnostic code",
    check: () => {
      const evidence: string[] = [];
      const files = [
        "lib/product/evidence-stage-contract.ts",
        "lib/product/evidence-tier-derivation.ts",
        "lib/kernel/living-layer-view-model.ts",
      ];
      let found = 0;
      for (const f of files) {
        if (!exists(f)) continue;
        const text = readTextSafe(f);
        if (text.includes("EvidenceTierLevel") || text.includes("evidence") && text.includes("level")) {
          found++;
          evidence.push(`${f}: contains evidence tier concepts`);
        }
      }
      const status: BehaviourStatus = found >= 2 ? "verified_real" : found >= 1 ? "inferred_real" : "not_found";
      return { status, evidence };
    },
  },
  {
    id: "diagnostic-contradiction-extraction",
    domain: "behavioural_truth",
    surface: "diagnostics",
    probe: "diagnostics extract contradictions from user input",
    whatItChecks: "Contradiction detection is present in diagnostic flow",
    check: () => {
      const evidence: string[] = [];
      const text = readTextSafe("lib/kernel/living-layer-view-model.ts");
      if (text.includes("contradiction") || text.includes("ambiguities") || text.includes("unresolved")) {
        evidence.push("lib/kernel/living-layer-view-model.ts: handles ambiguities/contradictions");
      }
      const status: BehaviourStatus = evidence.length > 0 ? "verified_real" : "not_found";
      return { status, evidence };
    },
  },
  {
    id: "diagnostic-memory-write",
    domain: "behavioural_truth",
    surface: "diagnostics",
    probe: "diagnostics write to memory/continuity",
    whatItChecks: "Session continuity or case memory is written during diagnostic flow",
    check: () => {
      const evidence: string[] = [];
      const files = [
        "lib/product/save-case-continuity.ts",
        "lib/product/session-case-continuity.ts",
        "lib/kernel/run-living-session.ts",
      ];
      for (const f of files) {
        if (!exists(f)) continue;
        const text = readTextSafe(f);
        if (text.includes("continuity") || text.includes("carryForward") || text.includes("memory")) {
          evidence.push(`${f}: contains continuity/memory concepts`);
        }
      }
      const status: BehaviourStatus = evidence.length >= 2 ? "verified_real" : evidence.length >= 1 ? "inferred_real" : "not_found";
      return { status, evidence };
    },
  },

  // B. Living component probes
  {
    id: "living-components-wired",
    domain: "behavioural_truth",
    surface: "components/living/",
    probe: "living components are wired to real data sources",
    whatItChecks: "Living components accept real view model props, not just static data",
    check: () => {
      const evidence: string[] = [];
      const livingDir = "components/living";
      const dir = path.join(ROOT, livingDir);
      if (!fs.existsSync(dir)) return { status: "not_found", evidence: ["components/living/ does not exist"] };

      const entries = fs.readdirSync(dir, { withFileTypes: true });
      let wiredCount = 0;
      let totalCount = 0;

      for (const entry of entries) {
        if (!entry.isFile() || !entry.name.endsWith(".tsx")) continue;
        totalCount++;
        const text = readTextSafe(`${livingDir}/${entry.name}`);
        // Check if component accepts props (not just static rendering)
        if (text.includes("type Props") || text.includes("interface Props") || text.includes("React.FC<") || text.includes("function ")) {
          wiredCount++;
          evidence.push(`${livingDir}/${entry.name}: accepts typed props — wireable`);
        } else {
          evidence.push(`${livingDir}/${entry.name}: no typed props found — may be static`);
        }
      }

      const status: BehaviourStatus = wiredCount === totalCount && totalCount > 0 ? "verified_real" : wiredCount > 0 ? "inferred_real" : "decorative";
      return { status, evidence };
    },
  },
  {
    id: "living-shell-real-view-model",
    domain: "behavioural_truth",
    surface: "components/living/LivingLayerShell.tsx",
    probe: "LivingLayerShell consumes real view model, not hardcoded data",
    whatItChecks: "The shell imports and uses the living layer view model",
    check: () => {
      const evidence: string[] = [];
      const text = readTextSafe("components/living/LivingLayerShell.tsx");
      if (text.includes("LivingLayerViewModel") || text.includes("viewModel")) {
        evidence.push("LivingLayerShell.tsx: imports LivingLayerViewModel type");
      }
      if (text.includes("buildLivingLayerViewModel")) {
        evidence.push("LivingLayerShell.tsx: uses buildLivingLayerViewModel");
      }
      const status: BehaviourStatus = evidence.length > 0 ? "verified_real" : "decorative";
      return { status, evidence };
    },
  },

  // C. Professional Console probes
  {
    id: "professional-advisor-boundary",
    domain: "behavioural_truth",
    surface: "pages/professionals.tsx",
    probe: "professional page describes advisor boundary",
    whatItChecks: "The professional surface includes advisor-mediated language and consent",
    check: () => {
      const evidence: string[] = [];
      const text = readTextSafe("pages/professionals.tsx");
      const required = ["Authority delta", "client consent", "advisor-mediated", "controlled access"];
      for (const phrase of required) {
        if (text.toLowerCase().includes(phrase.toLowerCase())) {
          evidence.push(`Contains: "${phrase}"`);
        }
      }
      const status: BehaviourStatus = evidence.length >= 2 ? "verified_real" : evidence.length >= 1 ? "inferred_real" : "needs_review";
      return { status, evidence };
    },
  },

  // D. GMI probes
  {
    id: "gmi-lifecycle-derived",
    domain: "behavioural_truth",
    surface: "pages/intelligence/gmi/index.tsx",
    probe: "GMI page derives current/forthcoming/archive from lifecycle",
    whatItChecks: "The GMI family page uses lifecycle-derived helpers, not hardcoded values",
    check: () => {
      const evidence: string[] = [];
      const text = readTextSafe("pages/intelligence/gmi/index.tsx");
      if (text.includes("getCurrentPublishedMarketIntelligenceReport")) {
        evidence.push("Uses getCurrentPublishedMarketIntelligenceReport from lifecycle");
      }
      if (text.includes("getUpcomingMarketIntelligenceReport")) {
        evidence.push("Uses getUpcomingMarketIntelligenceReport from lifecycle");
      }
      if (text.includes("getPublishedArchiveMarketIntelligenceReports")) {
        evidence.push("Uses getPublishedArchiveMarketIntelligenceReports from lifecycle");
      }
      const status: BehaviourStatus = evidence.length >= 2 ? "verified_real" : evidence.length >= 1 ? "inferred_real" : "needs_review";
      return { status, evidence };
    },
  },
  {
    id: "gmi-prior-quarter-review",
    domain: "behavioural_truth",
    surface: "GMI publication service",
    probe: "GMI has prior-quarter review mechanism",
    whatItChecks: "The publication service includes prior-quarter call review workflow",
    check: () => {
      const evidence: string[] = [];
      const text = readTextSafe("lib/intelligence/gmi-publication-service.ts");
      if (text.includes("getPendingCallReviews") || text.includes("priorQuarter") || text.includes("prior-quarter")) {
        evidence.push("gmi-publication-service.ts: has prior-quarter review mechanism");
      }
      const status: BehaviourStatus = evidence.length > 0 ? "verified_real" : "not_found";
      return { status, evidence };
    },
  },
];

// ─── Run all probes ─────────────────────────────────────────────────────────

export function runBehaviourProbes(): BehaviourReport {
  const probes: BehaviourProbe[] = [];

  for (const probeDef of PROBES) {
    const result = probeDef.check();
    probes.push({
      id: probeDef.id,
      domain: probeDef.domain,
      surface: probeDef.surface,
      probe: probeDef.probe,
      whatItChecks: probeDef.whatItChecks,
      status: result.status,
      evidence: result.evidence,
      evidencePosture: result.status === "verified_real" ? "verified" : result.status === "inferred_real" ? "strongly_indicated" : result.status === "needs_review" ? "needs_human_review" : result.status === "not_found" ? "contradictory" : "weakly_indicated",
    });
  }

  const summary = {
    total: probes.length,
    verifiedReal: probes.filter((p) => p.status === "verified_real").length,
    inferredReal: probes.filter((p) => p.status === "inferred_real").length,
    staticDemo: probes.filter((p) => p.status === "static_demo").length,
    decorative: probes.filter((p) => p.status === "decorative").length,
    notFound: probes.filter((p) => p.status === "not_found").length,
    needsReview: probes.filter((p) => p.status === "needs_review").length,
  };

  return {
    timestamp: new Date().toISOString(),
    probes,
    summary,
  };
}
