// pages/books.tsx
import { GetStaticProps } from 'next';
import Head from 'next/head';
import Layout from '../components/Layout';
import BookCard, { BookCardProps } from '../components/BookCard';
import { getAllBooks } from '../lib/books';

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
        <h1 className="font-serif text-4xl tracking-brand text-forest text-center mb-12">
          My Books
        </h1>

        {books.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {books.map((book) => (
              <BookCard key={book.slug} {...book} />
            ))}
          </div>
        ) : (
          <p className="text-center text-lg text-deepCharcoal/70">No books found.</p>
        )}
      </main>
    </Layout>
  );
}

export const getStaticProps: GetStaticProps<BooksProps> = async () => {
  const books = getAllBooks([
    'slug',
    'title',
    'coverImage',
    'excerpt',
    'author',
    'buyLink',
    'genre',
    'downloadPdf',
    'downloadEpub',
  ]);

  const booksWithRequiredProps: BookCardProps[] = books.map((book) => {
    const genreText =
      Array.isArray(book.genre) && book.genre.length > 0
        ? book.genre.join(', ')
        : typeof book.genre === 'string'
        ? book.genre
        : 'Uncategorized';

    return {
      slug: book.slug || '',
      title: book.title || 'Untitled Book',
      coverImage: book.coverImage || '/assets/images/default-book.jpg',
      excerpt: book.excerpt || 'No excerpt available.',
      author: book.author || 'Abraham of London',
      buyLink: book.buyLink || '#',
      genre: genreText,
      downloadPdf: book.downloadPdf ?? null,
      downloadEpub: book.downloadEpub ?? null,
    };
  });

  return {
    props: { books: booksWithRequiredProps },
    revalidate: 86400, // 24h ISR
  };
};
