import fs from "node:fs";

const REQUIRED_PHRASES = [
  {
    file: "components/homepage/ProfessionalContinuitySection.tsx",
    phrase: "Professional keeps governed cases alive.",
  },
  {
    file: "pages/pricing.tsx",
    phrase: "Start free. Preserve continuity with Professional.",
  },
  {
    file: "components/product/ResultPathwayPanel.tsx",
    phrase: "Result pathway",
  },
  {
    file: "components/product/ResultPathwayPanel.tsx",
    phrase: "Professional preserves continuity beyond the free active-case limit.",
  },
  {
    file: "pages/trust.tsx",
    phrase: "Create your governed case",
  },
  {
    file: "pages/decision-centre.tsx",
    phrase: "Next governed pathway",
  },
  {
    file: "components/decision-centre/DecisionCentreOrientation.tsx",
    phrase: "Decision Centre is not a dashboard.",
  },
  {
    file: "pages/provenance/demo.tsx",
    phrase: "Demonstration only · Not connected to any account or live case",
  },
  {
    file: "pages/provenance/sample-export.tsx",
    phrase: "Client-safe provenance sample",
  },
  {
    file: "pages/diagnostics/board-summary.tsx",
    phrase: "This is a board-ready preview generated from available diagnostic evidence. It does not create a new governed record.",
  },
  {
    file: "pages/tools/decision-delay-exposure.tsx",
    phrase: "No governed case or retained decision record is created by this estimate.",
  },
  {
    file: "lib/product/result-pathway-state.ts",
    phrase: "No governed record exists until this decision-delay estimate is saved as a governed case.",
  },
  {
    file: "lib/product/result-pathway-state.ts",
    phrase: "Earned intervention layer.",
  },
  {
    file: "pages/library/index.tsx",
    phrase: "governed knowledge estate",
  },
  {
    file: "pages/decision-centre.tsx",
    phrase: "The operating console for governed cases",
  },
  {
    file: "pages/pricing.tsx",
    phrase: "Which tier is right for me?",
  },
  {
    file: "pages/pricing.tsx",
    phrase: "Not sure where you fit?",
  },
  {
    file: "components/homepage/CategoryFrontDoor.tsx",
    phrase: "/library",
  },
];

const FORBIDDEN_SAMPLE_PHRASES = [
  {
    file: "pages/provenance/demo.tsx",
    phrase: "live client record",
  },
  {
    file: "pages/provenance/sample-export.tsx",
    phrase: "live client record",
  },
];

const FORBIDDEN_RESULT_CTA_PHRASES = [
  {
    file: "pages/diagnostics/fast.tsx",
    phrase: "Continue in Decision Centre",
  },
  {
    file: "pages/diagnostics/fast.tsx",
    phrase: "Open Decision Centre",
  },
];

const failures = [];

for (const check of REQUIRED_PHRASES) {
  const source = fs.readFileSync(check.file, "utf8");
  if (!source.includes(check.phrase)) {
    failures.push(`Missing required phrase in ${check.file}: ${check.phrase}`);
  }
}

for (const check of FORBIDDEN_SAMPLE_PHRASES) {
  const source = fs.readFileSync(check.file, "utf8");
  if (source.includes(check.phrase)) {
    failures.push(`Forbidden sample/live contradiction in ${check.file}: ${check.phrase}`);
  }
}

for (const check of FORBIDDEN_RESULT_CTA_PHRASES) {
  const source = fs.readFileSync(check.file, "utf8");
  if (source.includes(check.phrase)) {
    failures.push(`Duplicate result CTA phrase in ${check.file}: ${check.phrase}`);
  }
}

const strategyRoomSurfaces = [
  "lib/product/result-pathway-state.ts",
  "pages/diagnostics/fast.tsx",
];

for (const file of strategyRoomSurfaces) {
  const source = fs.readFileSync(file, "utf8");
  if (source.includes("Strategy Room") && !/earned|gated/i.test(source)) {
    failures.push(`Strategy Room lacks earned/gated context in ${file}`);
  }
}

if (failures.length > 0) {
  console.error("Product surfacing audit failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Product surfacing audit passed.");
