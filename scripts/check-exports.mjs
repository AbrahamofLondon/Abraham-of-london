// scripts/check-exports.mjs
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const filesToCheck = [
  'lib/gtag.ts',
  'lib/server/content-data.ts', 
  'lib/server/print-utils.ts'
];

console.log('🔍 Checking missing exports...\n');

for (const file of filesToCheck) {
  const filePath = join(process.cwd(), file);
  
  if (!existsSync(filePath)) {
    console.log(`❌ ${file} - FILE NOT FOUND`);
    continue;
  }
  
  const content = readFileSync(filePath, 'utf8');
  
  if (file === 'lib/gtag.ts') {
    const hasPageview = content.includes('export function pageview') || content.includes('export const pageview');
    const hasGaEvent = content.includes('export function gaEvent') || content.includes('export const gaEvent');
    
    console.log(`${file}:`);
    console.log(`  📊 pageview: ${hasPageview ? '✅' : '❌ MISSING'}`);
    console.log(`  🎯 gaEvent: ${hasGaEvent ? '✅' : '❌ MISSING'}`);
  }
  
  if (file === 'lib/server/content-data.ts') {
    const hasGetContentSlugs = content.includes('export function getContentSlugs') || content.includes('export const getContentSlugs');
    console.log(`${file}:`);
    console.log(`  📝 getContentSlugs: ${hasGetContentSlugs ? '✅' : '❌ MISSING'}`);
  }
  
  if (file === 'lib/server/print-utils.ts') {
    const hasGetPrintSlugs = content.includes('export function getPrintSlugs') || content.includes('export const getPrintSlugs');
    const hasGetPrintBySlug = content.includes('export function getPrintBySlug') || content.includes('export const getPrintBySlug');
    
    console.log(`${file}:`);
    console.log(`  🖨️  getPrintSlugs: ${hasGetPrintSlugs ? '✅' : '❌ MISSING'}`);
    console.log(`  🖨️  getPrintBySlug: ${hasGetPrintBySlug ? '✅' : '❌ MISSING'}`);
  }
  
  console.log('');
}

console.log('💡 Run: npm run check:exports');