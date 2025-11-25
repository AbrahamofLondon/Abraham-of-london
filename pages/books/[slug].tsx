// pages/books/[slug].tsx
import * as React from "react";
import type { GetStaticPaths, GetStaticProps } from "next";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import type { MDXRemoteSerializeResult } from "next-mdx-remote";
import Layout from "@/components/Layout";

// Import your custom MDX components
import Quote from "@/components/Quote";
import Callout from "@/components/Callout";
import Divider from "@/components/Divider";

import { getAllBooksMeta, getBookBySlug } from "@/lib/server/books-data";
import type { BookMeta } from "@/types/index";

type PageProps = {
  meta: BookMeta;
  mdxSource: MDXRemoteSerializeResult | null;
};

// Create a proper type for MDX components
type MDXComponentProps = {
  children?: React.ReactNode;
  className?: string;
  [key: string]: unknown;
};

// Create components object for MDX with proper typing
const mdxComponents = {
  Quote: Quote as React.ComponentType<MDXComponentProps>,
  Callout: Callout as React.ComponentType<MDXComponentProps>,
  Divider: Divider as React.ComponentType<MDXComponentProps>,
  a: ({ href, children, ...props }: { href?: string; children?: React.ReactNode }) => (
    <Link href={href || "#"} {...props}>
      {children}
    </Link>
  ),
};

export default function BookPage({ meta, mdxSource }: PageProps) {
  const {
    title,
    subtitle,
    description,
    author,
    date,
    coverImage,
    readTime,
    category,
    publishedDate,
    pages,
    language,
    isbn,
    rating,
    price,
    purchaseLink,
  } = meta;

  const pageTitle = `${title} | Books`;

  return (
    <Layout pageTitle={pageTitle}>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={description ?? subtitle ?? title} />
      </Head>

      <article className="mx-auto max-w-6xl px-6 py-14 text-cream">
        {/* HEADER & COVER LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-12">
          {/* Cover Image - Left Column */}
          <div className="lg:col-span-1 flex justify-center">
            {coverImage && (
              <div className="relative w-full max-w-xs">
                <Image
                  src={coverImage}
                  alt={title}
                  width={320}
                  height={440}
                  className="rounded-xl shadow-2xl w-full h-auto"
                  priority
                />
              </div>
            )}
          </div>

          {/* Metadata - Right Column */}
          <div className="lg:col-span-3">
            <header className="mb-6">
              <h1 className="mb-3 font-serif text-4xl font-bold text-cream">{title}</h1>
              {subtitle && (
                <p className="text-xl text-gray-300 mb-4">{subtitle}</p>
              )}
              {author && (
                <p className="text-lg text-gray-400 mb-2">
                  By <span className="font-semibold text-softGold">{author}</span>
                </p>
              )}
              {description && (
                <p className="text-gray-300 leading-relaxed mb-4">{description}</p>
              )}
            </header>

            {/* Key Metadata */}
            <section className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-300 mb-6">
              {readTime && (
                <div><span className="font-semibold text-softGold">Read time:</span> {readTime}</div>
              )}
              {publishedDate && (
                <div><span className="font-semibold text-softGold">Published:</span> {publishedDate}</div>
              )}
              {pages && (
                <div><span className="font-semibold text-softGold">Pages:</span> {pages}</div>
              )}
              {language && (
                <div><span className="font-semibold text-softGold">Language:</span> {language}</div>
              )}
              {isbn && (
                <div><span className="font-semibold text-softGold">ISBN:</span> {isbn}</div>
              )}
              {rating && (
                <div><span className="font-semibold text-softGold">Rating:</span> {rating}/5</div>
              )}
              {category && (
                <div><span className="font-semibold text-softGold">Category:</span> {category}</div>
              )}
              {price && (
                <div><span className="font-semibold text-softGold">Price:</span> {price}</div>
              )}
            </section>

            {/* Purchase CTA */}
            {purchaseLink && (
              <div className="mb-6">
                <a
                  href={purchaseLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block rounded-full bg-softGold px-8 py-3 text-black font-semibold hover:bg-softGold/90 transition shadow-lg hover:shadow-xl"
                >
                  Purchase Book
                </a>
              </div>
            )}
          </div>
        </div>

        {/* CONTENT SECTION */}
        <section className="prose prose-invert prose-lg max-w-none 
                          prose-headings:font-serif prose-headings:text-cream
                          prose-h1:text-3xl prose-h1:font-bold prose-h1:mb-6
                          prose-h2:text-2xl prose-h2:font-semibold prose-h2:mb-4
                          prose-h3:text-xl prose-h3:font-semibold prose-h3:mb-3
                          prose-p:text-gray-200 prose-p:leading-relaxed prose-p:mb-4
                          prose-strong:text-cream prose-strong:font-semibold
                          prose-a:text-softGold prose-a:no-underline hover:prose-a:underline
                          prose-ul:text-gray-200 prose-ol:text-gray-200
                          prose-li:mb-1
                          prose-blockquote:border-l-2 prose-blockquote:border-softGold 
                          prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-300
                          prose-blockquote:bg-charcoal/50 prose-blockquote:py-2 prose-blockquote:rounded-r
                          prose-hr:border-gray-600 prose-hr:my-8
                          prose-img:rounded-xl prose-img:shadow-lg
                          prose-pre:bg-gray-900 prose-pre:border prose-pre:border-gray-700">
          {mdxSource ? (
            <MDXRemote {...mdxSource} components={mdxComponents} />
          ) : (
            <div className="text-center py-16 border-2 border-dashed border-gray-600 rounded-2xl bg-charcoal/30">
              <div className="max-w-md mx-auto">
                <h3 className="text-2xl font-serif text-cream mb-4">Content Coming Soon</h3>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  The full manuscript of this volume is being prepared for publication. 
                  This is an early catalogue entry from the Abraham of London library.
                </p>
                <Link 
                  href="/subscribe" 
                  className="inline-block rounded-full bg-softGold px-6 py-2 text-black font-semibold hover:bg-softGold/90 transition"
                >
                  Join Waitlist for Updates
                </Link>
              </div>
            </div>
          )}
        </section>

        {/* ADDITIONAL BOOK INFO */}
        {(meta.tags || meta.publisher) && (
          <div className="mt-16 pt-8 border-t border-gray-700">
            <h3 className="font-serif text-xl font-semibold text-cream mb-6">Book Details</h3>
            <div className="grid gap-4 text-sm text-gray-300">
              {meta.publisher && (
                <div>
                  <span className="font-semibold text-softGold">Publisher:</span> {meta.publisher}
                </div>
              )}
              {meta.tags && meta.tags.length > 0 && (
                <div>
                  <span className="font-semibold text-softGold">Tags:</span>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {meta.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="rounded-full bg-gray-700/50 px-3 py-1 text-xs text-gray-300 border border-gray-600"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </article>
    </Layout>
  );
}

/* ------------------------------------------
 *  STATIC GENERATION
 * ------------------------------------------ */

export const getStaticPaths: GetStaticPaths = async () => {
  const metas = getAllBooksMeta();

  const paths = metas
    .filter(book => book.slug && book.slug.trim().length > 0)
    .map(book => ({
      params: { slug: book.slug! },
    }));

  console.log(`📚 Generated ${paths.length} book paths`);

  return {
    paths,
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps<PageProps> = async ({ params }) => {
  const slug = String(params?.slug);

  console.log(`🔍 Fetching book data for: ${slug}`);

  const book = getBookBySlug(slug);

  if (!book) {
    console.warn(`❌ Book not found for slug: ${slug}`);
    return { notFound: true };
  }

  console.log(`✅ Found book: ${book.title}`);
  console.log(`   - Has content: ${!!book.content}`);
  console.log(`   - Content length: ${book.content?.length || 0}`);

  // Clean the content - remove import statements
  let cleanContent = book.content || '';
  
  // Remove import statements from MDX content
  cleanContent = cleanContent.replace(
    /^import\s+.*?\s+from\s+["'][^"']+["'];?\s*$/gm, 
    ''
  ).trim();

  let mdxSource: MDXRemoteSerializeResult | null = null;
  
  if (cleanContent && cleanContent.length > 0) {
    try {
      console.log('🔄 Serializing MDX content...');
      mdxSource = await serialize(cleanContent, {
        mdxOptions: {
          remarkPlugins: [],
          rehypePlugins: [],
        },
      });
      console.log('✅ MDX serialization successful');
    } catch (error) {
      console.error(`❌ Error serializing MDX for ${slug}:`, error);
      mdxSource = null;
    }
  } else {
    console.warn(`⚠️ No content found for book: ${slug}`);
  }

  // Ensure all meta fields are JSON-serializable
  const safeMeta: BookMeta = {
    ...book,
    subtitle: book.subtitle ?? null,
    description: book.description ?? null,
    excerpt: book.excerpt ?? null,
    coverImage: book.coverImage ?? null,
    date: book.date ?? null,
    author: book.author ?? null,
    readTime: book.readTime ?? null,
    lastModified: book.lastModified ?? null,
    category: book.category ?? null,
    isbn: book.isbn ?? null,
    publisher: book.publisher ?? null,
    publishedDate: book.publishedDate ?? null,
    language: book.language ?? null,
    price: book.price ?? null,
    purchaseLink: book.purchaseLink ?? null,
    tags: book.tags ?? [],
    format: book.format ?? null,
    pages: book.pages ?? null,
    rating: book.rating ?? null,
    featured: book.featured ?? false,
    published: book.published ?? false,
    draft: book.draft ?? false,
    status: book.status ?? null,
  };

  return {
    props: {
      meta: safeMeta,
      mdxSource,
    },
    revalidate: 3600, // Revalidate every hour
  };
};