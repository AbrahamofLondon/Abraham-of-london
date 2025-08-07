import { GetStaticProps } from 'next';
import Head from 'next/head';
import Layout from '../components/Layout';
import BookCard from '../components/BookCard';
import { getAllBooks, BookMeta } from '../lib/books'; // Assuming you have a lib/books file

// Extend BookMeta to include required BookCardProps fields
interface BookCardProps extends BookMeta {
  buyLink: string;
  genre: string;
}

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
  ]);

  // Map over the books to add the missing required properties with fallback values
  const booksWithRequiredProps = books.map((book) => ({
    ...book,
    buyLink: book.buyLink || '#', // Fallback to '#' if buyLink is undefined
    genre: book.genre || 'Uncategorized', // Fallback to 'Uncategorized' if genre is undefined
  }));

  return {
    props: {
      books: booksWithRequiredProps,
    },
    revalidate: 86400, // Optional: Match ISR setting if used
  };
};