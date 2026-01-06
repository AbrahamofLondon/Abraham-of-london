/* scripts/check-contentlayer-exports.mjs */
import * as contentlayer from './lib/contentlayer/index.js';

console.log('🔍 Checking contentlayer exports...\n');

const requiredExports = [
  'getServerAllPosts',
  'getServerPostBySlug',
  'getServerAllBooks',
  'getServerBookBySlug',
  'getServerAllDownloads',
  'getServerDownloadBySlug',
  'getServerAllEvents',
  'getServerEventBySlug',
  'getServerAllShorts',
  'getServerShortBySlug',
  'getServerAllCanons',
  'getServerCanonBySlug',
  'getServerAllResources',
  'getServerResourceBySlug',
  'sanitizeData',
  'getDownloadSizeLabel',
  'assertPublicAssetsForDownloadsAndResources',
  'recordContentView',
  'getDownloadBySlug',
  'resolveDocDownloadUrl',
];

let missingExports = [];

requiredExports.forEach(exportName => {
  if (contentlayer[exportName]) {
    console.log(`✅ ${exportName}`);
  } else {
    console.log(`❌ ${exportName} - MISSING`);
    missingExports.push(exportName);
  }
});

console.log('\n' + '='.repeat(50));

if (missingExports.length === 0) {
  console.log('✅ All required exports are available!');
} else {
  console.log(`❌ Missing ${missingExports.length} exports:`, missingExports);
  console.log('\n⚠️  You need to add these missing exports to lib/contentlayer/index.ts');
}