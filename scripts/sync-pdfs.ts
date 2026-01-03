// scripts/sync-pdfs.ts
import fs from 'fs';
import path from 'path';

/**
 * Syncs PDFs between lib/pdfs and public/assets/downloads
 * - Copies missing PDFs from lib to public
 * - Removes duplicates
 * - Creates a manifest of all available PDFs
 */

async function syncPDFs() {
  console.log('🔄 Syncing PDFs between directories...');
  
  const libDir = path.join(process.cwd(), 'lib', 'pdfs');
  const publicDir = path.join(process.cwd(), 'public', 'assets', 'downloads');
  
  // Ensure directories exist
  [libDir, publicDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`   Created directory: ${dir}`);
    }
  });
  
  // Get files from both directories
  const libFiles = fs.existsSync(libDir) ? fs.readdirSync(libDir).filter(f => f.endsWith('.pdf')) : [];
  const publicFiles = fs.existsSync(publicDir) ? fs.readdirSync(publicDir).filter(f => f.endsWith('.pdf')) : [];
  
  console.log(`   lib/pdfs: ${libFiles.length} PDF(s)`);
  console.log(`   public/assets/downloads: ${publicFiles.length} PDF(s)`);
  
  // Sync from lib to public (copy missing files)
  let copiedCount = 0;
  for (const file of libFiles) {
    const libPath = path.join(libDir, file);
    const publicPath = path.join(publicDir, file);
    
    if (!fs.existsSync(publicPath)) {
      fs.copyFileSync(libPath, publicPath);
      console.log(`   📄 Copied: ${file} → public/`);
      copiedCount++;
    }
  }
  
  // Create manifest
  const allPDFs = [...new Set([...libFiles, ...publicFiles])].sort();
  const manifest = {
    generated: new Date().toISOString(),
    total: allPDFs.length,
    libCount: libFiles.length,
    publicCount: publicFiles.length,
    files: allPDFs.map(filename => {
      const libPath = path.join(libDir, filename);
      const publicPath = path.join(publicDir, filename);
      const libExists = fs.existsSync(libPath);
      const publicExists = fs.existsSync(publicPath);
      
      let size = 0;
      let location = '';
      
      if (libExists) {
        const stats = fs.statSync(libPath);
        size = stats.size;
        location = 'lib';
      } else if (publicExists) {
        const stats = fs.statSync(publicPath);
        size = stats.size;
        location = 'public';
      }
      
      return {
        filename,
        size,
        sizeMB: (size / 1024 / 1024).toFixed(2),
        location,
        libExists,
        publicExists,
      };
    }),
  };
  
  // Save manifest
  const manifestPath = path.join(publicDir, 'pdf-manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  
  console.log(`\n✅ Sync completed:`);
  console.log(`   Copied ${copiedCount} new PDF(s) to public directory`);
  console.log(`   Total unique PDFs: ${allPDFs.length}`);
  console.log(`   Manifest saved to: ${manifestPath}`);
  
  return manifest;
}

// Run if called directly
if (import.meta.url.includes('sync-pdfs.ts')) {
  syncPDFs().catch(console.error);
}

export { syncPDFs };