#!/usr/bin/env node
/**
 * sovereign-intelligence-guard.mjs
 *
 * CI guard for the Sovereign Intelligence layer boundary.
 *
 * Fails on:
 * 1. Public surfaces (app/, pages/, components/) directly importing raw
 *    sovereign engine files (intelligence-signals, cohort-intelligence,
 *    intelligence-commons, decision-forensics, institutional-memory).
 *    Only the public-safe DTO may cross the boundary.
 * 2. API routes serialising raw IntelligenceSignal objects (detectIntelligenceSignals,
 *    SIGNAL_LIBRARY, or raw signal predicates) in public JSON payloads.
 * 3. Forbidden claim language in public-facing surfaces:
 *    - "verified benchmark" without explicit caveat
 *    - "industry benchmark" unqualified
 *    - "automated oversight" unless tied to governed runtime
 *    - "predictive certainty", "Sovereign AI", "Quantum signal", "Secret engine"
 *
 * Classification: OPERATOR_ONLY_GUARD (this file is never served to clients)
 */

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];

// ─── Raw sovereign engine module paths (never allowed on public surfaces) ─────

const RAW_ENGINE_SPECIFIERS = [
  "@/lib/sovereign/intelligence-signals",
  "@/lib/sovereign/cohort-intelligence",
  "@/lib/sovereign/intelligence-commons",
  "@/lib/sovereign/decision-forensics",
  "@/lib/sovereign/institutional-memory",
];

// The only sovereign import allowed on public surfaces
const ALLOWED_PUBLIC_SOVEREIGN = "@/lib/sovereign/sovereign-signal-public-dto";

// ─── Raw detection symbols (must not appear in serialised API payloads) ────────

const FORBIDDEN_DETECTION_SYMBOLS = [
  /\bdetectIntelligenceSignals\b/,
  /\bSIGNAL_LIBRARY\b/,
  /\bpredicates?\b/i,
  /\bdetectionThreshold\b/,
  /\bscoreWeight\b/,
  /\bformulaWeight\b/,
  /\binternalScore\b/,
  /\brawPrevalence\b/,
  /\bsignalPredicat/,
];

// ─── Forbidden claim language (never on public-facing surfaces) ────────────────

const FORBIDDEN_CLAIM_PATTERNS = [
  { pattern: /verified benchmark/i, reason: "\"verified benchmark\" — must include sample caveat and evidence posture" },
  { pattern: /industry benchmark/i, reason: "\"industry benchmark\" — must qualify with sample size and posture" },
  { pattern: /automated oversight/i, reason: "\"automated oversight\" — must be tied to governed automation runtime" },
  { pattern: /predictive certainty/i, reason: "\"predictive certainty\" — forbidden; use qualified outcome framing" },
  { pattern: /Sovereign AI/i, reason: "\"Sovereign AI\" — AI mystique language prohibited" },
  { pattern: /Quantum signal/i, reason: "\"Quantum signal\" — prohibited product copy" },
  { pattern: /Secret engine/i, reason: "\"Secret engine\" — prohibited product copy" },
  { pattern: /autonomous governance/i, reason: "\"autonomous governance\" — prohibited; use governed automation" },
];

// ─── File walker ───────────────────────────────────────────────────────────────

const CODE_EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs"]);

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const results = [];
  for (const entry of entries) {
    if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walk(full));
    } else if (CODE_EXTS.has(path.extname(entry.name))) {
      results.push(full);
    }
  }
  return results;
}

function rel(file) {
  return path.relative(root, file).replace(/\\/g, "/");
}

function fail(file, reason) {
  failures.push(`${rel(file)}: ${reason}`);
}

// ─── Classify file surface ─────────────────────────────────────────────────────

function isApiRoute(file) {
  const r = rel(file);
  return r.startsWith("app/api/") || r.startsWith("pages/api/");
}

function isPublicSurface(file) {
  const r = rel(file);
  return (
    r.startsWith("app/") ||
    r.startsWith("pages/") ||
    r.startsWith("components/")
  );
}

function isServerOnlyFile(file) {
  const r = rel(file);
  // API routes are server-only — raw engine imports are permitted
  return r.startsWith("app/api/") || r.startsWith("pages/api/");
}

// ─── Check 1: Raw engine imports on non-API public surfaces ───────────────────

const publicFiles = [
  ...walk(path.join(root, "app")),
  ...walk(path.join(root, "pages")),
  ...walk(path.join(root, "components")),
];

for (const file of publicFiles) {
  if (isServerOnlyFile(file)) continue; // API routes are allowed to use raw engine

  const text = fs.readFileSync(file, "utf8");

  // Only flag VALUE imports — `import type` is erased at compile time and cannot leak data
  const valueImports = [...text.matchAll(/^(?!.*\bimport\s+type\b).*from\s+["']([^"']+)["']/gm)].map(
    (m) => m[1],
  );

  for (const specifier of valueImports) {
    if (
      RAW_ENGINE_SPECIFIERS.some((raw) => specifier === raw || specifier.startsWith(raw + "/")) &&
      specifier !== ALLOWED_PUBLIC_SOVEREIGN
    ) {
      fail(file, `raw sovereign engine value import forbidden on public surface: ${specifier}`);
    }
  }
}

// ─── Check 2: Raw detection symbols in API route JSON payloads ────────────────

for (const file of publicFiles.filter(isApiRoute)) {
  const text = fs.readFileSync(file, "utf8");

  // Extract text within .json( ... ) blocks (rough heuristic, not a full parser)
  const jsonCalls = [...text.matchAll(/\.json\s*\(\s*\{([\s\S]*?)(?=\}\s*\))/g)].map(
    (m) => m[1] ?? "",
  );

  for (const payload of jsonCalls) {
    for (const symbol of FORBIDDEN_DETECTION_SYMBOLS) {
      if (symbol.test(payload)) {
        fail(file, `forbidden detection symbol in public JSON payload: ${symbol}`);
      }
    }
  }
}

// ─── Check 3: Forbidden claim language in public-facing surfaces ──────────────

const claimScanFiles = [
  ...walk(path.join(root, "components")),
  ...walk(path.join(root, "app")),
];

// Exclude server-only and internal files from claim scan
const CLAIM_SCAN_EXCLUDES = [
  "node_modules",
  "/api/",
  "scripts/",
  "sovereign-intelligence-guard",
  "sovereign-intelligence-brief",
];

for (const file of claimScanFiles) {
  const r = rel(file);
  if (CLAIM_SCAN_EXCLUDES.some((ex) => r.includes(ex))) continue;

  const text = fs.readFileSync(file, "utf8");
  for (const { pattern, reason } of FORBIDDEN_CLAIM_PATTERNS) {
    if (pattern.test(text)) {
      fail(file, `forbidden claim language: ${reason}`);
    }
  }
}

// ─── Check 4: detectIntelligenceSignals / SIGNAL_LIBRARY on public surfaces ───
// Only flag runtime references — not type annotations stripped at compile time

for (const file of publicFiles) {
  if (isServerOnlyFile(file)) continue;

  const text = fs.readFileSync(file, "utf8");
  // Filter out type-only lines before checking
  const runtimeLines = text
    .split("\n")
    .filter((line) => !line.trim().startsWith("//") && !/^\s*import\s+type\b/.test(line))
    .join("\n");

  if (/\bdetectIntelligenceSignals\s*\(/.test(runtimeLines)) {
    fail(file, "detectIntelligenceSignals() called from public surface — must be server-side only");
  }
  if (/\bSIGNAL_LIBRARY\s*[\[.]/.test(runtimeLines)) {
    fail(file, "SIGNAL_LIBRARY accessed from public surface — must be server-side only");
  }
}

// ─── Result ────────────────────────────────────────────────────────────────────

if (failures.length > 0) {
  console.error("SOVEREIGN_INTELLIGENCE_GUARD: FAIL");
  for (const failure of failures) {
    console.error(`  - ${failure}`);
  }
  process.exit(1);
}

console.log(`SOVEREIGN_INTELLIGENCE_GUARD: PASS (${publicFiles.length} files scanned)`);
