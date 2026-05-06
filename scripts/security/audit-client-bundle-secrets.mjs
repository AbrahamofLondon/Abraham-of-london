#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const bundleRoots = [".next/static", ".next/server/app", ".next/server/pages"];
const banned = [
  /\bOPENAI[_A-Z]*\b/,
  /\bANTHROPIC[_A-Z]*\b/,
  /\bNEXTAUTH_SECRET\b/,
  /\bCRON_SECRET\b/,
  /\bDOWNLOAD_SECRET\b/,
  /\bDOWNLOAD_TOKEN_SECRET\b/,
  /\bSOVEREIGN_KEYS?\b/,
  /\bSECRET[_A-Z]*\b/,
  /\bprompt fragments?\b/i,
  /\barbiterResult\b/,
  /\bDecisionAnchors?\b/,
  /\bAnchorContradiction\b/,
  /\banti-gaming\b/i,
  /\bpattern taxonomy\b/i,
  /\bintegrity reasons?\b/i,
  /\bchallenge rules?\b/i,
  /\bthresholds?\b/i,
  /\bscoring weights?\b/i,
  /\bsource:\s*"(llm|deterministic|recovery|fallback)"/i,
];

function normalize(p) {
  return p.split(path.sep).join("/");
}

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, acc);
    } else {
      acc.push(full);
    }
  }
  return acc;
}

const findings = [];

for (const root of bundleRoots) {
  const dir = path.join(repoRoot, root);
  for (const file of walk(dir)) {
    const text = fs.readFileSync(file, "utf8");
    const rel = normalize(path.relative(repoRoot, file));
    for (const pattern of banned) {
      if (pattern.test(text)) {
        findings.push({ file: rel, pattern: String(pattern) });
      }
    }
  }
}

if (findings.length > 0) {
  console.error("Client bundle secret audit failed.");
  for (const finding of findings.slice(0, 100)) {
    console.error(`${finding.file} ${finding.pattern}`);
  }
  process.exit(1);
}

console.log("Client bundle secret audit passed.");
