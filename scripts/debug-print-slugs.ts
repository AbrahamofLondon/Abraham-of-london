// Add this temporary debug script to diagnose the print slug issue
// scripts/debug-print-slugs.ts
import { getAllPrintSlugs, getPrintSlugs, debugSlugSources } from '@/lib/server/print-utils';

console.log('🔍 DEBUG: Print Slug Analysis');
console.log('================================');

// Test getAllPrintSlugs
console.log('\n1. getAllPrintSlugs():');
const allSlugs = getAllPrintSlugs();
console.log('Result:', allSlugs);
console.log('Type:', typeof allSlugs);
console.log('Is Array:', Array.isArray(allSlugs));
console.log('Length:', allSlugs.length);

// Test getPrintSlugs
console.log('\n2. getPrintSlugs():');
const printSlugs = getPrintSlugs();
console.log('Result:', printSlugs);
console.log('Type:', typeof printSlugs);
console.log('Is Array:', Array.isArray(printSlugs));
console.log('Length:', printSlugs.length);

// Debug sources
console.log('\n3. Slug Sources:');
debugSlugSources();

console.log('\n================================');
console.log('✅ Debug complete');