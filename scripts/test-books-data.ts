// scripts/test-books-data.ts
/* eslint-disable no-console */

import { getBookBySlug } from "@/lib/books";

console.log("Testing book data functions...\n");

const testSlugs = [
  "fathering-without-fear",
  "the-architecture-of-human-purpose",
  "the-builders-catechism",
  "the-fiction-adaptation",
];

function bodyLength(book: any): number {
  const body = book?.body;
  if (!body) return 0;
  if (typeof body === "string") return body.length;
  if (typeof body?.raw === "string") return body.raw.length;
  if (typeof body?.code === "string") return body.code.length;
  return 0;
}

for (const slug of testSlugs) {
  console.log(`Testing: ${slug}`);
  try {
    const book = getBookBySlug(slug);

    if (!book) {
      console.log("  ✗ NOT FOUND in data layer\n");
      continue;
    }

    console.log(`  ✓ Found: "${book.title}"`);
    console.log(`    Date: ${book.date ?? "n/a"}`);
    console.log(`    Draft: ${String((book as any).draft ?? false)}`);

    // Contentlayer standard
    console.log(`    Has body: ${Boolean((book as any).body)}`);
    console.log(`    Body length: ${bodyLength(book)} chars`);

    // Contentlayer raw metadata (optional)
    const source = (book as any)?._raw?.sourceFileName;
    if (source) console.log(`    Source: ${source}`);

    console.log("");
  } catch (err) {
    const e = err as Error;
    console.log(`  ✗ ERROR: ${e.message}`);
    const firstStackLine = e.stack?.split("\n")[1];
    if (firstStackLine) console.log(`    Stack: ${firstStackLine.trim()}`);
    console.log("");
  }
}
