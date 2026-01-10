// lib/debug-books.ts - TYPE-SAFE VERSION
import { getAllBooks, getBookBySlug } from "@/lib/books"; // Use the correct export path

// Define a more complete Book type that includes all possible properties
interface DebugBook {
  slug?: string;
  title?: string;
  author?: string;
  subtitle?: string;
  excerpt?: string;
  description?: string;
  coverImage?: string;
  isbn?: string;
  publisher?: string;
  date?: string;
  draft?: boolean;
  body?: any;
  _raw?: {
    sourceFileName?: string;
  };
}

export async function debugBooks() {
  try {
    console.log("📚 Debugging books data...");

    const allBooks = await getAllBooks() as DebugBook[];
    console.log(`Total books found: ${allBooks.length}`);

    if (allBooks.length === 0) {
      console.log("❌ No books found at all!");
      return [];
    }

    // Log all books to see what we have
    allBooks.forEach((book, index) => {
      console.log(`\n📖 Book ${index + 1}:`);
      console.log(`   - Slug: ${book.slug || '(no slug)'}`);
      console.log(`   - Title: ${book.title || '(no title)'}`);
      console.log(`   - Author: ${book.author || '(no author)'}`);
      console.log(`   - Subtitle: ${book.subtitle || '(no subtitle)'}`);
      console.log(`   - Excerpt: ${book.excerpt ? '✓' : '✗'}`);
      console.log(`   - Description: ${book.description ? '✓' : '✗'}`);
      console.log(`   - Cover Image: ${book.coverImage || '(no cover)'}`);
      console.log(`   - ISBN: ${book.isbn || '(no ISBN)'}`);
      console.log(`   - Publisher: ${book.publisher || '(no publisher)'}`);
      console.log(`   - Date: ${book.date || '(no date)'}`);
      console.log(`   - Draft: ${book.draft ? 'Yes' : 'No'}`);
    });

    const problematicSlugs = [
      "fathering-without-fear",
      "the-architecture-of-human-purpose",
      "the-fiction-adaptation",
    ];

    for (const slug of problematicSlugs) {
      console.log(`\n🔍 Checking book: ${slug}`);
      const book = await getBookBySlug(slug) as DebugBook | null;
      if (!book) {
        console.log(`❌ Book not found: ${slug}`);
        continue;
      }
      console.log(`✅ Book found: ${book.title}`);
      console.log(`   - Has body content: ${!!book.body}`);
      console.log(`   - Body type: ${typeof book.body}`);
      console.log(`   - Has title: ${!!book.title}`);
      console.log(`   - Has date: ${book.date || 'No date'}`);
      console.log(`   - Has excerpt: ${!!book.excerpt}`);
      console.log(`   - Has description: ${!!book.description}`);
      console.log(`   - Has cover image: ${!!book.coverImage}`);
      console.log(`   - ISBN: ${book.isbn || 'No ISBN'}`);
      console.log(`   - Publisher: ${book.publisher || 'No publisher'}`);
      console.log(`   - Raw source: ${book._raw?.sourceFileName || 'Unknown'}`);
    }

    return allBooks;
  } catch (error) {
    console.error("💥 Error debugging books:", error);
    return [];
  }
}

