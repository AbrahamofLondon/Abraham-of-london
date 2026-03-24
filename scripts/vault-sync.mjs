/* scripts/vault-sync.mjs — INSTITUTIONAL SINGLETON ALIGNED (SCHEMA-CORRECT) */
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { PrismaClient, ContentType, AccessTier } from "@prisma/client";

const prisma = new PrismaClient();

const CONTENT_ROOT = path.join(process.cwd(), "content");
const CONTENT_PATH = path.join(CONTENT_ROOT, "briefs");

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                    */
/* -------------------------------------------------------------------------- */

function safeString(value, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function normalizeSlug(value) {
  return safeString(value)
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+|\/+$/g, "")
    .replace(/\.mdx?$/i, "");
}

function normalizeToken(value) {
  return safeString(value)
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function mapContentType(rawFolder, data = {}, slug = "") {
  const folder = normalizeToken(rawFolder);
  const category = normalizeToken(data.category);
  const title = safeString(data.title).toLowerCase();
  const description = safeString(data.description).toLowerCase();
  const excerpt = safeString(data.excerpt).toLowerCase();
  const format = normalizeToken(data.format);
  const haystack = `${folder} ${category} ${title} ${description} ${excerpt} ${format} ${slug}`.toLowerCase();

  if (haystack.includes("lexicon")) return ContentType.Lexicon;
  if (haystack.includes("landing")) return ContentType.Landing;

  if (
    haystack.includes("framework") ||
    haystack.includes("governance") ||
    haystack.includes("rule_of_life") ||
    haystack.includes("rule-of-life") ||
    haystack.includes("operational")
  ) {
    return ContentType.Operational_Framework;
  }

  if (haystack.includes("leadership")) return ContentType.Leadership;
  if (haystack.includes("strategy")) return ContentType.Strategy;
  if (haystack.includes("audit")) return ContentType.Audit;
  if (haystack.includes("research")) return ContentType.Research;

  if (
    haystack.includes("sovereign_intelligence") ||
    haystack.includes("sovereign intelligence") ||
    haystack.includes("si-")
  ) {
    return ContentType.Sovereign_Intelligence;
  }

  if (
    folder === "dossiers" ||
    haystack.includes("dossier") ||
    haystack.includes("intelligence_brief") ||
    haystack.includes("intelligence brief")
  ) {
    return ContentType.Dossier;
  }

  return ContentType.Briefs;
}

function mapClassification(tierLike) {
  const t = normalizeToken(tierLike);

  if (!t) return AccessTier.public;

  const aliases = {
    public: AccessTier.public,
    member: AccessTier.member,
    inner_circle: AccessTier.inner_circle,
    innercircle: AccessTier.inner_circle,
    restricted: AccessTier.restricted,
    client: AccessTier.client,
    legacy: AccessTier.legacy,
    architect: AccessTier.architect,
    owner: AccessTier.owner,
    top_secret: AccessTier.top_secret,
    topsecret: AccessTier.top_secret,

    // legacy / human input aliases
    private: AccessTier.restricted,
    internal: AccessTier.restricted,
    protected: AccessTier.restricted,
  };

  return aliases[t] || AccessTier.public;
}

function getFiles(dir) {
  let results = [];

  if (!fs.existsSync(dir)) return results;

  const list = fs.readdirSync(dir);

  for (const file of list) {
    const fullPath = path.resolve(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      results = results.concat(getFiles(fullPath));
    } else if (fullPath.endsWith(".mdx") || fullPath.endsWith(".md")) {
      results.push(fullPath);
    }
  }

  return results;
}

function buildSummary(data, content) {
  const explicit = safeString(data.description) || safeString(data.excerpt);
  if (explicit) return explicit;

  const compact = safeString(content)
    .replace(/\s+/g, " ")
    .trim();

  return compact.slice(0, 280);
}

function buildMetadata(frontmatter, extra = {}) {
  return {
    ...(frontmatter && typeof frontmatter === "object" ? frontmatter : {}),
    ...extra,
  };
}

/* -------------------------------------------------------------------------- */
/* EXECUTION                                                                  */
/* -------------------------------------------------------------------------- */

async function masterSync() {
  console.log("🚀 [VAULT SYNC]: Synchronizing via Institutional Proxy...");
  console.log("[VAULT_SYNC_FILE]", import.meta.url);

  try {
    const mdxFiles = getFiles(CONTENT_PATH);
    console.log(`[VAULT SYNC]: Indexing ${mdxFiles.length} assets.`);

    const operations = mdxFiles.map((file) => {
      const fileContent = fs.readFileSync(file, "utf8");
      const { data, content } = matter(fileContent);

      const relativePath = path.relative(CONTENT_ROOT, file);
      const normalizedRelativePath = normalizeSlug(relativePath);
      const rawFolder = normalizedRelativePath.split("/")[0] || "briefs";

      const slug = normalizedRelativePath;
      const title = safeString(data.title) || path.basename(file, path.extname(file));
      const contentType = mapContentType(rawFolder, data, slug);
      const classification = mapClassification(data.tier || data.accessLevel || data.classification);
      const summary = buildSummary(data, content);
      const version = safeString(data.version, "1.0.0") || "1.0.0";

      const metadata = buildMetadata(data, {
        lastSync: new Date().toISOString(),
        sourceFile: normalizedRelativePath,
      });

      console.log("[VAULT_SYNC_TYPE]", {
        slug,
        contentType,
        classification,
        category: data.category,
        title,
      });

      return prisma.contentMetadata.upsert({
        where: { slug },
        update: {
          title,
          contentType,
          classification,
          summary,
          content: content.slice(0, 5000),
          metadata,
          updatedAt: new Date(),
        },
        create: {
          slug,
          title,
          contentType,
          classification,
          summary,
          content: content.slice(0, 5000),
          metadata,
          version,
        },
      });
    });

    const results = await prisma.$transaction(operations);

    console.log(`✅ [SUCCESS]: ${results.length} assets synchronized with the vault.`);
  } catch (error) {
    console.error("❌ [CRITICAL FAILURE]: Sync aborted.");
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

masterSync().catch(async (error) => {
  console.error("❌ [UNHANDLED FAILURE]:", error instanceof Error ? error.message : String(error));
  await prisma.$disconnect();
  process.exit(1);
});