import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import type { GetStaticProps, GetStaticPaths } from 'next';
import { serialize } from 'next-mdx-remote/serialize';
import { MDXRemote } from 'next-mdx-remote';
import { MDXRemoteSerializeResult } from 'next-mdx-remote';
import { getBookBySlug, getAllBooks, BookMeta } from '../../lib/books';
import DateFormatter from '../../components/DateFormatter';
import MDXComponents from '../../components/MDXComponents';

interface BookProps {
  book: {
    meta: BookMeta;
    content: MDXRemoteSerializeResult;
  };
}

export default function Book({ book }: BookProps) {
  const pageTitle = `${book.meta.title} | Abraham of London Books`;
  const siteUrl = 'https://abrahamoflondon.org';

  // Safely handle date for published_time
  const publishedTime = book.meta.date && !isNaN(new Date(book.meta.date).getTime())
    ? new Date(book.meta.date).toISOString()
    : undefined; // Omit if invalid or missing

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={book.meta.description || book.meta.excerpt || ''} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={book.meta.description || book.meta.excerpt || ''} />
        <meta property="og:image" content={`${siteUrl}${book.meta.coverImage || ''}`} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`${siteUrl}/books/${book.meta.slug}`} />
        {publishedTime && <meta property="article:published_time" content={publishedTime} />} {/* Conditional rendering */}
        <meta property="article:author" content={book.meta.author || ''} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={book.meta.description || book.meta.excerpt || ''} />
        <meta name="twitter:image" content={`${siteUrl}${book.meta.coverImage || ''}`} />
        <link rel="canonical" href={`${siteUrl}/books/${book.meta.slug}`} />
      </Head>

      <div className="book-page-content">
        <article className="max-w-3xl mx-auto px-4 py-8 md:py-16">
          {book.meta.coverImage && (
            <div className="mb-8 md:mb-16 relative w-full h-80 rounded-lg overflow-hidden shadow-md">
              <Image
                src={book.meta.coverImage}
                alt={`Cover Image for ${book.meta.title}`}
                fill
                style={{ objectFit: 'cover' }}
                priority
              />
            </div>
          )}

          <header className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-extrabold leading-tight text-gray-900 mb-4">
              {book.meta.title}
            </h1>
            <div className="text-lg text-gray-600 mb-4">
              By <span className="font-semibold">{book.meta.author}</span> on{' '}
              <DateFormatter dateString={book.meta.date || ''} /> | {book.meta.readTime} read
            </div>
            {book.meta.category && (
              <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full mr-2">
                {book.meta.category}
              </span>
            )}
            {book.meta.tags &&
              book.meta.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-block bg-gray-200 text-gray-800 text-xs font-semibold px-2.5 py-0.5 rounded-full mr-2"
                >
                  #{tag}
                </span>
              ))}
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
      </div>
    </>
  );
}

export const getStaticProps: GetStaticProps<BookProps> = async ({ params }) => {
  const { slug } = params as { slug: string };
  const bookData = getBookBySlug(slug, [
    'title',
    'date',
    'slug',
    'author',
    'content',
    'coverImage',
    'excerpt',
    'readTime',
    'category',
    'tags',
    'description',
  ]) as { content: string } & Omit<BookMeta, 'content'>;

  const { content, ...meta } = bookData;
  const mdxSource = await serialize(content || '', {
    parseFrontmatter: true,
    scope: meta,
  });

  return {
    props: {
      book: {
        meta: meta as BookMeta,
        content: mdxSource,
      },
    },
    revalidate: 10,
  };
};

export const getStaticPaths: GetStaticPaths = async () => {
  const books = getAllBooks(['slug']);

  return {
    paths: books.map((book) => ({
      params: {
        slug: book.slug,
      },
    })),
    fallback: 'blocking',
  };
};