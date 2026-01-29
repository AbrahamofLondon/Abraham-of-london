// scripts/gzip-sitemaps-windows.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import zlib from 'zlib';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const gzip = promisify(zlib.gzip);

console.log('🗜️  Compressing sitemap files with gzip (Windows compatible)...');

const publicDir = path.join(process.cwd(), 'public');
const filesToCompress = [
  'sitemap.xml',
  'sitemap-0.xml',
  'robots.txt'
];

async function compressFiles() {
  try {
    for (const file of filesToCompress) {
      const filePath = path.join(publicDir, file);
      if (fs.existsSync(filePath)) {
        const originalContent = fs.readFileSync(filePath);
        const compressed = await gzip(originalContent);
        
        fs.writeFileSync(filePath + '.gz', compressed);
        console.log(`✅ Created ${file}.gz`);
        
        const originalSize = originalContent.length;
        const gzipSize = compressed.length;
        const compressionRatio = ((1 - gzipSize / originalSize) * 100).toFixed(1);
        
        console.log(`   Original: ${(originalSize / 1024).toFixed(2)} KB`);
        console.log(`   Gzipped: ${(gzipSize / 1024).toFixed(2)} KB (${compressionRatio}% smaller)`);
      }
    }
    
    console.log('\n🎉 Gzip compression complete!');
    console.log('\nCompressed files available at:');
    console.log('   ✅ public/sitemap.xml.gz');
    console.log('   ✅ public/sitemap-0.xml.gz');
    console.log('   ✅ public/robots.txt.gz');
    
  } catch (error) {
    console.error('❌ Error compressing files:', error.message);
    process.exit(1);
  }
}

compressFiles();