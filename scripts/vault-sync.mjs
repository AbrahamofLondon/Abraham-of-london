/* scripts/vault-sync.mjs - INSTITUTIONAL SINGLETON ALIGNED */
import fs from "fs";
import path from "path";
import matter from "gray-matter";
// Import the singleton instance directly from your lib
import { prisma } from '../lib/prisma.ts';

const CONTENT_PATH = path.join(process.cwd(), "content", "briefs");

/** --- MAPPING HELPERS --- */
function mapContentType(rawFolder) {
  const typeMap = {
    'briefs': 'Briefing',
    'dossiers': 'Dossier',
    'strategy': 'Operational_Framework',
    'lexicon': 'Lexicon',
    'landing': 'Landing'
  };
  return typeMap[rawFolder.toLowerCase()] || 'Briefing';
}

function mapClassification(tier) {
  const t = String(tier || "").toUpperCase();
  if (t === 'PRIVATE' || t === 'INNER-CIRCLE' || t === 'RESTRICTED') return 'RESTRICTED';
  return 'PUBLIC';
}

function getFiles(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (let file of list) {
    const fullPath = path.resolve(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(fullPath));
    } else if (fullPath.endsWith(".mdx") || fullPath.endsWith(".md")) {
      results.push(fullPath);
    }
  }
  return results;
}

/** --- EXECUTION ENGINE --- */
async function masterSync() {
  console.log("🚀 [VAULT SYNC]: Synchronizing via Institutional Proxy...");

  try {
    const mdxFiles = getFiles(CONTENT_PATH);
    console.log(`[VAULT SYNC]: Indexing ${mdxFiles.length} assets.`);

    const operations = mdxFiles.map((file) => {
      const fileContent = fs.readFileSync(file, "utf8");
      const { data, content } = matter(fileContent);
      
      const relativePath = path.relative(path.join(process.cwd(), "content"), file);
      const rawType = relativePath.split(path.sep)[0]; 
      const slug = relativePath.replace(/\\/g, '/').replace(/\.mdx?$/, '');
      
      return prisma.contentMetadata.upsert({
        where: { slug },
        update: {
          title: data.title || path.basename(file, ".mdx"),
          contentType: mapContentType(rawType),
          classification: mapClassification(data.tier || data.accessLevel),
          summary: data.description || data.excerpt || "",
          content: content.slice(0, 5000), 
          metadata: data,
          updatedAt: new Date(),
        },
        create: {
          slug,
          title: data.title || path.basename(file, ".mdx"),
          contentType: mapContentType(rawType),
          classification: mapClassification(data.tier || data.accessLevel),
          summary: data.description || data.excerpt || "",
          content: content.slice(0, 5000),
          metadata: data,
          version: data.version || "1.0.0"
        },
      });
    });

    const results = await prisma.$transaction(operations);
    console.log(`✅ [SUCCESS]: ${results.length} assets synchronized with the 718-asset vault.`);

  } catch (error) {
    console.error("❌ [CRITICAL FAILURE]: Sync aborted.", error.message);
    process.exit(1);
  } finally {
    // We disconnect here because this is a standalone script
    await prisma.$disconnect();
  }
}

masterSync();