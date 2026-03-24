/* scripts/sign-vault.ts — ARCHIVAL INTEGRITY SUITE */
import fs from "fs";
import path from "path";
import crypto from "crypto";

/**
 * GENERATES A CRYPTOGRAPHIC MANIFEST
 * Scans the public/downloads/briefs directory and signs every asset.
 */
async function signVault() {
  const vaultPath = path.join(process.cwd(), "public", "downloads", "briefs");
  const manifestPath = path.join(vaultPath, "manifest.json");

  if (!fs.existsSync(vaultPath)) {
    console.error("Vault path not found. Run generatePDF batch first.");
    return;
  }

  const files = fs.readdirSync(vaultPath).filter(f => f.endsWith(".pdf"));
  const registry: Record<string, { 
    sha256: string; 
    size: number; 
    signedAt: string;
    forensicId?: string;
  }> = {};

  console.log(`[SIGNING]: Processing ${files.length} institutional assets...`);

  for (const file of files) {
    const filePath = path.join(vaultPath, file);
    const fileBuffer = fs.readFileSync(filePath);
    
    // Calculate SHA-256
    const hash = crypto.createHash("sha256").update(fileBuffer).digest("hex");
    
    // Extract Forensic ID from sidecar fingerprint file if it exists
    const fingerprintPath = `${filePath}.fingerprint`;
    let forensicId = "unknown";
    if (fs.existsSync(fingerprintPath)) {
      forensicId = fs.readFileSync(fingerprintPath, "utf8").trim();
    }

    registry[file] = {
      sha256: hash,
      size: fileBuffer.length,
      signedAt: new Date().toISOString(),
      forensicId
    };
  }

  const manifest = {
    version: "1.0.0",
    issuer: "Abraham of London Vault Master",
    total_assets: files.length,
    generated_at: new Date().toISOString(),
    assets: registry
  };

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`[SUCCESS]: Manifest generated at ${manifestPath}`);
}

signVault().catch(console.error);