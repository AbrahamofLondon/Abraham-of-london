// scripts/pdf/audit-pdf-assets.ts
import fs from "fs";
import path from "path";
// Import the actual function instead of aliasing the array
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
];

function shouldIgnore(p: string): boolean {
  return IGNORE_PATTERNS.some((rx) => rx.test(p));
}

function main() {
  const root = process.cwd();
  // Scanning both core download locations
  const publicDownloads = path.join(root, "public", "assets", "downloads");
  const vaultDownloads = path.join(root, "public", "vault", "downloads");

  const diskFiles = [
    ...walk(publicDownloads),
    ...walk(vaultDownloads)
  ]
    .filter((f) => f.toLowerCase().endsWith(".pdf"))
    .map((abs) => {
      const relative = toPosix(abs.slice(path.join(root, "public").length));
      return relative.startsWith("/") ? relative : `/${relative}`;
    })
    .sort();

  // CALLING the function properly now
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
  
  const unregisteredOnDisk = diskFiles.filter((p) => {
    if (shouldIgnore(p)) return false; 
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

  const ignoredFiles = diskFiles.filter(shouldIgnore);
  if (ignoredFiles.length > 0) {
    console.log("\n--- Internal PDFs (ignored in audit) ---");
    ignoredFiles.forEach((p) => console.log(`⚙️  INTERNAL: ${p}`));
  }

  console.log("\n--- Quick diagnosis ---");
  const activeDiskCount = diskFiles.length - ignoredFiles.length;
  
  if (registryPaths.length < activeDiskCount) {
    console.log(
      `⚠️  Registry is missing ${activeDiskCount - registryPaths.length} entries found on disk.`
    );
  } else if (registryPaths.length > activeDiskCount) {
    console.log(
      `⚠️  Registry references ${registryPaths.length - activeDiskCount} files missing from disk.`
    );
  } else {
    console.log("✅ Registry and disk counts match.");
  }

  if (missingOnDisk.length === 0 && unregisteredOnDisk.length === 0) {
    console.log("\n🎉 Audit passed! All expected PDFs are accounted for.");
  } else {
    console.log("\n⚠️  Audit issues found. Review the lists above.");
  }

  console.log("\nDone.\n");
}

main();