import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { encryptDocument } from "../lib/security";

const prisma = new PrismaClient();

// Recursive function to find ALL markdown files regardless of depth
function getAllFiles(dirPath: string, arrayOfFiles: string[] = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      if (file.endsWith(".md") || file.endsWith(".mdx")) {
        arrayOfFiles.push(path.join(dirPath, "/", file));
      }
    }
  });

  return arrayOfFiles;
}

async function totalSync() {
  console.log("🏛️  INITIATING FULL INSTITUTIONAL AUDIT...");
  const contentPath = path.join(process.cwd(), "content");
  
  if (!fs.existsSync(contentPath)) {
    console.error("❌ Content folder not found at:", contentPath);
    return;
  }

  const allFiles = getAllFiles(contentPath);
  console.log(`📊 Audit Found: ${allFiles.length} Total Assets.`);

  for (const filePath of allFiles) {
    const relativePath = path.relative(contentPath, filePath);
    const slug = relativePath.replace(/\\/g, "/").replace(/\.mdx?$/, "");
    const rawContent = fs.readFileSync(filePath, "utf8");
    
    // Auto-Classify based on folder
    const isPrivate = relativePath.includes("private") || relativePath.includes("onboarding");
    const classification = isPrivate ? "PRIVATE" : "PUBLIC";
    
    // Extract Type (Brief, Post, Canon, etc.) from the first folder name
    const typeParts = slug.split('/');
    const contentType = typeParts.length > 1 ? typeParts[0].toUpperCase() : "GENERAL";

    let finalContent = rawContent;
    let metadata = null;

    if (isPrivate) {
      const encrypted = encryptDocument(rawContent);
      finalContent = "[RESTRICTED DATA]";
      metadata = JSON.stringify(encrypted);
    }

    await prisma.contentMetadata.upsert({
      where: { slug },
      update: {
        content: finalContent,
        classification,
        metadata,
        contentType
      },
      create: {
        slug,
        title: path.basename(slug).replace(/-/g, " ").toUpperCase(),
        contentType,
        classification,
        content: finalContent,
        metadata
      }
    });
  }
  console.log(`✅ SYNC COMPLETE: ${allFiles.length} Assets Harmonized.`);
}

totalSync().finally(() => prisma.$disconnect());