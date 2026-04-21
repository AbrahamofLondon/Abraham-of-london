import fs from "fs";
import path from "path";

import {
  buildDuplicateGroups,
  ensureReportsDir,
  isCandidateCanonicalUrl,
  isLegacyDirectFileUrl,
  scanPublicPdfAssets,
  type DuplicateGroup,
} from "./pdf-audit-shared";

type RedirectCandidate = {
  from: string;
  to: string;
  status: 301;
  reason: "byte_identical_legacy_alias";
  filename: string;
  sha256: string;
};

function candidatesFromGroup(group: DuplicateGroup): RedirectCandidate[] {
  if (group.classification !== "identical_duplicate") return [];

  const canonical = group.recommendedCanonicalPath;
  if (!canonical || !isCandidateCanonicalUrl(canonical)) return [];

  const canonicalFile = group.files.find((file) => file.publicUrl === canonical);
  if (!canonicalFile) return [];

  return group.files
    .filter((file) => file.publicUrl !== canonical)
    .filter((file) => isLegacyDirectFileUrl(file.publicUrl))
    .map((file) => ({
      from: file.publicUrl,
      to: canonical,
      status: 301 as const,
      reason: "byte_identical_legacy_alias" as const,
      filename: group.filename,
      sha256: canonicalFile.sha256,
    }))
    .sort((a, b) => a.from.localeCompare(b.from));
}

const groups = buildDuplicateGroups(scanPublicPdfAssets());
const candidates = groups.flatMap(candidatesFromGroup).sort((a, b) => a.from.localeCompare(b.from));

ensureReportsDir();

const jsonOut = path.join(process.cwd(), "reports", "pdf-redirect-candidates.json");
fs.writeFileSync(
  jsonOut,
  `${JSON.stringify({ generatedAt: new Date().toISOString(), candidates }, null, 2)}\n`,
  "utf8",
);

const tomlLines = [
  "# PDF canonical alias redirects",
  "# Generated from duplicate report",
  "# Only byte-identical legacy direct-file aliases included",
  ...candidates.flatMap((candidate) => [
    "",
    "[[redirects]]",
    `  from = "${candidate.from}"`,
    `  to = "${candidate.to}"`,
    "  status = 301",
    "  force = true",
  ]),
  "",
  "# End PDF canonical alias redirects",
];

const tomlOut = path.join(process.cwd(), "reports", "pdf-redirect-candidates.toml");
fs.writeFileSync(tomlOut, `${tomlLines.join("\n")}\n`, "utf8");

console.log("[pdf:redirect-candidates] wrote", path.relative(process.cwd(), jsonOut));
console.log("[pdf:redirect-candidates] wrote", path.relative(process.cwd(), tomlOut));
console.log("[pdf:redirect-candidates] candidates", candidates.length);
