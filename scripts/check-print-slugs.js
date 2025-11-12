// scripts/check-print-slugs.mjs (use .mjs extension)
import { getPrintSlugs, getPrintSlugsWithType } from '../lib/server/print-utils.js';

console.log('🔍 Checking print slugs return types...\n');

const slugs = getPrintSlugs();
const slugsWithType = getPrintSlugsWithType();

console.log('getPrintSlugs():');
console.log('  Type:', Array.isArray(slugs) ? 'Array' : typeof slugs);
console.log('  Length:', slugs.length);
if (slugs.length > 0) {
  console.log('  First item type:', typeof slugs[0]);
  console.log('  First item:', slugs[0]);
} else {
  console.log('  No items found');
}
console.log('');

console.log('getPrintSlugsWithType():');
console.log('  Type:', Array.isArray(slugsWithType) ? 'Array' : typeof slugsWithType);
console.log('  Length:', slugsWithType.length);
if (slugsWithType.length > 0) {
  console.log('  First item type:', typeof slugsWithType[0]);
  console.log('  First item:', slugsWithType[0]);
} else {
  console.log('  No items found');
}
console.log('');

// Test if slugs are valid for Next.js
const isValidForNextJS = Array.isArray(slugs) && slugs.every(slug => typeof slug === 'string');
console.log('✅ Valid for Next.js getStaticPaths:', isValidForNextJS);

if (!isValidForNextJS && slugs.length > 0) {
  console.log('\n❌ PROBLEM: getPrintSlugs() is returning objects instead of strings');
  console.log('   Expected: string[]');
  console.log('   Actual:', slugs.map(item => typeof item).join(', '));
}