/* scripts/vault-master-sync.ts — V7.0 (ROBUST INSTITUTIONAL POLICY SYNC) */
import { PrismaClient, ContentType } from "@prisma/client";
import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";

const prisma = new PrismaClient();

const PROJECT_ROOT = process.cwd();
const CONTENTLAYER_INDEX = path.join(PROJECT_ROOT, ".contentlayer", "generated", "index.mjs");

// Hard exclusions: not admitted into this database sync
const FORBIDDEN_TYPES = new Set(["Book", "Post", "Canon"]);

// Allowed to exist in DB but not pre-generated as PDFs
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
  version?: string;
  institutionalId?: string;
  metadata?: Record<string, unknown> | null;
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

function resolveContentType(doc: ContentlayerDoc): ContentType {
  const metadata = asRecord(doc.metadata);

  const haystack = [
    doc.type,
    doc.category,
    doc.slugSafe,
    doc.slug,
    doc.titleSafe,
    doc.title,
    metadata.type,
    metadata.docKind,
    metadata.category,
  ]
    .map((value) => safeString(value).toLowerCase())
    .join(" ");

  if (haystack.includes("sovereign intelligence")) return ContentType.Sovereign_Intelligence;
  if (haystack.includes("audit")) return ContentType.Audit;
  if (haystack.includes("research")) return ContentType.Research;
  if (haystack.includes("leadership")) return ContentType.Leadership;
  if (haystack.includes("strategy")) return ContentType.Strategy;

  if (
    haystack.includes("framework") ||
    haystack.includes("governance") ||
    haystack.includes("rule-of-life") ||
    haystack.includes("operational")
  ) {
    return ContentType.Operational_Framework;
  }

  if (haystack.includes("lexicon")) return ContentType.Lexicon;
  if (haystack.includes("landing") || haystack.includes("page")) return ContentType.Landing;

  if (
    haystack.includes("dossier") ||
    haystack.includes("intelligence brief") ||
    haystack.includes("intelligence")
  ) {
    return ContentType.Dossier;
  }

  return ContentType.Briefs;
}

function buildInstitutionalId(doc: ContentlayerDoc, cleanSlug: string): string {
  const existing = safeString(doc.institutionalId);
  if (existing) return existing;

  if (cleanSlug) {
    return `CB-AUTO-${cleanSlug.toUpperCase().replace(/[\/\s]+/g, "-")}`;
  }

  const fallback = slugify(
    safeString(doc.titleSafe) ||
      safeString(doc.title) ||
      safeString(doc._id) ||
      "unfiled"
  );

  return `CB-AUTO-${fallback.toUpperCase()}`;
}

function resolveClassification(doc: ContentlayerDoc): "PUBLIC" | "MEMBER" | "RESTRICTED" {
  const metadata = asRecord(doc.metadata);

  const raw =
    safeString(metadata.classification) ||
    safeString(metadata.accessTierSafe) ||
    safeString(metadata.tier) ||
    "public";

  const normalized = raw.trim().toLowerCase();

  if (normalized === "restricted") return "RESTRICTED";
  if (normalized === "member" || normalized === "premium") return "MEMBER";
  return "PUBLIC";
}

function shouldSkipDoc(doc: ContentlayerDoc): { skip: boolean; reason?: string } {
  const type = safeString(doc.type, "Brief");
  const metadata = asRecord(doc.metadata);
  const version = safeString(doc.version || metadata.version);

  if (FORBIDDEN_TYPES.has(type)) {
    return { skip: true, reason: "forbidden-type" };
  }

  if (version === "0.9") {
    return { skip: true, reason: "legacy-version" };
  }

  return { skip: false };
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

async function masterSync(): Promise<void> {
  console.log("🚀 [VAULT SYNC] Initiating institutional policy sync...");

  const allDocs = await loadContentlayerDocs();

  const skipped: Array<{ slug: string; type: string; reason: string }> = [];
  const filteredDocs: ContentlayerDoc[] = [];

  for (const doc of allDocs) {
    const decision = shouldSkipDoc(doc);
    if (decision.skip) {
      skipped.push({
        slug: normalizeSlug(doc.slugSafe || doc.slug || doc._id),
        type: safeString(doc.type, "Unknown"),
        reason: decision.reason || "unknown",
      });
      continue;
    }
    filteredDocs.push(doc);
  }

  console.log(`[VAULT SYNC] Indexing ${filteredDocs.length} policy-compliant assets.`);

  let committed = 0;

  try {
    const batches = chunk(filteredDocs, BATCH_SIZE);

    for (const batch of batches) {
      const operations = batch.map((doc) => {
        const metadata = asRecord(doc.metadata);

        const cleanSlug =
          normalizeSlug(doc.slugSafe || doc.slug) ||
          slugify(safeString(doc.titleSafe || doc.title || doc._id));

        const title =
          safeString(doc.titleSafe) ||
          safeString(doc.title) ||
          "Untitled";

        const summary =
          safeString(doc.excerptSafe) ||
          safeString(doc.excerpt) ||
          safeString(doc.summary) ||
          safeString(doc.description);

        const content = safeString(doc.body?.raw);
        const version = safeString(doc.version || metadata.version, "1.0.0");
        const institutionalId = buildInstitutionalId(doc, cleanSlug);
        const contentType = resolveContentType(doc);
        const classification = resolveClassification(doc);

        const mergedMetadata: Record<string, unknown> = {
          ...metadata,
          institutionalId,
          sourceType: safeString(doc.type, "Unknown"),
          onlineOnly: ONLINE_ONLY_TYPES.has(safeString(doc.type)),
          lastSync: new Date().toISOString(),
        };

        return prisma.contentMetadata.upsert({
          where: { slug: cleanSlug },
          update: {
            title,
            contentType,
            classification,
            summary,
            content,
            metadata: mergedMetadata,
            updatedAt: new Date(),
          },
          create: {
            slug: cleanSlug,
            title,
            contentType,
            classification,
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

    const onlineOnlyCount = filteredDocs.filter((doc) =>
      ONLINE_ONLY_TYPES.has(safeString(doc.type))
    ).length;

    console.log("\n\n--- INSTITUTIONAL SYNC REPORT ---");
    console.log("✅ Status: SUCCESS");
    console.log(`📦 Assets Committed: ${committed}`);
    console.log(`🚫 Policy Exclusions: ${skipped.length}`);
    console.log(`🌐 Online-Only Flagged: ${onlineOnlyCount}`);
    console.log("🛡️ Mapping: Institutional enum validation passed");

    if (skipped.length > 0) {
      console.log("\n--- SKIP SUMMARY ---");
      const byReason = skipped.reduce<Record<string, number>>((acc, item) => {
        acc[item.reason] = (acc[item.reason] || 0) + 1;
        return acc;
      }, {});

      for (const [reason, count] of Object.entries(byReason)) {
        console.log(`- ${reason}: ${count}`);
      }
    }
  } catch (error) {
    console.error("\n❌ [CRITICAL SYNC FAILURE]");
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

masterSync().catch(async (error) => {
  console.error("\n❌ [UNHANDLED SYNC FAILURE]", error);
  await prisma.$disconnect();
  process.exit(1);
});