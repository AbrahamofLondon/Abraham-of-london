import fs from "fs";
import path from "path";

import {
  buildDuplicateGroups,
  scanPublicPdfAssets,
  writeJsonReport,
} from "./pdf-audit-shared";

const records = scanPublicPdfAssets();
const groups = buildDuplicateGroups(records);

const byClassification = groups.reduce<Record<string, number>>((acc, group) => {
  acc[group.classification] = (acc[group.classification] || 0) + 1;
  return acc;
}, {});

const byRecommendedAction = groups.reduce<Record<string, number>>((acc, group) => {
  acc[group.recommendedAction] = (acc[group.recommendedAction] || 0) + 1;
  return acc;
}, {});

const report = {
  generatedAt: new Date().toISOString(),
  totals: {
    duplicateFilenameGroups: groups.length,
    identicalDuplicateGroups: groups.filter((group) => group.classification === "identical_duplicate").length,
    divergentDuplicateGroups: groups.filter((group) => group.classification === "divergent_duplicate").length,
    generatedVsStaticConflictGroups: groups.filter(
      (group) => group.classification === "generated_vs_static_conflict",
    ).length,
  },
  byClassification,
  byRecommendedAction,
  groups,
};

const jsonOut = writeJsonReport("pdf-duplicate-report.json", report);

const mdLines = [
  "# PDF Duplicate Report",
  "",
  `Generated: ${report.generatedAt}`,
  "",
  "## Summary",
  "",
  `- Duplicate filename groups: ${report.totals.duplicateFilenameGroups}`,
  `- Identical duplicate groups: ${report.totals.identicalDuplicateGroups}`,
  `- Divergent duplicate groups: ${report.totals.divergentDuplicateGroups}`,
  `- Generated/static conflict groups: ${report.totals.generatedVsStaticConflictGroups}`,
  "",
  "## Manual Review Groups",
  "",
  ...groups
    .filter((group) => group.recommendedAction === "manual_resolution_required")
    .slice(0, 75)
    .flatMap((group) => [
      `### ${group.filename}`,
      "",
      `- Classification: ${group.classification}`,
      `- Unique hashes: ${group.uniqueHashCount}`,
      `- Recommended canonical path: ${group.recommendedCanonicalPath || "none"}`,
      "",
      ...group.files.map((file) => `  - ${file.publicUrl} (${file.fileSizeBytes} bytes)`),
      "",
    ]),
];

const mdOut = path.join(process.cwd(), "reports", "pdf-duplicate-report.md");
fs.writeFileSync(mdOut, `${mdLines.join("\n")}\n`, "utf8");

console.log("[pdf:duplicates] wrote", path.relative(process.cwd(), jsonOut));
console.log("[pdf:duplicates] wrote", path.relative(process.cwd(), mdOut));
console.log("[pdf:duplicates] duplicate groups", groups.length);
console.log("[pdf:duplicates] classifications", JSON.stringify(byClassification));
