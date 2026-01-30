// scripts/generate-sitemap.js - HARDENED NATIVE VERSION
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 1. SETUP PATHS
const projectRoot = process.cwd();
const sitemapPath = path.join(projectRoot, 'public', 'sitemap.xml');

console.log('🚀 Initializing Sitemap Generation Sequence...');

try {
  // 2. VERIFY CORE CONFIG 🛡️
  const configPath = path.join(projectRoot, 'next-sitemap.config.js');
  if (!fs.existsSync(configPath)) {
    throw new Error('Institutional Config Missing: next-sitemap.config.js not found.');
  }

  // 3. EXECUTE GENERATION ⚡
  // We use 'npx next-sitemap' directly. 
  // Note: next-sitemap automatically looks for .env and .env.local 
  // We force the SITE_URL here as an extra layer of safety.
  console.log('📄 Generating sitemap XML files...');
  
  execSync('npx next-sitemap', { 
    stdio: 'inherit',
    env: { 
      ...process.env, 
      NODE_ENV: 'production',
      // Hard injection to ensure abrahamoflondon.org is the source of truth
      NEXT_PUBLIC_SITE_URL: 'https://www.abrahamoflondon.org'
    } 
  });
  
  // 4. VERIFICATION & REPORTING 📝
  if (fs.existsSync(sitemapPath)) {
    const stats = fs.statSync(sitemapPath);
    const sizeInKb = (stats.size / 1024).toFixed(2);
    console.log(`✅ SUCCESS: Sitemap generated at ${sitemapPath} (${sizeInKb} KB)`);
  } else {
    throw new Error('Verification Failed: sitemap.xml was not found in the public directory.');
  }

} catch (error) {
  console.error('❌ CRITICAL FAILURE: Sitemap generation aborted.');
  console.error(`Reason: ${error.message}`);
  process.exit(1);
}