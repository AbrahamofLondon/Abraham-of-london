// pages/books.tsx (Fully Robust Version)
import { GetStaticProps, InferGetStaticPropsType } from "next";
import Head from "next/head";
import Layout from "@/components/Layout";
import BookCard from "@/components/BookCard";
// Imports the unified data fetcher
import { getAllContent } from "@/lib/mdx"; 
import type { PostMeta } from "@/types/post";

// Define a safe data structure type for the component props
type SafeBookData = PostMeta & {
    // These properties MUST be guaranteed strings ("") to prevent the .toLowerCase crash
    slug: string;
    title: string;
    author: string;
    excerpt: string;
    category: string;
    // Other properties are safe as strings or arrays, or null for serialization
    date: string | null;
    summary: string | null;
    tags: string[] | null;
};
type BooksProps = InferGetStaticPropsType<typeof getStaticProps>;

// ------------------------------------------------------------------
// ✅ CRITICAL FIX: getStaticProps (Guarantees data integrity and serialization safety)
// ------------------------------------------------------------------
export const getStaticProps: GetStaticProps = async () => {
  const allBooks = getAllContent('books');
  
  const books: SafeBookData[] = allBooks.map((book) => {
    // CRITICAL: Coalesce properties that MUST be strings to ""
    const safeBook = {
        // Ensure all properties are copied
        ...book,
        
        // --- String Coercion for Crash Prevention ---
        slug: book.slug ?? '',
        title: book.title ?? 'Untitled Book',
        author: book.author ?? '',      // FIX: Ensures string for rendering/comparison
        excerpt: book.excerpt ?? '',    // FIX: Ensures string for rendering/comparison
        category: book.category ?? '',  // FIX: Ensures string for rendering/comparison (used as 'genre')
        
        // --- Serialization Safety (Null Coalescing) ---
        date: book.date ?? null,
        coverImage: book.coverImage ?? null,
        readTime: book.readTime ?? null,
        location: book.location ?? null,
        subtitle: book.subtitle ?? null,
        coverAspect: (book as any).coverAspect ?? null,
        coverFit: (book as any).coverFit ?? null,
        coverPosition: (book as any).coverPosition ?? null,
        summary: (book as any).summary ?? null, 
        tags: book.tags ?? null,
    } as SafeBookData; // Cast to the safe type

    return safeBook;
  });

  // Final JSON-safe operation. Use JSON.stringify/parse once to ensure all data is serializable.
  return {
    props: { books: JSON.parse(JSON.stringify(books)) },
    revalidate: 3600,
  };
};

// ------------------------------------------------------------------
// Component now uses the guaranteed clean data
// ------------------------------------------------------------------
export default function Books({ books }: BooksProps) {
  return (
    <Layout pageTitle="Books">
      <Head>
        <title>Books | Abraham of London</title>
        <meta name="description" content="Books, memoirs, and field guides by Abraham of London." />
      </Head>
      <main className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-serif font-bold text-center mb-10">
          Books
        </h1>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {books.map((book) => (
            <BookCard
              key={book.slug}
              // These props are guaranteed to be strings by getStaticProps
              slug={book.slug}
              title={book.title}
              author={book.author}
              excerpt={book.excerpt}
              coverImage={book.coverImage}
              genre={book.category} 
            />
          ))}
        </div>
      </main>
    </Layout>
  );
}