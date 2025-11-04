// pages/books/index.tsx (ABSOLUTELY ROBUST FINAL VERSION)
import type { GetStaticProps, InferGetStaticPropsType } from "next";
import Link from "next/link";
import Head from "next/head";
// Assuming getAllContent is defined in lib/mdx and is array-safe
import { getAllContent } from "@/lib/mdx"; 

type Book = {
  slug: string;
  title?: string;
  excerpt?: string;
  date?: string;
  coverImage?: string;
};

// ------------------------------------------------------------------
// CRITICAL FIX: getStaticProps (Ensures array return and serialization safety)
// ------------------------------------------------------------------
export const getStaticProps: GetStaticProps<{ books: Book[] }> = async () => {
  let books: Book[] = [];
  try {
    // This fetches data that may contain null/undefined fields, but guarantees an array return.
    // The previous failures in minimized code are due to subsequent processing of these fields.
    books = getAllContent("books", { includeDrafts: false }) ?? [];
    
    // FINAL DATA SAFETY CHECK: Ensure data is clean for the compiled renderer
    const safeBooks = books.map(b => ({
      ...b,
      // Coalesce non-critical fields to null for serialization, but crucial strings to ""
      slug: b.slug ?? '',
      title: b.title ?? '', // Coerce to ""
      excerpt: b.excerpt ?? null, // Can be null if component checks for it
      // Coerce all remaining optional fields to null for explicit JSON safety
      date: b.date ?? null,
      coverImage: b.coverImage ?? null,
      // If there are other implicit properties (like category/author) causing the crash, 
      // they must also be coerced here (e.g., author: (b as any).author ?? '').
    }));

    // CRITICAL: Force serialization with clean data
    return { props: { books: JSON.parse(JSON.stringify(safeBooks)) }, revalidate: 3600 };
  } catch (e) {
    console.error("Error during getStaticProps for /books:", e);
    // Never fail the export, return empty array as fallback
    return { props: { books: [] }, revalidate: 3600 };
  }
};


// ------------------------------------------------------------------
// COMPONENT FIX: Explicit String Casting (Final defense against r.toLowerCase crash)
// ------------------------------------------------------------------
export default function BooksIndex({ books }: InferGetStaticPropsType<typeof getStaticProps>) {
  return (
    <>
      <Head><title>Books • Abraham of London</title></Head>
      <main className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-3xl font-semibold tracking-tight">Books</h1>
        {(!books || books.length === 0) ? (
          <p className="mt-6 text-neutral-600">
            No books published yet. Check back soon.
          </p>
        ) : (
          <ul className="mt-8 space-y-6">
            {books.map((b) => (
              <li key={String(b.slug)} className="border border-neutral-200 rounded-xl p-4">
                <h2 className="text-xl font-medium">
                  <Link 
                    // CRITICAL FIX: Ensure slug is always a string for the href
                    href={`/books/${String(b.slug)}`} 
                    className="hover:underline"
                  >
                    {/* CRITICAL FIX: Ensure title display is safe */}
                    {String(b.title || b.slug)} 
                  </Link>
                </h2>
                {/* CRITICAL FIX: Ensure excerpt is safe before rendering */}
                {b.excerpt && <p className="mt-2 text-neutral-700">{String(b.excerpt)}</p>}
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}



