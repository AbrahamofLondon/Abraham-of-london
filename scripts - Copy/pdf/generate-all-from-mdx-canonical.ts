// scripts/pdf/generate-all-from-mdx-canonical.ts
//
// Generates TWO output tracks (no collisions):
// A) Canonical (flat) PDFs for the public site paths you already use:
//    /public/assets/downloads/content-downloads/<pdfName>.pdf
// B) Tiered variants (foldered) for inner-circle packaging:
//    /public/assets/downloads/content-downloads/<tier>/<format>/<quality>/<pdfName>.pdf
//
// Usage:
//   pnpm tsx scripts/pdf/generate-all-from-mdx-canonical.ts
//   pnpm tsx scripts/pdf/generate-all-from-mdx-canonical.ts --only=leadership-playbook
//   pnpm tsx scripts/pdf/generate-all-from-mdx-canonical.ts --skip-tiered
//   pnpm tsx scripts/pdf/generate-all-from-mdx-canonical.ts --skip-canonical
//   pnpm tsx scripts/pdf/generate-all-from-mdx-canonical.ts --formats=A4,Letter --quality=standard,premium
//
// Notes:
// - Canonical generation uses ONE chosen tier/quality/format for each doc to keep a stable URL.
// - Tiered generation still produces the full matrix (or filtered by CLI).
//

import fs from "fs";
import path from "path";

import { MdxToPdfConverter } from "./mdx-pdf-converter/converter";
import {
  DOCUMENT_REGISTRY,
  discoverMdxFiles,
  type DocumentRegistryEntry,
  type TierConfig,
  type PaperFormat,
  type Quality,
  repoAbsFromPublic,
  outputPublicPathForMdx,
} from "./mdx-pdf-converter/config";

// -----------------------------------------------------------------------------
// CLI
// -----------------------------------------------------------------------------

function parseArgs(argv: string[]) {
  const out = {
    only: "" as string | "",
    skipCanonical: false,
    skipTiered: false,
    formats: null as PaperFormat[] | null,
    quality: null as Quality[] | null,
    canonicalTier: "free" as string, // which tier's "look" to use for canonical
    canonicalQuality: "premium" as Quality,
    canonicalFormat: "A4" as PaperFormat,
    verbose: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--skip-canonical") out.skipCanonical = true;
    else if (a === "--skip-tiered") out.skipTiered = true;
    else if (a === "--verbose") out.verbose = true;
    else if (a === "--only") out.only = (argv[i + 1] || "").trim();
    else if (a.startsWith("--only=")) out.only = a.split("=", 2)[1].trim();

    else if (a.startsWith("--formats=")) {
      const v = a.split("=", 2)[1];
      out.formats = v.split(",").map((x) => x.trim()) as PaperFormat[];
    } else if (a === "--formats") {
      const v = (argv[i + 1] || "").trim();
      out.formats = v.split(",").map((x) => x.trim()) as PaperFormat[];
    }

    else if (a.startsWith("--quality=")) {
      const v = a.split("=", 2)[1];
      out.quality = v.split(",").map((x) => x.trim()) as Quality[];
    } else if (a === "--quality") {
      const v = (argv[i + 1] || "").trim();
      out.quality = v.split(",").map((x) => x.trim()) as Quality[];
    }

    else if (a.startsWith("--canonical-tier=")) {
      out.canonicalTier = a.split("=", 2)[1].trim();
    } else if (a === "--canonical-tier") {
      out.canonicalTier = (argv[i + 1] || "").trim();
    }

    else if (a.startsWith("--canonical-quality=")) {
      out.canonicalQuality = a.split("=", 2)[1].trim() as Quality;
    } else if (a === "--canonical-quality") {
      out.canonicalQuality = (argv[i + 1] || "").trim() as Quality;
    }

    else if (a.startsWith("--canonical-format=")) {
      out.canonicalFormat = a.split("=", 2)[1].trim() as PaperFormat;
    } else if (a === "--canonical-format") {
      out.canonicalFormat = (argv[i + 1] || "").trim() as PaperFormat;
    }
  }

  return out;
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function titleCaseFromSlug(slug: string): string {
  return String(slug || "")
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function absMdx(p: string) {
  return path.isAbsolute(p) ? p : path.join(process.cwd(), p);
}

function canonicalPublicPathForDoc(pdfName: string) {
  // This matches your existing “flat” production URL strategy
  // and keeps stable, human URLs without tier folders.
  return `/assets/downloads/content-downloads/${pdfName}.pdf`;
}

function ensureDirForFile(absFile: string) {
  fs.mkdirSync(path.dirname(absFile), { recursive: true });
}

function existsFile(absFile: string) {
  try {
    return fs.statSync(absFile).isFile();
  } catch {
    return false;
  }
}

function resolveTierForDoc(doc: DocumentRegistryEntry, desiredTierSlug: string): TierConfig {
  const hit = doc.tiers.find((t) => t.slug === desiredTierSlug);
  if (hit) return hit;

  // fallback order: free -> first tier -> synthetic free
  const free = doc.tiers.find((t) => t.slug === "free");
  if (free) return free;
  if (doc.tiers.length) return doc.tiers[0];

  return {
    slug: "free",
    displayName: "Free",
    accessLevel: "free",
    generatePdf: true,
    generateFillable: false,
    formats: ["A4"],
    quality: ["standard"],
  };
}

function dedupeDocs(docs: DocumentRegistryEntry[]): DocumentRegistryEntry[] {
  // Avoid duplicates when registry includes explicit entries and auto-discovery adds same mdxPath.
  const seen = new Set<string>();
  const out: DocumentRegistryEntry[] = [];
  for (const d of docs) {
    const key = path.resolve(absMdx(d.mdxPath));
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(d);
  }
  return out;
}

// -----------------------------------------------------------------------------
// Runner
// -----------------------------------------------------------------------------

class CanonicalAndTieredRunner {
  private converter: MdxToPdfConverter;

  constructor() {
    this.converter = new MdxToPdfConverter();
  }

  async run() {
    const args = parseArgs(process.argv.slice(2));

    console.log("🧱 AoL MDX → PDF Runner (Canonical + Tiered)");
    console.log("═".repeat(78));
    console.log(
      `mode: canonical=${!args.skipCanonical}  tiered=${!args.skipTiered}  ` +
        `only=${args.only || "(all)"}  formats=${args.formats?.join(",") || "(all)"}  quality=${
          args.quality?.join(",") || "(all)"
        }`,
    );
    console.log(
      `canonical: tier=${args.canonicalTier} format=${args.canonicalFormat} quality=${args.canonicalQuality}`,
    );
    console.log("═".repeat(78));

    const start = Date.now();

    // Build unified doc list:
    // 1) Start with registry
    const docs: DocumentRegistryEntry[] = [...DOCUMENT_REGISTRY];

    // 2) Add any undiscovered MDX as auto-docs
    const discovered = discoverMdxFiles();
    const registeredAbs = new Set(docs.map((d) => path.resolve(absMdx(d.mdxPath))));

    for (const mdxAbs of discovered) {
      if (registeredAbs.has(path.resolve(mdxAbs))) continue;

      const base = path.basename(mdxAbs, ".mdx");
      docs.push({
        mdxPath: mdxAbs,
        pdfName: base,
        displayName: titleCaseFromSlug(base),
        category: "Uncategorized",
        description: "Automatically generated from MDX",
        tiers: [
          {
            slug: "free",
            displayName: "Free",
            accessLevel: "free",
            generatePdf: true,
            generateFillable: false,
            formats: ["A4"],
            quality: ["standard"],
          },
        ],
      });
    }

    const allDocs = dedupeDocs(docs)
      .filter((d) => !args.only || d.pdfName === args.only)
      .filter((d) => fs.existsSync(absMdx(d.mdxPath)));

    if (!allDocs.length) {
      console.log("ℹ️ No documents found to process (check --only or missing MDX paths).");
      return;
    }

    let canonicalOk = 0;
    let canonicalFail = 0;
    let tieredOk = 0;
    let tieredFail = 0;

    for (const doc of allDocs) {
      console.log(`\n📚 ${doc.displayName}  (${doc.pdfName})`);
      console.log("─".repeat(60));

      // ------------------------------------------------------------
      // A) Canonical flat output (one stable URL)
      // ------------------------------------------------------------
      if (!args.skipCanonical) {
        const tier = resolveTierForDoc(doc, args.canonicalTier);

        // We do NOT use outputPublicPathForMdx here, because we want a flat stable path.
        const canonicalPublic = canonicalPublicPathForDoc(doc.pdfName);
        const canonicalAbs = repoAbsFromPublic(canonicalPublic);

        console.log(
          `🧷 Canonical -> ${canonicalPublic} (tier=${tier.slug} format=${args.canonicalFormat} quality=${args.canonicalQuality})`,
        );

        // Convert to the tiered-path first (to reuse converter) then copy into canonical,
        // OR write directly to canonical by temporarily generating to a temp dir.
        // We will generate to a temp tiered file, then copy into canonical.
        const tempPublic = outputPublicPathForMdx({
          pdfName: doc.pdfName,
          tier: tier.slug,
          format: args.canonicalFormat,
          quality: args.canonicalQuality,
        });
        const tempAbs = repoAbsFromPublic(tempPublic);

        try {
          const r = await this.converter.convertDocument(doc, tier, args.canonicalFormat, args.canonicalQuality);
          if (!r.success || !r.outputAbsPath || !existsFile(r.outputAbsPath)) {
            throw new Error(r.error || "Conversion failed (no output)");
          }

          // r.outputAbsPath should already be tempAbs if converter path matches outputPublicPathForMdx.
          // But we won't assume; we’ll copy from r.outputAbsPath to canonicalAbs.
          ensureDirForFile(canonicalAbs);
          fs.copyFileSync(r.outputAbsPath, canonicalAbs);

          // Safety: avoid “empty tiny PDF” slipping through unnoticed
          const sz = fs.statSync(canonicalAbs).size;
          if (sz < 20_000) {
            console.warn(
              `⚠️ Canonical PDF is small (${Math.round(sz / 1024)} KB). If content is short, ok. If not, audit the MDX.`,
            );
          }

          canonicalOk++;
          console.log(`✅ Canonical OK  (${Math.round(sz / 1024)} KB)`);
        } catch (e: any) {
          canonicalFail++;
          console.log(`❌ Canonical FAIL: ${e?.message || String(e)}`);
          if (args.verbose) console.log(`   temp: ${tempPublic}`);
        }
      }

      // ------------------------------------------------------------
      // B) Tiered variants (foldered) output matrix
      // ------------------------------------------------------------
      if (!args.skipTiered) {
        for (const tier of doc.tiers) {
          if (!tier.generatePdf) continue;

          const formats = (args.formats?.length ? args.formats : tier.formats) as PaperFormat[];
          const qualities = (args.quality?.length ? args.quality : tier.quality) as Quality[];

          for (const format of formats) {
            for (const quality of qualities) {
              const outPublic = outputPublicPathForMdx({ pdfName: doc.pdfName, tier: tier.slug, format, quality });
              console.log(`📦 Tiered -> ${outPublic}`);

              try {
                const r = await this.converter.convertDocument(doc, tier, format, quality);
                if (!r.success || !r.outputAbsPath || !existsFile(r.outputAbsPath)) {
                  throw new Error(r.error || "Conversion failed (no output)");
                }

                const sz = fs.statSync(r.outputAbsPath).size;
                if (sz < 20_000) {
                  console.warn(
                    `⚠️ Tiered PDF is small (${Math.round(sz / 1024)} KB): tier=${tier.slug} format=${format} quality=${quality}`,
                  );
                }

                tieredOk++;
                console.log(`✅ Tiered OK  (${Math.round(sz / 1024)} KB)`);
              } catch (e: any) {
                tieredFail++;
                console.log(`❌ Tiered FAIL: ${e?.message || String(e)}`);
              }
            }
          }
        }
      }
    }

    const duration = Date.now() - start;
    const stats = this.converter.getStats();

    console.log("\n" + "═".repeat(78));
    console.log("📊 RUN SUMMARY");
    console.log("═".repeat(78));
    console.log(`🧷 Canonical: ok=${canonicalOk}  fail=${canonicalFail}`);
    console.log(`📦 Tiered:    ok=${tieredOk}    fail=${tieredFail}`);
    console.log(`🔁 Converter: processed=${stats.processed}  errors=${stats.errors}  warnings=${stats.warnings}`);
    console.log(`⏱️  Duration: ${duration}ms`);
    console.log("═".repeat(78));

    if (stats.errors > 0) process.exit(1);
  }
}

// ESM-safe guard
const invokedAsScript = (() => {
  const argv1 = process.argv[1] ? String(process.argv[1]).replace(/\\/g, "/") : "";
  const here = String(import.meta.url).replace("file://", "");
  return argv1.endsWith(here) || `file://${argv1}` === import.meta.url;
})();

if (invokedAsScript) {
  new CanonicalAndTieredRunner().run().catch((e) => {
    console.error("❌ Fatal:", e?.stack || e?.message || e);
    process.exit(1);
  });
}

export { CanonicalAndTieredRunner };