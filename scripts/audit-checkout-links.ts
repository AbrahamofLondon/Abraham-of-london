import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { resolveProductIdentity } from "../lib/commercial/product-identity";

type Finding = {
  file: string;
  issue: string;
  match: string;
};

const ROOT = process.cwd();
const SKIP_DIRS = new Set([
  ".git",
  ".next",
  ".netlify",
  "node_modules",
  "out",
  "dist",
  "coverage",
]);
const TEXT_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".md",
  ".mdx",
  ".json",
]);

function walk(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const fullPath = path.join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      walk(fullPath, files);
    } else if (TEXT_EXTENSIONS.has(path.extname(entry))) {
      files.push(fullPath);
    }
  }
  return files;
}

function relative(file: string): string {
  return path.relative(ROOT, file).replace(/\\/g, "/");
}

function collectFindings(file: string): Finding[] {
  const rel = relative(file);
  if (rel === "scripts/audit-checkout-links.ts") return [];
  if (/\.(test|spec)\.[jt]sx?$/.test(rel)) return [];

  const text = readFileSync(file, "utf8");
  const findings: Finding[] = [];

  const directCheckoutPattern = /\/api\/checkout(?:\?|["'`\s>])/g;
  for (const match of text.matchAll(directCheckoutPattern)) {
    findings.push({
      file: rel,
      issue: "Direct GET checkout route reference",
      match: match[0],
    });
  }

  const bundlePattern = /bundle=([A-Za-z0-9_-]+)/g;
  for (const match of text.matchAll(bundlePattern)) {
    findings.push({
      file: rel,
      issue: "Legacy bundle query reference",
      match: match[0],
    });
  }

  const productPatterns = [
    /productCode=["']([^"']+)["']/g,
    /productCode:\s*["']([^"']+)["']/g,
    /priceCode:\s*["']([^"']+)["']/g,
    /checkoutCode:\s*["']([^"']+)["']/g,
  ];

  for (const pattern of productPatterns) {
    for (const match of text.matchAll(pattern)) {
      const identifier = match[1];
      if (!identifier || identifier.includes("${")) continue;
      if (!resolveProductIdentity(identifier)) {
        findings.push({
          file: rel,
          issue: "Unknown commercial product identifier",
          match: identifier,
        });
      }
    }
  }

  return findings;
}

const findings = walk(ROOT).flatMap(collectFindings);

if (findings.length === 0) {
  console.log("Checkout link audit passed.");
  process.exit(0);
}

for (const finding of findings) {
  console.error(`${finding.file}: ${finding.issue}: ${finding.match}`);
}

process.exit(1);
