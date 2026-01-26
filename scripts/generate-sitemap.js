// scripts/generate-sitemap.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('📄 Generating sitemap...');

try {
  // Run next-sitemap
  execSync('npx next-sitemap', { stdio: 'inherit' });
  
  // Verify sitemap was created
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