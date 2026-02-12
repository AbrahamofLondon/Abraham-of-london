/* scripts/pdf-refresh.ts */
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

const SOURCE_DIR = path.join(process.cwd(), 'content/downloads');
const TARGET_DIR = path.join(process.cwd(), 'public/assets/downloads');

async function refresh() {
  console.log(chalk.blue.bold("🔄 STARTING INSTITUTIONAL ASSET REFRESH"));
  console.log("============================================================");

  if (!fs.existsSync(TARGET_DIR)) fs.mkdirSync(TARGET_DIR, { recursive: true });

  try {
    const files = fs.readdirSync(SOURCE_DIR);

    files.forEach(file => {
      const srcPath = path.join(SOURCE_DIR, file);
      
      // 1. CLEANUP: Remove backup files
      if (file.includes('.backup-')) {
        fs.unlinkSync(srcPath);
        console.log(chalk.gray(`  🗑️  Cleaned Backup: ${file}`));
        return;
      }

      // 2. PRODUCTION SYNC: Move actual assets to Public
      // We target non-MDX files that are intended for download
      if (file.endsWith('.pdf') || file.endsWith('.xlsx') || file.endsWith('.pptx') || file.endsWith('.zip')) {
        const destPath = path.join(TARGET_DIR, file);
        fs.copyFileSync(srcPath, destPath);
        console.log(chalk.green(`  ✅ Synced to Public: ${file}`));
      }
    });

    // 3. CANONICAL ALIASES (Institutional Requirements)
    const aliases = [
      { src: 'life-alignment-assessment.pdf', alias: 'core-alignment.pdf' },
      { src: 'legacy-canvas.pdf', alias: 'core-legacy.pdf' }
    ];

    aliases.forEach(a => {
      const src = path.join(TARGET_DIR, a.src);
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, path.join(TARGET_DIR, a.alias));
        console.log(chalk.cyan(`  🧷 Created Alias: ${a.alias}`));
      }
    });

    console.log(chalk.blue.bold("\n============================================================"));
    console.log(chalk.green("✨ REFRESH COMPLETE: Assets Physically Reconciled"));
  } catch (error) {
    console.error(chalk.red("❌ REFRESH FAILED:"), error);
    process.exit(1);
  }
}

refresh();