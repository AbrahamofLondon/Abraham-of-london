// scripts/pdf/audit-pdf-assets.ts
import fs from "fs";
import path from "path";
import { getPDFRegistrySource } from "./pdf-registry.source";

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

function toPosix(p: string) {
  return p.replace(/\\/g, "/");
}

// Define ignore patterns for internal operational files
const IGNORE_PATTERNS = [
  /^\/assets\/downloads\/_core-.*\.pdf$/i,
  // Add more patterns here as needed
];

function shouldIgnore(p: string): boolean {
  return IGNORE_PATTERNS.some((rx) => rx.test(p));
}

function main() {
  const root = process.cwd();
  const publicDownloads = path.join(root, "public", "assets", "downloads");

  const diskFiles = walk(publicDownloads)
    .filter((f) => f.toLowerCase().endsWith(".pdf"))
    .map((abs) => toPosix(abs.slice(path.join(root, "public").length)).replace(/^\/+/, "/"))
    .sort();

  const source = getPDFRegistrySource();

  const registryPaths = source
    .map((x) => (x.outputPath?.trim() ? x.outputPath.trim() : ""))
    .filter(Boolean)
    .map((p) => (p.startsWith("/") ? p : `/${p}`))
    .map(toPosix)
    .sort();

  const diskSet = new Set(diskFiles);
  const regSet = new Set(registryPaths);

  const missingOnDisk = registryPaths.filter((p) => !diskSet.has(p));
  
  // Apply ignore rule for unregistered files
  const unregisteredOnDisk = diskFiles.filter((p) => {
    if (shouldIgnore(p)) return false; // Skip ignored files
    return !regSet.has(p);
  });

  console.log("\n=== PDF ASSET AUDIT ===\n");

  console.log(`On disk:      ${diskFiles.length} PDFs`);
  console.log(`In registry:  ${registryPaths.length} entries`);
  console.log(`Ignored:      ${diskFiles.filter(shouldIgnore).length} internal PDFs`);

  console.log("\n--- Registry paths missing on disk (broken links) ---");
  if (!missingOnDisk.length) console.log("✅ OK: none");
  else missingOnDisk.forEach((p) => console.log(`❌ MISSING: ${p}`));

  console.log("\n--- PDFs on disk NOT referenced in registry (stale/unlisted) ---");
  if (!unregisteredOnDisk.length) console.log("✅ OK: none");
  else unregisteredOnDisk.forEach((p) => console.log(`⚠️  UNLISTED: ${p}`));

  // Show ignored files for transparency
  const ignoredFiles = diskFiles.filter(shouldIgnore);
  if (ignoredFiles.length > 0) {
    console.log("\n--- Internal PDFs (ignored in audit) ---");
    ignoredFiles.forEach((p) => console.log(`⚙️  INTERNAL: ${p}`));
  }

  console.log("\n--- Quick diagnosis ---");
  if (registryPaths.length < diskFiles.length - ignoredFiles.length) {
    console.log(
      "⚠️  Your registry source is missing entries for existing PDFs. Add those PDFs into scripts/pdf/pdf-registry.source.ts."
    );
  } else if (registryPaths.length > diskFiles.length - ignoredFiles.length) {
    console.log(
      "⚠️  Your registry references PDFs that aren't present on disk. Either generate them or remove/fix outputPath."
    );
  } else {
    console.log("✅ Registry and disk counts match (excluding internal files).");
  }

  if (missingOnDisk.length === 0 && unregisteredOnDisk.length === 0) {
    console.log("\n🎉 Audit passed! All expected PDFs are accounted for.");
  } else {
    console.log("\n⚠️  Audit issues found. Review the lists above.");
  }

  console.log("\nDone.\n");
}

main();