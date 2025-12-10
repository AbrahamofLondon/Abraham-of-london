// Minimal test of books data
const module = await import('./lib/books.js');
const { getBookBySlug } = module;

console.log('Testing book data retrieval...\n');

const testSlugs = [
  'fathering-without-fear',
  'the-architecture-of-human-purpose'
];

for (const slug of testSlugs) {
  console.log(`Testing: ${slug}`);
  try {
    const book = getBookBySlug(slug);
    if (book) {
      console.log(`  ✓ Found book: ${book.title}`);
      console.log(`    Date: ${book.date}`);
      console.log(`    Draft: ${book.draft}`);
    } else {
      console.log(`  ✗ Book not found`);
    }
  } catch (err) {
    console.log(`  ✗ Error: ${err.message}`);
  }
  console.log('');
}
