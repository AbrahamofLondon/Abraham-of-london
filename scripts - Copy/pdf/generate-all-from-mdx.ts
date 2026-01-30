// scripts/pdf/generate-all-from-mdx.ts
import { MdxToPdfConverter } from "./mdx-pdf-converter/converter";
import {
  DOCUMENT_REGISTRY,
  discoverMdxFiles,
  type DocumentRegistryEntry,
  type TierConfig,
} from "./mdx-pdf-converter/config";
import fs from "fs";
import path from "path";

class AllMdxPdfGenerator {
  private converter: MdxToPdfConverter;

  constructor() {
    this.converter = new MdxToPdfConverter();
  }

  async generateAll() {
    console.log("✨ ENTERPRISE MDX → PDF (BRANDED) ✨");
    console.log("═".repeat(72));
    console.log("🚀 Batch conversion of MDX documents (AoL Premium Layout)");
    console.log("═".repeat(72));

    const startTime = Date.now();
    const results: any[] = [];

    // Process each document in registry
    for (const doc of DOCUMENT_REGISTRY) {
      if (!fs.existsSync(doc.mdxPath)) {
        console.log(`❌ MDX file not found: ${doc.mdxPath}`);
        continue;
      }

      console.log(`\n📚 Processing: ${doc.displayName}`);
      console.log("─".repeat(56));

      for (const tier of doc.tiers) {
        if (!tier.generatePdf) continue;

        for (const format of tier.formats) {
          for (const quality of tier.quality) {
            const r = await this.converter.convertDocument(doc, tier, format, quality);
            results.push({
              document: doc.pdfName,
              tier: tier.slug,
              format,
              quality,
              ...r,
            });

            const tag = r.success ? "✅" : "❌";
            console.log(
              `${tag} ${doc.pdfName}  | tier=${tier.slug}  format=${format}  quality=${quality}` +
                (r.success ? `  -> ${r.outputPublicPath}` : `  (${r.error})`),
            );
          }
        }
      }
    }

    // Auto-discover and process remaining MDX files
    await this.processUndiscoveredMdx();

    const duration = Date.now() - startTime;
    const stats = this.converter.getStats();

    console.log("\n" + "═".repeat(72));
    console.log("📊 CONVERSION SUMMARY");
    console.log("═".repeat(72));
    console.log(`✅ PDFs generated: ${stats.processed}`);
    console.log(`❌ Errors: ${stats.errors}`);
    console.log(`⏱️  Total time: ${duration}ms`);
    console.log(`📁 Output root: public/assets/downloads/`);
    console.log(`🧠 Warnings: ${stats.warnings}`);
    console.log("═".repeat(72));

    if (stats.errors > 0) {
      console.log("\n⚠️  ERRORS:");
      stats.errorMessages.forEach((msg, i) => console.log(`  ${i + 1}. ${msg}`));
    }
    if (stats.warnings > 0) {
      console.log("\nℹ️  WARNINGS:");
      stats.warningMessages.forEach((msg, i) => console.log(`  ${i + 1}. ${msg}`));
    }

    console.log("\n💡 NEXT STEPS:");
    console.log("1) Open a few PDFs and confirm typography + pagination");
    console.log("2) If any doc needs bespoke layout, add it to DOCUMENT_REGISTRY");
    console.log("3) Wire your alias sync after this step (if needed)");
    console.log("═".repeat(72));

    return { results, stats, duration };
  }

  private async processUndiscoveredMdx() {
    const discovered = discoverMdxFiles();
    const registered = new Set(DOCUMENT_REGISTRY.map((d) => path.resolve(d.mdxPath)));
    const unregistered = discovered.filter((p) => !registered.has(path.resolve(p)));

    if (unregistered.length === 0) return;

    console.log(`\n🔍 Auto-processing ${unregistered.length} unregistered MDX files:`);

    for (const mdxPath of unregistered) {
      const baseName = path.basename(mdxPath, ".mdx");

      const autoTier: TierConfig = {
        slug: "free",
        displayName: "Free",
        accessLevel: "free",
        generatePdf: true,
        generateFillable: false,
        formats: ["A4"],
        quality: ["standard"],
      };

      const doc: DocumentRegistryEntry = {
        mdxPath,
        pdfName: baseName,
        displayName: this.formatDisplayName(baseName),
        category: "Uncategorized",
        description: "Automatically generated from MDX",
        tiers: [autoTier],
      };

      console.log(`\n📄 Auto: ${doc.displayName}`);

      const result = await this.converter.convertDocument(doc, autoTier, "A4", "standard");
      if (!result.success) console.log(`  ⚠️  Skipped: ${baseName} (failed)`);
    }
  }

  private formatDisplayName(baseName: string): string {
    return baseName
      .split("-")
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }
}

// Main execution (tsx / ESM safe)
const invokedAsScript = (() => {
  const argv1 = process.argv[1] ? String(process.argv[1]).replace(/\\/g, "/") : "";
  const here = String(import.meta.url).replace("file://", "");
  return argv1.endsWith(here) || `file://${argv1}` === import.meta.url;
})();

if (invokedAsScript) {
  const generator = new AllMdxPdfGenerator();
  generator.generateAll().catch((error) => {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  });
}

export { AllMdxPdfGenerator };