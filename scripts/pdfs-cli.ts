/**
 * ABRAHAM OF LONDON: PDF CLI (Node-only)
 * Run with: pnpm tsx scripts/pdfs-cli.ts <command>
 */

import {
  getAllPDFs,
  scanForDynamicAssets,
  generateMissingPDFs,
} from "../lib/pdfs"; // runtime-safe exports

import { PDFGenerationOrchestrator } from "./generate-pdfs"; // Node-only
import { LegacyCanvasGenerator } from "./generate-legacy-canvas"; // Node-only

function formatFileSize(bytes: number): string {
  if (!bytes) return "N/A";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] ?? "help";

  switch (command) {
    case "list": {
      const all = getAllPDFs();
      console.log(`📚 Total PDFs: ${all.length}\n`);
      for (const pdf of all) {
        console.log(`${pdf.exists ? "✅" : "❌"} ${pdf.title}`);
        console.log(`   ID: ${pdf.id}`);
        console.log(`   Tier: ${pdf.tier} | Type: ${pdf.type}`);
        console.log(`   Interactive: ${pdf.isInteractive ? "Yes" : "No"}`);
        console.log(`   Size: ${pdf.fileSize ? formatFileSize(pdf.fileSize) : "N/A"}`);
        console.log();
      }
      return;
    }

    case "scan": {
      const assets = scanForDynamicAssets();
      console.log(`🔍 Found ${assets.length} dynamic assets\n`);
      for (const a of assets) {
        console.log(`• ${a.title}`);
        console.log(`  ID: ${a.id} | Type: ${a.type} | Tier: ${a.tier}`);
        console.log();
      }
      return;
    }

    case "generate-missing": {
      const results = await generateMissingPDFs();
      const ok = results.filter((r) => r.success).length;
      const bad = results.filter((r) => !r.success).length;
      console.log(`✅ Successful: ${ok}`);
      console.log(`❌ Failed: ${bad}`);
      if (bad) {
        console.log("\nFailures:");
        results.filter((r) => !r.success).forEach((r) => console.log(`  • ${r.id}: ${r.error}`));
      }
      return;
    }

    case "run-orchestrator": {
      const orch = new PDFGenerationOrchestrator();
      await orch.run(["A4", "Letter", "A3"]);
      console.log("✅ Orchestrator complete");
      return;
    }

    case "run-legacy-canvas": {
      const gen = new LegacyCanvasGenerator();
      await gen.generateAllFormats?.();
      console.log("✅ Legacy canvas complete");
      return;
    }

    default: {
      console.log(`
PDF CLI Commands:
  pnpm tsx scripts/pdfs-cli.ts list
  pnpm tsx scripts/pdfs-cli.ts scan
  pnpm tsx scripts/pdfs-cli.ts generate-missing
  pnpm tsx scripts/pdfs-cli.ts run-orchestrator
  pnpm tsx scripts/pdfs-cli.ts run-legacy-canvas
`);
      return;
    }
  }
}

main().catch((e) => {
  console.error("❌ CLI failed:", e?.message || e);
  process.exit(1);
});