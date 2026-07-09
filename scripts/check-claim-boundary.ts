/**
 * scripts/check-claim-boundary.ts — §16.1 build-time content gate.
 *
 * Scans commercial / product / public-report surfaces for the HIGH-STAKES advisory
 * boundary classes (guaranteed outcome, unsupported financial prediction, legal
 * certainty) using the ONE canonical claim-boundary authority. It deliberately does
 * NOT scan the editorial/blog corpus (where such words appear legitimately in prose) —
 * authority-grade wording on those surfaces is already governed by the existing
 * surface-claim scanners. The build must FAIL (exit 1) on any DENY-class hit.
 *
 * Run: pnpm exec tsx scripts/check-claim-boundary.ts   (add to CI: check:claim-boundary)
 */

import fs from "node:fs";
import path from "node:path";
import { evaluateClaimBoundary } from "@/lib/governance/claim-boundary-authority";

const ROOT = process.cwd();

// Commercial / product / public-report surfaces only.
const CONTENT_DIRS = ["content/intelligence"];
const CODE_SURFACES = ["lib/commercial/catalog.ts", "pages/products.tsx"];
const CODE_DIRS = ["pages/report", "pages/reporting"];

function walk(dir: string, exts: string[]): string[] {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) return [];
  const out: string[] = [];
  for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p, exts));
    else if (exts.some((e) => entry.name.endsWith(e))) out.push(p);
  }
  return out;
}

function stripMdxCode(text: string): string {
  // avoid flagging fenced code / imports; we only care about prose claim wording.
  return text.replace(/```[\s\S]*?```/g, " ").replace(/^import .*$/gm, " ");
}

const files = [
  ...CONTENT_DIRS.flatMap((d) => walk(d, [".md", ".mdx"])),
  ...CODE_SURFACES.filter((f) => fs.existsSync(path.join(ROOT, f))),
  ...CODE_DIRS.flatMap((d) => walk(d, [".tsx", ".ts"])),
];

let denies = 0;
const findings: string[] = [];

for (const rel of files) {
  const text = stripMdxCode(fs.readFileSync(path.join(ROOT, rel), "utf8"));
  const result = evaluateClaimBoundary(text, { surface: "PUBLIC_PRODUCT_COPY" });
  // build gate cares only about the universal high-stakes DENY classes here.
  const denyViolations = result.violations.filter(
    (v) => v.severity === "DENY" &&
      (v.boundaryClass === "GUARANTEED_OUTCOME" ||
        v.boundaryClass === "UNSUPPORTED_FINANCIAL_PREDICTION" ||
        v.boundaryClass === "LEGAL_CERTAINTY"),
  );
  for (const v of denyViolations) {
    denies++;
    findings.push(`  DENY  ${rel}  [${v.boundaryClass}] "${v.match}"`);
  }
}

console.log(`[check:claim-boundary] scanned ${files.length} commercial/report surface(s).`);
if (denies > 0) {
  console.error(`\n✗ ${denies} forbidden high-stakes claim(s):\n${findings.join("\n")}`);
  process.exit(1);
}
console.log("✓ no forbidden guaranteed-outcome / financial-prediction / legal-certainty claims on commercial surfaces.");
