#!/usr/bin/env node
/**
 * audit-product-doctrine.mjs
 *
 * Scans client-facing source directories for phrases that violate
 * Abraham of London's product doctrine — overclaims, AI-advisor language,
 * and externally-immutable anchoring assertions that are not yet live.
 *
 * Usage:
 *   node scripts/audit-product-doctrine.mjs
 *   pnpm doctrine:audit
 *
 * Exit code 0 = clean. Exit code 1 = violations found.
 */

import { readdir, readFile, stat } from "node:fs/promises";
import { join, extname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = join(__dirname, "..");

// ── Directories to scan ────────────────────────────────────────────────────
const SCAN_TARGETS = [
  "components/homepage",
  "pages/diagnostics",
  "pages/decision-centre.tsx",
  "pages/strategy-room",
  "pages/oversight",
  "pages/provenance",
  "pages/account/proof-pack.tsx",
  "pages/boardroom",
];

// ── Extensions to read ─────────────────────────────────────────────────────
const EXTENSIONS = new Set([".tsx", ".ts", ".jsx", ".js", ".mjs", ".mdx", ".md"]);

// ── Doctrine violations ────────────────────────────────────────────────────
// Each entry: { pattern: RegExp, label: string, severity: "ERROR" | "WARN" }
const RULES = [
  // Externally-immutable / blockchain claims — not yet live
  {
    pattern: /externally\s+immutable/gi,
    label: "Externally immutable claim — external anchoring is not yet live",
    severity: "ERROR",
  },
  {
    pattern: /WORM\s+retained/gi,
    label: "WORM retained — external WORM is not yet live; use internal chain-of-custody language",
    severity: "ERROR",
  },
  {
    pattern: /blockchain\s+secured/gi,
    label: "Blockchain secured — not a live capability; remove or qualify",
    severity: "ERROR",
  },
  {
    pattern: /tamper[- ]proof/gi,
    label: "Tamper-proof claim — use hash-verifiable or chain-anchored language instead",
    severity: "ERROR",
  },
  {
    pattern: /impossible\s+to\s+alter/gi,
    label: "Impossible to alter — overclaim; use governed-chain language",
    severity: "ERROR",
  },
  {
    pattern: /regulator\s+certif/gi,
    label: "Regulator certified — overclaim not supported by current product",
    severity: "ERROR",
  },
  {
    pattern: /third[- ]party\s+anchor(?:ed|ing)\s+(?:is\s+)?(?:live|active|enabled)/gi,
    label: "Third-party anchoring claimed as live — not yet active",
    severity: "ERROR",
  },

  // AI-advisor / decision-authority framing
  {
    pattern: /AI\s+advisor/gi,
    label: "AI advisor — system is not an advisor; use governed evidence record language",
    severity: "ERROR",
  },
  {
    pattern: /decision\s+governance\s+toolkit/gi,
    label: "Decision governance toolkit — avoid toolkit framing; use governed decision record",
    severity: "WARN",
  },
  {
    pattern: /central\s+hub\s+for\s+tracking/gi,
    label: "Central hub for tracking — avoid CRM/dashboard language; use operating console",
    severity: "WARN",
  },

  // AI leverage / performance-theatre phrases
  {
    pattern: /AI\s+leverage\s+intervention/gi,
    label: "AI leverage interventions — use governed intervention options",
    severity: "ERROR",
  },
  {
    pattern: /performance\s+theatre/gi,
    label: "Performance theatre — avoid this phrase in client-facing copy",
    severity: "WARN",
  },

  // Artifact language
  {
    pattern: /reviewed\s+cycle\s+artifact/gi,
    label: "Reviewed cycle artifact — use governed oversight brief",
    severity: "WARN",
  },

  // Always-present (old provenance stage label)
  {
    pattern: /state:\s*["']Always present["']/g,
    label: "Provenance stage state 'Always present' — use 'Chain carried forward'",
    severity: "WARN",
  },
];

// ── File walker ────────────────────────────────────────────────────────────
async function collectFiles(target) {
  const abs = join(ROOT, target);
  let s;
  try {
    s = await stat(abs);
  } catch {
    return [];
  }
  if (s.isFile()) return EXTENSIONS.has(extname(abs)) ? [abs] : [];

  const results = [];
  async function walk(dir) {
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        // Skip node_modules and .next inside any target
        if (entry.name === "node_modules" || entry.name === ".next") continue;
        await walk(full);
      } else if (entry.isFile() && EXTENSIONS.has(extname(entry.name))) {
        results.push(full);
      }
    }
  }
  await walk(abs);
  return results;
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  const files = [];
  for (const target of SCAN_TARGETS) {
    const collected = await collectFiles(target);
    files.push(...collected);
  }

  const violations = [];

  for (const file of files) {
    let content;
    try {
      content = await readFile(file, "utf8");
    } catch {
      continue;
    }

    const lines = content.split("\n");
    for (const rule of RULES) {
      // Reset stateful regex
      rule.pattern.lastIndex = 0;

      for (let i = 0; i < lines.length; i++) {
        rule.pattern.lastIndex = 0;
        if (rule.pattern.test(lines[i])) {
          violations.push({
            severity: rule.severity,
            label: rule.label,
            file: relative(ROOT, file).replace(/\\/g, "/"),
            line: i + 1,
            text: lines[i].trim().slice(0, 120),
          });
        }
      }
    }
  }

  const errors = violations.filter((v) => v.severity === "ERROR");
  const warnings = violations.filter((v) => v.severity === "WARN");

  if (violations.length === 0) {
    console.log("[DOCTRINE_AUDIT] ✅ Clean — no doctrine violations found across", files.length, "files.");
    process.exit(0);
  }

  console.log(`\n[DOCTRINE_AUDIT] Scanned ${files.length} files.\n`);

  if (errors.length > 0) {
    console.log(`❌  ${errors.length} ERROR${errors.length === 1 ? "" : "S"}\n`);
    for (const v of errors) {
      console.log(`  ERROR  ${v.file}:${v.line}`);
      console.log(`         ${v.label}`);
      console.log(`         → ${v.text}`);
      console.log();
    }
  }

  if (warnings.length > 0) {
    console.log(`⚠️   ${warnings.length} WARNING${warnings.length === 1 ? "" : "S"}\n`);
    for (const v of warnings) {
      console.log(`  WARN   ${v.file}:${v.line}`);
      console.log(`         ${v.label}`);
      console.log(`         → ${v.text}`);
      console.log();
    }
  }

  if (errors.length > 0) {
    console.log("[DOCTRINE_AUDIT] Failed — resolve ERRORs before shipping.");
    process.exit(1);
  } else {
    console.log("[DOCTRINE_AUDIT] Warnings present — review before shipping.");
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("[DOCTRINE_AUDIT] Unexpected error:", err);
  process.exit(1);
});
