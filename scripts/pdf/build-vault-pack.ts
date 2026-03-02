// scripts/pdf/build-vault-pack.ts
// ABRAHAM OF LONDON — Vault Pack Builder (Production Grade)
// ---------------------------------------------------------
// Builds: public/assets/downloads/abraham-vault-artifacts.zip
//
// Source of truth:
// - lib/pdf/pdf-registry.generated.ts (inventory-first registry output)
//
// Hard policy:
// - No placeholders.
// - Deterministic pack contents.
// - Fail if output pack is suspiciously small.
// - Safe path handling (no traversal).

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { Command } from "commander";
import archiver from "archiver";

import { GENERATED_PDF_CONFIGS } from "@/lib/pdf/pdf-registry.generated";
import type { PDFRegistryEntry } from "@/lib/pdf/registry.static";

// ----------------------------
// CLI
// ----------------------------

const program = new Command();

program
  .name("build-vault-pack")
  .description("Build abraham-vault-artifacts.zip from SSOT registry (inventory-first)")
  .option("--out <path>", "Output zip path (relative or abs)", "./public/assets/downloads/abraham-vault-artifacts.zip")
  .option(
    "--include <mode>",
    "What to include: pdfs | pdfs+manifests",
    "pdfs+manifests"
  )
  .option("--tier <tier>", "Tier filter: free | member | architect | inner-circle | all", "all")
  .option("--category <slug>", "CategorySlug filter (exact match)", "")
  .option("--dry-run", "Print what would be included, but do not write zip", false)
  .option("--min-kb <n>", "Fail if output zip smaller than this (KB)", "64")
  .option("--verbose", "Verbose logging", false);

// ----------------------------
// Helpers
// ----------------------------

function toAbs(p: string) {
  return path.isAbsolute(p) ? p : path.join(process.cwd(), p);
}

function ensureDir(p: string) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function safePosix(p: string) {
  return String(p || "").replace(/\\/g, "/").replace(/^\/+/, "");
}

function normalizeTier(s: string) {
  const t = String(s || "").toLowerCase().trim();
  if (t === "free" || t === "member" || t === "architect" || t === "inner-circle") return t;
  return "all";
}

function isPdfEntry(e: PDFRegistryEntry) {
  return String(e.format).toUpperCase() === "PDF" && String(e.outputPath).toLowerCase().endsWith(".pdf");
}

function repoAbsFromPublicWebPath(webPath: string) {
  // webPath like "/assets/downloads/content-downloads/x.pdf"
  const rel = safePosix(webPath);
  return path.join(process.cwd(), "public", rel);
}

function sha256File(abs: string) {
  const buf = fs.readFileSync(abs);
  return crypto.createHash("sha256").update(buf).digest("hex");
}

function nowISO() {
  return new Date().toISOString();
}

type PackItem = {
  id: string;
  title: string;
  outputPath: string;   // web
  absPath: string;      // disk
  sizeBytes: number;
  sha256: string;
  tier: string;
  categorySlug: string | null;
};

// ----------------------------
// Build inventory
// ----------------------------

function buildPackInventory(opts: {
  tier: string;
  category: string;
  verbose: boolean;
}): PackItem[] {
  const tierFilter = normalizeTier(opts.tier);
  const categoryFilter = String(opts.category || "").trim().toLowerCase();

  const items: PackItem[] = [];

  for (const e of GENERATED_PDF_CONFIGS as ReadonlyArray<PDFRegistryEntry>) {
    if (!isPdfEntry(e)) continue;

    const eTier = String(e.tier || "free").toLowerCase();
    if (tierFilter !== "all" && eTier !== tierFilter) continue;

    const eCat = String((e as any).categorySlug || (e as any).category || "").toLowerCase();
    if (categoryFilter && eCat !== categoryFilter) continue;

    const abs = repoAbsFromPublicWebPath(e.outputPath);
    if (!fs.existsSync(abs)) {
      throw new Error(`[VAULT PACK] Missing file on disk: ${e.outputPath} -> ${abs}`);
    }

    const st = fs.statSync(abs);
    if (!st.isFile() || st.size <= 0) {
      throw new Error(`[VAULT PACK] Invalid file on disk: ${e.outputPath} (${st.size} bytes)`);
    }

    items.push({
      id: e.id,
      title: e.title,
      outputPath: e.outputPath,
      absPath: abs,
      sizeBytes: st.size,
      sha256: sha256File(abs),
      tier: eTier,
      categorySlug: eCat || null,
    });
  }

  // Stable ordering for deterministic zips
  items.sort((a, b) => {
    const t = a.tier.localeCompare(b.tier);
    if (t !== 0) return t;
    const c = String(a.categorySlug || "").localeCompare(String(b.categorySlug || ""));
    if (c !== 0) return c;
    return a.id.localeCompare(b.id);
  });

  if (opts.verbose) {
    console.log(`[VAULT PACK] Inventory: ${items.length} PDFs`);
    console.log(items.slice(0, 20).map(x => ` - ${x.tier}/${x.id} (${Math.round(x.sizeBytes/1024)}KB)`).join("\n"));
    if (items.length > 20) console.log(` - … ${items.length - 20} more`);
  }

  if (!items.length) {
    throw new Error(`[VAULT PACK] No PDFs matched filters (tier=${tierFilter}, category=${categoryFilter || "any"})`);
  }

  return items;
}

// ----------------------------
// Zip writer
// ----------------------------

async function writeZip(args: {
  outAbs: string;
  includeMode: "pdfs" | "pdfs+manifests";
  items: PackItem[];
  minKB: number;
  dryRun: boolean;
}) {
  const { outAbs, includeMode, items, minKB, dryRun } = args;

  if (dryRun) {
    console.log(`\n[DRY RUN] Would write: ${outAbs}`);
    console.log(`[DRY RUN] Files: ${items.length} PDFs`);
    return;
  }

  ensureDir(path.dirname(outAbs));
  if (fs.existsSync(outAbs)) fs.unlinkSync(outAbs);

  const outStream = fs.createWriteStream(outAbs);
  const archive = archiver("zip", { zlib: { level: 9 } });

  const done = new Promise<void>((resolve, reject) => {
    outStream.on("close", () => resolve());
    outStream.on("error", reject);
    archive.on("warning", (err) => {
      // warnings (like stat failures) should fail here because we’re “no placeholders”
      reject(err);
    });
    archive.on("error", reject);
  });

  archive.pipe(outStream);

  // Add PDFs under a clean, stable folder name inside the zip
  for (const it of items) {
    const inside = safePosix(path.join("vault-pack", it.tier, path.basename(it.absPath)));
    archive.file(it.absPath, { name: inside });
  }

  // Add a manifest inside the zip for integrity + UX
  const packManifest = {
    generatedAt: nowISO(),
    total: items.length,
    bytesTotal: items.reduce((a, x) => a + x.sizeBytes, 0),
    files: items.map((x) => ({
      id: x.id,
      title: x.title,
      tier: x.tier,
      categorySlug: x.categorySlug,
      outputPath: x.outputPath,
      zipPath: safePosix(path.join("vault-pack", x.tier, path.basename(x.absPath))),
      sizeBytes: x.sizeBytes,
      sha256: x.sha256,
    })),
  };

  archive.append(JSON.stringify(packManifest, null, 2), {
    name: "vault-pack/pack-manifest.json",
  });

  // Optionally include the public manifests too (recommended)
  if (includeMode === "pdfs+manifests") {
    const publicDownloads = path.join(process.cwd(), "public", "assets", "downloads");
    const candidates = [
      "pdf-manifest.json",
      "pdf-duplicates.json",
      "pdf-ssot-validate.json",
    ];

    for (const f of candidates) {
      const abs = path.join(publicDownloads, f);
      if (fs.existsSync(abs)) {
        archive.file(abs, { name: safePosix(path.join("vault-pack", "manifests", f)) });
      }
    }
  }

  await archive.finalize();
  await done;

  const st = fs.statSync(outAbs);
  const sizeKB = Math.round(st.size / 1024);

  if (sizeKB < minKB) {
    throw new Error(`[VAULT PACK] Output zip too small (<${minKB}KB): ${outAbs} (${sizeKB}KB)`);
  }

  console.log(`✅ Vault pack built: ${outAbs}`);
  console.log(`   - PDFs: ${items.length}`);
  console.log(`   - Size: ${sizeKB.toLocaleString()} KB`);
}

// ----------------------------
// Main
// ----------------------------

async function main() {
  program.parse(process.argv);
  const raw = program.opts();

  const outAbs = toAbs(String(raw.out || "./public/assets/downloads/abraham-vault-artifacts.zip"));
  const includeMode = (String(raw.include || "pdfs+manifests") === "pdfs" ? "pdfs" : "pdfs+manifests") as
    | "pdfs"
    | "pdfs+manifests";

  const tier = String(raw.tier || "all");
  const category = String(raw.category || "");
  const dryRun = Boolean(raw.dryRun);
  const verbose = Boolean(raw.verbose);
  const minKB = Math.max(1, parseInt(String(raw.minKb || "64"), 10) || 64);

  console.log("🧰 [VAULT PACK] Building abraham-vault-artifacts.zip from SSOT registry...");
  console.log(`   - include: ${includeMode}`);
  console.log(`   - tier: ${tier}`);
  if (category) console.log(`   - category: ${category}`);
  console.log(`   - out: ${outAbs}`);

  const items = buildPackInventory({ tier, category, verbose });

  await writeZip({ outAbs, includeMode, items, minKB, dryRun });
}

main().catch((e) => {
  console.error(`❌ [VAULT PACK] Fatal: ${e?.message || String(e)}`);
  process.exit(1);
});

export default main;