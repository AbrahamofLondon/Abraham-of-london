/* scripts/vault-reconcile.ts */
import fs from "fs";
import path from "path";
import { getAllPDFs } from "../lib/pdf/registry";

async function reconcileVault() {
  console.log("🏛️  ABRAHAM OF LONDON | RECONCILIATION AUDIT | 20 March 2026");
  
  const registry = getAllPDFs();
  const sourceFolders = ["briefs", "vault", "blog", "lexicon", "strategy", "resources", "downloads"];
  const allMdxFiles: string[] = [];

  // 1. Map every physical MDX file in the system
  sourceFolders.forEach(folder => {
    const fullPath = path.join(process.cwd(), "content", folder);
    if (fs.existsSync(fullPath)) {
      const files = fs.readdirSync(fullPath).filter(f => f.endsWith(".mdx"));
      allMdxFiles.push(...files.map(f => f.replace(".mdx", "")));
    }
  });

  const missing = [];
  const found = [];

  // 2. Cross-reference Registry against Physical Files
  for (const entry of registry) {
    if (allMdxFiles.includes(entry.id)) {
      found.push(entry.id);
    } else {
      // Find a likely candidate (Fuzzy Match)
      const candidate = allMdxFiles.find(f => entry.id.includes(f) || f.includes(entry.id));
      missing.push({ id: entry.id, candidate: candidate || "NONE" });
    }
  }

  console.log(`\n✅ Verified Links: ${found.length}`);
  console.log(`⚠️  Placeholder Links: ${missing.length}\n`);

  if (missing.length > 0) {
    console.table(missing);
    console.log("\n💡 ACTION: Update the 'SLUG_FIXES' mapping in lib/pdf-generator.ts with the IDs above.");
  }
}

reconcileVault();