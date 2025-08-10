import { GetStaticProps } from 'next';
import Head from 'next/head';
import Layout from '../components/Layout';
import BookCard from '../components/BookCard';
import { getAllBooks, BookMeta } from '../lib/books';

type BooksProps = { books: (Required<Pick<BookMeta, 'slug' | 'title' | 'author' | 'excerpt' | 'coverImage' | 'buyLink'>> & { genre: string })[] };

export const getStaticProps: GetStaticProps<BooksProps> = async () => {
  const booksRaw = getAllBooks(['slug', 'title', 'author', 'excerpt', 'coverImage', 'buyLink', 'genre']);

  const books = booksRaw.map((b) => ({
    slug: b.slug || '',
    title: b.title || 'Untitled Book',
    author: b.author || 'Abraham of London',
    excerpt: b.excerpt || 'Read more for full details.',
    coverImage:
      typeof b.coverImage === 'string' && b.coverImage.trim()
        ? b.coverImage
        : '/assets/images/default-book.jpg',
    buyLink: b.buyLink || '#',
    genre: Array.isArray(b.genre) ? b.genre.filter(Boolean).join(', ') : b.genre || 'Uncategorized',
  }));

  return { props: { books }, revalidate: 86400 };
};

export default function Books({ books }: BooksProps) {
  return (
    <Layout>
      <Head>
        <title>Books | Abraham of London</title>
        <meta name="description" content="A list of books by Abraham of London." />
      </Head>

      <main className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-extrabold text-center mb-12">My Books</h1>
        {books.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {books.map((book) => (
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
