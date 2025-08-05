import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import type { GetStaticProps, GetStaticPaths } from 'next';
import { serialize } from 'next-mdx-remote/serialize';
import { MDXRemote } from 'next-mdx-remote';
import { MDXRemoteSerializeResult } from 'next-mdx-remote';
import { getBookBySlug, getAllBooks, BookMeta } from '../../lib/books';
import { parseDate } from '../../lib/dateUtils';
import { safeString } from '../../lib/stringUtils';
import MDXComponents from '../../components/MDXComponents';
import Layout from '../../components/Layout';

interface BookProps {
  book: {
    meta: BookMeta;
    content: MDXRemoteSerializeResult;
  };
}

export default function Book({ book }: BookProps) {
  const pageTitle = `${safeString(book.meta.title)} | Abraham of London Books`;
  const siteUrl = 'https://abrahamoflondon.org';
  
  // Safe fallbacks for meta properties
  const description = safeString(book.meta.description || book.meta.excerpt || 'Book by Abraham of London');
  const coverImage = book.meta.coverImage || '/assets/default-book-cover.jpg';
  const author = safeString(book.meta.author || 'Abraham of London');

  return (
    <Layout>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={`${siteUrl}${coverImage}`} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`${siteUrl}/books/${book.meta.slug}`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={`${siteUrl}${coverImage}`} />
        <link rel="canonical" href={`${siteUrl}/books/${book.meta.slug}`} />
      </Head>

      <div className="book-post-content">
        <article className="max-w-3xl mx-auto px-4 py-8 md:py-16">
          {book.meta.coverImage && (
            <div className="mb-8 md:mb-16 relative w-full h-80 rounded-lg overflow-hidden shadow-lg">
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
              {safeString(book.meta.title)}
            </h1>
            <div className="text-lg text-gray-600 mb-4">
              By <span className="font-semibold">{author}</span>
            </div>
            {book.meta.date && (
              <div className="text-sm text-gray-500">
                Published: {parseDate(book.meta.date).toLocaleDateString()}
              </div>
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
      </div>
    </Layout>
  );
}

export const getStaticProps: GetStaticProps<BookProps> = async ({ params }) => {
  try {
    const { slug } = params as { slug: string };
    
    const bookData = getBookBySlug(slug, [
      'title',
      'date',
      'publishedAt',
      'slug',
      'author',
      'content',
      'coverImage',
      'excerpt',
      'readTime',
      'category',
      'tags',
      'description',
      'buyLink',
      'downloadLink',
      'downloadEpubLink',
    ]) as { content: string } & Omit<BookMeta, 'content'>;

    // Check if book exists
    if (bookData.title === 'Book Not Found') {
      return { notFound: true };
    }

    const { content, ...meta } = bookData;
    
    // Serialize MDX content
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
  } catch (error) {
    console.error(`Error in getStaticProps for book ${params?.slug}:`, error);
    return { notFound: true };
  }
};

export const getStaticPaths: GetStaticPaths = async () => {
  try {
    const books = getAllBooks(['slug']);

    return {
      paths: books.map((book) => ({
        params: {
          slug: book.slug,
        },
      })),
      fallback: 'blocking',
    };
  } catch (error) {
    console.error('Error in getStaticPaths for books:', error);
    return {
      paths: [],
      fallback: 'blocking',
    };
  }
};