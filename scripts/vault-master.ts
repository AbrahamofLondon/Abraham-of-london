/* scripts/vault-master.ts — VAULT MASTER ORCHESTRATOR (Hardened, Deterministic) */
/* eslint-disable no-console */

/**
 * PHASE 0: SYSTEM-LEVEL INTERCEPTORS
 * - Loads .env deterministically (relative to this file, not cwd)
 * - Neutralizes Next.js 'server-only' in script runtime
 * - Mocks Redis imports for local/offline runs (prevents ECONNREFUSED hang/retries)
 */

import dotenv from "dotenv";
import path from "path";
import Module from "module";
import { fileURLToPath } from "url";

// Resolve project root reliably: scripts/..
// (Works even if you run the command from a different working directory)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ENV_PATH = path.join(__dirname, "..", ".env");

// Load env once, early, before any other imports execute logic.
dotenv.config({ path: ENV_PATH });

console.log(
  "[ENV_CHECK]",
  "cwd=", process.cwd(),
  "envPath=", ENV_PATH,
  "saltLen=", (process.env.SYSTEM_INTEGRITY_SALT || "").length,
  "issuer=", process.env.AOL_ISSUER_ID || "(unset)"
);

// @ts-ignore
const originalRequire = Module.prototype.require;
// @ts-ignore
Module.prototype.require = function (id: any) {
  // 0) Ensure any late dotenv/config requires remain consistent
  if (id === "dotenv/config") {
    dotenv.config({ path: ENV_PATH });
    return {};
  }

  // 1) Neutralize Next.js 'server-only' package for scripts
  if (id === "server-only") {
    return {};
  }

  // 2) Mock Redis imports (catch common variations)
  if (typeof id === "string" && (id.includes("lib/redis") || id.includes("@/lib/redis") || id.includes("\\lib\\redis"))) {
    return {
      getRedis: () => ({
        on: () => {},
        ping: async () => "PONG",
        get: async () => null,
        set: async () => "OK",
        quit: async () => {},
        pipeline: () => ({
          set: () => {},
          exec: async () => [],
        }),
      }),
      default: {
        getRedis: () => ({ on: () => {}, ping: async () => "PONG" }),
        isRedisAvailable: async () => true,
        client: { get: async () => null },
      },
      isRedisAvailable: async () => true,
      closeRedis: async () => {},
    };
  }

  return originalRequire.apply(this, arguments as any);
};

/**
 * PHASE 1: IMPORTS & CORE LOGIC
 */

// @ts-ignore - Local .mjs file
import { verifyDatabaseIntegrity } from "./audit-vault.mjs";
import { generatePDF } from "../lib/pdf-generator";
import fs from "fs";
import matter from "gray-matter";
import os from "os";

interface PDFGenerationResult {
  success: boolean;
  cached?: boolean;
  error?: string;
}

interface VaultStats {
  success: number;
  cached: number;
  failed: number;
  healedLinks: number;
}

interface LinkReconciliation {
  healedContent: string;
  issuesFound: number;
}

/**
 * VAULT MASTER ORCHESTRATOR
 * Handles safe-healing and parallel PDF generation for the portfolio.
 */
async function vaultMaster(): Promise<void> {
  try {
    // 1) Registry Audit
    const activeKeys: string[] = await verifyDatabaseIntegrity();

    const stats: VaultStats = {
      success: 0,
      cached: 0,
      failed: 0,
      healedLinks: 0,
    };

    if (!activeKeys || activeKeys.length === 0) {
      console.warn("⚠️  VAULT_MASTER: No briefs found in registry.");
      process.exit(0);
    }

    console.log(`🏛️  VAULT_MASTER: Processing ${activeKeys.length} verified briefs...`);

    // 2) Optimized Parallel Generation
    const concurrencyLimit = Math.max(1, os.cpus().length - 1);

    for (let i = 0; i < activeKeys.length; i += concurrencyLimit) {
      const batch = activeKeys.slice(i, i + concurrencyLimit);
      console.log(`📦 Batch [${i / concurrencyLimit + 1}]: Processing ${batch.length} assets...`);

      const batchPromises = batch.map(async (id: string): Promise<PDFGenerationResult> => {
        // Keep deterministic resolution (no relative ambiguity)
        const mdxPath = path.join(process.cwd(), "content", "briefs", `${id}.mdx`);

        if (!fs.existsSync(mdxPath)) {
          return { success: false, error: `MDX Source Missing at ${mdxPath}` };
        }

        const fileContent = fs.readFileSync(mdxPath, "utf8");
        const { content } = matter(fileContent);

        const { healedContent, issuesFound }: LinkReconciliation = reconcileLinks(content, activeKeys);
        stats.healedLinks += issuesFound;

        // PDF generation
        // NOTE: generatePDF handles cache truth via fingerprint now.
        return await generatePDF(id, false, healedContent);
      });

      const results = await Promise.all(batchPromises);

      results.forEach((r: PDFGenerationResult, index: number) => {
        if (r.cached) {
          stats.cached++;
        } else if (r.success) {
          stats.success++;
        } else {
          stats.failed++;
          console.error(`❌ FAILURE [${batch[index]}]: ${r.error || "Unknown Error"}`);
        }
      });
    }

    // 3) Health Reporting
    renderHealthReport(stats);

    // 4) Outcome Determination
    if (stats.failed > 0) {
      console.error(`🚨 System fail-safe triggered: ${stats.failed} failures detected.`);
      process.exit(1);
    }

    console.log("✅ VAULT_MASTER: Portfolio synchronization complete.");
  } catch (error: any) {
    console.error("🚨 MASTER_SYNC_CRITICAL_FAILURE:", error?.message || error);
    process.exit(1);
  }
}

/**
 * RECONCILE LINKS
 * Corrects internal references to prevent broken links in the PDF vault.
 */
function reconcileLinks(content: string, activeKeys: string[]): LinkReconciliation {
  // Matches: [Text](/briefs/<id>) OR [Text](#<id>)
  const linkRegex = /\[(.*?)\]\((\/briefs\/|#)(.*?)\)/g;
  let issuesFound = 0;

  const healedContent = content.replace(linkRegex, (match, text, prefix, targetId) => {
    const target = String(targetId || "").trim();

    if (prefix === "/briefs/" && target && !activeKeys.includes(target)) {
      issuesFound++;
      return `[${text} (REF_PENDING: ${target})](#)`;
    }

    return match;
  });

  return { healedContent, issuesFound };
}

/**
 * RENDER HEALTH REPORT
 */
function renderHealthReport(stats: VaultStats): void {
  console.log(`
--- 🛡️  VAULT HEALTH REPORT ---
✅ Assets Synchronized: ${stats.success}
♻️  Cache Hits:          ${stats.cached}
🩹  Links Reconciled:    ${stats.healedLinks}
❌ System Failures:      ${stats.failed}
------------------------------
  `);
}

/**
 * TERMINATION HANDLER
 * Explicitly kills the process to prevent hangs caused by unclosed handles.
 */
vaultMaster()
  .then(() => {
    setTimeout(() => process.exit(0), 250);
  })
  .catch((err) => {
    console.error("FATAL_VAULT_ERROR:", err);
    process.exit(1);
  });