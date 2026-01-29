// scripts/generate-sitemap.js
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

console.log('📄 Generating sitemap...');

try {
  // Run next-sitemap
  execSync('npx next-sitemap', { stdio: 'inherit' });
  
  // Verify sitemap was created
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const sitemapPath = path.join(process.cwd(), 'public', 'sitemap.xml');
  
  if (fs.existsSync(sitemapPath)) {
    console.log('✅ Sitemap generated successfully at', sitemapPath);
  } else {
    console.log('⚠️  Sitemap not found, but command succeeded');
  }
} catch (error) {
  console.error('❌ Failed to generate sitemap:', error.message);
  process.exit(1);
}