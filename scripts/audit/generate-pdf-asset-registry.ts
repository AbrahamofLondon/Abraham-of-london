import path from "path";

import {
  buildDuplicateGroups,
  groupBy,
  scanPublicPdfAssets,
  writeJsonReport,
} from "./pdf-audit-shared";

const records = scanPublicPdfAssets();
const duplicateGroups = buildDuplicateGroups(records);
const byClass = groupBy(records, (record) => record.folderClass);
const byStatus = groupBy(records, (record) => record.canonicalityStatus);

const report = {
  generatedAt: new Date().toISOString(),
  canonicalBinaryTarget: "/assets/downloads/{slug}.pdf",
  totals: {
    pdfs: records.length,
    duplicateFilenameGroups: duplicateGroups.length,
    duplicateAssets: records.filter((record) => record.duplicateGroupId).length,
  },
  byFolderClass: Object.fromEntries(
    Array.from(byClass.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => [key, value.length]),
  ),
  byCanonicalityStatus: Object.fromEntries(
    Array.from(byStatus.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => [key, value.length]),
  ),
  assets: records,
};

const out = writeJsonReport("pdf-asset-registry.json", report);

console.log("[pdf:registry] wrote", path.relative(process.cwd(), out));
console.log("[pdf:registry] pdfs", records.length);
console.log("[pdf:registry] duplicate filename groups", duplicateGroups.length);
