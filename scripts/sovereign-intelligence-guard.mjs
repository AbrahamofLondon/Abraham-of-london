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
// Only flag runtime references — not type annotations stripped at compile time.
// Exception: Pages Router pages using dynamic import inside getServerSideProps/
// getStaticProps are server-side only — the dynamic import never bundles to client.

function isGsspDynamicEngineImport(text) {
  // File exports GSSP/GSP and uses engine only via await import(), not static import
  const hasGssp = /export\s+(const|async function)\s+getServerSideProps|export\s+(const|async function)\s+getStaticProps/.test(text);
  const hasStaticEngineImport = /^import\s+(?!type\s)[^'"]*from\s+['"]@\/lib\/sovereign\/intelligence-signals['"]$/m.test(text);
  const hasDynamicEngineImport = /await\s+import\s*\(\s*['"]@\/lib\/sovereign\/intelligence-signals['"]/.test(text);
  return hasGssp && hasDynamicEngineImport && !hasStaticEngineImport;
}

for (const file of publicFiles) {
  if (isServerOnlyFile(file)) continue;

  const text = fs.readFileSync(file, "utf8");

  // Pages Router files: allow detectIntelligenceSignals if used only via dynamic import in GSSP
  if (rel(file).startsWith("pages/") && isGsspDynamicEngineImport(text)) continue;

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

// ─── Check 5: No raw prevalencePercent on public surfaces ─────────────────────
// The DTO converts this to a non-numeric label. Any raw number in this context
// would be a DTO boundary violation.

for (const file of publicFiles) {
  if (isServerOnlyFile(file)) continue;
  const text = fs.readFileSync(file, "utf8");
  if (/prevalencePercent/.test(text)) {
    fail(file, "raw prevalencePercent on public surface — use prevalenceLabel from public DTO only");
  }
}

// ─── Check 6: No outcome distribution raw percentages on public surfaces ───────
// outcomeDistributionSummary is text — raw outcomePercent or outcomeDistributionPercent
// must never appear on a public surface.

for (const file of publicFiles) {
  if (isServerOnlyFile(file)) continue;
  const text = fs.readFileSync(file, "utf8");
  if (/outcomePercent|outcomeDistributionPercent/.test(text)) {
    fail(file, "raw outcome distribution percentage on public surface — use outcomeDistributionSummary text from public DTO only");
  }
}

// ─── Check 7: Forbidden automation claim language in public component/page code ─
// Checks JSX string literals and template literals for claim phrases that imply
// functionality the system does not provide or has not been claimed.

const AUTOMATION_CLAIM_PATTERNS = [
  { pattern: /continuous monitoring/i, reason: "\"continuous monitoring\" — use operator-governed cadence language" },
  { pattern: /always-on governance/i, reason: "\"always-on governance\" — use governed automation with human boundary" },
  { pattern: /fully autonomous/i, reason: "\"fully autonomous\" — prohibited; use governed automation" },
  { pattern: /secret intelligence/i, reason: "\"secret intelligence\" — prohibited product copy" },
  { pattern: /quantum signal/i, reason: "\"quantum signal\" — prohibited product copy" },
];

const AUTOMATION_CLAIM_NEGATIONS = [
  /not\s+/i, /never\s+/i, /without\s+/i, /avoid\s+/i, /not\s+claimed/i,
  /what\s+is\s+not/i, /must\s+not/i, /forbidden/i, /unless/i,
];

const automationScanFiles = [
  ...walk(path.join(root, "components")),
  ...walk(path.join(root, "pages")),
  ...walk(path.join(root, "app")),
].filter((f) => !isApiRoute(f));

for (const file of automationScanFiles) {
  const r = rel(file);
  // Skip guard scripts themselves and docs
  if (r.startsWith("scripts/") || r.includes("docs/")) continue;

  const text = fs.readFileSync(file, "utf8");
  const lines = text.split("\n");

  for (const { pattern, reason } of AUTOMATION_CLAIM_PATTERNS) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!pattern.test(line)) continue;
      // Allow comments
      if (/^\s*(\/\/|\/\*|\*)/.test(line.trim())) continue;
      // Allow negation context
      if (AUTOMATION_CLAIM_NEGATIONS.some((neg) => neg.test(line))) continue;
      fail(file, `forbidden automation claim language (line ${i + 1}): ${reason}`);
    }
  }
}

// ─── Check 8: No raw IntelligenceSignal value in API route JSON payloads ────────
// Specifically check for the type name being used as a property key or spread.

const allApiFiles = publicFiles.filter(isApiRoute);

for (const file of allApiFiles) {
  const text = fs.readFileSync(file, "utf8");
  // Detect spreading or returning a raw IntelligenceSignal object
  if (/signals:\s*rawSignals|IntelligenceSignal\[\]/.test(text)) {
    // Allow if it's a type annotation only line
    const valueLines = text.split("\n").filter(
      (l) => !/^\s*\/\//.test(l) && !/^\s*import\s+type\b/.test(l) && !/:\s*IntelligenceSignal\[\]/.test(l),
    );
    if (valueLines.some((l) => /signals:\s*rawSignals/.test(l))) {
      fail(file, "raw IntelligenceSignal[] assigned to 'signals' key in API response — use public DTO instead");
    }
  }
}

// ─── Check 9: All sovereign computation API routes must import require-sovereign-api-access ──
// Only applies to the 4 intelligence computation endpoints — not to auth/logout/report routes
// which have their own gating mechanisms or are the auth mechanism itself.

const SOVEREIGN_COMPUTATION_ROUTES = [
  "app/api/sovereign/signals/route.ts",
  "app/api/sovereign/cohort/route.ts",
  "app/api/sovereign/forensics/route.ts",
  "app/api/sovereign/memory/route.ts",
];

const sovereignApiRoutes = SOVEREIGN_COMPUTATION_ROUTES
  .map((r) => path.join(root, r))
  .filter((f) => fs.existsSync(f));

const SOVEREIGN_ACCESS_GUARD_IMPORT = /require-sovereign-api-access/;

for (const file of sovereignApiRoutes) {
  const text = fs.readFileSync(file, "utf8");
  if (!SOVEREIGN_ACCESS_GUARD_IMPORT.test(text)) {
    fail(file, "sovereign API route missing require-sovereign-api-access import — all /api/sovereign/* routes must be access-gated");
  }
}

// ─── Check 10: No sovereign API route returns raw IntelligenceSignal fields ────
// Extends Check 8 specifically to sovereign routes.

for (const file of sovereignApiRoutes) {
  const text = fs.readFileSync(file, "utf8");
  // Check that DTO boundary is maintained — raw signal arrays must not be key values
  const lines = text.split("\n").filter((l) => !/^\s*\/\//.test(l) && !/import\s+type/.test(l));
  for (const line of lines) {
    // Flag if a field called 'signals' is assigned rawSignals directly
    if (/\bsignals\s*:\s*rawSignals\b/.test(line)) {
      fail(file, `sovereign API route returns raw signals without DTO conversion: ${rel(file)}`);
    }
    // Flag raw signal spread into response
    if (/\.\.\.\s*rawSignals/.test(line)) {
      fail(file, `sovereign API route spreads rawSignals into response — use buildSovereignSignalAssessment`);
    }
  }
}

// ─── Check 11: requireSovereignApiAccess must be called before body read ─────
// Validates that the guard call precedes any data processing in the route body.

for (const file of sovereignApiRoutes) {
  const text = fs.readFileSync(file, "utf8");
  if (!SOVEREIGN_ACCESS_GUARD_IMPORT.test(text)) continue; // already caught in check 9

  const guardCallIndex = text.indexOf("requireSovereignApiAccess");
  const bodyReadIndex = text.indexOf("req.json()");

  if (guardCallIndex === -1) {
    fail(file, "sovereign API route imports require-sovereign-api-access but never calls it");
  } else if (bodyReadIndex !== -1 && bodyReadIndex < guardCallIndex) {
    fail(file, "sovereign API route reads request body before calling requireSovereignApiAccess — guard must execute first");
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

console.log(`SOVEREIGN_INTELLIGENCE_GUARD: PASS (${publicFiles.length} files scanned, ${sovereignApiRoutes.length} sovereign API routes verified)`);
