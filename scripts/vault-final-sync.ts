/* scripts/vault-final-sync.ts — V5.0 (FORENSIC AUDITOR, HARDENED) */
import fs from "fs";
import path from "path";

import { generatePDF } from "../lib/pdf-generator";
import * as RegistryModule from "../lib/pdf/registry";

type RegistryEntry = {
  id?: string;
  slug?: string;
  title?: string;
  type?: string;
  tier?: string;
  outputPath?: string;
  [key: string]: unknown;
};

type SyncStatus = "branded" | "cached" | "failed" | "critical";

type SyncRecord = {
  id: string;
  slug: string;
  title: string;
  type: string;
  status: SyncStatus;
  error?: string;
  outputPath?: string;
};

const PROJECT_ROOT = process.cwd();
const REPORT_DIR = path.join(PROJECT_ROOT, "public", "assets", "downloads");
const REPORT_PATH = path.join(REPORT_DIR, "vault-final-sync-report.json");

/**
 * Hard exclusions for this premium sync pass.
 * These are not the same as the full ecosystem policy rules.
 * This script is specifically for higher-value branded assets.
 */
const EXCLUDED_ID_PREFIXES = ["when-", "fr-"];
const EXCLUDED_TYPES = new Set(["Short", "Brief", "VaultBrief"]);

function safeString(value: unknown, fallback = ""): string {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : fallback;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return fallback;
}

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function normalizeRegistryModule(mod: typeof RegistryModule): RegistryEntry[] {
  const candidate = (mod as unknown as { default?: unknown }).default ?? mod;

  if (
    candidate &&
    typeof candidate === "object" &&
    "getAllPDFs" in candidate &&
    typeof (candidate as { getAllPDFs?: unknown }).getAllPDFs === "function"
  ) {
    const result = (candidate as { getAllPDFs: () => unknown }).getAllPDFs();
    if (Array.isArray(result)) {
      return result as RegistryEntry[];
    }
  }

  if (
    candidate &&
    typeof candidate === "object" &&
    "PDF_REGISTRY" in candidate &&
    Array.isArray((candidate as { PDF_REGISTRY?: unknown }).PDF_REGISTRY)
  ) {
    return (candidate as { PDF_REGISTRY: RegistryEntry[] }).PDF_REGISTRY;
  }

  if (Array.isArray(candidate)) {
    return candidate as RegistryEntry[];
  }

  if (candidate && typeof candidate === "object") {
    const values = Object.values(candidate);
    if (values.every((item) => item && typeof item === "object")) {
      return values as RegistryEntry[];
    }
  }

  return [];
}

function isEligiblePremiumAsset(entry: RegistryEntry): boolean {
  const id = safeString(entry.id);
  const type = safeString(entry.type);

  if (!id) return false;
  if (EXCLUDED_ID_PREFIXES.some((prefix) => id.startsWith(prefix))) return false;
  if (EXCLUDED_TYPES.has(type)) return false;

  return true;
}

function summarizeEntry(entry: RegistryEntry): {
  id: string;
  slug: string;
  title: string;
  type: string;
} {
  return {
    id: safeString(entry.id),
    slug: safeString(entry.slug, safeString(entry.id)),
    title: safeString(entry.title, safeString(entry.id, "Untitled")),
    type: safeString(entry.type, "Unknown"),
  };
}

async function syncBrandedVault(): Promise<void> {
  console.log("\n🏛️  ABRAHAM OF LONDON | ELITE VAULT SYNCHRONIZATION");
  console.log(`📅 ${new Date().toUTCString()} | System Status: ORCHESTRATING\n`);

  ensureDir(REPORT_DIR);

  const registryEntries = normalizeRegistryModule(RegistryModule);

  if (registryEntries.length === 0) {
    throw new Error("Registry normalization returned zero entries. Check lib/pdf/registry exports.");
  }

  const premiumAssets = registryEntries.filter(isEligiblePremiumAsset);
  const total = premiumAssets.length;

  let successCount = 0;
  let brandedCount = 0;
  let cachedCount = 0;
  let failCount = 0;

  const records: SyncRecord[] = [];

  console.log(`💎 Analyzing ${total} intelligence assets...`);
  console.log("--------------------------------------------------");

  for (let i = 0; i < total; i += 1) {
    const asset = premiumAssets[i];
    const meta = summarizeEntry(asset);
    const progress = `[${String(i + 1).padStart(2, "0")}/${total}]`;

    try {
      /**
       * Force regeneration here intentionally:
       * this pass is meant to ensure latest branding, watermarking,
       * QR integrity, and template alignment.
       */
      const result = await generatePDF(meta.id, true);

      if (result.success) {
        successCount += 1;

        if (result.cached) {
          cachedCount += 1;
          records.push({
            ...meta,
            status: "cached",
            outputPath: result.path,
          });
          console.log(`${progress} ⚡ CACHED:   ${meta.id}`);
        } else {
          brandedCount += 1;
          records.push({
            ...meta,
            status: "branded",
            outputPath: result.path,
          });
          console.log(`${progress} ✅ BRANDED:  ${meta.id}`);
        }
      } else {
        failCount += 1;
        const error = safeString(result.error, "Unknown generation failure");
        records.push({
          ...meta,
          status: "failed",
          error,
        });
        console.log(`${progress} ❌ FAILED:   ${meta.id} -> ${error}`);
      }
    } catch (error) {
      failCount += 1;
      const message = error instanceof Error ? error.message : String(error);
      records.push({
        ...meta,
        status: "critical",
        error: message,
      });
      console.log(`${progress} 🚨 CRITICAL: ${meta.id} -> ${message}`);
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    totals: {
      registryEntries: registryEntries.length,
      premiumAssets: total,
      successful: successCount,
      branded: brandedCount,
      cached: cachedCount,
      failed: failCount,
    },
    exclusions: {
      idPrefixes: EXCLUDED_ID_PREFIXES,
      types: Array.from(EXCLUDED_TYPES),
    },
    records,
  };

  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), "utf8");

  console.log("\n--------------------------------------------------");
  console.log("🛡️  VAULT INTEGRITY REPORT");
  console.log(`   REGISTRY ENTRIES: ${registryEntries.length}`);
  console.log(`   TOTAL ASSETS:     ${total}`);
  console.log(`   SUCCESSFUL:       ${successCount}`);
  console.log(`   BRANDED:          ${brandedCount}`);
  console.log(`   CACHE HITS:       ${cachedCount}`);
  console.log(`   FAILURES:         ${failCount}`);
  console.log("--------------------------------------------------");
  console.log(`📊 REPORT: ${REPORT_PATH}`);

  if (failCount === 0) {
    console.log("✨ ALL PREMIUM ASSETS ARE NOW FORENSIC-ALIGNED AND BRANDED.");
  } else {
    console.log("⚠️  SYNC COMPLETE WITH ERRORS. REVIEW THE REPORT AND LOGS.");
    console.log("\n--- FAILURE SNAPSHOT ---");
    for (const record of records.filter((r) => r.status === "failed" || r.status === "critical").slice(0, 15)) {
      console.log(`❌ ${record.id} [${record.type}] -> ${record.error}`);
    }
  }
}

syncBrandedVault().catch((error) => {
  console.error("🚨 ORCHESTRATOR EXIT:", error);
  process.exit(1);
});