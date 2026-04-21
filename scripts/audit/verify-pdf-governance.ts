import { execFileSync } from "child_process";
import path from "path";

import { buildDuplicateGroups, scanPublicPdfAssets, writeJsonReport } from "./pdf-audit-shared";

type GovernanceFinding = {
  rule: string;
  severity: "fail" | "warn";
  path: string;
  message: string;
};

const CANONICAL_PUBLIC_PREFIX = "public/assets/downloads/";
const ARCHIVE_PUBLIC_PREFIX = "public/_archive/pdfs/";

function git(args: string[]): string[] {
  try {
    const out = execFileSync("git", args, {
      cwd: process.cwd(),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    return out
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}

function isPdf(pathname: string): boolean {
  return pathname.toLowerCase().endsWith(".pdf");
}

function isAllowedNewPdf(pathname: string): boolean {
  const normalized = pathname.replace(/\\/g, "/");
  return normalized.startsWith(CANONICAL_PUBLIC_PREFIX) || normalized.startsWith(ARCHIVE_PUBLIC_PREFIX);
}

const addedPdfs = unique([
  ...git(["diff", "--name-only", "--diff-filter=A", "--", "public"]),
  ...git(["diff", "--cached", "--name-only", "--diff-filter=A", "--", "public"]),
]).filter(isPdf);

const findings: GovernanceFinding[] = [];

for (const addedPdf of addedPdfs) {
  if (!isAllowedNewPdf(addedPdf)) {
    findings.push({
      rule: "no_new_pdf_outside_canonical_path",
      severity: "fail",
      path: addedPdf,
      message: `New PDFs must be created under ${CANONICAL_PUBLIC_PREFIX} or archived under ${ARCHIVE_PUBLIC_PREFIX}.`,
    });
  }
}

const duplicateGroups = buildDuplicateGroups(scanPublicPdfAssets());
if (duplicateGroups.length > 0) {
  findings.push({
    rule: "duplicate_filename_threshold",
    severity: "warn",
    path: "public/**/*.pdf",
    message: `${duplicateGroups.length} duplicate filename groups currently exist; resolve via docs/program/pdf-manual-resolution.md.`,
  });
}

const failFindings = findings.filter((finding) => finding.severity === "fail");
const warnFindings = findings.filter((finding) => finding.severity === "warn");

const out = writeJsonReport("pdf-governance-report.json", {
  generatedAt: new Date().toISOString(),
  rules: {
    noNewPdfOutsideCanonicalPath: {
      canonicalPrefix: CANONICAL_PUBLIC_PREFIX,
      archivePrefix: ARCHIVE_PUBLIC_PREFIX,
      addedPdfs,
    },
    duplicateAlertThreshold: {
      duplicateFilenameGroups: duplicateGroups.length,
    },
  },
  totals: {
    findings: findings.length,
    failures: failFindings.length,
    warnings: warnFindings.length,
  },
  findings,
});

console.log("[pdf:governance] wrote", path.relative(process.cwd(), out));
console.log("[pdf:governance] added public PDFs", addedPdfs.length);
console.log("[pdf:governance] duplicate filename groups", duplicateGroups.length);

for (const finding of warnFindings) {
  console.warn(`[pdf:governance] warn ${finding.rule}: ${finding.message}`);
}

if (failFindings.length > 0) {
  for (const finding of failFindings) {
    console.error(`[pdf:governance] fail ${finding.rule}: ${finding.path} - ${finding.message}`);
  }
  process.exit(1);
}
