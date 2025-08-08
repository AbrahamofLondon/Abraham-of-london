// pages/books.tsx
import { GetStaticProps } from 'next';
import Head from 'next/head';
import Layout from '../components/Layout';
import BookCard, { BookCardProps } from '../components/BookCard';
import { getAllBooks } from '../lib/books'; // Removed BookMeta

interface BooksProps {
  books: BookCardProps[];
}

export default function Books({ books }: BooksProps) {
  return (
    <Layout>
      <Head>
        <title>Books | Abraham of London</title>
        <meta name="description" content="A list of books by Abraham of London." />
      </Head>
      <main className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-extrabold text-center mb-12">My Books</h1>
        {books.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {books.map((book: BookCardProps) => (
              <BookCard key={book.slug} {...book} />
            ))}
          </div>
        ) : (
          <p className="text-center text-lg text-gray-600">No books found.</p>
        )}
      </main>
    </Layout>
  );
}

export const getStaticProps: GetStaticProps<BooksProps> = async () => {
  const books = getAllBooks([
    'slug',
    'title',
    'date',
    'publishedAt',
    'coverImage',
    'excerpt',
    'author',
    'description',
    'image',
    'readTime',
    'category',
    'tags',
    'content',
    'downloadPdf',
    'downloadEpub',
    'buyLink',
    'genre',
  ]);

  const booksWithRequiredProps: BookCardProps[] = books.map((book) => {
    // Explicitly cast the returned object to BookCardProps
    return {
      ...book,
      coverImage: book.coverImage || '/assets/images/default-book.jpg', // Add fallback
      excerpt: book.excerpt || 'No excerpt available.', // Add fallback
      buyLink: book.buyLink || '#', // Add fallback
      genre: book.genre || 'Uncategorized', // Add fallback
      // Ensure optional props are handled correctly
      downloadPdf: book.downloadPdf || undefined,
      downloadEpub: book.downloadEpub || undefined,
    } as BookCardProps;
  });

  return {
    props: {
      books: booksWithRequiredProps,
    },
    revalidate: 86400,
  };
};