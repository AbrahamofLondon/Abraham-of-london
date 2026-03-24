/* scripts/vault-indexer.ts — FORENSIC AUDIT & VAULT UNIFICATION */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- CONFIGURATION ---
const TARGET_VAULT = path.join(__dirname, "..", "public", "vault", "briefs");
const MANIFEST_PATH = path.join(__dirname, "..", "public", "vault", "manifest.json");

// Search these locations for loose PDFs to bring into the vault
const LEGACY_SOURCES = [
  path.join(__dirname, "..", "public", "assets", "downloads"),
  path.join(__dirname, "..", "lib", "pdf"),
  path.join(__dirname, "..", "private_storage", "premium-content", "reports"),
];

interface AssetEntry {
  slug: string;
  fileName: string;
  fileSizeKB: number;
  checksum: string;
  source: string;
  status: "migrated" | "indexed" | "modified";
}

async function runUnifiedAudit() {
  console.log("🛡️ [VAULT_INDEXER]: Initiating Forensic Unification...");

  // 1. Ensure Target Directory Exists
  if (!fs.existsSync(TARGET_VAULT)) {
    fs.mkdirSync(TARGET_VAULT, { recursive: true });
    console.log(`📁 Created official vault at: ${TARGET_VAULT}`);
  }

  const currentAssets: AssetEntry[] = [];

  // 2. Migration & Indexing Loop
  for (const sourceDir of LEGACY_SOURCES) {
    if (!fs.existsSync(sourceDir)) continue;

    const files = fs.readdirSync(sourceDir).filter(f => f.endsWith(".pdf"));
    console.log(`📂 Scanning ${sourceDir} (${files.length} files found)`);

    for (const file of files) {
      const sourcePath = path.join(sourceDir, file);
      const targetPath = path.join(TARGET_VAULT, file);
      
      // Calculate Checksum
      const fileBuffer = fs.readFileSync(sourcePath);
      const checksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');
      const stats = fs.statSync(sourcePath);
      const slug = file.replace(".pdf", "");

      // If it's not in the vault yet, move it (unify)
      if (!fs.existsSync(targetPath)) {
        fs.copyFileSync(sourcePath, targetPath);
        console.log(`➡️  Migrated: ${file}`);
      }

      currentAssets.push({
        slug,
        fileName: file,
        fileSizeKB: Math.round(stats.size / 1024),
        checksum,
        source: sourceDir,
        status: fs.existsSync(targetPath) ? "indexed" : "migrated"
      });
    }
  }

  // 3. Generate Manifest
  const manifest = {
    auditHeader: {
      version: "2.0.0-PROD",
      totalAssets: currentAssets.length,
      timestamp: new Date().toISOString(),
      vaultPath: TARGET_VAULT
    },
    assets: currentAssets
  };

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));

  console.log(`
--- ✅ VAULT UNIFIED ---
📦 Assets Indexed: ${currentAssets.length}
📍 Manifest:      ${MANIFEST_PATH}
🏛️ Vault Root:    ${TARGET_VAULT}
-----------------------
  `);
}

runUnifiedAudit().catch(console.error);