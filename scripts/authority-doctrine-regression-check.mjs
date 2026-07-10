#!/usr/bin/env node
/**
 * scripts/authority-doctrine-regression-check.mjs
 *
 * Doctrine-regression gate. Governance guidance (integration guides, docs,
 * READMEs, and the recommendation strings emitted by the audit scripts) must
 * never again teach that a public/customer route should render the raw
 * ProductAuthorityContract or its internal-consuming display components.
 *
 * This is NOT a naive "forbid mentioning the name" scan. Admin examples and
 * prohibition documentation (this guide's own "Don't" examples, the ADMIN
 * section, the ban list) are legitimate and must not trip the gate. The gate
 * only fires when a forbidden term appears inside a PUBLIC-scoped context
 * that has not been flipped to a prohibiting polarity.
 *
 * Method: for every occurrence of a forbidden term, look at the preceding
 * WINDOW lines (including the line itself). Find the closest-preceding scope
 * marker (PUBLIC vs ADMIN) and the closest-preceding polarity marker
 * (RECOMMEND vs PROHIBIT). Flag only when scope === PUBLIC and
 * polarity !== PROHIBIT.
 *
 * Usage:
 *   node scripts/authority-doctrine-regression-check.mjs
 *   pnpm gate:authority-doctrine
 *
 * Exit 0 = clean. Exit 1 = a doctrine document recommends the leak again.
 */
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, relative, extname } from "node:path";

const ROOT = process.cwd();
const WINDOW = 15;

// ── Scan targets — governance guidance only, not the whole repo ────────────
const SCAN_TARGETS = [
  "lib/product/ProductAuthorityIntegration.guide.md",
  "docs",
  "README.md",
  "scripts/audit-market-adoption-posture.mjs",
  "scripts/audit-system-wiring.mjs",
  "scripts/authority-boundary-gate.mjs",
  "scripts/authority-dom-vocabulary-scan.mjs",
];

const SCAN_EXTENSIONS = new Set([".md", ".mjs", ".ts", ".tsx"]);

// ── Forbidden terms — the internal authority display machinery + internal
// fields. resolveProductAuthority / getDefaultProductConfigurations are
// deliberately NOT in this list: they are legitimate to call server-side
// even within a public-scoped code example, provided the result is passed
// through projectPublicProductAuthority before it reaches a client surface.
// That distinction (server-side resolve+project vs. client-side render of
// raw fields) is exactly what the "Don't" examples below teach, and this
// gate would produce unfixable false positives on its own correct guidance
// if resolver calls alone tripped it.
const FORBIDDEN_TERMS = [
  "ProductAuthorityPanel",
  "ProductAuthorityNotice",
  "ProductAuthorityBadge",
  "ProductAuthorityWrapper",
  "ProductEvidenceStatus",
  "blockingReasons",
];

// ── Scope markers ────────────────────────────────────────────────────────────
const PUBLIC_SCOPE_RE =
  /\bpublic[- ](?:facing|page|route|surface)\b|\bcustomer[- ](?:facing|page|route|surface)\b|\bPUBLIC_CUSTOMER\b|\bCONTROLLED_CUSTOMER\b|\bENTITLED_CUSTOMER\b|\bpublic product page/i;
const ADMIN_SCOPE_RE =
  /\badmin[/\- ]|\bADMIN\b|\bINTERNAL_OPERATOR\b|\binternal[- ]operator\b|\/admin\//i;

// ── Polarity markers ─────────────────────────────────────────────────────────
const PROHIBIT_RE =
  /❌|MAY NOT CONSUME|must not|may not|never render|do not (?:render|show|display|wire|expose)|forbidden|prohibited|^\s*WRONG\b|banned|not (?:a|an) supported (?:pattern|path)/i;
const RECOMMEND_RE =
  /✅|MAY CONSUME|^\s*CORRECT\b|recommended|should (?:render|show|display|wire)|^\s*Do:|for public-facing product pages/i;

function collectFiles(target) {
  const abs = join(ROOT, target);
  if (!existsSync(abs)) return [];
  const st = statSync(abs);
  if (st.isFile()) return SCAN_EXTENSIONS.has(extname(abs)) ? [abs] : [];

  const results = [];
  function walk(dir) {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (["node_modules", ".next", ".git", "archive"].includes(entry.name)) continue;
        walk(full);
      } else if (entry.isFile() && SCAN_EXTENSIONS.has(extname(entry.name))) {
        results.push(full);
      }
    }
  }
  walk(abs);
  return results;
}

function closestPrecedingMatch(windowLines, re) {
  // Search from the end of the window (closest to the flagged line) backward.
  for (let i = windowLines.length - 1; i >= 0; i--) {
    if (re.test(windowLines[i])) return true;
  }
  return false;
}

function scanFile(absPath) {
  const rel = relative(ROOT, absPath).replace(/\\/g, "/");
  let content;
  try {
    content = readFileSync(absPath, "utf8");
  } catch {
    return [];
  }

  // Fast pre-filter: skip files with no forbidden term at all.
  if (!FORBIDDEN_TERMS.some((t) => content.includes(t))) return [];

  const lines = content.split("\n");
  const findings = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const term of FORBIDDEN_TERMS) {
      if (!line.includes(term)) continue;

      const windowStart = Math.max(0, i - WINDOW + 1);
      const windowLines = lines.slice(windowStart, i + 1);

      const isPublicScope = closestPrecedingMatch(windowLines, PUBLIC_SCOPE_RE);
      const isAdminScope = closestPrecedingMatch(windowLines, ADMIN_SCOPE_RE);
      const isProhibited = closestPrecedingMatch(windowLines, PROHIBIT_RE);

      // Determine which scope marker is actually closer to the flagged line —
      // if ADMIN appears strictly after the last PUBLIC marker in the window,
      // admin wins (the section switched context).
      let scope = "UNKNOWN";
      if (isPublicScope || isAdminScope) {
        let lastPublicIdx = -1;
        let lastAdminIdx = -1;
        for (let w = 0; w < windowLines.length; w++) {
          if (PUBLIC_SCOPE_RE.test(windowLines[w])) lastPublicIdx = w;
          if (ADMIN_SCOPE_RE.test(windowLines[w])) lastAdminIdx = w;
        }
        scope = lastAdminIdx > lastPublicIdx ? "ADMIN" : "PUBLIC";
      }

      // Only PUBLIC scope is in-scope for this gate. ADMIN and UNKNOWN
      // (isolated mentions, component definition docstrings, etc.) are not
      // flagged — this is what keeps the check non-naive.
      if (scope !== "PUBLIC") continue;
      if (isProhibited) continue; // explicitly prohibiting documentation is legitimate

      findings.push({
        file: rel,
        line: i + 1,
        term,
        text: line.trim().slice(0, 140),
      });
    }
  }

  return findings;
}

function main() {
  const files = new Set();
  for (const target of SCAN_TARGETS) {
    for (const f of collectFiles(target)) files.add(f);
  }

  const allFindings = [];
  for (const f of files) allFindings.push(...scanFile(f));

  console.log("── Authority Doctrine Regression Check ──");
  console.log(`files scanned: ${files.size}`);

  if (allFindings.length === 0) {
    console.log("✅ No governance document recommends public/customer rendering of internal authority machinery.");
    process.exit(0);
  }

  console.error(`\n❌ DOCTRINE REGRESSION: ${allFindings.length} finding(s)`);
  console.error("file:line | term | text");
  for (const f of allFindings) {
    console.error(`${f.file}:${f.line} | ${f.term} | ${f.text}`);
  }
  console.error(
    "\nA public/customer-scoped section recommends a forbidden internal authority term " +
      "without a prohibiting marker nearby (❌ / MAY NOT CONSUME / must not / etc.). " +
      "If this is intentional prohibition documentation, add an explicit prohibiting " +
      "marker in the preceding lines. If this is admin-only guidance, add an ADMIN scope " +
      "marker before it.",
  );
  process.exit(1);
}

main();
