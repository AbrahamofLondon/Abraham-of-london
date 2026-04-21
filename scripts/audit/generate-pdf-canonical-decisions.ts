import fs from "fs";
import path from "path";

import { decideCanonical, type PdfAssetCandidate } from "../../lib/assets/pdf-canonical";
import {
  buildDuplicateGroups,
  groupBy,
  publicUrlToAbs,
  scanPublicPdfAssets,
  writeJsonReport,
  type DuplicateGroup,
  type PdfAssetRecord,
} from "./pdf-audit-shared";

type CanonicalDecisionReport = {
  generatedAt: string;
  totals: {
    assetGroups: number;
    resolved: number;
    unresolved: number;
    canonical: number;
    alias: number;
    duplicate: number;
    conflict: number;
  };
  decisions: ReturnType<typeof decideCanonical>[];
};

function fileModifiedMs(publicUrl: string): number {
  try {
    return fs.statSync(publicUrlToAbs(publicUrl)).mtimeMs;
  } catch {
    return 0;
  }
}

function toAuthority(file: Pick<PdfAssetRecord, "folderClass" | "canonicalityStatus">): PdfAssetCandidate["authority"] {
  if (file.folderClass === "canonical_download" || file.canonicalityStatus === "candidate_canonical") return "canonical";
  if (file.folderClass === "generated_download" || file.canonicalityStatus === "generated") return "generated";
  if (file.folderClass === "legacy_download" || file.canonicalityStatus === "legacy_compatibility") return "legacy";
  return "draft";
}

function toCandidate(file: {
  publicUrl: string;
  folderClass: PdfAssetRecord["folderClass"];
  canonicalityStatus: PdfAssetRecord["canonicalityStatus"];
  fileSizeBytes: number;
  sha256: string;
}, slug: string): PdfAssetCandidate {
  return {
    slug,
    path: file.publicUrl,
    hash: file.sha256,
    size: file.fileSizeBytes,
    mtimeMs: fileModifiedMs(file.publicUrl),
    authority: toAuthority(file),
    generated: file.folderClass === "generated_download",
    static: file.folderClass !== "generated_download",
    explicitlyAuthoritative: file.canonicalityStatus === "candidate_canonical",
  };
}

function decisionInput(files: PdfAssetRecord[]): PdfAssetCandidate[] {
  const slug = files[0]?.slugCandidate || files[0]?.filename?.replace(/\.pdf$/i, "") || "unknown";
  return files.map((file) => toCandidate(file, slug));
}

function markdownForManualResolution(decisions: ReturnType<typeof decideCanonical>[], groups: DuplicateGroup[]): string {
  const unresolved = decisions.filter((decision) => !decision.resolved);
  const groupBySlug = new Map(groups.map((group) => [group.filename.replace(/\.pdf$/i, ""), group]));
  const lines = [
    "# PDF Manual Resolution",
    "",
    "This file is the operator workflow for Phase 3 PDF authority decisions.",
    "",
    "Phase 3.5 has converted this from a pending worksheet into a deterministic decision ledger.",
    "",
    "## Summary",
    "",
    `- Unresolved groups: ${unresolved.length}`,
    `- Resolved decisions: ${decisions.filter((decision) => decision.resolved).length}`,
    "- Archive target for retired binaries: `/public/_archive/pdfs/`",
    "- Protected folders pending route-level audit: `/vault`, `/resources`, `/prints`, `/lexicon`",
    "",
    "## Resolution Queue",
    "",
  ];

  if (unresolved.length === 0) {
    lines.push("No unresolved canonical decisions remain.");
    lines.push("");
  }

  for (const decision of unresolved) {
    const group = groupBySlug.get(decision.slug);
    lines.push(`### File: ${decision.slug}.pdf`);
    lines.push("");
    lines.push(`Decision status: ${decision.decision}`);
    lines.push(`Suggested canonical: ${decision.canonicalPath || "none"}`);
    lines.push(`Reason: ${decision.reason}`);
    lines.push("Paths:");
    for (const sourcePath of decision.sourcePaths) {
      lines.push(`- ${sourcePath}`);
    }
    lines.push("");
    if (group) {
      lines.push("Hashes:");
      for (const file of group.files) {
        lines.push(`- ${file.sha256}`);
      }
      lines.push("");
      lines.push("Sizes:");
      for (const file of group.files) {
        lines.push(`- ${file.publicUrl}: ${file.fileSizeBytes} bytes`);
      }
      lines.push("");
    }
    lines.push("Decision:");
    lines.push("[ ] Canonical: __________");
    lines.push("[ ] Rename: __________");
    lines.push("[ ] Keep both: __________");
    lines.push("[ ] Archive: __________");
    lines.push("");
    lines.push("Reason:");
    lines.push("____________");
    lines.push("");
  }

  lines.push("## Resolved Decision Ledger");
  lines.push("");
  for (const decision of decisions) {
    lines.push(`- ${decision.slug}: ${decision.decision} -> ${decision.canonicalPath} (${decision.reason})`);
  }

  return `${lines.join("\n")}\n`;
}

const records = scanPublicPdfAssets();
const duplicateGroups = buildDuplicateGroups(records);
const duplicateKeys = new Set(duplicateGroups.map((group) => group.groupId));
const singles = Array.from(groupBy(records, (record) => record.filename.toLowerCase()).values()).filter(
  (files) => files.length === 1,
);

const decisions = [
  ...duplicateGroups.map((group) =>
    decideCanonical(group.files.map((file) => toCandidate(file, group.filename.replace(/\.pdf$/i, "")))),
  ),
  ...singles.map((files) => decideCanonical(decisionInput(files))),
].sort((a, b) => `${a.resolved}:${a.slug}`.localeCompare(`${b.resolved}:${b.slug}`));

const byDecision = decisions.reduce<Record<string, number>>((acc, decision) => {
  acc[decision.decision] = (acc[decision.decision] || 0) + 1;
  return acc;
}, {});

const report: CanonicalDecisionReport = {
  generatedAt: new Date().toISOString(),
  totals: {
    assetGroups: decisions.length,
    resolved: decisions.filter((decision) => decision.resolved).length,
    unresolved: decisions.filter((decision) => !decision.resolved).length,
    canonical: byDecision.canonical || 0,
    alias: byDecision.alias || 0,
    duplicate: byDecision.duplicate || 0,
    conflict: byDecision.conflict || 0,
  },
  decisions,
};

const jsonOut = writeJsonReport("pdf-canonical-decisions.json", report);

const docsDir = path.join(process.cwd(), "docs", "program");
fs.mkdirSync(docsDir, { recursive: true });
const manualOut = path.join(docsDir, "pdf-manual-resolution.md");
fs.writeFileSync(manualOut, markdownForManualResolution(decisions, duplicateGroups), "utf8");

console.log("[pdf:canonical] wrote", path.relative(process.cwd(), jsonOut));
console.log("[pdf:canonical] wrote", path.relative(process.cwd(), manualOut));
console.log("[pdf:canonical] groups", decisions.length);
console.log("[pdf:canonical] unresolved", report.totals.unresolved);
console.log("[pdf:canonical] duplicate filename groups", duplicateKeys.size);
