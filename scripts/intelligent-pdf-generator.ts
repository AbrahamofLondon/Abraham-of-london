/* scripts/intelligent-pdf-generator.ts - FIXED (proper tier naming) */

import { Command } from "commander";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import crypto from "crypto";

// Import the premium PDF generator
import { PremiumPDFGenerator } from "./generate-premium-pdfs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type Tier = "architect" | "member" | "free" | "all";
type Quality = "premium" | "enterprise";
type PaperFormat = "A4" | "LETTER" | "A3" | "A2";

interface CliOptions {
  tier: Tier;
  quality: Quality;
  formats: string;
  outputDir: string;
  dryRun: boolean;

  interactive: boolean;
  watermark: boolean;
  metadata: boolean;
  cleanOutput: boolean;

  usePuppeteer: boolean;
  generateManifest: boolean;
}

interface GenerationConfig {
  tier: Tier;
  quality: Quality;
  formats: PaperFormat[];
  outputDir: string;
  interactive: boolean;
  watermark: boolean;
  metadata: boolean;
  cleanOutput: boolean;
  usePuppeteer: boolean;
  generateManifest: boolean;
}

interface GenerationResult {
  format: PaperFormat;
  success: boolean;
  filePath: string;
  size: number;
  duration: number;
  method: "react-pdf" | "puppeteer" | "none";
  error?: string;
}

const program = new Command();

program
  .name("intelligent-pdf-generator")
  .description("Enterprise-grade PDF generation with interactive form fields")
  .version("3.2.0");

program
  .option("-t, --tier <type>", "Content tier (architect, member, free, all)", "architect")
  .option("-q, --quality <level>", "PDF quality (premium, enterprise)", "premium")
  .option("-f, --formats <list>", "PDF formats (comma-separated: A4,Letter,A3,A2)", "A4,Letter,A3")
  .option("-o, --output-dir <path>", "Output directory", "./public/assets/downloads")
  .option("-d, --dry-run", "Dry run without actual generation", false)
  .option("--no-interactive", "Disable interactive form-fillable PDFs")
  .option("--no-watermark", "Disable premium watermark")
  .option("--no-metadata", "Disable professional metadata")
  .option("--no-clean-output", "Do not clean output directory before generation")
  .option("--no-use-puppeteer", "Disable Puppeteer fallback (highest fidelity)")
  .option("--no-generate-manifest", "Do not generate generation manifest");

/**
 * INSTITUTIONAL PDF GENERATION LOGIC
 */
export async function main(): Promise<void> {
  console.log("✨ ABRAHAM OF LONDON - INTELLIGENT PDF GENERATOR v3.2 ✨");
  console.log("════════════════════════════════════════════════════════════════════");

  try {
    program.parse(process.argv);
    const raw = program.opts() as unknown as CliOptions;

    const tier = normalizeTier(raw.tier);
    const quality = normalizeQuality(raw.quality);
    const formats = parseFormats(raw.formats);

    console.log("🎯 Target Tier:", tier);
    console.log("🏆 Quality:", quality);
    console.log("📄 Formats:", formats.join(", "));
    console.log("📁 Output Directory:", raw.outputDir);
    console.log("🔄 Interactive Forms:", raw.interactive);
    console.log("💧 Watermark:", raw.watermark);
    console.log("🧹 Clean Output:", raw.cleanOutput);
    console.log("🧠 Puppeteer Fallback:", raw.usePuppeteer);
    console.log("📝 Manifest:", raw.generateManifest);
    console.log("════════════════════════════════════════════════════════════════════\n");

    if (raw.dryRun) {
      console.log("=== DRY RUN ===");
      console.log("Would generate:");
      console.log("  Tier:", tier);
      console.log("  Quality:", quality);
      console.log("  Formats:", formats.join(", "));
      console.log("  Output:", raw.outputDir);
      console.log("=== END DRY RUN ===");
      return;
    }

    // Ensure output directory exists
    await fs.mkdir(raw.outputDir, { recursive: true });

    // Clean only files for THIS tier
    if (raw.cleanOutput) {
      await cleanOutputDirectory(raw.outputDir, tier);
    }

    console.log("🚀 Starting premium PDF generation...\n");

    const config: GenerationConfig = {
      tier,
      quality,
      formats,
      outputDir: raw.outputDir,
      interactive: raw.interactive,
      watermark: raw.watermark,
      metadata: raw.metadata,
      cleanOutput: raw.cleanOutput,
      usePuppeteer: raw.usePuppeteer,
      generateManifest: raw.generateManifest,
    };

    const results = await generateIntelligentPDFs(config);

    // Professional summary + manifest
    await generateSummary(results, config);

    // Verify generated files
    await verifyGeneratedFiles(config.outputDir, config.formats, tier);

    console.log("\n✅ PREMIUM GENERATION COMPLETED SUCCESSFULLY!");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("❌ FATAL ERROR:", message);
    process.exit(1);
  }
}

/**
 * NORMALIZERS
 */
function normalizeTier(input: string): Tier {
  const v = String(input || "").toLowerCase().trim();
  if (v === "architect" || v === "member" || v === "free" || v === "all") return v;
  return "architect";
}

function normalizeQuality(input: string): Quality {
  const v = String(input || "").toLowerCase().trim();
  if (v === "premium" || v === "enterprise") return v;
  return "premium";
}

function parseFormats(formatsRaw: string): PaperFormat[] {
  const allowed = new Set<PaperFormat>(["A4", "LETTER", "A3", "A2"]);

  const parsed = String(formatsRaw || "")
    .split(/[,\s]+/)
    .map((f) => f.trim().toUpperCase())
    .filter(Boolean)
    .filter((f): f is PaperFormat => allowed.has(f as PaperFormat));

  return parsed.length > 0 ? Array.from(new Set(parsed)) : ["A4", "LETTER", "A3"];
}

/**
 * SMART CLEANUP - Only deletes files for the current tier
 */
async function cleanOutputDirectory(outputDir: string, tier: Tier): Promise<void> {
  try {
    const files = await fs.readdir(outputDir);
    
    // Only delete files for THIS specific tier
    const filesToDelete = files.filter((f) => {
      const lower = f.toLowerCase();
      // Delete existing files for this tier
      return (
        lower.includes(`-${tier}.pdf`) ||
        (tier !== "all" && lower.endsWith(`-${tier}.pdf`))
      );
    });

    if (filesToDelete.length === 0) {
      console.log("🧹 No existing files to clean for tier:", tier);
      return;
    }

    console.log(`🧹 Cleaning ${filesToDelete.length} PDF files for tier: ${tier}...`);

    for (const file of filesToDelete) {
      const filePath = path.join(outputDir, file);
      try {
        await fs.unlink(filePath);
        console.log(`  Removed: ${file}`);
      } catch {
        console.log(`  Failed to remove: ${file}`);
      }
    }

    console.log("✅ Output directory cleaned for tier:", tier);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.log("⚠️  Could not clean output directory:", message);
  }
}

/**
 * CORE GENERATION ENGINE
 */
async function generateIntelligentPDFs(config: GenerationConfig): Promise<GenerationResult[]> {
  const results: GenerationResult[] = [];

  console.log("🔧 Method 1: Using Premium PDF Generator (React-PDF)");

  for (const format of config.formats) {
    console.log(`\n🎨 Processing ${format} format...`);

    try {
      const generator = new PremiumPDFGenerator({
        format,
        quality: config.quality,
        tier: config.tier,
        outputDir: config.outputDir,
        interactive: config.interactive,
        watermark: config.watermark,
        metadata: config.metadata,
        cleanOutput: false,
      });

      const result = await generator.generate();

      results.push({
        format,
        success: true,
        filePath: result.filePath,
        size: result.size,
        duration: result.duration,
        method: "react-pdf",
      });

      console.log(`  ✅ ${format}: ${(result.size / 1024).toFixed(1)} KB | ${result.duration}ms`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`  ❌ ${format}: ${message}`);

      // Fallback path
      const fallback = await tryAlternativeMethod(format, config);
      results.push(fallback);

      if (fallback.success) {
        console.log(
          `  ✅ ${format} (alternative): ${(fallback.size / 1024).toFixed(1)} KB | ${fallback.duration}ms`
        );
      } else {
        console.log(`  ⚠️  ${format}: alternative method failed`);
      }
    }
  }

  return results;
}

/**
 * FALLBACK RENDERING - FIXED filename generation
 */
async function tryAlternativeMethod(format: PaperFormat, config: GenerationConfig): Promise<GenerationResult> {
  const startTime = Date.now();

  if (!config.usePuppeteer) {
    return {
      format,
      success: false,
      filePath: "",
      size: 0,
      duration: Date.now() - startTime,
      method: "none",
      error: "Puppeteer fallback disabled",
    };
  }

  try {
    const puppeteerAvailable = await hasPuppeteer();
    if (!puppeteerAvailable) throw new Error("Puppeteer not installed");

    const puppeteer = await import("puppeteer");
    const browser = await puppeteer.default.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    const htmlContent = createPremiumHTML(format, config.tier, config.quality, config.watermark);
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });

    // FIXED: Use tier name instead of "alt"
    const safeFormatToken = format.toLowerCase();
    const safeTierToken = config.tier.toLowerCase();
    const pdfPath = path.join(
      config.outputDir,
      `legacy-architecture-canvas-${safeFormatToken}-${config.quality}-${safeTierToken}.pdf`
    );

    await page.pdf({
      path: pdfPath,
      format: puppeteerFormat(format),
      printBackground: true,
      margin: { top: "20mm", right: "20mm", bottom: "20mm", left: "20mm" },
    });

    await browser.close();

    const stats = await fs.stat(pdfPath);

    return {
      format,
      success: true,
      filePath: pdfPath,
      size: stats.size,
      duration: Date.now() - startTime,
      method: "puppeteer",
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      format,
      success: false,
      filePath: "",
      size: 0,
      duration: Date.now() - startTime,
      method: "none",
      error: message,
    };
  }
}

async function hasPuppeteer(): Promise<boolean> {
  try {
    await import("puppeteer");
    return true;
  } catch {
    return false;
  }
}

function puppeteerFormat(format: PaperFormat): "A4" | "A3" | "A2" | "Letter" {
  return format === "LETTER" ? "Letter" : format;
}

/**
 * PREMIUM HTML TEMPLATE
 */
function createPremiumHTML(format: PaperFormat, tier: Tier, quality: Quality, watermark: boolean): string {
  const year = new Date().getFullYear();
  const badge = `${format} • ${quality.toUpperCase()} • ${tier.toUpperCase()} TIER`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Legacy Architecture Canvas - ${tier.toUpperCase()} Tier</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; background: #f8f9fa; color: #333; }
    .container { max-width: 800px; margin: 0 auto; background: #fff; padding: 40px; box-shadow: 0 0 20px rgba(0,0,0,0.1); border-radius: 8px; }
    .header { text-align: center; margin-bottom: 40px; border-bottom: 3px solid #d4af37; padding-bottom: 20px; }
    h1 { color: #1a237e; margin-bottom: 10px; }
    .subtitle { color: #666; font-style: italic; }
    .badge { display: inline-block; background: #d4af37; color: #fff; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; margin-top: 10px; }
    .section { margin: 30px 0; padding: 20px; border-left: 4px solid #1a237e; background: #f8f9fa; }
    .field { margin: 15px 0; }
    label { display: block; font-weight: bold; margin-bottom: 5px; color: #444; }
    textarea { width: 100%; min-height: 100px; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-family: Arial, sans-serif; font-size: 14px; }
    .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 80px; color: rgba(0,0,0,0.05); font-weight: bold; white-space: nowrap; pointer-events: none; }
  </style>
</head>
<body>
  ${watermark ? `<div class="watermark">ABRAHAM OF LONDON</div>` : ``}
  <div class="container">
    <div class="header">
      <h1>Legacy Architecture Canvas - ${tier.toUpperCase()} Edition</h1>
      <div class="subtitle">Institutional-Grade Framework for Sovereign Legacy Design</div>
      <div class="badge">${badge}</div>
    </div>
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666;">
      <p>© ${year} Abraham of London. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * VERIFICATION - Check for correct tier naming
 */
async function verifyGeneratedFiles(outputDir: string, formats: PaperFormat[], tier: Tier): Promise<void> {
  console.log("\n🔍 Verifying generated files...");

  try {
    const files = await fs.readdir(outputDir);
    const pdfFiles = files.filter((f) => f.toLowerCase().endsWith(".pdf"));

    if (pdfFiles.length === 0) {
      console.log("⚠️  No PDF files found in output directory");
      return;
    }

    // Look for files with the correct tier naming
    const expectedPattern = `-${tier}.pdf`;
    const generatedFiles = pdfFiles.filter((f) => f.includes(expectedPattern));

    console.log(`Found ${generatedFiles.length} generated PDFs for tier "${tier}":`);

    let allValid = true;

    for (const file of generatedFiles) {
      const filePath = path.join(outputDir, file);
      const stats = await fs.stat(filePath);
      const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
      const isValid = stats.size > 50_000;

      if (isValid) {
        console.log(`  ✅ ${file.padEnd(60)} ${sizeMB} MB`);
      } else {
        console.log(`  ❌ ${file.padEnd(60)} ${sizeMB} MB (TOO SMALL)`);
        allValid = false;
      }
    }

    console.log("\n🎯 Expected Formats Check:");
    for (const format of formats) {
      const token = format === "LETTER" ? "letter" : format.toLowerCase();
      const found = pdfFiles.some((f) => 
        f.toLowerCase().includes(token) && f.includes(`-${tier}.pdf`)
      );
      if (found) console.log(`  ✅ Expected ${format} format: FOUND`);
      else {
        console.log(`  ❌ Expected ${format} format: NOT FOUND`);
        allValid = false;
      }
    }

    if (!allValid) console.log("\n⚠️  Some PDFs may be invalid or missing");
    else console.log("\n✅ All PDFs verified successfully!");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.log("⚠️  Verification failed:", message);
  }
}

/**
 * REPORT GENERATION
 */
async function generateSummary(results: GenerationResult[], config: GenerationConfig): Promise<void> {
  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  console.log("\n════════════════════════════════════════════════════════════════════");
  console.log("📊 GENERATION SUMMARY");
  console.log("════════════════════════════════════════════════════════════════════");

  console.log(`✅ Successful: ${successful.length}/${results.length}`);
  console.log(`❌ Failed: ${failed.length}/${results.length}`);

  if (successful.length > 0) {
    const totalSizeKB = successful.reduce((sum, r) => sum + r.size, 0) / 1024;
    const avgSizeKB = totalSizeKB / successful.length;
    const avgDuration = successful.reduce((sum, r) => sum + r.duration, 0) / successful.length;

    console.log("\n📈 Statistics:");
    console.log(`   Total size: ${totalSizeKB.toFixed(1)} KB`);
    console.log(`   Average size: ${avgSizeKB.toFixed(1)} KB per file`);
    console.log(`   Average generation time: ${Math.round(avgDuration)} ms`);
    console.log(`   Quality: ${config.quality.toUpperCase()}`);
    console.log(`   Tier: ${config.tier.toUpperCase()}`);

    if (config.generateManifest) {
      const manifest = {
        generated: new Date().toISOString(),
        quality: config.quality,
        tier: config.tier,
        formats: config.formats,
        total: results.length,
        successful: successful.length,
        failed: failed.length,
        files: successful.map((r) => ({
          format: r.format,
          file: path.basename(r.filePath),
          size: r.size,
          duration: r.duration,
          method: r.method,
          checksum: generateChecksum(r.filePath),
        })),
        failures: failed.map((r) => ({
          format: r.format,
          method: r.method,
          error: r.error || "Unknown error",
        })),
      };

      const manifestPath = path.join(config.outputDir, "generation-manifest.json");
      await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
      console.log(`\n📝 Manifest saved: ${manifestPath}`);
    }
  }

  console.log("════════════════════════════════════════════════════════════════════");
}

/**
 * CHECKSUM GENERATION
 */
function generateChecksum(filePath: string): string {
  try {
    const fileBuffer = fsSync.readFileSync(filePath);
    const hash = crypto.createHash("sha256");
    hash.update(fileBuffer);
    return hash.digest("hex").substring(0, 16);
  } catch {
    return "N/A";
  }
}

/**
 * EXECUTION WRAPPER
 */
const invokedAsScript = (() => {
  const argv1 = process.argv[1] ? path.resolve(process.argv[1]) : "";
  const here = path.resolve(__filename);
  return argv1 === here;
})();

if (invokedAsScript) {
  main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}

export { main };