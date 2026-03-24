/* scripts/vault-manifest-gen.ts — V6.1 (DEDUPED CANONICAL RESTORATION) */
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

import { generatePDF } from "../lib/pdf-generator";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.join(__dirname, "..");
const PUBLIC_ROOT = path.join(PROJECT_ROOT, "public");
const ASSETS_ROOT = path.join(PUBLIC_ROOT, "assets", "downloads");
const REGISTRY_OUT = path.join(
  PROJECT_ROOT,
  "lib",
  "pdf",
  "pdf-registry.generated.ts"
);
const OPS_REPORT_OUT = path.join(ASSETS_ROOT, "pdf-ops-report.json");
const CONTENTLAYER_INDEX = path.join(
  PROJECT_ROOT,
  ".contentlayer",
  "generated",
  "index.mjs"
);

const DOCTYPE_MAP: Record<string, string> = {
  Brief: "vault/briefs",
  VaultBrief: "vault/briefs",
  Intelligence: "vault/intelligence",
  Strategy: "strategy",
  Resource: "resources",
  Lexicon: "lexicon",
  Print: "prints",
  Download: "downloads",
  Dispatch: "dispatch",
  Vault: "vault/general",
};

const FORBIDDEN_TYPES = new Set(["Book", "Post", "Canon"]);
const ONLINE_ONLY_TYPES = new Set(["Short"]);

type ContentlayerDoc = {
  _id?: string;
  type?: string;
  title?: string;
  slug?: string;
  slugSafe?: string;
  institutionalId?: string;
  version?: string;
  frontmatter?: {
    version?: string;
  };
};

type VaultRegistryEntry = {
  id: string;
  title: string;
  slug: string;
  type: string;
  outputPath: string;
  mirrorPath: string;
  exists: true;
};

type FailedEntry = {
  id: string;
  slug: string;
  type: string;
  reason: string;
};

type SkipReason =
  | "forbidden-type"
  | "online-only"
  | "legacy-version"
  | "missing-id";

type SkippedEntry = {
  id: string;
  slug: string;
  type: string;
  reason: SkipReason;
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

function slugify(value: string): string {
  return safeString(value)
    .normalize("NFKD")
    .replace(/[^\w\s/-]+/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
}

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
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

function getDocType(doc: ContentlayerDoc): string {
  return safeString(doc.type, "Vault");
}

function getDocVersion(doc: ContentlayerDoc): string {
  return safeString(doc.version || doc.frontmatter?.version);
}

function getDocId(doc: ContentlayerDoc): string {
  return safeString(doc.institutionalId || doc.slug || doc._id);
}

function getDocSlug(doc: ContentlayerDoc): string {
  return safeString(doc.slugSafe || doc.slug) || slugify(getDocId(doc));
}

function getDocTitle(doc: ContentlayerDoc): string {
  return safeString(doc.title, getDocSlug(doc) || getDocId(doc) || "Untitled");
}

function shouldSkipDoc(doc: ContentlayerDoc): SkipReason | null {
  const type = getDocType(doc);
  const version = getDocVersion(doc);
  const id = getDocId(doc);

  if (!id) return "missing-id";
  if (FORBIDDEN_TYPES.has(type)) return "forbidden-type";
  if (ONLINE_ONLY_TYPES.has(type)) return "online-only";
  if (version === "0.9") return "legacy-version";

  return null;
}

function getLeafStem(value: string): string {
  const normalized = safeString(value)
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\.(md|mdx|markdown|pdf)$/i, "")
    .replace(/[^\w/-]+/g, "-")
    .replace(/-+/g, "-");

  return normalized.split("/").pop() || "document";
}

function dedupeDocs(docs: ContentlayerDoc[]): ContentlayerDoc[] {
  const seen = new Set<string>();
  const out: ContentlayerDoc[] = [];

  for (const doc of docs) {
    const key = [
      getDocId(doc),
      getDocType(doc),
      getDocSlug(doc),
    ].join("::");

    if (seen.has(key)) continue;
    seen.add(key);
    out.push(doc);
  }

  return out;
}

function inferTypeFromOutputPath(outputPath: string, fallbackType: string): string {
  const clean = safeString(outputPath).replace(/\\/g, "/").replace(/^\/+/, "");

  if (clean.startsWith("vault/briefs/")) return "Brief";
  if (clean.startsWith("vault/intelligence/")) return "Intelligence";
  if (clean.startsWith("strategy/")) return "Strategy";
  if (clean.startsWith("resources/")) return "Resource";
  if (clean.startsWith("lexicon/")) return "Lexicon";
  if (clean.startsWith("prints/")) return "Print";
  if (clean.startsWith("downloads/")) return "Download";
  if (clean.startsWith("dispatch/")) return "Dispatch";
  if (clean.startsWith("vault/general/")) return "Vault";

  return fallbackType;
}

async function buildVault(): Promise<void> {
  const timestamp = new Date().toISOString();
  console.log(`🏛️ ABRAHAM OF LONDON | VAULT SYNC V6.1 | ${timestamp}`);

  ensureDir(ASSETS_ROOT);
  ensureDir(path.dirname(REGISTRY_OUT));

  const allDocs = await loadContentlayerDocs();
  const skipped: SkippedEntry[] = [];
  const restorationQueueRaw: ContentlayerDoc[] = [];

  for (const doc of allDocs) {
    const skipReason = shouldSkipDoc(doc);
    if (skipReason) {
      skipped.push({
        id: getDocId(doc),
        slug: getDocSlug(doc),
        type: getDocType(doc),
        reason: skipReason,
      });
      continue;
    }

    restorationQueueRaw.push(doc);
  }

  const restorationQueue = dedupeDocs(restorationQueueRaw);

  console.log(`📡 Analyzing ${restorationQueue.length} assets for restoration...`);

  const successes: VaultRegistryEntry[] = [];
  const failures: FailedEntry[] = [];

  for (const doc of restorationQueue) {
    const id = getDocId(doc);
    const slug = getDocSlug(doc);
    const title = getDocTitle(doc);
    const declaredType = getDocType(doc);

    try {
      const result = await generatePDF(id, true);

      if (!result.success || !result.buffer || !result.path) {
        failures.push({
          id,
          slug,
          type: declaredType,
          reason: safeString(result.error, "PDF generation returned no buffer"),
        });
        continue;
      }

      const outputPath = result.path;
      const relativeOutput = outputPath.replace(/^\//, "");
      const outputFileName = path.basename(relativeOutput);
      const mirrorType = inferTypeFromOutputPath(relativeOutput, declaredType);
      const mirrorFolder = DOCTYPE_MAP[mirrorType] || "vault/general";
      const mirrorPath = `/${mirrorFolder}/${outputFileName}`;

      const assetFile = path.join(ASSETS_ROOT, outputFileName);
      const mirrorDir = path.join(PUBLIC_ROOT, mirrorFolder);
      const mirrorFile = path.join(mirrorDir, outputFileName);

      ensureDir(path.dirname(assetFile));
      ensureDir(mirrorDir);

      fs.writeFileSync(assetFile, result.buffer);
      fs.writeFileSync(mirrorFile, result.buffer);

      if (result.fingerprint) {
        fs.writeFileSync(`${assetFile}.fingerprint`, result.fingerprint, "utf8");
        fs.writeFileSync(`${mirrorFile}.fingerprint`, result.fingerprint, "utf8");
      }

      successes.push({
        id,
        title,
        slug: getLeafStem(slug),
        type: mirrorType,
        outputPath,
        mirrorPath,
        exists: true,
      });

      process.stdout.write(".");
    } catch (error) {
      failures.push({
        id,
        slug,
        type: declaredType,
        reason: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const registryTS = `/** AUTO-GENERATED VAULT REGISTRY — DO NOT EDIT
 * Generated by scripts/vault-manifest-gen.ts V6.1
 */
export const GENERATED_AT = ${JSON.stringify(timestamp)};
export const GENERATED_COUNT = ${successes.length};
export const GENERATED_PDF_CONFIGS = ${JSON.stringify(successes, null, 2)} as const;

const generatedRegistry = {
  GENERATED_AT,
  GENERATED_COUNT,
  GENERATED_PDF_CONFIGS,
};

export default generatedRegistry;
`;

  fs.writeFileSync(REGISTRY_OUT, registryTS, "utf8");

  const opsReport = {
    generatedAt: timestamp,
    totals: {
      allDocs: allDocs.length,
      queued: restorationQueue.length,
      restored: successes.length,
      failed: failures.length,
      skipped: skipped.length,
      deduped:
        restorationQueueRaw.length - restorationQueue.length,
    },
    skipped,
    failures,
    restoredByType: successes.reduce<Record<string, number>>((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    }, {}),
  };

  fs.writeFileSync(OPS_REPORT_OUT, JSON.stringify(opsReport, null, 2), "utf8");

  console.log(`\n\n--- 🛡️ INSTITUTIONAL FOLDER STATUS ---`);
  for (const [docType, folder] of Object.entries(DOCTYPE_MAP)) {
    const count = successes.filter((item) => item.type === docType).length;
    console.log(`📂 ${folder.padEnd(24)} | Restored: ${count}`);
  }

  console.log(`\n✨ Total Assets Restored: ${successes.length}`);
  console.log(
    `🚫 Forbidden Types Skipped: ${skipped.filter((s) => s.reason === "forbidden-type").length}`
  );
  console.log(
    `🌐 Shorts (Online Only) Skipped: ${skipped.filter((s) => s.reason === "online-only").length}`
  );
  console.log(
    `🕰️ Legacy Version 0.9 Skipped: ${skipped.filter((s) => s.reason === "legacy-version").length}`
  );
  console.log(
    `🧹 Duplicates Removed: ${restorationQueueRaw.length - restorationQueue.length}`
  );
  console.log(`❌ Failed: ${failures.length}`);
  console.log(`🧾 Registry: ${REGISTRY_OUT}`);
  console.log(`📊 Ops Report: ${OPS_REPORT_OUT}`);

  if (failures.length > 0) {
    console.log(`\n--- FAILURE SNAPSHOT ---`);
    for (const failure of failures.slice(0, 15)) {
      console.log(`❌ ${failure.id} [${failure.type}] — ${failure.reason}`);
    }
  }
}

buildVault().catch((error) => {
  console.error("🚨 VAULT SYNC FAILURE:", error);
  process.exit(1);
});