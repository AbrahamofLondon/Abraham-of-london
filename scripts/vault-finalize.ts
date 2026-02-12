/* scripts/vault-finalize.ts */
import fs from 'fs';
import path from 'path';
import archiver from 'archiver'; // Ensure this is installed: pnpm add archiver
import chalk from 'chalk';

const PUBLIC_DOWNLOADS = path.join(process.cwd(), 'public/assets/downloads');
const INTEL_BRIEFS_DIR = path.join(process.cwd(), 'content/intelligence');

async function finalizeVault() {
  console.log(chalk.blue.bold("🛡️  FINISHING INSTITUTIONAL VAULT ALIGNMENT..."));

  // 1. Resolve Path Regression for Legacy Canvas
  const canvasSrc = path.join(PUBLIC_DOWNLOADS, 'download-legacy-architecture-canvas.fillable.pdf');
  const canvasDest = path.join(PUBLIC_DOWNLOADS, 'content-downloads/download-legacy-architecture-canvas.fillable.pdf');
  
  if (fs.existsSync(canvasSrc)) {
    fs.mkdirSync(path.dirname(canvasDest), { recursive: true });
    fs.copyFileSync(canvasSrc, canvasDest);
    console.log(chalk.green("✅ Resolved Path: Legacy Canvas moved to /content-downloads/"));
  }

  // 2. Generate the missing .zip Artifacts
  const zipPath = path.join(PUBLIC_DOWNLOADS, 'abraham-vault-artifacts.zip');
  console.log(chalk.cyan("📦 Bundling 75+ Intelligence Briefs into Vault Artifacts..."));

  const output = fs.createWriteStream(zipPath);
  const archive = archiver('zip', { zlib: { level: 9 } });

  output.on('close', () => {
    console.log(chalk.green(`✅ Generated: abraham-vault-artifacts.zip (${archive.pointer()} total bytes)`));
    console.log(chalk.blue.bold("\n--- 🏁 FINAL AUDIT READINESS ---"));
    console.log("Run: node scripts/refresh-downloads.js");
  });

  archive.on('error', (err) => { throw err; });
  archive.pipe(output);

  // Add all MDX files from intelligence briefs to the zip
  if (fs.existsSync(INTEL_BRIEFS_DIR)) {
    archive.directory(INTEL_BRIEFS_DIR, 'intelligence-briefs');
  }

  await archive.finalize();
}

finalizeVault().catch(console.error);