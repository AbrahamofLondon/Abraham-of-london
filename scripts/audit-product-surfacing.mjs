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
    file: "components/diagnostics/AssessmentResultSurface.tsx",
    phrase: "Where the decision lives now",
  },
  {
    file: "components/product/SaveCaseConversionPanel.tsx",
    phrase: "Professional preserves the governed record beyond the free active-case limit",
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

if (failures.length > 0) {
  console.error("Product surfacing audit failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Product surfacing audit passed.");
