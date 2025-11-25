// lib/debug-books.ts
import { getAllBooks, getBookBySlug } from "@/lib/books"; // Use the correct export path

export async function debugBooks() {
  try {
    console.log("📚 Debugging books data...");
    
    const allBooks = await getAllBooks();
    console.log(`Total books found: ${allBooks.length}`);
    
    if (allBooks.length === 0) {
      console.log("❌ No books found at all!");
      return [];
    }
    
    // Log all books to see what we have
    allBooks.forEach((book, index) => {
      console.log(`\n📖 Book ${index + 1}:`);
      console.log(`   - Slug: ${book.slug}`);
      console.log(`   - Title: ${book.title}`);
      console.log(`   - Author: ${book.author}`);
      console.log(`   - Has excerpt: ${!!book.excerpt}`);
      console.log(`   - Has description: ${!!book.description}`);
    });
    
    const problematicSlugs = [
      "fathering-without-fear",
      "the-architecture-of-human-purpose", 
      "the-fiction-adaptation"
    ];
    
    for (const slug of problematicSlugs) {
      console.log(`\n🔍 Checking book: ${slug}`);
      const book = await getBookBySlug(slug);
      if (!book) {
        console.log(`❌ Book not found: ${slug}`);
        continue;
      }
      console.log(`✅ Book found: ${book.title}`);
      console.log(`   - Has content: ${!!book.content}`);
      console.log(`   - Content length: ${book.content?.length || 0}`);
      console.log(`   - Has title: ${!!book.title}`);
      console.log(`   - Has date: ${!!book.date}`);
    }
    
    return allBooks;
  } catch (error) {
    console.error("💥 Error debugging books:", error);
    return [];
  }
}