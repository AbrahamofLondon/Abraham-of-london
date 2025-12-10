import { getBookBySlug } from './lib/books';

const failingSlugs = [
  'fathering-without-fear',
  'the-architecture-of-human-purpose', 
  'the-builders-catechism',
  'the-fiction-adaptation'
];

console.log('Checking specific book data...\n');

for (const slug of failingSlugs) {
  console.log(\=== Book: \ ===\);
  const book = getBookBySlug(slug);
  
  if (!book) {
    console.log('❌ Book not found at all');
    continue;
  }
  
  console.log(\Title: \\);
  console.log(\Slug: \\);
  console.log(\Date: \\);
  console.log(\Author: \\);
  console.log(\Draft: \\);
  console.log(\Featured: \\);
  
  // Check for problematic fields
  const problems = [];
  if (!book.title) problems.push('Missing title');
  if (!book.slug) problems.push('Missing slug');
  if (!book.date) problems.push('Missing date');
  if (book.draft === true) problems.push('Is draft');
  if (book.content && typeof book.content !== 'string') {
    problems.push(\Content is not string (type: \)\);
  }
  
  if (problems.length > 0) {
    console.log(\⚠ Problems: \\);
  } else {
    console.log('✓ All basic fields present');
  }
  
  console.log('');
}
