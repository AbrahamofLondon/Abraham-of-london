/* scripts/vault-final-sync.mjs — V2.1 (ENUM ALIGNMENT) */
import { PrismaClient, ContentType, AccessTier } from "@prisma/client"; // Added AccessTier
import { allBriefs } from "../.contentlayer/generated/index.mjs";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const ASSETS_DIR = path.join(ROOT, 'public', 'assets', 'downloads');
const REGISTRY_OUTPUT = path.join(ROOT, 'lib', 'pdf', 'pdf-registry.generated.ts');

const prisma = new PrismaClient();

// --- HELPERS ---
function safeString(value) { return typeof value === "string" ? value : ""; }
function normalizeSlug(value) { return safeString(value).trim().replace(/^\/+|\/+$/g, ""); }

function resolveContentType(brief) {
  const category = safeString(brief.category).toLowerCase();
  const slug = normalizeSlug(brief.slugSafe).toLowerCase();
  const title = safeString(brief.titleSafe).toLowerCase();
  const haystack = `${category} ${slug} ${title}`;

  if (haystack.includes("sovereign intelligence")) return ContentType.Sovereign_Intelligence;
  if (haystack.includes("audit")) return ContentType.Audit;
  if (haystack.includes("research")) return ContentType.Research;
  if (haystack.includes("leadership")) return ContentType.Leadership;
  if (haystack.includes("strategy")) return ContentType.Strategy;
  if (haystack.includes("framework") || haystack.includes("governance")) return ContentType.Operational_Framework;
  if (haystack.includes("lexicon")) return ContentType.Lexicon;
  if (haystack.includes("dossier") || haystack.includes("intelligence")) return ContentType.Dossier;

  return ContentType.Briefs;
}

/**
 * Maps string metadata tiers to the Prisma AccessTier Enum.
 * Defaults to Public if not found.
 */
function resolveAccessTier(tierString) {
  const tier = safeString(tierString).toUpperCase();
  // Adjust these keys if your AccessTier enum uses different names (e.g. Architect vs ARCHITECT)
  if (tier === "ARCHITECT") return AccessTier.Architect;
  if (tier === "SOVEREIGN") return AccessTier.Sovereign;
  return AccessTier.Public; 
}

// --- MASTER SYNC ---
async function masterSync() {
  console.log("🚀 [VAULT SYNC]: Initializing Institutional Sync...");
  const pdfConfigs = [];

  try {
    const operations = allBriefs.map((brief) => {
      const cleanSlug = normalizeSlug(brief.slugSafe);
      const validatedType = resolveContentType(brief);
      const title = safeString(brief.titleSafe).trim() || "Untitled";
      const summary = safeString(brief.excerptSafe).trim() || safeString(brief.description).trim() || "";
      const content = safeString(brief.body?.raw);
      
      // Resolve IDs
      const instId = brief.institutionalId || `CB-${cleanSlug.toUpperCase().replace(/[\/\s]+/g, "-")}`;
      
      // Resolve Enums
      const classification = resolveAccessTier(brief.metadata?.tier || "PUBLIC");

      // Prepare Registry Data
      pdfConfigs.push({
        id: instId,
        title: title,
        slug: cleanSlug,
        outputPath: `/assets/downloads/${cleanSlug}.pdf`,
        format: 'PDF',
        exists: fs.existsSync(path.join(ASSETS_DIR, `${cleanSlug}.pdf`)),
        tier: (brief.metadata?.tier || 'architect').toLowerCase(),
        type: 'brief'
      });

      return prisma.contentMetadata.upsert({
        where: { slug: cleanSlug },
        update: {
          title,
          contentType: validatedType,
          classification, // Now using Enum value
          summary,
          content,
          metadata: {
            institutionalId: instId,
            lastSync: new Date().toISOString(),
            ...brief.metadata
          },
          updatedAt: new Date(),
        },
        create: {
          slug: cleanSlug,
          title,
          contentType: validatedType,
          classification, // Now using Enum value
          summary,
          content,
          metadata: {
            institutionalId: instId,
            lastSync: new Date().toISOString(),
            ...brief.metadata
          },
          version: safeString(brief.version) || "1.0.0",
        },
      });
    });

    await prisma.$transaction(operations);
    console.log(`✅ Success: Database & PDF Registry aligned.`);

    // Write Registry File
    const registryContent = `export const GENERATED_PDF_CONFIGS = ${JSON.stringify(pdfConfigs, null, 2)};`;
    fs.writeFileSync(REGISTRY_OUTPUT, registryContent);

  } catch (error) {
    console.error("\n❌ [CRITICAL SYNC FAILURE]:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

masterSync();