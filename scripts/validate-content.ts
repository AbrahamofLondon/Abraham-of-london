#!/usr/bin/env node
/**
 * scripts/validate-content.mjs
 * ENTERPRISE-GRADE CONTENT AUDITOR
 * * Verifies that all MDX/MD files in the /content directory meet the 
 * brand's strict metadata requirements before build.
 */

import { promises as fs } from "fs";
import path, { join, dirname } from "path";
import { fileURLToPath } from "url";
import matter from "gray-matter";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..");
const contentDir = join(rootDir, "content");
const publicDir = join(rootDir, "public");

// 🛡️ Fields that MUST exist for a successful build
const requiredFields = {
  canon: ["title", "date"],
  downloads: ["title", "date"],
  resources: ["title", "date"],
  blog: ["title", "date"],
};

const isIsoDate = (v) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
const cleanStr = (v) => String(v ?? "").trim();

function ensureLeadingSlash(s) {
  const v = cleanStr(s);
  if (!v) return "";
  return v.startsWith("/") ? v : `/${v}`;
}

function publicUrlToFsPath(publicUrl) {
  const u = cleanStr(publicUrl);
  if (!u.startsWith("/")) return null;
  return join(publicDir, u.replace(/^\/+/, ""));
}

async function fileExists(fsPath) {
  try {
    await fs.access(fsPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates if a referenced asset exists in the /public folder.
 */
async function validateAssetUrl(label, url, targetArray) {
  const u = cleanStr(url);
  if (!u || !u.startsWith("/")) return;

  const abs = publicUrlToFsPath(u);
  if (!abs) return;

  // Only validate assets that are expected to be in the local /public folder
  if (!u.startsWith("/assets/") && !u.startsWith("/favicon") && !u.startsWith("/icons/")) {
    return;
  }

  if (!(await fileExists(abs))) {
    targetArray.push(`Missing public asset (${label}): ${u}`);
  }
}

async function validateFile(filePath) {
  try {
    const content = await fs.readFile(filePath, "utf8");
    const { data } = matter(content);
    const errors = [];
    const warnings = [];

    // Normalize path for key matching across OS environments
    const normalizedPath = filePath.split(path.sep).join("/");
    const dirKey = normalizedPath.split("/").find(p => requiredFields[p]);

    // 1. Validate Required Metadata (Strict Error)
    if (dirKey && requiredFields[dirKey]) {
      for (const field of requiredFields[dirKey]) {
        if (!data[field]) errors.push(`Missing required field: ${field}`);
      }
    }

    if (data.date && !isIsoDate(data.date)) {
      errors.push(`Invalid date format: ${data.date}. Use YYYY-MM-DD`);
    }

    // 2. Validate Assets (Relaxed Warning)
    const cover = data.coverImage ?? data.image ?? data.cover ?? null;
    if (cover) {
      await validateAssetUrl("coverImage", ensureLeadingSlash(cover), warnings);
    }

    const fileUrl = data.downloadUrl ?? data.fileUrl ?? data.downloadFile ?? null;
    if (fileUrl) {
      const u = ensureLeadingSlash(fileUrl);
      // Logic for legacy asset mapping
      const canonical = u.startsWith("/downloads/") ? u.replace(/^\/downloads\//, "/assets/downloads/") : u;
      await validateAssetUrl("downloadFile", canonical, warnings);
    }

    return {
      path: path.relative(contentDir, filePath),
      valid: errors.length === 0,
      errors,
      warnings,
    };
  } catch (error) {
    return { path: filePath, valid: false, errors: [`Parse error: ${error.message}`], warnings: [] };
  }
}

async function walkDir(dir) {
  let results = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) results = results.concat(await walkDir(fullPath));
    else if (entry.name.match(/\.(md|mdx)$/)) results.push(fullPath);
  }
  return results;
}

async function main() {
  if (!existsSync(contentDir)) {
    console.warn("⚠️  Content directory not found. Skipping validation.");
    process.exit(0);
  }

  const files = await walkDir(contentDir);
  const results = await Promise.all(files.map(validateFile));

  const invalidFiles = results.filter((r) => !r.valid);
  const filesWithWarnings = results.filter((r) => r.warnings.length > 0);

  console.log(`📊 Summary: ${results.length} documents audited.`);
  console.log(`✅ Valid: ${results.length - invalidFiles.length} | ❌ Invalid: ${invalidFiles.length}\n`);

  if (filesWithWarnings.length > 0) {
    console.log("⚠️  Asset Warnings (Non-breaking):");
    filesWithWarnings.forEach(f => {
      console.log(`📄 ${f.path}`);
      f.warnings.forEach(w => console.log(`   - ${w}`));
    });
  }

  if (invalidFiles.length > 0) {
    console.log("\n❌ Critical Content Errors (Build Failed):");
    invalidFiles.forEach(f => {
      console.log(`📄 ${f.path}`);
      f.errors.forEach(e => console.log(`   - ${e}`));
    });
    process.exit(1);
  } else {
    console.log("\n🎉 Content validation passed!");
    process.exit(0);
  }
}

import { existsSync } from "fs";
main().catch(console.error);
