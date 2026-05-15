#!/usr/bin/env node
/**
 * audit-entry-surfaces.mjs
 *
 * Lightweight guardrail for the public entry-surface standard.
 * Fails when named surfaces lose the boundary language that explains:
 * - what the surface is
 * - what it does / does not create
 * - where the decision goes next
 *
 * v2: Also checks core surfaces for governed case language:
 *   case ID, record status, Decision Centre, governance implication,
 *   next earned action, scenario estimate (where applicable),
 *   not financial advice (where applicable).
 */

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = join(__dirname, "..");

const checks = [
  {
    label: "Decision Delay",
    file: "pages/tools/decision-delay-exposure.tsx",
    requirements: [
      ["scenario estimate", "Decision Delay must retain scenario-estimate language."],
      ["not financial advice", "Decision Delay must state it is not financial advice."],
      ["does not create a governed case", "Decision Delay must state it does not create a governed case."],
      ["Fast Diagnostic", "Decision Delay must point to the Fast Diagnostic."],
      ["Decision Centre", "Decision Delay must point to Decision Centre."],
    ],
  },
  {
    label: "Fast Diagnostic",
    file: "pages/diagnostics/fast.tsx",
    requirements: [
      ["governance move", "Fast Diagnostic must name the governance move."],
      ["Decision Centre", "Fast Diagnostic must point to Decision Centre."],
      ["checkpoint", "Fast Diagnostic must explain checkpoint behavior."],
      ["governed case", "Fast Diagnostic must explain governed case creation."],
      ["case ID", "Fast Diagnostic must reference case ID or record identifier."],
      ["record status", "Fast Diagnostic must reference record status or persistence level."],
      ["governance implication", "Fast Diagnostic must reference governance implication."],
      ["next earned action", "Fast Diagnostic must reference next earned action or required move."],
    ],
  },
  {
    label: "Purpose Alignment",
    file: "pages/diagnostics/purpose-alignment.tsx",
    requirements: [
      ["Decision Centre", "Purpose Alignment must point to Decision Centre."],
      ["governed case", "Purpose Alignment must explain governed case creation."],
      ["record status", "Purpose Alignment must reference record status."],
      ["next earned action", "Purpose Alignment must reference next earned action."],
    ],
  },
  {
    label: "Constitutional Diagnostic",
    file: "pages/diagnostics/constitutional-diagnostic.tsx",
    requirements: [
      ["Decision Centre", "Constitutional Diagnostic must point to Decision Centre."],
      ["governed case", "Constitutional Diagnostic must explain governed case creation."],
      ["next earned action", "Constitutional Diagnostic must reference next earned action."],
    ],
  },
  {
    label: "Team Assessment",
    file: "pages/diagnostics/team-assessment.tsx",
    requirements: [
      ["Decision Centre", "Team Assessment must point to Decision Centre."],
      ["governed case", "Team Assessment must explain governed case creation."],
      ["next earned action", "Team Assessment must reference next earned action."],
    ],
  },
  {
    label: "Enterprise Assessment",
    file: "pages/diagnostics/enterprise-assessment.tsx",
    requirements: [
      ["Decision Centre", "Enterprise Assessment must point to Decision Centre."],
      ["governed case", "Enterprise Assessment must explain governed case creation."],
      ["next earned action", "Enterprise Assessment must reference next earned action."],
    ],
  },
  {
    label: "Board Summary",
    file: "pages/diagnostics/board-summary.tsx",
    requirements: [
      ["session-derived", "Board Summary must state it is session-derived."],
      ["does not create a new governed record", "Board Summary must state it does not create a new governed record."],
      ["Decision Centre", "Board Summary must point to Decision Centre."],
    ],
  },
  {
    label: "Provenance Sample",
    file: "pages/provenance/sample-export.tsx",
    requirements: [
      ["sample", "Provenance Sample must identify itself as a sample."],
      ["not generated from", "Provenance Sample must state it is not generated from the visitor's account or case."],
      ["client-safe", "Provenance Sample must retain the client-safe boundary."],
    ],
  },
  {
    label: "Anchor Log",
    file: "pages/provenance/anchor-log.tsx",
    requirements: [
      ["public root", "Anchor Log must explain public roots."],
      ["internal chain", "Anchor Log must explain the internal chain."],
      ["external anchoring", "Anchor Log must explain external anchoring."],
      ["not configured", "Anchor Log must state external anchoring is not configured."],
    ],
  },
  {
    label: "Return Brief Explainer",
    file: "pages/return-brief/index.tsx",
    requirements: [
      ["public explainer", "Return Brief explainer must identify itself as a public explainer."],
      ["case-specific", "Return Brief explainer must state generated briefs are case-specific."],
      ["Decision Centre", "Return Brief explainer must point to Decision Centre."],
    ],
  },
  {
    label: "Executive Reporting",
    file: "pages/diagnostics/executive-reporting.tsx",
    requirements: [
      ["paid report layer", "Executive Reporting must identify itself as a paid report layer."],
      ["evidence-gated", "Executive Reporting must state it is evidence-gated."],
      ["priority stack", "Executive Reporting must explain the governed priority stack."],
      ["case ID", "Executive Reporting must reference case ID or report identifier."],
      ["governance implication", "Executive Reporting must reference governance implication."],
      ["Decision Centre", "Executive Reporting must point to Decision Centre."],
    ],
  },
  {
    label: "Strategy Room Session",
    file: "pages/strategy-room/session/[id].tsx",
    requirements: [
      ["Decision Centre", "Strategy Room must point to Decision Centre."],
      ["provenance", "Strategy Room must reference provenance status."],
      ["record status", "Strategy Room must reference record status."],
    ],
  },
  {
    label: "Return Brief",
    file: "pages/briefing/return/[sessionKey].tsx",
    requirements: [
      ["Decision Centre", "Return Brief must point to Decision Centre."],
      ["provenance", "Return Brief must reference provenance status."],
      ["case", "Return Brief must reference case or session."],
    ],
  },
  {
    label: "Proof Pack",
    file: "pages/account/proof-pack.tsx",
    requirements: [
      ["provenance", "Proof Pack must reference provenance status."],
      ["evidence", "Proof Pack must reference evidence posture."],
      ["export boundary", "Proof Pack must reference export boundary."],
      ["Decision Centre", "Proof Pack must point to Decision Centre."],
    ],
  },
  {
    label: "Decision Centre",
    file: "pages/decision-centre.tsx",
    requirements: [
      ["case ID", "Decision Centre must reference case ID."],
      ["governance implication", "Decision Centre must reference governance implication."],
      ["next required action", "Decision Centre must reference next required action."],
      ["provenance", "Decision Centre must reference provenance status."],
    ],
  },
];

async function main() {
  const failures = [];

  for (const check of checks) {
    const abs = join(ROOT, check.file);
    let content = "";
    try {
      content = await readFile(abs, "utf8");
    } catch {
      failures.push(`SURFACE_AUDIT ERROR: ${check.label} file is missing (${check.file}).`);
      continue;
    }

    const normalized = content.toLowerCase();
    for (const [needle, message] of check.requirements) {
      if (!normalized.includes(needle.toLowerCase())) {
        failures.push(`SURFACE_AUDIT ERROR: ${message}`);
      }
    }
  }

  if (failures.length > 0) {
    for (const failure of failures) console.error(failure);
    process.exit(1);
  }

  console.log("[SURFACE_AUDIT] ✅ All required entry-surface boundary phrases are present.");
}

main().catch((error) => {
  console.error("SURFACE_AUDIT ERROR: unexpected failure while scanning entry surfaces.");
  console.error(error);
  process.exit(1);
});