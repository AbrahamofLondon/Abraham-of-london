/* scripts/vault-sync.mjs - INSTITUTIONAL SINGLETON ALIGNED */
import fs from "fs";
import path from "path";
import matter from "gray-matter";
// Import the established singleton to avoid redeclaration errors
import { prisma } from "../lib/prisma.ts";

const CONTENT_PATH = path.join(process.cwd(), "content");

/**
 * MAPPING HELPERS
 * Ensures frontmatter strings align with Prisma Enums
 */
function mapClassification(accessLevel) {
  const level = String(accessLevel || "").toUpperCase();
  if (level === "PRIVATE" || level === "INNER-CIRCLE") return "RESTRICTED";
  if (level === "RESTRICTED") return "RESTRICTED";
  return "PUBLIC"; // Default fallback
}

function mapContentType(rawType) {
  const typeMap = {
    briefs: "Briefing",
    intelligence: "Dossier",
    strategy: "Operational_Framework",
    lexicon: "Lexicon",
    landing: "Landing"
  };
  return typeMap[rawType.toLowerCase()] || "Briefing";
}

async function masterSync() {
  console.log("🚀 [VAULT SYNC]: Initiating Neon PostgreSQL Upsert via Singleton...");

  const getFiles = (dir) => {
    if (!fs.existsSync(dir)) return [];
    const subdirs = fs.readdirSync(dir);
    const files = subdirs.map((subdir) => {
      const res = path.resolve(dir, subdir);
      return fs.statSync(res).isDirectory() ? getFiles(res) : res;
    });
    return files.reduce((a, b) => a.concat(b), []);
  };

  try {
    const mdxFiles = getFiles(CONTENT_PATH).filter(f => f.endsWith(".mdx") || f.endsWith(".md"));
    console.log(`[VAULT SYNC]: Indexing ${mdxFiles.length} intelligence assets.`);
    
    const operations = mdxFiles.map((file) => {
      const fileContent = fs.readFileSync(file, "utf8");
      const { data, content } = matter(fileContent);
      const relativePath = path.relative(CONTENT_PATH, file);
      
      // Normalize slug for web-standard URL paths
      const slug = relativePath.replace(/\\/g, '/').replace(/\.mdx?$/, '');
      const rawType = relativePath.split(path.sep)[0];
      
      return prisma.contentMetadata.upsert({
        where: { slug },
        update: {
          title: data.title || path.basename(file, ".mdx"),
          contentType: mapContentType(rawType),
          classification: mapClassification(data.accessLevel || data.tier),
          summary: data.description || data.excerpt || "",
          content: content.slice(0, 5000), // Indexing for semantic search
          metadata: data, // Prisma handles JSON objects automatically
          updatedAt: new Date(),
        },
        create: {
          slug,
          title: data.title || path.basename(file, ".mdx"),
          contentType: mapContentType(rawType),
          classification: mapClassification(data.accessLevel || data.tier),
          summary: data.description || data.excerpt || "",
          content: content.slice(0, 5000),
          metadata: data,
          version: data.version || "1.0.0",
        },
      });
    });

    const results = await prisma.$transaction(operations);
    console.log(`✅ [SUCCESS]: ${results.length} records synchronized with Neon.`);

  } catch (error) {
    console.error("❌ [CRITICAL FAILURE]: Sync aborted.", error.message);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

masterSync();