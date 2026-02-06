import { prisma } from "../lib/prisma";
import fs from "fs";
import path from "path";

async function pruneRegistry() {
  console.log("🧹 [REGISTRY_PRUNE]: Aligning Database with Disk...");

  const CONTENT_PATH = path.join(process.cwd(), "content");
  
  const getFiles = (dir: string): string[] => {
    if (!fs.existsSync(dir)) return [];
    const subdirs = fs.readdirSync(dir);
    const files = subdirs.map((subdir) => {
      const res = path.resolve(dir, subdir);
      return fs.statSync(res).isDirectory() ? getFiles(res) : res;
    });
    return files.reduce((a, b) => a.concat(b), []);
  };

  // 1. Get current slugs from disk
  const mdxFiles = getFiles(CONTENT_PATH).filter(f => f.endsWith(".mdx") || f.endsWith(".md"));
  const validSlugs = mdxFiles.map(file => {
    const relative = path.relative(CONTENT_PATH, file);
    return '/' + relative.replace(/\\/g, '/').replace(/\.mdx?$/, '');
  });

  try {
    // 2. Delete anything in the DB NOT in our validSlugs list
    const deleted = await prisma.contentMetadata.deleteMany({
      where: {
        slug: { notIn: validSlugs }
      }
    });

    console.log(`🗑️  [PRUNED]: Removed ${deleted.count} legacy/ghost entries.`);
    
    // 3. Verify the final count
    const finalCount = await prisma.contentMetadata.count();
    console.log(`📊 [VERIFIED]: Database now contains ${finalCount} active briefs.`);

  } catch (error) {
    console.error("❌ [PRUNE_FAILURE]:", error);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

pruneRegistry();