// pages/books/index.tsx
import { GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../components/Layout';
import { getAllBooks, BookMeta } from '../../lib/books';
import Image from 'next/image';
import { motion } from 'framer-motion';

interface BooksPageProps {
  books: BookMeta[];
}

const BooksPage: React.FC<BooksPageProps> = ({ books }) => {
  // Extract unique tags from books
  const allTags = Array.from(new Set(books.flatMap(book => book.tags || [])));

  return (
    <Layout>
      <Head>
        <title>Books by Abraham of London</title>
        <meta name="description" content="Explore books by Abraham of London on fatherhood, faith, justice, and legacy." />
        <meta property="og:title" content="Books by Abraham of London" />
        <meta property="og:description" content="Explore books by Abraham of London on fatherhood, faith, justice, and legacy." />
        <meta property="og:image" content="/assets/images/og-books.jpg" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Books by Abraham of London" />
        <meta name="twitter:description" content="Explore books by Abraham of London on fatherhood, faith, justice, and legacy." />
        <meta name="twitter:image" content="/assets/images/og-books.jpg" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            'name': 'Books by Abraham of London',
            'description': 'Explore books by Abraham of London on fatherhood, faith, justice, and legacy.',
            'url': 'https://abrahamoflondon.org/books',
            'publisher': {
              '@type': 'Organization',
              'name': 'Abraham of London',
              'url': 'https://abrahamoflondon.org'
            }
          })
        }} />
      </Head>

      <section className="bg-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-extrabold text-gray-800 mb-6">Books by Abraham of London</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-12">
            Dive into transformational writings that speak to purpose, power, and paternal courage.
          </p>

          {allTags.length > 0 && (
            <div className="mb-12">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Browse by Tag</h2>
              <div className="flex flex-wrap justify-center gap-2">
                {allTags.map(tag => (
                  <span key={tag} className="px-4 py-2 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {books.length > 0 ? (
            <div className="grid gap-10 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {books.map((book) => (
                <motion.div
                  key={book.slug}
                  className="border rounded-lg overflow-hidden shadow-md bg-white"
                  whileHover={{ scale: 1.03 }}
                  transition={{ duration: 0.3 }}
                >
                  <Link href={`/books/${book.slug}`}> 
                    <div className="cursor-pointer">
                      <Image
                        src={book.coverImage || '/assets/images/default-book.jpg'}
                        alt={book.title}
                        width={400}
                        height={600}
                        className="w-full h-80 object-cover"
                      />
                      <div className="p-4 text-left">
                        <h3 className="text-2xl font-semibold text-gray-800 mb-2">{book.title}</h3>
                        <p className="text-gray-600 text-sm mb-2">by {book.author}</p>
                        <p className="text-gray-700 text-base mb-4 line-clamp-3">{book.excerpt}</p>
                        <span className="inline-block mt-2 text-blue-600 font-medium hover:underline">
                          Learn More &rarr;
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No books available yet. Please check back soon.</p>
          )}
        </div>
      </section>
    </Layout>
  );
};

export const getStaticProps: GetStaticProps = async () => {
  const books = getAllBooks([
    'title',
    'slug',
    'author',
    'coverImage',
    'excerpt',
    'tags'
  ]);

  return {
    props: {
      books
    }
  };
};

export default BooksPage;
