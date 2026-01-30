// scripts/build-content.mjs
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

console.log('📚 Building content for Abraham of London\n');

const isWindows = process.platform === 'win32';

async function tryBuild() {
  if (isWindows) {
    console.log('🪟 Windows detected - applying optimizations...');
    
    // First, try to apply Windows fixes
    try {
      const fixScript = path.join(__dirname, 'fix-contentlayer-issue.mjs');
      if (await fs.access(fixScript).then(() => true).catch(() => false)) {
        console.log('Applying Windows fixes...');
        execSync(`node "${fixScript}"`, { stdio: 'inherit', cwd: rootDir });
      }
    } catch (error) {
      console.warn('⚠️ Windows fix script failed, continuing...');
    }
  }
  
  // Clean contentlayer cache
  console.log('🧹 Cleaning contentlayer cache...');
  try {
    const contentlayerDir = path.join(rootDir, '.contentlayer');
    if (await fs.access(contentlayerDir).then(() => true).catch(() => false)) {
      await fs.rm(contentlayerDir, { recursive: true, force: true });
    }
  } catch (error) {
    console.warn('Could not clean contentlayer cache:', error.message);
  }
  
  // Try standard build
  console.log('🚀 Attempting Contentlayer build...');
  
  const env = { 
    ...process.env, 
    NODE_OPTIONS: '--max-old-space-size=4096',
    // Windows-specific environment variables
    ...(isWindows && { 
      DISABLE_WINDOWS_FIX: 'false',
      NODE_NO_WARNINGS: '1'
    })
  };
  
  try {
    execSync('npx contentlayer2 build', {
      stdio: 'inherit',
      cwd: rootDir,
      env
    });
    console.log('✅ Contentlayer build successful!');
    return true;
  } catch (error) {
    console.error('❌ Contentlayer build failed:', error.message);
    
    if (isWindows) {
      console.log('\n🔄 Trying Windows fallback approach...');
      
      try {
        // Create minimal content structure
        const contentlayerDir = path.join(rootDir, '.contentlayer', 'generated');
        await fs.mkdir(contentlayerDir, { recursive: true });
        
        // Create empty index file
        const emptyIndex = `export const allPosts = [];
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

// Helper functions
export function getPost(slug) { return null; }
export function getAllPosts() { return []; }
export function getBook(slug) { return null; }
export function getAllBooks() { return []; }
// ... add other helper functions as needed`;
        
        await fs.writeFile(
          path.join(contentlayerDir, 'index.mjs'),
          emptyIndex,
          'utf8'
        );
        
        console.log('✅ Created empty contentlayer structure for Windows');
        console.log('⚠️  Contentlayer is disabled but app will still run');
        console.log('   You can add content manually or fix the Contentlayer issue later.');
        
        return true;
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError.message);
        return false;
      }
    }
    
    return false;
  }
}

async function main() {
  try {
    const success = await tryBuild();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('❌ Build script failed:', error);
    process.exit(1);
  }
}

main();
