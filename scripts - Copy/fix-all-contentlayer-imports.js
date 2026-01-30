/* scripts/fix-all-contentlayer-imports.mjs */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filesToUpdate = [
  'pages/blog/[slug].tsx',
  'pages/books/[slug].tsx',
  'pages/canon/[slug].tsx',
  'pages/downloads/[slug].tsx',
  'pages/downloads/index.tsx',
  'pages/events/[slug].tsx',
  'pages/index.tsx',
  'pages/resources/[...slug].tsx',
  'pages/shorts/[slug].tsx',
  'pages/api/blog/[slug].tsx',
  'pages/api/canon/[slug].tsx',
  'pages/api/content/initialize.ts',
  'pages/api/dl/[token].ts',
  'pages/api/downloads/[slug].ts',
];

const importReplacements = {
  // Replace import paths
  "from '@/lib/server/content'": "from '@/lib/contentlayer'",
  "from '@/lib/contentlayer-compat'": "from '@/lib/contentlayer'",
  "from '@/lib/contentlayer-helper.server'": "from '@/lib/contentlayer'",
  "from '@/lib/contentlayer-helper'": "from '@/lib/contentlayer'",
  
  // These should stay the same - just ensure they come from the right place
  "getServerAllPosts": "getServerAllPosts",
  "getServerPostBySlug": "getServerPostBySlug",
  "getServerAllBooks": "getServerAllBooks",
  "getServerBookBySlug": "getServerBookBySlug",
  "getServerAllCanons": "getServerAllCanons",
  "getServerCanonBySlug": "getServerCanonBySlug",
  "getServerAllDownloads": "getServerAllDownloads",
  "getServerDownloadBySlug": "getServerDownloadBySlug",
  "getServerAllEvents": "getServerAllEvents",
  "getServerEventBySlug": "getServerEventBySlug",
  "getServerAllShorts": "getServerAllShorts",
  "getServerShortBySlug": "getServerShortBySlug",
  "getServerAllResources": "getServerAllResources",
  "getServerResourceBySlug": "getServerResourceBySlug",
  "sanitizeData": "sanitizeData",
  "assertPublicAssetsForDownloadsAndResources": "assertPublicAssetsForDownloadsAndResources",
  "getDownloadSizeLabel": "getDownloadSizeLabel",
  "recordContentView": "recordContentView",
  "getDownloadBySlug": "getDownloadBySlug",
  "resolveDocDownloadUrl": "resolveDocDownloadUrl",
};

async function updateFile(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return false;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  let originalContent = content;
  
  // Check if it needs updating
  const needsUpdate = Object.keys(importReplacements).some(pattern => {
    if (pattern.includes('from')) {
      // This is an import path pattern
      return content.includes(pattern);
    }
    return false;
  });
  
  if (!needsUpdate) {
    console.log(`✓ Already correct: ${filePath}`);
    return false;
  }
  
  // Apply replacements for import paths
  Object.entries(importReplacements).forEach(([search, replace]) => {
    if (search.includes('from')) {
      content = content.replace(new RegExp(search, 'g'), replace);
    }
  });
  
  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Updated: ${filePath}`);
    return true;
  }
  
  return false;
}

async function main() {
  console.log('🔍 Checking contentlayer imports...\n');
  
  let updatedCount = 0;
  
  for (const filePath of filesToUpdate) {
    const updated = await updateFile(filePath);
    if (updated) updatedCount++;
  }
  
  console.log(`\n📊 Results: Updated ${updatedCount} of ${filesToUpdate.length} files`);
  
  if (updatedCount > 0) {
    console.log('\n✅ Import updates completed!');
    console.log('\n⚠️  Next steps:');
    console.log('   1. Run type check: pnpm type-check');
    console.log('   2. Test build: pnpm build');
  } else {
    console.log('\n✅ All imports are already correct!');
  }
}

main().catch(console.error);