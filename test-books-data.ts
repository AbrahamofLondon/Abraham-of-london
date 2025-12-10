// test-books-data.ts
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
      console.log(`    Has content: ${!!book.content}`);
    } else {
      console.log(`  ✗ NOT FOUND in data layer`);
    }
  } catch (err: any) {
    console.log(`  ✗ ERROR: ${err.message}`);
    console.log(`    Stack: ${err.stack?.split('\n')[1]}`);
  }
  console.log('');
}
