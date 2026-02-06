import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { prisma } from "../lib/prisma";

const CONTENT_PATH = path.join(process.cwd(), "content");

async function directSync() {
  console.log("🚀 [DIRECT SYNC]: Bypassing Contentlayer... Final Schema Alignment.");

  const getFiles = (dir: string): string[] => {
    if (!fs.existsSync(dir)) return [];
    const subdirs = fs.readdirSync(dir);
    const files = subdirs.map((subdir) => {
      const res = path.resolve(dir, subdir);
      return fs.statSync(res).isDirectory() ? getFiles(res) : res;
    });
    return files.reduce((a, b) => a.concat(b), []);
  };

  const mdxFiles = getFiles(CONTENT_PATH).filter(f => f.endsWith(".mdx") || f.endsWith(".md"));
  console.log(`📂 Found ${mdxFiles.length} briefs on disk.`);

  const operations = mdxFiles.map((file) => {
    const fileContent = fs.readFileSync(file, "utf8");
    const { data } = matter(fileContent);
    
    const relativePath = path.relative(CONTENT_PATH, file);
    const slug = '/' + relativePath.replace(/\\/g, '/').replace(/\.mdx?$/, '');
    
    const folderType = relativePath.split(path.sep)[0] || "brief";

    return prisma.contentMetadata.upsert({
      where: { slug },
      update: {
        title: data.title || path.basename(file, ".mdx"),
        classification: data.accessLevel || "private",
        contentType: folderType,
        metadata: JSON.stringify(data),
        updatedAt: new Date(),
      },
      create: {
        slug,
        title: data.title || path.basename(file, ".mdx"),
        contentType: folderType, // Only using contentType, removing 'type'
        classification: data.accessLevel || "private",
        metadata: JSON.stringify(data),
      },
    });
  });

  try {
    console.log("📡 Pushing transaction to Neon PostgreSQL...");
    const results = await prisma.$transaction(operations);
    console.log(`✅ [SUCCESS]: ${results.length} briefs are now live in the Registry.`);
  } catch (error) {
    console.error("❌ [CRITICAL FAILURE]: Sync aborted.", error);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

directSync();