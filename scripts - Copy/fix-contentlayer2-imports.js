/* scripts/fix-contentlayer2-imports.js */
const fs = require('fs');
const path = require('path');

// Common files that need updating
const filesToCheck = [
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

function updateFileImports(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return false;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  const originalContent = content;
  
  // Replace old import paths
  const oldImportPaths = [
    '@/lib/server/content',
    '@/lib/contentlayer-compat',
    '@/lib/contentlayer-helper.server',
    '@/lib/contentlayer-helper'
  ];
  
  oldImportPaths.forEach(oldPath => {
    const regex = new RegExp(`from ['"]${oldPath}['"]`, 'g');
    content = content.replace(regex, "from '@/lib/contentlayer'");
  });
  
  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Updated: ${filePath}`);
    return true;
  }
  
  console.log(`✓ Already correct: ${filePath}`);
  return false;
}

console.log('🔍 Fixing Contentlayer2 imports...\n');

let updatedCount = 0;
filesToCheck.forEach(filePath => {
  if (updateFileImports(filePath)) {
    updatedCount++;
  }
});

console.log(`\n📊 Updated ${updatedCount} files`);
console.log('\n✅ Done! Now run: pnpm build');