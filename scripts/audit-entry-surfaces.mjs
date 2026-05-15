#!/usr/bin/env node
/**
 * audit-entry-surfaces.mjs
 *
 * Lightweight guardrail for the public entry-surface standard.
 * Fails when named surfaces lose the boundary language that explains:
 * - what the surface is
 * - what it does / does not create
 * - where the decision goes next
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
