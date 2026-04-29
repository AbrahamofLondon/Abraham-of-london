/* scripts/vault-master.ts — V6.3 (POLICY-ALIGNED ORCHESTRATOR) */
/* eslint-disable no-console */

import "./load-local-env";
import path from "path";
import Module from "module";
import { fileURLToPath } from "url";
import os from "os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Bypass Redis for CLI operations
// @ts-ignore
const originalRequire = Module.prototype.require;
// @ts-ignore
Module.prototype.require = function (id: any) {
  if (id === "server-only") return {};
  if (
    typeof id === "string" &&
    (id.includes("lib/redis") || id.includes("@/lib/redis"))
  ) {
    return {
      getRedis: () => ({
        on: () => {},
        ping: async () => "PONG",
        get: async () => null,
        set: async () => "OK",
        quit: async () => {},
      }),
      redisClient: { get: async () => null },
      isRedisAvailable: async () => true,
      closeRedis: async () => {},
    };
  }
  return originalRequire.apply(this, arguments as any);
};

import { PrismaClient, ContentType, AccessTier } from "@prisma/client";
// @ts-ignore
import { allBriefs } from "../.contentlayer/generated/index.mjs";

import { generatePDF } from "../lib/pdf-generator";
import { registerPdfFonts } from "../lib/pdf/register-fonts";

const prisma = new PrismaClient();

function getVaultDatabaseUrl(): string | null {
  const value = process.env.DATABASE_URL?.trim();
  if (!value) {
    return null;
  }

  if (
    !value.startsWith("postgresql://") &&
    !value.startsWith("postgres://")
  ) {
    return null;
  }

  return value;
}

// 🚫 HARD EXCLUSION: Never process these
const FORBIDDEN_TYPES = ["Book", "Post", "Canon"];

// 🌐 ONLINE ONLY: Sync to DB, but do NOT pre-generate PDF
const ONLINE_ONLY_TYPES = ["Short"];

interface VaultStats {
  success: number;
  cached: number;
  failed: number;
  healedLinks: number;
  dbSynced: number;
  skipped: number;
}

type BriefLike = {
  type?: string;
  category?: string;
  slugSafe: string;
  titleSafe: string;
  excerptSafe?: string;
  statusSafe?: string;
  accessTierSafe?: string;
  version?: string;
  frontmatter?: {
    version?: string;
  };
  body?: {
    raw?: string;
  };
};

function mapToSchemaType(raw: string | undefined): ContentType {
  const cat = raw || "Briefs";
  if (cat === "Sovereign Intelligence") {
    return ContentType.Sovereign_Intelligence;
  }

  return (Object.values(ContentType) as string[]).includes(cat)
    ? (cat as ContentType)
    : ContentType.Briefs;
}

async function registerFontsForCli(): Promise<void> {
  const ReactPDF = await import("@react-pdf/renderer");
  registerPdfFonts(ReactPDF, process.cwd());
}

async function vaultMaster(): Promise<void> {
  const startTime = Date.now();
  const vaultDatabaseUrl = getVaultDatabaseUrl();
  const stats: VaultStats = {
    success: 0,
    cached: 0,
    failed: 0,
    healedLinks: 0,
    dbSynced: 0,
    skipped: 0,
  };

  try {
    console.log("🚀 [VAULT_MASTER]: Initiating Policy-Aligned Orchestration...");

    // === GUARANTEED FONT REGISTRATION ===
    try {
      await registerFontsForCli();
      console.log(
        "✅ [VAULT_MASTER]: PDF fonts registered successfully (AoLInter + AoLSerif)"
      );
    } catch (fontErr: any) {
      console.error(
        `❌ [VAULT_MASTER]: Font registration FAILED: ${fontErr?.message || String(fontErr)}`
      );
      process.exit(1);
    }

    if (!allBriefs || allBriefs.length === 0) {
      console.warn("⚠️ VAULT_MASTER: No briefs found in Contentlayer output.");
      process.exit(0);
    }

    // 🔍 1. FILTERING & VALIDATION
    const filteredBriefs = (allBriefs as BriefLike[]).filter((b) => {
      const type = b.type || "Brief";
      const version = String(b.version || b.frontmatter?.version || "").trim();

      const isForbidden = FORBIDDEN_TYPES.includes(type);
      const isLegacy = version === "0.9";

      if (isForbidden || isLegacy) {
        stats.skipped++;
        return false;
      }

      return true;
    });

    const activeKeys = filteredBriefs.map((b) => b.slugSafe);

    // 📡 2. DATABASE SYNCHRONIZATION
    if (vaultDatabaseUrl) {
      console.log(
        `📡 [VAULT_MASTER]: Syncing ${filteredBriefs.length} metadata records...`
      );

      for (const brief of filteredBriefs) {
        try {
          const version = String(brief.version || "1.0.0");

          await prisma.contentMetadata.upsert({
            where: { slug: brief.slugSafe },
            update: {
              title: brief.titleSafe,
              contentType: mapToSchemaType(brief.category),
              classification:
                brief.accessTierSafe === "public"
                  ? AccessTier.PUBLIC
                  : AccessTier.RESTRICTED,
              summary: brief.excerptSafe || "",
              metadata: JSON.stringify({
                status: brief.statusSafe,
                version,
              }),
              updatedAt: new Date(),
            },
            create: {
              slug: brief.slugSafe,
              title: brief.titleSafe,
              contentType: mapToSchemaType(brief.category),
              classification:
                brief.accessTierSafe === "public"
                  ? AccessTier.PUBLIC
                  : AccessTier.RESTRICTED,
              summary: brief.excerptSafe || "",
              metadata: JSON.stringify({
                status: brief.statusSafe,
              }),
              version,
            },
          });

          stats.dbSynced++;
        } catch (dbErr: any) {
          console.error(
            `❌ DB_SYNC_ERROR [${brief.slugSafe}]: ${dbErr?.message || String(dbErr)}`
          );
          stats.failed++;
        }
      }
    } else {
      console.log(
        "📡 [VAULT_MASTER]: Skipping metadata DB sync because DATABASE_URL is not a PostgreSQL connection string."
      );
    }

    // 🖨️ 3. PDF GENERATION (Selective + Robust)
    console.log("🖨️ [VAULT_MASTER]: Generating PDFs...");

    const pdfQueue = filteredBriefs.filter(
      (b) => !ONLINE_ONLY_TYPES.includes(b.type || "")
    );

    const concurrencyLimit = Math.max(1, Math.min(4, os.cpus().length - 1));

    for (let i = 0; i < pdfQueue.length; i += concurrencyLimit) {
      const batch = pdfQueue.slice(i, i + concurrencyLimit);

      await Promise.all(
        batch.map(async (brief) => {
          try {
            const rawContent = brief.body?.raw || "";
            const { healedContent, issuesFound } = reconcileLinks(
              rawContent,
              activeKeys
            );

            stats.healedLinks += issuesFound;

            const result = await generatePDF(
              brief.slugSafe,
              false,
              healedContent
            );

            if (result.cached) {
              stats.cached++;
            } else if (result.success) {
              stats.success++;
            } else {
              throw new Error(result.error || "Unknown PDF generation error");
            }
          } catch (err: any) {
            stats.failed++;
            console.error(
              `❌ PDF_ERROR [${brief.slugSafe}]: ${err?.message || String(err)}`
            );
          }
        })
      );
    }

    renderHealthReport(
      stats,
      ((Date.now() - startTime) / 1000).toFixed(2)
    );
  } catch (error: any) {
    console.error(
      "🚨 MASTER_SYNC_CRITICAL_FAILURE:",
      error?.message || String(error)
    );
    process.exit(1);
  } finally {
    await prisma.$disconnect().catch(() => undefined);
  }
}

function reconcileLinks(content: string, activeKeys: string[]) {
  const linkRegex = /\[(.*?)\]\((\/briefs\/|#)(.*?)\)/g;
  let issuesFound = 0;

  const healedContent = content.replace(
    linkRegex,
    (match, text, prefix, targetId) => {
      const target = String(targetId || "").trim();

      if (prefix === "/briefs/" && target && !activeKeys.includes(target)) {
        issuesFound++;
        return `[${text} (REF_PENDING: ${target})](#)`;
      }

      return match;
    }
  );

  return { healedContent, issuesFound };
}

function renderHealthReport(stats: VaultStats, duration: string): void {
  console.log(`\n--- 🛡️ VAULT MASTER HEALTH REPORT (${duration}s) ---`);
  console.log(`✅ PDFs Created: ${stats.success}`);
  console.log(`♻️ Cache Hits: ${stats.cached}`);
  console.log(`📡 DB Records Synced: ${stats.dbSynced}`);
  console.log(
    `🌐 Online-Only (Shorts): ${
      (allBriefs as BriefLike[]).filter((b) => b.type === "Short").length
    }`
  );
  console.log(`🚫 Policy Exclusions: ${stats.skipped}`);
  console.log(`❌ System Failures: ${stats.failed}`);
  console.log(`----------------------------------------------\n`);
}

vaultMaster();
