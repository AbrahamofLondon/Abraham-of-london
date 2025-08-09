// pages/books/[slug].tsx

import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import type { GetStaticPaths, GetStaticProps } from 'next';
import { serialize } from 'next-mdx-remote/serialize';
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote';
import { getBookBySlug, getAllBooks, BookMeta } from '../../lib/books';
import { parseDate } from '../../lib/dateUtils';
import { safeString } from '../../lib/stringUtils';
import Layout from '../../components/Layout';
import { MDXComponents } from '../../components/MDXComponents';
import * as React from 'react';

/**
 * Type representing the metadata needed to render the book page.
 */
type BookPageMeta = Required<
  Pick<BookMeta, 'slug' | 'title' | 'author' | 'excerpt' | 'coverImage'>
> & {
  date: string;
  publishedAt: string;
  description: string;
  buyLink: string;
  downloadPdf?: string | null;
  downloadEpub?: string | null;
  tags?: string[];
  genre?: string[];
};

/**
 * Props received by the Book detail page.
 */
type BookProps = {
  book: {
    meta: BookPageMeta;
    content: MDXRemoteSerializeResult;
  };
};

export default function Book({ book }: BookProps) {
  // Construct the SEO-friendly page title.
  const pageTitle = `${safeString(book.meta.title)} | Abraham of London Books`;
  const siteUrl = 'https://abrahamoflondon.org';
  // Use description or excerpt as the meta description fallback.
  const description =
    safeString(book.meta.description || book.meta.excerpt || 'Book by Abraham of London');
  // Safe fallback for cover image.
  const coverImage = book.meta.coverImage || '/assets/images/default-book-cover.jpg';
  // Safe fallback for author name.
  const author = safeString(book.meta.author || 'Abraham of London');

  /**
   * Normalize optional arrays to guarantee they are always defined.
   *
   * TypeScript flagged `book.meta.genre?.length` and `book.meta.genre.map`
   * as possibly undefined. To avoid this, we create local arrays that are
   * either the existing array (if defined and an array) or an empty array.
   */
  const genres: string[] = Array.isArray(book.meta.genre) ? book.meta.genre : [];
  const tags: string[] = Array.isArray(book.meta.tags) ? book.meta.tags : [];

  /**
   * Safely format the publication date. If parseDate is not present,
   * fallback to the raw date string.
   */
  const renderDate = (d: string) => {
    if (!d) return null;
    try {
      return (parseDate ? parseDate(d) : new Date(d)).toLocaleDateString();
    } catch {
      return d;
    }
  };

  return (
    <Layout>
      {/* SEO Metadata */}
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={`${siteUrl}/books/${book.meta.slug}`} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`${siteUrl}/books/${book.meta.slug}`} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={`${siteUrl}${coverImage}`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={`${siteUrl}${coverImage}`} />
      </Head>

      <article className="max-w-3xl mx-auto px-4 py-8 md:py-16">
        {/* Cover Image */}
        {!!coverImage && (
          <div className="mb-8 md:mb-16 relative w-full h-80 rounded-lg overflow-hidden shadow-lg">
            <Image
              src={coverImage}
              alt={`Cover image for "${book.meta.title}"`}
              fill
              sizes="(max-width: 768px) 100vw, 768px"
              style={{ objectFit: 'cover' }}
              priority
            />
          </div>
        )}

        {/* Title, Author, and Publication Date */}
        <header className="text-center mb-8">
          <h1 className="font-serif text-5xl md:text-6xl tracking-brand text-forest mb-4">
            {safeString(book.meta.title)}
          </h1>
          <div className="text-lg text-deepCharcoal mb-2">
            By <span className="font-semibold">{author}</span>
          </div>
          {!!book.meta.date && (
            <div className="text-sm text-deepCharcoal/70">
              Published: {renderDate(book.meta.date)}
            </div>
          )}
        </header>

        {/* Genres - only rendered if there are one or more */}
        {genres.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2 justify-center">
            {genres.map((g) => (
              <span
                key={g}
                className="inline-block text-xs uppercase tracking-wide text-forest border border-lightGrey px-3 py-1"
              >
                {g}
              </span>
            ))}
          </div>
        )}

        {/* Book Content rendered via MDX */}
        <div className="prose prose-lg max-w-none text-deepCharcoal mb-10">
          <MDXRemote
            {...book.content}
            components={MDXComponents as unknown as Record<string, React.ComponentType<any>>}
          />
        </div>

        {/* Tags - only rendered if there are one or more */}
        {tags.length > 0 && (
          <ul className="flex flex-wrap gap-2 justify-center mt-2 mb-10">
            {tags.map((t) => (
              <li
                key={t}
                className="text-xs uppercase tracking-wide text-forest border border-lightGrey px-3 py-1"
              >
                {t}
              </li>
            ))}
          </ul>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 justify-center mb-12">
          {!!book.meta.buyLink && book.meta.buyLink !== '#' && (
            <a
              href={book.meta.buyLink}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-forest text-cream px-5 py-2 rounded-[2px] tracking-brand transition hover:bg-softGold hover:text-forest"
            >
              Buy Now
            </a>
          )}
          {!!book.meta.downloadPdf && (
            <a
              href={book.meta.downloadPdf}
              target="_blank"
              rel="noopener noreferrer"
              className="border-2 border-forest text-forest px-5 py-2 rounded-[2px] tracking-brand transition hover:bg-forest hover:text-cream"
            >
              Download PDF
            </a>
          )}
          {!!book.meta.downloadEpub && (
            <a
              href={book.meta.downloadEpub}
              target="_blank"
              rel="noopener noreferrer"
              className="border-2 border-forest text-forest px-5 py-2 rounded-[2px] tracking-brand transition hover:bg-forest hover:text-cream"
            >
              Download EPUB
            </a>
          )}
        </div>

        {/* Back Link */}
        <div className="text-center">
          <Link href="/books" className="text-forest hover:text-softGold font-medium">
            &larr; Back to Books
          </Link>
        </div>
      </article>
    </Layout>
  );
}

export const getStaticProps: GetStaticProps<BookProps> = async ({ params }) => {
  const slug = String(params?.slug || '');

  // Request fields from the MDX file and its frontmatter.
  const raw = getBookBySlug(slug, [
    'slug',
    'title',
    'author',
    'excerpt',
    'coverImage',
    'description',
    'date',
    'publishedAt',
    'buyLink',
    'downloadPdf',
    'downloadEpub',
    'tags',
    'genre',
    'content',
  ]) as Partial<BookMeta> & { content?: string };

  // If the book is not found, return a 404.
  if (!raw.slug || raw.title === 'Book Not Found') {
    return { notFound: true };
  }

  // Normalize the optional fields to ensure they are arrays or strings with defaults.
  const meta: BookPageMeta = {
    slug: raw.slug,
    title: raw.title || 'Untitled Book',
    author: raw.author || 'Abraham of London',
    excerpt: raw.excerpt || '',
    coverImage: raw.coverImage || '/assets/images/default-book-cover.jpg',
    date: raw.date || raw.publishedAt || '',
    publishedAt: raw.publishedAt || raw.date || '',
    description: raw.description || raw.excerpt || '',
    buyLink: raw.buyLink || '#',
    downloadPdf: raw.downloadPdf ?? null,
    downloadEpub: raw.downloadEpub ?? null,
    tags: Array.isArray(raw.tags) ? raw.tags : raw.tags ? [raw.tags] : [],
    genre: Array.isArray(raw.genre) ? raw.genre : raw.genre ? [raw.genre] : [],
  };

  // Serialize the MDX content to feed into MDXRemote.
  const mdxSource = await serialize(raw.content ?? '', {
    parseFrontmatter: false,
    scope: meta,
  });

  return {
    props: {
      book: { meta, content: mdxSource },
    },
    revalidate: 60,
  };
};

export const getStaticPaths: GetStaticPaths = async () => {
  const books = getAllBooks(['slug']);
  const paths =
    books
      .map((b) => (b.slug ? { params: { slug: String(b.slug) } } : null))
      .filter(Boolean) as { params: { slug: string } }[];
  return {
    paths,
    fallback: 'blocking',
  };
};
