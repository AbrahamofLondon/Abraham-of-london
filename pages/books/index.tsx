// pages/books/index.tsx
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { GetStaticProps } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import Layout from '../../components/Layout';
import Head from 'next/head';

interface BookMeta {
  slug: string;
  title: string;
  author: string;
  coverImage: string;
  description: string;
  date: string;
}

interface BooksPageProps {
  books: BookMeta[];
}

const BooksPage: React.FC<BooksPageProps> = ({ books }) => {
  return (
    <Layout>
      <Head>
        <title>Books | Abraham of London</title>
        <meta name="description" content="Explore the books authored by Abraham of London. Principles of fatherhood, faith, and leadership." />
      </Head>

      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold text-center text-gray-900 mb-10">Books by Abraham of London</h1>

          {books.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
              {books.map((book) => (
                <Link key={book.slug} href={`/books/${book.slug}`} className="group block bg-gray-50 rounded-lg shadow-md hover:shadow-lg overflow-hidden transition">
                  <Image
                    src={book.coverImage}
                    alt={book.title}
                    width={500}
                    height={300}
                    className="w-full h-64 object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="p-4">
                    <h3 className="text-xl font-semibold text-gray-800">{book.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">By {book.author}</p>
                    <p className="text-gray-700 text-sm">{book.description.substring(0, 100)}...</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-600">No books available yet. Check back soon!</p>
          )}
        </div>
      </section>
    </Layout>
  );
};

export const getStaticProps: GetStaticProps = async () => {
  const booksDir = path.join(process.cwd(), 'content/books');
  const filenames = fs.readdirSync(booksDir);

  const books = filenames
    .filter((file) => file.endsWith('.mdx'))
    .map((filename) => {
      const filePath = path.join(booksDir, filename);
      const fileContents = fs.readFileSync(filePath, 'utf8');
      const { data } = matter(fileContents);

      return {
        slug: filename.replace(/\.mdx$/, ''),
        title: data.title || 'Untitled',
        author: data.author || 'Unknown',
        coverImage: data.coverImage || '/assets/images/default-cover.jpg',
        description: data.description || '',
        date: data.date || '',
      };
    });

  return {
    props: {
      books,
    },
  };
};

export default BooksPage;
