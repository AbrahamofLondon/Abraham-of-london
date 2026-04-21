import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";

import { scanPublicPdfAssets, writeJsonReport } from "./pdf-audit-shared";

type Finding = {
  rule: string;
  severity: "fail";
  message: string;
};

function readJson<T>(relativePath: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), relativePath), "utf8")) as T;
  } catch {
    return null;
  }
}

function gitShow(pathname: string): string | null {
  try {
    return execFileSync("git", ["show", `HEAD:${pathname}`], {
      cwd: process.cwd(),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    return null;
  }
}

function stripGeneratedAt(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripGeneratedAt);
  if (!value || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key]) => key !== "generatedAt")
      .map(([key, entry]) => [key, stripGeneratedAt(entry)]),
  );
}

function reportChangedSubstantively(pathname: string): boolean {
  const current = fs.existsSync(path.join(process.cwd(), pathname))
    ? fs.readFileSync(path.join(process.cwd(), pathname), "utf8")
    : null;
  const baseline = gitShow(pathname);

  if (!current || !baseline) return false;

  try {
    return JSON.stringify(stripGeneratedAt(JSON.parse(current))) !==
      JSON.stringify(stripGeneratedAt(JSON.parse(baseline)));
  } catch {
    return current !== baseline;
  }
}

const findings: Finding[] = [];

const canonical = readJson<{
  totals?: { unresolved?: number };
  decisions?: Array<{ slug: string; canonicalPath: string; resolved: boolean }>;
}>("reports/pdf-canonical-decisions.json");

if (!canonical) {
  findings.push({ rule: "canonical_report_exists", severity: "fail", message: "Missing reports/pdf-canonical-decisions.json." });
} else {
  const unresolved = Number(canonical.totals?.unresolved || 0);
  if (unresolved > 0) {
    findings.push({ rule: "unresolved_canonical_decisions", severity: "fail", message: `${unresolved} canonical decisions remain unresolved.` });
  }

  for (const decision of canonical.decisions || []) {
    if (!decision.resolved) continue;
    const expected = `/assets/downloads/${decision.slug}.pdf`;
    if (decision.canonicalPath !== expected) {
      findings.push({
        rule: "canonical_path_shape",
        severity: "fail",
        message: `${decision.slug} canonicalPath is ${decision.canonicalPath}; expected ${expected}.`,
      });
    }

    const abs = path.join(process.cwd(), "public", expected.replace(/^\/+/, ""));
    if (!fs.existsSync(abs)) {
      findings.push({
        rule: "canonical_binary_exists",
        severity: "fail",
        message: `${decision.slug} is missing physical canonical binary ${expected}.`,
      });
    }
  }
}

const linkReport = readJson<{ totals?: { rawPdfLinks?: number; rawCanonicalDownloadLinks?: number } }>(
  "reports/pdf-link-verification.json",
);
const rawPdfLinks = Number(linkReport?.totals?.rawPdfLinks || linkReport?.totals?.rawCanonicalDownloadLinks || 0);
if (rawPdfLinks > 0) {
  findings.push({ rule: "no_raw_pdf_links", severity: "fail", message: `${rawPdfLinks} raw PDF links remain in UI/content.` });
}

const activeOutsideCanonical = scanPublicPdfAssets().filter((asset) => {
  if (!asset.publicUrl.endsWith(".pdf")) return false;
  if (/^\/assets\/downloads\/[^/]+\.pdf$/i.test(asset.publicUrl)) return false;
  if (/^\/(vault|resources|prints|lexicon)\//.test(asset.publicUrl)) return false;
  return true;
});

if (activeOutsideCanonical.length > 0) {
  findings.push({
    rule: "active_pdf_outside_canonical_path",
    severity: "fail",
    message: `${activeOutsideCanonical.length} active non-strategic PDFs remain outside /assets/downloads/{slug}.pdf.`,
  });
}

if (process.env.PDF_ACCEPT_REPORT_CHANGES !== "1") {
  const dirtyReports = [
    "reports/pdf-canonical-decisions.json",
    "reports/pdf-asset-registry.json",
    "reports/pdf-duplicate-report.json",
    "reports/pdf-link-verification.json",
  ].filter(reportChangedSubstantively);

  if (dirtyReports.length > 0) {
    findings.push({
      rule: "generated_reports_committed",
      severity: "fail",
      message: `Generated PDF reports changed unexpectedly: ${dirtyReports.join(", ")}.`,
    });
  }
}

const out = writeJsonReport("pdf-enforcement-report.json", {
  generatedAt: new Date().toISOString(),
  totals: {
    failures: findings.length,
  },
  findings,
});

console.log("[pdf:enforce] wrote", path.relative(process.cwd(), out));
console.log("[pdf:enforce] failures", findings.length);

if (findings.length > 0) {
  for (const finding of findings) {
    console.error(`[pdf:enforce] ${finding.rule}: ${finding.message}`);
  }
  process.exit(1);
}
