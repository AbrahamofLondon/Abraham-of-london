#!/usr/bin/env node
import { promises as fs } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import matter from "gray-matter";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..");
const downloadsDir = join(rootDir, "content", "downloads");
const publicDir = join(rootDir, "public");

const cleanStr = (v) => String(v ?? "").trim();
const ensureLeadingSlash = (s) => (s.startsWith("/") ? s : `/${s}`);

function publicUrlToFsPath(publicUrl) {
  const u = cleanStr(publicUrl);
  if (!u.startsWith("/")) return null;
  return join(publicDir, u.replace(/^\/+/, ""));
}

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function walk(dir) {
  let out = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) out = out.concat(await walk(full));
    else if (e.name.match(/\.(md|mdx)$/)) out.push(full);
  }
  return out;
}

async function main() {
  if (!(await exists(downloadsDir))) {
    console.log("No content/downloads directory found. Skipping.");
    process.exit(0);
  }

  const files = await walk(downloadsDir);
  const missing = [];

  for (const f of files) {
    const raw = await fs.readFile(f, "utf8");
    const { data } = matter(raw);

    const fileUrl =
      data.downloadUrl ??
      data.fileUrl ??
      data.pdfPath ??
      data.file ??
      data.downloadFile ??
      null;

    if (!fileUrl) continue;

    const u = ensureLeadingSlash(cleanStr(fileUrl));
    const canonical = u.startsWith("/downloads/")
      ? u.replace(/^\/downloads\//, "/assets/downloads/")
      : u;

    if (!canonical.startsWith("/assets/")) continue;

    const fsPath = publicUrlToFsPath(canonical);
    if (!fsPath || !(await exists(fsPath))) {
      missing.push({
        file: f.replace(rootDir + "/", ""),
        referenced: canonical,
      });
    }
  }

  if (missing.length) {
    console.log("❌ Missing download assets:\n");
    for (const m of missing) {
      console.log(`- ${m.file}`);
      console.log(`  -> ${m.referenced}`);
    }
    process.exit(1);
  }

  console.log("✅ Download assets validated.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});