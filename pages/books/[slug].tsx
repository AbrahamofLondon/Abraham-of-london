import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { GetStaticProps, GetStaticPaths } from 'next';
import { serialize } from 'next-mdx-remote/serialize';
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote';
import { getBookBySlug, getAllBooks, BookWithContent } from '../../lib/books';
import Layout from '../../components/Layout';
import MDXComponents from '../../components/MDXComponents';

interface BookProps {
  book: {
    meta: Omit<BookWithContent, 'content'>;
    content: MDXRemoteSerializeResult;
  };
}

export default function Book({ book }: BookProps) {
  const pageTitle = `${book.meta.title} | Abraham of London Books`;
  const siteUrl = 'https://abrahamoflondon.org';

  return (
    <Layout>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={book.meta.description || book.meta.excerpt} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={book.meta.description || book.meta.excerpt} />
        <meta property="og:image" content={`${siteUrl}${book.meta.coverImage}`} />
        <meta property="og:type" content="book" />
        <meta property="og:url" content={`${siteUrl}/books/${book.meta.slug}`} />
        {book.meta.author && <meta property="book:author" content={book.meta.author} />}
        {genres.map((g, index) => (
          <meta key={index} property="book:tag" content={g} />
        ))}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={book.meta.description || book.meta.excerpt} />
        <meta name="twitter:image" content={`${siteUrl}${book.meta.coverImage}`} />
        <link rel="canonical" href={`${siteUrl}/books/${book.meta.slug}`} />
      </Head>

      <article className="max-w-3xl mx-auto px-4 py-8 md:py-16">
        {book.meta.coverImage && (
          <div className="mb-8 md:mb-16 relative w-full h-96 rounded-lg overflow-hidden shadow-lg">
            <Image
              src={book.meta.coverImage}
              alt={`Cover Image for ${book.meta.title}`}
              layout="fill"
              objectFit="contain"
              priority
            />
          </div>
        )}

        <header className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-extrabold leading-tight text-gray-900 mb-4">
            {book.meta.title}
          </h1>
          {book.meta.author && (
            <div className="text-lg text-gray-600 mb-4">
              By <span className="font-semibold">{book.meta.author}</span>
            </div>
          )}
          {genres.length > 0 && (
            <div className="mb-4">
              {genres.map((genre) => (
                <span
                  key={genre}
                  className="inline-block bg-purple-100 text-purple-800 text-xs font-semibold px-2.5 py-0.5 rounded-full mr-2"
                >
                  {genre}
                </span>
              ))}
            </div>
          )}
          {book.meta.buyLink && (
            <Link
              href={book.meta.buyLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-full text-lg font-semibold transition duration-300 shadow-lg hover:bg-blue-700"
            >
              Buy Now
            </Link>
          )}
        </header>

        <div className="prose prose-lg mx-auto mb-16">
          <MDXRemote {...book.content} components={MDXComponents} />
        </div>

        <div className="text-center">
          <Link href="/books" className="text-blue-600 hover:underline text-xl font-medium">
            &larr; Back to Books
          </Link>
        </div>
      </article>
    </Layout>
  );
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params as { slug: string };
  const book = getBookBySlug(slug, [
    'title',
    'slug',
    'author',
    'content',
    'coverImage',
    'excerpt',
    'buyLink',
    'genre',
    'description',
    'tags',
  ]) as BookWithContent;

  const mdxSource = await serialize(book.content, { scope: book });

  return {
    props: {
      book: {
        meta: { ...book, content: undefined },
        content: mdxSource,
      },
    },
    revalidate: 10,
  };
};

export const getStaticPaths: GetStaticPaths = async () => {
  const books = getAllBooks(['slug']);
  return {
    paths: books.map((book) => ({ params: { slug: book.slug } })),
    fallback: 'blocking',
  };
};

