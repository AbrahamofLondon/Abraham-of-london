#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();

const prohibitedZones = [
  "components",
  "pages",
  "app",
  "content",
  "public",
];

const protectedPrefixes = [
  "lib/server/",
  "app/api/",
  "pages/api/",
];

const fileExtensions = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".md",
  ".mdx",
  ".json",
]);

const bannedPatterns = [
  {
    name: "threshold",
    regex: /\bthresholds?\b/i,
    ignore: [
      /\bintersectionobserver\b/i,
      /\brootmargin\b/i,
      /\bthreshold\s*[:=]/i,
      /\bthreshold\?/i,
      /\bfont-weight\b/i,
      /\bthreshold proximity\b/i,
    ],
    require: /\b(diagnostic|integrity|constitutional|severity|critical|below|meets|govern|review|qualif)\b/i,
  },
  {
    name: "weight",
    regex: /\bweights?\b|\bweighting\b/i,
    ignore: [
      /\bfont-weight\b/i,
      /\bfont-(thin|light|normal|medium|semibold|bold|extrabold|black)\b/i,
      /\bwght\b/i,
      /\bcorrect weights?\b/i,
      /\bbear weight\b/i,
      /\bcarry weight\b/i,
    ],
    require: /\b(signal|score|model|drift|distribution|influence|weighted?|proprietary|evaluation)\b/i,
  },
  { name: "score band", regex: /\b(score\s*bands?|scoreBand|banded scoring|80\/60\/40|0-40|41-60|61-80|81-100)\b/i },
  { name: "arbiter rule", regex: /\barbiter|arbitration\b/i },
  {
    name: "fallback mode",
    regex: /\bfallback(mode|route|source)?\b/i,
    ignore: [
      /\bfallback\s*[=:({<]/i,
      /\bfallback\?/i,
      /\bif\s*\([^)]*fallback/i,
      /\breturn\s+fallback\b/i,
      /\bfallback\s+to\b/i,
      /\bgraceful fallback\b/i,
      /\bsafe fallback\b/i,
      /\bimage fails\b/i,
      /\blazy loading\b/i,
      /\bcopy link\b/i,
      /\bfont failed to load\b/i,
      /\berrorboundary\b/i,
      /\bsuspense\b/i,
    ],
    require: /\b(mode|route|source|recovery|deterministic|governed analysis|completion|content source)\b/i,
  },
  { name: "deterministic mode", regex: /\bdeterministic\b/i },
  { name: "LLM source", regex: /\bllm\b|language model/i },
  {
    name: "signal map",
    regex: /\bsignal(map|s)?\b|\bSignalKey\b|\bmatchedSignals?\b/i,
    ignore: [
      /\bAbortSignal\b/i,
      /\bcontroller\.signal\b/i,
      /\bsignal:\s*\{/i,
      /\bsignal:\s*true\b/i,
      /\bsignal\?\s*:/i,
      /\bsignal quality\b/i,
      /\bsignal over noise\b/i,
      /\bpublic signal\b/i,
      /\blive signal\b/i,
      /\bmarket signals?\b/i,
    ],
    require: /\b(signalmap|matchedsignals?|SignalKey|fragility signal|signal profile|diagnostic signal|constitutional signals?|internal signals?)\b/i,
  },
  { name: "classification keyword", regex: /\bmatchedKeywords?|keyword classification\b/i },
  { name: "raw spine", regex: /\brawSpine|intelligence spine\b/i },
  { name: "decision anchors", regex: /\bDecisionAnchors?\b|\bAnchorContradiction\b/i },
  { name: "integrity reasons", regex: /\bintegrity reasons?\b/i },
  { name: "challenge rules", regex: /\bchallenge rules?\b/i },
  { name: "anti gaming", regex: /\banti-gaming\b|\banti gaming\b/i },
  { name: "token secrets", regex: /\b(CRON_SECRET|DOWNLOAD_SECRET|NEXTAUTH_SECRET|SOVEREIGN_KEYS?)\b/i },
  { name: "pattern taxonomy", regex: /\bpattern taxonomy\b/i },
];

function normalize(relPath) {
  return relPath.split(path.sep).join("/");
}

function isProtected(relPath) {
  const normalized = normalize(relPath);
  return protectedPrefixes.some((prefix) => normalized.startsWith(prefix));
}

function shouldScan(relPath) {
  const normalized = normalize(relPath);
  if (isProtected(normalized)) return false;
  if (!prohibitedZones.some((zone) => normalized === zone || normalized.startsWith(`${zone}/`))) {
    return false;
  }
  return fileExtensions.has(path.extname(normalized));
}

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".next" || entry.name === ".git") continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, acc);
    } else {
      acc.push(fullPath);
    }
  }
  return acc;
}

const files = walk(repoRoot);
const findings = [];

for (const fullPath of files) {
  const relPath = normalize(path.relative(repoRoot, fullPath));
  if (!shouldScan(relPath)) continue;

  const content = fs.readFileSync(fullPath, "utf8");
  const lines = content.split(/\r?\n/);

  lines.forEach((line, index) => {
    for (const pattern of bannedPatterns) {
      if (!pattern.regex.test(line)) continue;
      if (pattern.ignore?.some((ignore) => ignore.test(line))) continue;
      if (pattern.require && !pattern.require.test(line)) continue;
        findings.push({
          file: relPath,
          line: index + 1,
          pattern: pattern.name,
          text: line.trim().slice(0, 180),
        });
    }
  });
}

if (findings.length > 0) {
  console.error("Public IP exposure audit failed.");
  for (const finding of findings.slice(0, 200)) {
    console.error(`${finding.file}:${finding.line} [${finding.pattern}] ${finding.text}`);
  }
  process.exit(1);
}

console.log("Public IP exposure audit passed.");
