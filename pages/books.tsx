import { GetStaticProps } from 'next';
import Head from 'next/head';
import Layout from '../components/Layout';
import BookCard, { BookCardProps } from '../components/BookCard';
import { getAllBooks, BookMeta } from '../lib/books';

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

  const booksWithRequiredProps = books.map((book) => {
    const extendedBook: BookCardProps = {
      ...book,
      buyLink: book.buyLink || '#',
      genre: book.genre || 'Uncategorized',
    };
    // Only include downloadPdf and downloadEpub if they exist, otherwise omit them
    if (book.downloadPdf !== undefined) extendedBook.downloadPdf = book.downloadPdf;
    if (book.downloadEpub !== undefined) extendedBook.downloadEpub = book.downloadEpub;
    return extendedBook;
  });

  return {
    props: {
      books: booksWithRequiredProps,
    },
    revalidate: 86400,
  };
};