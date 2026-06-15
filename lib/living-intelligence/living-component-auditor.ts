/**
 * lib/living-intelligence/living-component-auditor.ts
 *
 * Audits each living component to determine:
 *   - Does it accept real data props?
 *   - Is it wired to any real route?
 *   - Is it used only with static/demo data?
 *   - Does it express doctrine accurately?
 *   - Which living engine output should feed it?
 *   - Is it safe for public use, internal use, or future use only?
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

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

export type ComponentAuditStatus =
  | "wired_real"       // Connected to real data source
  | "wired_inferred"   // Likely wired based on imports/props
  | "static_demo"      // Only used with static/demo data
  | "dormant"          // Exists but not used anywhere
  | "needs_review";    // Ambiguous

export type ComponentAudit = {
  name: string;
  path: string;
  status: ComponentAuditStatus;
  hasTypedProps: boolean;
  hasRealDataSource: boolean;
  usedWithStaticData: boolean;
  doctrineAccuracy: string;
  recommendedEngineOutput: string;
  safetyLevel: "public" | "internal" | "future";
  evidence: string[];
};

const LIVING_COMPONENTS = [
  "DecisionAdvantageSummary.tsx",
  "EvidenceStrengthMeter.tsx",
  "GovernedActionPanel.tsx",
  "HumanReviewPrompt.tsx",
  "IntelligenceGainPanel.tsx",
  "LivingLayerShell.tsx",
  "LivingSpineProgress.tsx",
  "NextLayerUnlockedPanel.tsx",
  "OutcomeMemoryPreview.tsx",
  "WhatChangedPanel.tsx",
  "WhatTheSystemHeard.tsx",
];

export function auditLivingComponents(): ComponentAudit[] {
  const results: ComponentAudit[] = [];

  for (const component of LIVING_COMPONENTS) {
    const relPath = `components/living/${component}`;
    const text = readTextSafe(relPath);

    if (!text) {
      results.push({
        name: component,
        path: relPath,
        status: "dormant",
        hasTypedProps: false,
        hasRealDataSource: false,
        usedWithStaticData: false,
        doctrineAccuracy: "File not found",
        recommendedEngineOutput: "N/A",
        safetyLevel: "future",
        evidence: ["File does not exist"],
      });
      continue;
    }

    const hasTypedProps = text.includes("type Props") || text.includes("interface Props") || text.includes("React.FC<");
    const hasRealDataSource = text.includes("import") && (text.includes("from ") || text.includes("require("));
    const usedWithStaticData = text.includes("demo") || text.includes("static") || text.includes("sample") || text.includes("mock");
    const hasViewModelImport = text.includes("LivingLayerViewModel") || text.includes("viewModel");

    // Determine status
    let status: ComponentAuditStatus;
    if (hasTypedProps && hasRealDataSource && hasViewModelImport) {
      status = "wired_real";
    } else if (hasTypedProps && hasRealDataSource) {
      status = "wired_inferred";
    } else if (usedWithStaticData) {
      status = "static_demo";
    } else if (!hasTypedProps) {
      status = "needs_review";
    } else {
      status = "dormant";
    }

    // Determine safety level
    let safetyLevel: "public" | "internal" | "future";
    if (status === "wired_real" || status === "wired_inferred") {
      safetyLevel = "internal"; // Safe for internal use, not yet public
    } else {
      safetyLevel = "future";
    }

    // Determine recommended engine output
    const recommendedMap: Record<string, string> = {
      "DecisionAdvantageSummary.tsx": "estate-snapshot → contradiction summary → advantage summary",
      "EvidenceStrengthMeter.tsx": "estate-snapshot → evidence posture per domain",
      "GovernedActionPanel.tsx": "contradiction-detector → intervention-classifier → governed action",
      "HumanReviewPrompt.tsx": "contradiction-detector → owner-decision-required items",
      "IntelligenceGainPanel.tsx": "drift-memory-store → learned insights",
      "LivingLayerShell.tsx": "full living-intelligence pipeline → unified view model",
      "LivingSpineProgress.tsx": "doctrine-claim-loader → verified claims progress",
      "NextLayerUnlockedPanel.tsx": "contradiction-detector → next unresolved contradiction",
      "OutcomeMemoryPreview.tsx": "drift-memory-store → repeated/resolved/regressed entries",
      "WhatChangedPanel.tsx": "estate-snapshot → delta between runs",
      "WhatTheSystemHeard.tsx": "behaviour-probe-engine → probe results",
    };

    results.push({
      name: component,
      path: relPath,
      status,
      hasTypedProps,
      hasRealDataSource,
      usedWithStaticData,
      doctrineAccuracy: hasViewModelImport ? "Expresses doctrine via view model" : "Doctrine accuracy unknown — no view model connection",
      recommendedEngineOutput: recommendedMap[component] ?? "living-intelligence pipeline output",
      safetyLevel,
      evidence: [
        `Typed props: ${hasTypedProps}`,
        `Real data source: ${hasRealDataSource}`,
        `Static/demo data: ${usedWithStaticData}`,
        `View model import: ${hasViewModelImport}`,
      ],
    });
  }

  return results;
}
