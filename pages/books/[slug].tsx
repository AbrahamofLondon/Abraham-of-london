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

type BookProps = {
  book: { meta: BookPageMeta; content: MDXRemoteSerializeResult };
};

export default function Book({ book }: BookProps) {
  const siteUrl = 'https://abrahamoflondon.org';
  const title = `${safeString(book.meta.title)} | Abraham of London Books`;
  const description = safeString(book.meta.description || book.meta.excerpt || 'Book by Abraham of London');
  const coverImage = book.meta.coverImage || '/assets/images/default-book-cover.jpg';
  const author = safeString(book.meta.author || 'Abraham of London');

  const genres: string[] = Array.isArray(book.meta.genre) ? book.meta.genre : [];
  const tags: string[] = Array.isArray(book.meta.tags) ? book.meta.tags : [];

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
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={`${siteUrl}/books/${book.meta.slug}`} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`${siteUrl}/books/${book.meta.slug}`} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={`${siteUrl}${coverImage}`} />
        {author && <meta property="book:author" content={author} />}
        {genres.length > 0 && genres.map((g, i) => <meta key={`genre-${i}`} property="book:tag" content={g} />)}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={`${siteUrl}${coverImage}`} />
      </Head>

      <article className="max-w-3xl mx-auto px-4 py-8 md:py-16">
        {coverImage && (
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

        <header className="text-center mb-8">
          <h1 className="font-serif text-5xl md:text-6xl tracking-brand text-forest mb-4">
            {safeString(book.meta.title)}
          </h1>
          <div className="text-lg text-deepCharcoal mb-2">
            By <span className="font-semibold">{author}</span>
          </div>
          {book.meta.date && <div className="text-sm text-deepCharcoal/70">Published: {renderDate(book.meta.date)}</div>}
        </header>

        {genres.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2 justify-center">
            {genres.map((g) => (
              <span key={g} className="inline-block text-xs uppercase tracking-wide text-forest border border-lightGrey px-3 py-1">
                {g}
              </span>
            ))}
          </div>
        )}

        <div className="prose prose-lg max-w-none text-deepCharcoal mb-10">
          <MDXRemote
            {...book.content}
            components={MDXComponents as unknown as Record<string, React.ComponentType<Record<string, unknown>>>}
          />
        </div>

        {tags.length > 0 && (
          <ul className="flex flex-wrap gap-2 justify-center mt-2 mb-10">
            {tags.map((t) => (
              <li key={t} className="text-xs uppercase tracking-wide text-forest border border-lightGrey px-3 py-1">
                {t}
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-wrap gap-3 justify-center mb-12">
          {book.meta.buyLink && book.meta.buyLink !== '#' && (
            <a href={book.meta.buyLink} target="_blank" rel="noopener noreferrer" className="bg-forest text-cream px-5 py-2 rounded-[2px] tracking-brand transition hover:bg-softGold hover:text-forest">
              Buy Now
            </a>
          )}
          {book.meta.downloadPdf && (
            <a href={book.meta.downloadPdf} target="_blank" rel="noopener noreferrer" className="border-2 border-forest text-forest px-5 py-2 rounded-[2px] tracking-brand transition hover:bg-forest hover:text-cream">
              Download PDF
            </a>
          )}
          {book.meta.downloadEpub && (
            <a href={book.meta.downloadEpub} target="_blank" rel="noopener noreferrer" className="border-2 border-forest text-forest px-5 py-2 rounded-[2px] tracking-brand transition hover:bg-forest hover:text-cream">
              Download EPUB
            </a>
          )}
        </div>

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

  const raw = getBookBySlug(slug, [
    'slug','title','author','excerpt','coverImage','description',
    'date','publishedAt','buyLink','downloadPdf','downloadEpub',
    'tags','genre','content',
  ]) as Partial<BookMeta> & { content?: string };

  if (!raw.slug || raw.title === 'Book Not Found') return { notFound: true };

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

  const mdxSource = await serialize(raw.content ?? '', { parseFrontmatter: false, scope: meta });

  return { props: { book: { meta, content: mdxSource } }, revalidate: 60 };
};

export const getStaticPaths: GetStaticPaths = async () => {
  const books = getAllBooks(['slug']);
  const paths = books
    .map((b) => (b.slug ? { params: { slug: String(b.slug) } } : null))
    .filter((p): p is { params: { slug: string } } => Boolean(p));
  return { paths, fallback: 'blocking' };
};
