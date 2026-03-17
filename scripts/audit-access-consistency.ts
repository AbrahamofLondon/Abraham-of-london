// scripts/audit-access-consistency.ts
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);

const IGNORE_DIRS = new Set([
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  "coverage",
  ".contentlayer",
  "out",
]);

const SUSPICIOUS_PATTERNS: Array<{ name: string; regex: RegExp }> = [
  {
    name: "manual-tier-array",
    regex:
      /\[(?:\s*["'`](?:public|member|inner-circle|architect|owner|client|restricted|top-secret|legacy)["'`]\s*,?){2,}\s*\]\.includes\(/g,
  },
  {
    name: "manual-tier-compare",
    regex:
      /(?:userTier|tier|requiredTier)\s*(?:===|!==|==|!=)\s*["'`](?:public|member|inner-circle|architect|owner|client|restricted|top-secret|legacy)["'`]/g,
  },
  {
    name: "manual-tier-if-chain",
    regex:
      /if\s*\(\s*.*?\.tier\s*===\s*["'`](?:public|member|inner-circle|architect|owner|client|restricted|top-secret|legacy)["'`]/g,
  },
  {
    name: "raw-normalization",
    regex: /String\s*\(\s*.*?(?:userTier|tier).*?\)\.toLowerCase\(\)/g,
  },
  {
    name: "legacy-requireTier-option",
    regex: /\brequireTier\s*:/g,
  },
  {
    name: "direct-accessTier-usage",
    regex: /\.accessTier\b/g,
  },
];

const RECOMMENDED_PATTERNS: Array<{ name: string; regex: RegExp }> = [
  { name: "uses-hasAccess", regex: /\bhasAccess\s*\(/g },
  { name: "uses-normalizeUserTier", regex: /\bnormalizeUserTier\s*\(/g },
];

type Finding = {
  file: string;
  line: number;
  rule: string;
  excerpt: string;
};

function walk(dir: string, out: string[] = []): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (IGNORE_DIRS.has(entry.name)) continue;

    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      walk(full, out);
      continue;
    }

    const ext = path.extname(entry.name).toLowerCase();
    if (EXTS.has(ext)) out.push(full);
  }

  return out;
}

function getLineNumber(text: string, index: number): number {
  let line = 1;
  for (let i = 0; i < index; i++) {
    if (text.charCodeAt(i) === 10) line++;
  }
  return line;
}

function getLineExcerpt(text: string, index: number): string {
  const start = text.lastIndexOf("\n", index) + 1;
  const endRaw = text.indexOf("\n", index);
  const end = endRaw === -1 ? text.length : endRaw;
  return text.slice(start, end).trim();
}

function rel(file: string): string {
  return path.relative(ROOT, file).replace(/\\/g, "/");
}

function scanFile(file: string): Finding[] {
  const text = fs.readFileSync(file, "utf8");
  const findings: Finding[] = [];

  for (const pattern of SUSPICIOUS_PATTERNS) {
    pattern.regex.lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = pattern.regex.exec(text))) {
      findings.push({
        file: rel(file),
        line: getLineNumber(text, match.index),
        rule: pattern.name,
        excerpt: getLineExcerpt(text, match.index),
      });
    }
  }

  return findings;
}

function summarizeRecommendedUsage(file: string): { hasAccess: boolean; normalize: boolean } {
  const text = fs.readFileSync(file, "utf8");
  return {
    hasAccess: RECOMMENDED_PATTERNS[0].regex.test(text),
    normalize: RECOMMENDED_PATTERNS[1].regex.test(text),
  };
}

function main(): void {
  const files = walk(ROOT);
  const findings = files.flatMap(scanFile);

  const accessFiles = files.filter((file) => {
    const r = rel(file);
    return /access|tier|premium|editorial|inner-circle|publication|dashboard/i.test(r);
  });

  console.log("\n=== ACCESS CONSISTENCY AUDIT ===\n");

  if (findings.length === 0) {
    console.log("No suspicious access-pattern drift found.\n");
  } else {
    const grouped = new Map<string, Finding[]>();
    for (const finding of findings) {
      if (!grouped.has(finding.file)) grouped.set(finding.file, []);
      grouped.get(finding.file)!.push(finding);
    }

    for (const [file, fileFindings] of grouped.entries()) {
      console.log(file);
      for (const finding of fileFindings) {
        console.log(`  L${finding.line}  [${finding.rule}]  ${finding.excerpt}`);
      }
      console.log("");
    }
  }

  console.log("=== ACCESS FILES USING SSOT HELPERS ===\n");

  for (const file of accessFiles) {
    const usage = summarizeRecommendedUsage(file);
    const flags = [
      usage.hasAccess ? "hasAccess" : "missing-hasAccess",
      usage.normalize ? "normalizeUserTier" : "missing-normalizeUserTier",
    ];
    console.log(`${rel(file)}  ->  ${flags.join(", ")}`);
  }

  console.log("\n=== RECOMMENDATION ===");
  console.log("Prefer normalizeUserTier() + hasAccess() everywhere.");
  console.log("Avoid manual tier arrays, raw .toLowerCase() tier logic, and requireTier.");
  console.log("");
}

main();