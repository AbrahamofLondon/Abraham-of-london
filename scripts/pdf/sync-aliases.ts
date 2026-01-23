// scripts/pdf/sync-aliases.ts
// Alias sync for PDFs with SHA-256 hashing + safety gates.
// - Copies from canonical PDF -> alias locations under /public
// - Only copies when content differs (SHA-256)
// - Prevents overwriting "real" PDFs with tiny placeholder/fallback PDFs
//
// Usage:
//   pnpm tsx scripts/pdf/sync-aliases.ts --dry-run
//   pnpm tsx scripts/pdf/sync-aliases.ts --legacy-extras
//   pnpm tsx scripts/pdf/sync-aliases.ts --min-kb=10
//   pnpm tsx scripts/pdf/sync-aliases.ts --force
//
// Notes:
// - Paths are PUBLIC URL paths (start with "/").
// - Mapped to filesystem paths under "<repo>/public".

import fs from "fs";
import path from "path";
import crypto from "crypto";

type AliasGroup = {
  canonicalPublicPath: string;
  aliasPublicPaths: string[];
  label?: string;
};

type Args = {
  dryRun: boolean;
  verbose: boolean;
  only: string;
  legacyExtras: boolean;
  force: boolean;
  minKb: number;
};

function parseArgs(argv: string[]): Args {
  const out: Args = {
    dryRun: false,
    verbose: false,
    only: "",
    legacyExtras: false,
    force: false,
    minKb: 25, // default: do not allow writing super tiny placeholder PDFs into aliases
  };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") out.dryRun = true;
    else if (a === "--verbose") out.verbose = true;
    else if (a === "--legacy-extras") out.legacyExtras = true;
    else if (a === "--force") out.force = true;
    else if (a === "--only") out.only = (argv[i + 1] || "").trim();
    else if (a.startsWith("--only=")) out.only = a.split("=", 2)[1].trim();
    else if (a.startsWith("--min-kb=")) out.minKb = Number(a.split("=", 2)[1] || "25") || 25;
    else if (a === "--min-kb") out.minKb = Number(argv[i + 1] || "25") || 25;
  }

  return out;
}

function normalizePublicPath(p: string): string {
  let s = (p || "").trim();
  if (!s.startsWith("/")) s = `/${s}`;
  s = s.replace(/\\/g, "/");
  s = s.replace(/\/{2,}/g, "/");
  return s;
}

function publicToAbs(publicPath: string): string {
  const clean = normalizePublicPath(publicPath).replace(/^\/+/, "");
  return path.join(process.cwd(), "public", clean);
}

function ensureDirForFile(absFile: string) {
  fs.mkdirSync(path.dirname(absFile), { recursive: true });
}

function existsFile(absFile: string): boolean {
  try {
    return fs.statSync(absFile).isFile();
  } catch {
    return false;
  }
}

function statSizeKb(absFile: string): number {
  const st = fs.statSync(absFile);
  return Math.round(st.size / 1024);
}

function sha256File(absFile: string): string {
  const h = crypto.createHash("sha256");
  h.update(fs.readFileSync(absFile));
  return h.digest("hex");
}

function fastEqualByStat(a: string, b: string): boolean | "unknown" {
  try {
    const sa = fs.statSync(a);
    const sb = fs.statSync(b);
    if (sa.size !== sb.size) return false;
    return "unknown";
  } catch {
    return false;
  }
}

function relFromPublic(absPath: string): string {
  const pubRoot = path.join(process.cwd(), "public");
  const rel = path.relative(pubRoot, absPath).replace(/\\/g, "/");
  return "/" + rel.replace(/^\/+/, "");
}

/**
 * Heuristics to detect placeholder/fallback PDFs.
 * Adjust if your fallback generator changes.
 */
function looksLikeFallback(absFile: string): boolean {
  const base = path.basename(absFile).toLowerCase();
  if (base.includes("fallback")) return true;
  if (base === "_core-fallback.pdf") return true;

  // Size-based heuristic: ultra-tiny PDFs are usually placeholders.
  // (We don't *only* rely on this; it just flags a suspicion.)
  try {
    const kb = statSizeKb(absFile);
    if (kb > 0 && kb <= 6) return true;
  } catch {
    return false;
  }

  return false;
}

function shouldBlockCopy(opts: {
  canonicalAbs: string;
  destAbs: string;
  minKb: number;
  force: boolean;
  verbose: boolean;
}): { block: boolean; reason?: string } {
  const { canonicalAbs, destAbs, minKb, force } = opts;

  if (force) return { block: false };

  // If canonical looks like fallback/placeholder, be cautious.
  const canonLooksFallback = looksLikeFallback(canonicalAbs);
  const canonKb = statSizeKb(canonicalAbs);

  // If destination exists and is "real" (>= minKb), don't overwrite it with a tiny/fallback canonical.
  if (existsFile(destAbs)) {
    const destKb = statSizeKb(destAbs);

    if (destKb >= minKb && (canonLooksFallback || canonKb < minKb)) {
      return {
        block: true,
        reason: `blocked: dest=${destKb}KB looks real; canonical=${canonKb}KB looks placeholder/fallback`,
      };
    }
  }

  // Even if dest doesn't exist, you may not want to publish tiny placeholders in aliases.
  if (!existsFile(destAbs) && (canonLooksFallback || canonKb < minKb)) {
    return {
      block: true,
      reason: `blocked: canonical=${canonKb}KB looks placeholder/fallback (minKb=${minKb})`,
    };
  }

  return { block: false };
}

function copyIfDifferent(opts: {
  canonicalAbs: string;
  destAbs: string;
  dryRun: boolean;
  verbose: boolean;
  minKb: number;
  force: boolean;
}): { result: "copied" | "skipped" | "blocked"; reason?: string } {
  const { canonicalAbs, destAbs, dryRun, verbose, minKb, force } = opts;

  const gate = shouldBlockCopy({ canonicalAbs, destAbs, minKb, force, verbose });
  if (gate.block) return { result: "blocked", reason: gate.reason };

  if (!existsFile(destAbs)) {
    if (!dryRun) {
      ensureDirForFile(destAbs);
      fs.copyFileSync(canonicalAbs, destAbs);
    }
    return { result: "copied" };
  }

  const statEq = fastEqualByStat(canonicalAbs, destAbs);

  // Same size? hash to confirm.
  if (statEq === "unknown") {
    const ha = sha256File(canonicalAbs);
    const hb = sha256File(destAbs);
    if (ha === hb) return { result: "skipped" };

    if (!dryRun) {
      ensureDirForFile(destAbs);
      fs.copyFileSync(canonicalAbs, destAbs);
    }
    return { result: "copied" };
  }

  if (statEq === false) {
    if (!dryRun) {
      ensureDirForFile(destAbs);
      fs.copyFileSync(canonicalAbs, destAbs);
    }
    return { result: "copied" };
  }

  // In practice, statEq === true won't happen (we return "unknown" for equal sizes),
  // but keep it safe:
  const ha = sha256File(canonicalAbs);
  const hb = sha256File(destAbs);
  if (ha === hb) return { result: "skipped" };

  if (!dryRun) {
    ensureDirForFile(destAbs);
    fs.copyFileSync(canonicalAbs, destAbs);
  }
  return { result: "copied" };
}

// -----------------------------------------------------------------------------
// Alias map
// -----------------------------------------------------------------------------

function buildAliasGroups(legacyExtras: boolean): AliasGroup[] {
  const groups: AliasGroup[] = [
    {
      label: "personal-alignment-assessment-fillable",
      canonicalPublicPath: "/assets/downloads/personal-alignment-assessment-fillable.pdf",
      aliasPublicPaths: [
        "/assets/downloads/content-downloads/personal-alignment-assessment-fillable.pdf",
        "/assets/downloads/lib-pdf/personal-alignment-assessment-fillable.pdf",
        "/assets/downloads/public-assets/vault/personal-alignment-assessment-fillable.pdf",
        "/downloads/personal-alignment-assessment-fillable.pdf",
      ],
    },
    {
      label: "life-alignment-assessment-base",
      canonicalPublicPath: "/assets/downloads/content-downloads/life-alignment-assessment.pdf",
      aliasPublicPaths: [
        "/assets/downloads/life-alignment-assessment.pdf",
        "/assets/downloads/lib-pdf/life-alignment-assessment.pdf",
        "/assets/downloads/life-alignment-worksheet.pdf",
        "/downloads/life-alignment-worksheet.pdf",
      ],
    },
    {
      label: "surrender-framework",
      canonicalPublicPath: "/assets/downloads/surrender-framework.pdf",
      aliasPublicPaths: [
        "/assets/downloads/content-downloads/surrender-framework.pdf",
        "/downloads/surrender-framework.pdf",
      ],
    },
    {
      label: "surrender-principles",
      canonicalPublicPath: "/assets/downloads/surrender-principles.pdf",
      aliasPublicPaths: [
        "/assets/downloads/content-downloads/surrender-principles.pdf",
        "/downloads/surrender-principles.pdf",
      ],
    },
    {
      label: "decision-matrix-scorecard-fillable",
      canonicalPublicPath: "/assets/downloads/lib-pdf/decision-matrix-scorecard-fillable.pdf",
      aliasPublicPaths: [
        "/assets/downloads/decision-matrix-scorecard-fillable.pdf",
        "/assets/downloads/public-assets/vault/decision-matrix-scorecard-fillable.pdf",
        "/downloads/decision-matrix-scorecard-fillable.pdf",
      ],
    },
    {
      label: "legacy-canvas-fillable",
      canonicalPublicPath: "/assets/downloads/lib-pdf/legacy-canvas-fillable.pdf",
      aliasPublicPaths: [
        "/assets/downloads/legacy-canvas-fillable.pdf",
        "/assets/downloads/public-assets/vault/legacy-canvas-fillable.pdf",
        "/downloads/legacy-canvas-fillable.pdf",
      ],
    },
    {
      label: "purpose-pyramid-worksheet-fillable",
      canonicalPublicPath: "/assets/downloads/lib-pdf/purpose-pyramid-worksheet-fillable.pdf",
      aliasPublicPaths: [
        "/assets/downloads/purpose-pyramid-worksheet-fillable.pdf",
        "/assets/downloads/public-assets/vault/purpose-pyramid-worksheet-fillable.pdf",
        "/downloads/purpose-pyramid-worksheet-fillable.pdf",
        ...(legacyExtras ? ["/downloads/lib-pdf/purpose-pyramid-worksheet-fillable.pdf"] : []),
      ],
    },
  ];

  return groups.map((g) => {
    const canon = normalizePublicPath(g.canonicalPublicPath);
    const uniq = Array.from(new Set((g.aliasPublicPaths || []).map(normalizePublicPath))).filter(
      (p) => p !== canon
    );
    return { ...g, canonicalPublicPath: canon, aliasPublicPaths: uniq };
  });
}

// -----------------------------------------------------------------------------
// Main
// -----------------------------------------------------------------------------

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const groups = buildAliasGroups(args.legacyExtras);

  console.log(
    `pdf-alias-sync  dryRun=${args.dryRun}  hashing=sha256  legacyExtras=${args.legacyExtras}  minKb=${args.minKb}  force=${args.force}`
  );

  let copied = 0;
  let skipped = 0;
  let blocked = 0;
  let missingCanonical = 0;

  for (const g of groups) {
    if (args.only && g.label && g.label !== args.only) continue;

    const canonAbs = publicToAbs(g.canonicalPublicPath);
    if (!existsFile(canonAbs)) {
      console.log(`MISSING_CANONICAL  ${g.canonicalPublicPath}`);
      missingCanonical++;
      continue;
    }

    for (const aliasPublicPath of g.aliasPublicPaths) {
      const destAbs = publicToAbs(aliasPublicPath);

      const { result, reason } = copyIfDifferent({
        canonicalAbs: canonAbs,
        destAbs,
        dryRun: args.dryRun,
        verbose: args.verbose,
        minKb: args.minKb,
        force: args.force,
      });

      const left = relFromPublic(destAbs);
      const right = relFromPublic(canonAbs);

      if (result === "copied") {
        copied++;
        console.log(`COPY   ${left}  <=  ${right}`);
      } else if (result === "blocked") {
        blocked++;
        console.log(`BLOCK  ${left}  <=  ${right}  (${reason || "safety gate"})`);
      } else {
        skipped++;
        console.log(`SKIP   ${left}`);
      }
    }
  }

  console.log(
    `done  copied=${copied}  skipped=${skipped}  blocked=${blocked}  missingCanonical=${missingCanonical}`
  );
}

main().catch((e) => {
  console.error(e?.stack || e?.message || e);
  process.exit(1);
});