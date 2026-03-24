import fs from "fs/promises";
import path from "path";

const TARGET_DIR = "./content/downloads";

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walk(fullPath));
    } else if (entry.isFile() && /\.(tsx|ts|mdx|md)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

function normalizeBrandFrameImport(content) {
  return content.replace(
    /import\s*\{\s*BrandFrame\s*\}\s*from\s*["']@\/components\/print\/BrandFrame["'];?/g,
    'import BrandFrame from "@/components/print/BrandFrame";',
  );
}

function normalizeBriefDocumentShim(content, filePath) {
  if (!filePath.replace(/\\/g, "/").endsWith("lib/pdf-templates/BriefDocument.tsx")) {
    return content;
  }

  return `export { InstitutionalBriefDocument as BriefDocument } from "../pdf/templates/InstitutionalBriefDocument";
export { InstitutionalBriefDocument as default } from "../pdf/templates/InstitutionalBriefDocument";
`;
}

async function backupFile(filePath, original) {
  const backupPath = `${filePath}.bak`;
  try {
    await fs.access(backupPath);
  } catch {
    await fs.writeFile(backupPath, original, "utf8");
  }
}

async function transformFile(filePath) {
  const original = await fs.readFile(filePath, "utf8");
  let updated = original;

  // Fix shim path if this is the legacy bridge file
  updated = normalizeBriefDocumentShim(updated, filePath);

  // Only run download-template normalization on download-like content files
  if (updated.includes('type: "Download"')) {
    updated = normalizeBrandFrameImport(updated);

    // Optional light-touch normalization:
    // normalize pageSize prop casing if you use BrandFrame in JSX
    updated = updated.replace(
      /<BrandFrame([^>]*?)\s+pageSize=\{?"A4"\}?/g,
      '<BrandFrame$1 pageSize="A4"',
    );
  }

  if (updated !== original) {
    await backupFile(filePath, original);
    await fs.writeFile(filePath, updated, "utf8");
    console.log(`[FIXED] ${filePath}`);
  }
}

async function run() {
  console.log("--- STARTING SAFE ALIGNMENT ---");

  const files = await walk(TARGET_DIR).catch(() => []);
  for (const file of files) {
    await transformFile(file);
  }

  // Also explicitly fix the shim file if it exists
  const shimPath = path.join("lib", "pdf-templates", "BriefDocument.tsx");
  try {
    await transformFile(shimPath);
  } catch {
    // ignore if file does not exist
  }

  console.log("--- ALIGNMENT COMPLETE ---");
}

run().catch((error) => {
  console.error("[ALIGNMENT FAILED]", error);
  process.exit(1);
});