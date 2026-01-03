// scripts/debug-content-routes.mjs
// Use this import instead:
import { allDocuments } from '../.contentlayer/generated/index.ts';

// Filter the documents by their collection type
const allBooks = allDocuments.filter(doc => doc._raw.collection === 'Book');
const allCanons = allDocuments.filter(doc => doc._raw.collection === 'Canon');

function printSection(title, rows) {
  console.log(`\n=== ${title} ===`);
  if (!rows.length) {
    console.log("(none)");
    return;
  }
  console.table(rows);
}

const bookRows = allBooks.map((b) => ({
  slug: b.slug,
  title: b.title,
  type: b.type ?? "",
  draft: !!b.draft,
}));

const canonRows = allCanons.map((c) => ({
  slug: c.slug,
  title: c.title,
  volumeNumber: c.volumeNumber ?? "",
  accessLevel: c.accessLevel ?? "public",
  draft: !!c.draft,
}));

printSection("BOOKS", bookRows);
printSection("CANONS", canonRows);

// Also check for the duplicate slug causing the Next.js error
console.log('\n=== CHECKING FOR DUPLICATE SLUGS ===');
const allSlugs = [...bookRows.map(b => b.slug), ...canonRows.map(c => c.slug)];
const duplicateSlugs = allSlugs.filter((slug, index) => allSlugs.indexOf(slug) !== index);

if (duplicateSlugs.length) {
  console.log('❌ Duplicate slugs found:', duplicateSlugs);
  
  // Find which documents have the duplicate slug
  duplicateSlugs.forEach(slug => {
    const bookMatch = allBooks.find(b => b.slug === slug);
    const canonMatch = allCanons.find(c => c.slug === slug);
    console.log(`\nSlug "${slug}" appears in:`);
    if (bookMatch) console.log(`  - Book: ${bookMatch.title}`);
    if (canonMatch) console.log(`  - Canon: ${canonMatch.title}`);
  });
} else {
  console.log('✅ No duplicate slugs found in content.');
}
