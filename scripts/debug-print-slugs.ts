// Temporary debug script for print slug analysis
import { getAllPrintSlugs } from '@/lib/server/print-utils';

console.log('🔍 DEBUG: Print Slug Analysis');
console.log('================================');

// Test getAllPrintSlugs
console.log('\n1. getAllPrintSlugs():');
const allSlugs = getAllPrintSlugs();
console.log('Result:', allSlugs);
console.log('Type:', typeof allSlugs);
console.log('Is Array:', Array.isArray(allSlugs));
console.log('Length:', allSlugs.length);

console.log('\n================================');
console.log('✅ Debug complete');
