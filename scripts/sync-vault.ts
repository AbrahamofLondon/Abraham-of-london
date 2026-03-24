/* scripts/sync-vault.ts — V3.0 (ROBUST INSTITUTIONAL PROXY SYNC) */
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";

const prisma = new PrismaClient();

const PROJECT_ROOT = process.cwd();
const CONTENTLAYER_INDEX = path.join(PROJECT_ROOT, ".contentlayer", "generated", "index.mjs");

const FORBIDDEN_TYPES = new Set(["Book", "Post", "Canon"]);
const ONLINE_ONLY_TYPES = new Set(["Short"]);
const BATCH_SIZE = 50;

type ContentlayerDoc = {
  _id?: string;
  type?: string;
  slug?: string;
  slugSafe?: string;
  title?: string;
  titleSafe?: string;
  excerpt?: string;
  excerptSafe?: string;
  description?: string;
  summary?: string;
  category?: string;
  tier?: string;
  accessTierSafe?: string;
  statusSafe?: string;
  version?: string;
  institutionalId?: string;
  metadata?: Record<string, unknown> | null;
  frontmatter?: {
    version?: string;
  };
  body?: {
    raw?: string;
  };
};

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

function normalizeSlug(value: unknown): string {
  return safeString(value).replace(/^\/+|\/+$/g, "");
}

function slugify(value: string): string {
  return safeString(value)
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

async function loadContentlayerDocs(): Promise<ContentlayerDoc[]> {
  if (!fs.existsSync(CONTENTLAYER_INDEX)) {
    throw new Error(
      `Missing generated Contentlayer file: ${CONTENTLAYER_INDEX}. Run: npx contentlayer2 build`
    );
  }

  const moduleUrl = pathToFileURL(CONTENTLAYER_INDEX).href;
  const mod = (await import(moduleUrl)) as Record<string, unknown>;

  return Object.entries(mod)
    .filter(([key, value]) => key.startsWith("all") && Array.isArray(value))
    .flatMap(([, value]) => value as ContentlayerDoc[]);
}

function shouldSkipDoc(doc: ContentlayerDoc): { skip: boolean; reason?: string } {
  const type = safeString(doc.type, "Brief");
  const metadata = asRecord(doc.metadata);
  const version = safeString(doc.version || doc.frontmatter?.version || metadata.version);

  if (FORBIDDEN_TYPES.has(type)) {
    return { skip: true, reason: "forbidden-type" };
  }

  if (version === "0.9") {
    return { skip: true, reason: "legacy-version" };
  }

  return { skip: false };
}

function getDurableSlug(doc: ContentlayerDoc): string {
  return (
    normalizeSlug(doc.slugSafe || doc.slug) ||
    slugify(
      safeString(doc.titleSafe) ||
        safeString(doc.title) ||
        safeString(doc._id) ||
        "unfiled"
    )
  );
}

function getVersion(doc: ContentlayerDoc): string {
  const metadata = asRecord(doc.metadata);
  return safeString(doc.version || doc.frontmatter?.version || metadata.version, "1.0.0");
}

function getTier(doc: ContentlayerDoc): string {
  return safeString(doc.tier || doc.accessTierSafe, "public").toLowerCase();
}

async function syncVault(): Promise<void> {
  console.log("🚀 [VAULT SYNC] Initiating synchronization via institutional proxy...");

  const allDocs = await loadContentlayerDocs();

  if (allDocs.length === 0) {
    console.warn("⚠️ [VAULT SYNC] No assets found in Contentlayer.");
    return;
  }

  const skipped: Array<{ slug: string; type: string; reason: string }> = [];
  const filteredDocs: ContentlayerDoc[] = [];

  for (const doc of allDocs) {
    const decision = shouldSkipDoc(doc);
    if (decision.skip) {
      skipped.push({
        slug: getDurableSlug(doc),
        type: safeString(doc.type, "Unknown"),
        reason: decision.reason || "unknown",
      });
      continue;
    }
    filteredDocs.push(doc);
  }

  console.log(`📡 [VAULT SYNC] Indexing ${filteredDocs.length} policy-compliant assets.`);

  let committed = 0;

  try {
    const batches = chunk(filteredDocs, BATCH_SIZE);

    for (const batch of batches) {
      const operations = batch.map((doc) => {
        const metadata = asRecord(doc.metadata);
        const slug = getDurableSlug(doc);
        const title =
          safeString(doc.title) ||
          safeString(doc.titleSafe) ||
          "Untitled";

        const summary =
          safeString(doc.excerptSafe) ||
          safeString(doc.excerpt) ||
          safeString(doc.summary) ||
          safeString(doc.description);

        const content = safeString(doc.body?.raw);
        const version = getVersion(doc);
        const tier = getTier(doc);
        const sourceType = safeString(doc.type, "Brief");
        const institutionalId =
          safeString(doc.institutionalId) ||
          `CB-AUTO-${slug.toUpperCase().replace(/[\/\s]+/g, "-")}`;

        const mergedMetadata: Record<string, unknown> = {
          ...metadata,
          institutionalId,
          status: safeString(doc.statusSafe, "published"),
          version,
          tier,
          sourceType,
          onlineOnly: ONLINE_ONLY_TYPES.has(sourceType),
          lastSync: new Date().toISOString(),
          contentlayerId: safeString(doc._id),
        };

        /**
         * This assumes your Prisma model has:
         * - unique slug
         * - title
         * - summary
         * - content
         * - metadata (JSON)
         * - version
         *
         * If your schema differs, adjust these fields, but do NOT go back to using _id as the durable sync key.
         */
        return prisma.contentMetadata.upsert({
          where: { slug },
          update: {
            title,
            summary,
            content,
            metadata: mergedMetadata,
            version,
            updatedAt: new Date(),
          },
          create: {
            slug,
            title,
            summary,
            content,
            metadata: mergedMetadata,
            version,
          },
        });
      });

      const results = await prisma.$transaction(operations);
      committed += results.length;
      process.stdout.write(".");
    }

    console.log(`\n✅ [VAULT SYNC] Synchronization complete.`);
    console.log(`📦 Assets committed: ${committed}`);
    console.log(`🚫 Policy exclusions: ${skipped.length}`);
    console.log(
      `🌐 Online-only flagged: ${filteredDocs.filter((d) => ONLINE_ONLY_TYPES.has(safeString(d.type))).length}`
    );

    if (skipped.length > 0) {
      const byReason = skipped.reduce<Record<string, number>>((acc, item) => {
        acc[item.reason] = (acc[item.reason] || 0) + 1;
        return acc;
      }, {});

      console.log("\n--- [CLEANUP SUMMARY] ---");
      for (const [reason, count] of Object.entries(byReason)) {
        console.log(`${reason}: ${count}`);
      }
    }
  } catch (error) {
    console.error("❌ [CRITICAL FAILURE] Sync aborted.");
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

syncVault().catch(async (error) => {
  console.error("❌ [UNHANDLED SYNC FAILURE]", error);
  await prisma.$disconnect();
  process.exit(1);
});