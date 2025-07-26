// pages/books/[slug].tsx
import { GetStaticPaths, GetStaticProps } from 'next';
import { getAllBooks, getBookBySlug, BookMeta } from '../../lib/books';
import Layout from '../../components/Layout';
import Image from 'next/image';
import Head from 'next/head';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface BookPageProps {
  book: BookMeta;
}

const BookPage: React.FC<BookPageProps> = ({ book }) => {
  const {
    title,
    author,
    coverImage,
    description,
    excerpt,
    slug,
  } = book;

  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'Book',
    'name': title,
    'author': {
      '@type': 'Person',
      'name': author,
    },
    'image': coverImage || '/assets/images/default-book.jpg',
    'description': excerpt || description || '',
    'url': `https://abrahamoflondon.org/books/${slug}`,
  };

  return (
    <Layout>
      <Head>
        <title>{title} – Abraham of London</title>
        <meta name="description" content={excerpt || description || ''} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={excerpt || description || ''} />
        <meta property="og:image" content={coverImage || '/assets/images/default-book.jpg'} />
        <meta property="og:type" content="book" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={excerpt || description || ''} />
        <meta name="twitter:image" content={coverImage || '/assets/images/default-book.jpg'} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
        />
      </Head>

      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-10 text-center">
              <h1 className="text-5xl font-bold text-gray-800 mb-4">{title}</h1>
              <p className="text-gray-600 text-lg italic">by {author}</p>
            </div>

            <div className="flex flex-col md:flex-row gap-10 items-start">
              <div className="md:w-1/2">
                <Image
                  src={coverImage || '/assets/images/default-book.jpg'}
                  alt={title}
                  width={500}
                  height={700}
                  className="rounded-lg shadow-lg"
                />
              </div>
              <div className="md:w-1/2 space-y-6">
                <p className="text-lg text-gray-700 whitespace-pre-line">{description}</p>
                <Link
                  href="/books"
                  className="inline-block mt-6 bg-blue-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-blue-700 shadow-lg"
                  aria-label="Back to all books"
                >
                  &larr; Back to Books
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  const books = getAllBooks(['slug']);
  const paths = books.map((book) => ({
    params: { slug: book.slug },
  }));

  return {
    paths,
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps<BookPageProps> = async ({ params }) => {
  const book = getBookBySlug(params?.slug as string, [
    'slug',
    'title',
    'author',
    'coverImage',
    'excerpt',
    'description',
  ]);

  return {
    props: {
      book,
    },
  };
};

export default BookPage;
