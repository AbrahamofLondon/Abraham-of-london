// test-books-data.ts - BEST FIX
import { getBookBySlug } from './lib/books';

console.log('Testing book data functions...\n');

const testSlugs = [
  'fathering-without-fear',
  'the-architecture-of-human-purpose',
  'the-builders-catechism',
  'the-fiction-adaptation'
];

for (const slug of testSlugs) {
  console.log(`Testing: ${slug}`);
  try {
    const book = getBookBySlug(slug);
    if (book) {
      console.log(`  ✓ Found: "${book.title}"`);
      console.log(`    Date: ${book.date}`);
      console.log(`    Draft: ${book.draft}`);
      
      // FIXED: Check for 'body' property instead of 'content' (Contentlayer standard)
      console.log(`    Has body: ${!!(book as any).body}`);
      
      // Additional useful checks
      if ((book as any).body) {
        const body = (book as any).body;
        const bodyLength = typeof body === 'string' 
          ? body.length 
          : body?.raw ? body.raw.length : 0;
        console.log(`    Body length: ${bodyLength} chars`);
      }
      
      // Check other common Contentlayer properties
      if ((book as any)._raw) {
        console.log(`    Source: ${(book as any)._raw?.sourceFileName || 'unknown'}`);
      }
    } else {
      console.log(`  ✗ NOT FOUND in data layer`);
    }
  } catch (err: any) {
    console.log(`  ✗ ERROR: ${err.message}`);
    console.log(`    Stack: ${err.stack?.split('\n')[1]}`);
  }
  console.log('');
}