// scripts/fix-contentlayer-windows.mjs
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

console.log('🔧 Fixing Contentlayer Windows compatibility...\n');

const isWindows = process.platform === 'win32';

if (!isWindows) {
  console.log('✅ Not on Windows, no fixes needed.');
  process.exit(0);
}

async function fixPackageExports() {
  console.log('1️⃣  Checking problematic packages...');
  
  const problemPackages = [
    'mdast-util-mdx-jsx/node_modules/mdast-util-to-markdown/package.json',
    'mdast-util-to-markdown/package.json'
  ];
  
  let fixed = false;
  
  for (const pkgPath of problemPackages) {
    const fullPath = path.join(rootDir, 'node_modules', pkgPath);
    
    try {
      await fs.access(fullPath);
      const content = await fs.readFile(fullPath, 'utf8');
      const pkg = JSON.parse(content);
      
      if (pkg.exports && typeof pkg.exports === 'object') {
        // Add missing exports
        if (!pkg.exports['./lib/util/container-phrasing.js']) {
          pkg.exports['./lib/util/container-phrasing.js'] = './lib/util/container-phrasing.js';
          await fs.writeFile(fullPath, JSON.stringify(pkg, null, 2), 'utf8');
          console.log(`✅ Fixed exports in: ${pkgPath}`);
          fixed = true;
        }
      }
    } catch (error) {
      // Package doesn't exist or can't be accessed
      continue;
    }
  }
  
  return fixed;
}

async function createFallbackContentlayer() {
  console.log('\n2️⃣  Creating fallback Contentlayer structure...');
  
  const contentlayerDir = path.join(rootDir, '.contentlayer', 'generated');
  await fs.mkdir(contentlayerDir, { recursive: true });
  
  const fallbackContent = `// Fallback Contentlayer exports for Windows compatibility
export const allPosts = [];
export const allBooks = [];
export const allDownloads = [];
export const allCanons = [];
export const allShorts = [];
export const allEvents = [];
export const allResources = [];
export const allStrategies = [];
export const allArticles = [];
export const allGuides = [];
export const allTutorials = [];
export const allCaseStudies = [];
export const allWhitepapers = [];
export const allReports = [];
export const allNewsletters = [];
export const allSermons = [];
export const allDevotionals = [];
export const allPrayers = [];
export const allTestimonies = [];
export const allPodcasts = [];
export const allVideos = [];
export const allCourses = [];
export const allLessons = [];
export const allPrints = [];

// Helper functions with fallbacks
export function getPost(slug) { 
  console.warn('Contentlayer not available on Windows - using fallback');
  return null; 
}
export function getAllPosts() { return []; }
export function getBook(slug) { return null; }
export function getAllBooks() { return []; }
export function getDownload(slug) { return null; }
export function getAllDownloads() { return []; }
export function getCanon(slug) { return null; }
export function getAllCanons() { return []; }

// Utility to check if Contentlayer is available
export const isContentlayerAvailable = false;
export const contentlayerStatus = 'windows-fallback-mode';
`;
  
  await fs.writeFile(
    path.join(contentlayerDir, 'index.mjs'),
    fallbackContent,
    'utf8'
  );
  
  console.log('✅ Created fallback Contentlayer structure');
  return true;
}

async function main() {
  try {
    console.log('🪟 Windows Contentlayer Fix Process\n');
    
    const packageFixed = await fixPackageExports();
    const fallbackCreated = await createFallbackContentlayer();
    
    console.log('\n📋 Summary:');
    console.log(`   • Package exports fixed: ${packageFixed ? '✅' : '⚠️ (not needed)'}`);
    console.log(`   • Fallback created: ${fallbackCreated ? '✅' : '❌'}`);
    
    console.log('\n🚀 Recommendations:');
    console.log('   1. Try: npm run content:build');
    console.log('   2. If fails: npm run dev:windows (disables Contentlayer)');
    console.log('   3. For development: Your app works without Contentlayer');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Fix failed:', error.message);
    process.exit(1);
  }
}

main();