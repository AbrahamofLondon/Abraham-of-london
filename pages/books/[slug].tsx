// pages/books/[slug].tsx
import * as React from "react";
import Head from "next/head";
import type { GetStaticPaths, GetStaticProps } from "next";
import {
  MDXRemote,
  type MDXRemoteSerializeResult,
} from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";

import Layout from "@/components/Layout";
import mdxComponents from "@/components/mdx-components";
import { getAllBooks, getBookBySlug } from "@/lib/books";
import type { BookMeta } from "@/types/index";
import ArticleHero from "@/components/ArticleHero";

// Create a type that includes content for the data returned by getBookBySlug
type BookData = BookMeta & {
  content?: string;
};

type PageMeta = BookMeta & {
  coverAspect?: "book" | "wide" | "square";
  coverFit?: "cover" | "contain";
};

type PageProps = {
  meta: PageMeta;
  mdxSource: MDXRemoteSerializeResult | null;
};

export default function BookPage({ meta, mdxSource }: PageProps): JSX.Element {
  const {
    title,
    description,
    excerpt,
    author,
    date,
    readTime,
    coverImage,
    coverAspect = "book",
    coverFit = "cover",
  } = meta;

  const displaySubtitle = excerpt || description || undefined;
  const canonicalTitle = title || "Abraham of London";
  const displayDescription = description || excerpt || "";
  const authorDisplay = author ? `By ${author}` : "By Abraham of London";

  return (
    <Layout title={canonicalTitle}>
      <Head>
        <title>{canonicalTitle} | Abraham of London</title>
        {displayDescription && (
          <meta name="description" content={displayDescription} />
        )}
        <meta property="og:type" content="book" />
        {author && <meta property="book:author" content={author} />}
      </Head>

      <ArticleHero
        title={title}
        subtitle={displaySubtitle}
        category={authorDisplay}
        date={date}
        readTime={readTime}
        coverImage={coverImage as string | undefined}
        coverAspect={coverAspect}
        coverFit={coverFit}
      />

      <main>
        <article className="mx-auto w-full max-w-3xl px-4 pb-16 pt-10 lg:px-0">
          {/* Book Metadata */}
          <div className="mb-8 flex flex-wrap gap-4 text-sm text-gray-600">
            {meta.publishedDate && (
              <div>
                <strong className="text-deepCharcoal">Published:</strong>{" "}
                {new Date(meta.publishedDate).toLocaleDateString('en-GB', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            )}
            {meta.pages && (
              <div>
                <strong className="text-deepCharcoal">Pages:</strong> {meta.pages}
              </div>
            )}
            {meta.format && (
              <div>
                <strong className="text-deepCharcoal">Format:</strong>{" "}
                <span className="capitalize">{meta.format}</span>
              </div>
            )}
            {meta.language && (
              <div>
                <strong className="text-deepCharcoal">Language:</strong> {meta.language}
              </div>
            )}
          </div>

          {/* Purchase Link */}
          {meta.purchaseLink && (
            <div className="mb-8">
              <a
                href={meta.purchaseLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-forest px-6 py-3 font-semibold text-cream transition-all hover:bg-forest/90 hover:shadow-lg"
              >
                <span>Purchase Book</span>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          )}

          {/* Book Content - Conditionally render based on mdxSource */}
          {mdxSource ? (
            <div
              className="
                prose prose-lg max-w-none
                prose-headings:font-serif prose-headings:text-deepCharcoal dark:prose-headings:text-cream
                prose-p:text-gray-700 dark:prose-p:text-gray-200 prose-p:leading-relaxed
                prose-strong:text-deepCharcoal dark:prose-strong:text-cream prose-strong:font-semibold
                prose-a:text-softGold prose-a:no-underline hover:prose-a:underline
                prose-ul:text-gray-700 dark:prose-ul:text-gray-200 prose-ol:text-gray-700 dark:prose-ol:text-gray-200
                prose-blockquote:border-l-softGold prose-blockquote:text-gray-700 dark:prose-blockquote:text-gray-100
                prose-hr:border-gray-300 dark:prose-hr:border-white/10
                prose-img:rounded-xl prose-img:shadow-lg
                prose-table:border-gray-300 prose-td:border-gray-300 prose-th:bg-gray-100
              "
            >
              <MDXRemote {...mdxSource} components={mdxComponents} />
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="bg-softGold/10 rounded-2xl p-8 max-w-md mx-auto">
                <h3 className="font-serif text-xl text-deepCharcoal mb-4">Content Coming Soon</h3>
                <p className="text-gray-600 mb-4">
                  The full content for this book is currently being prepared.
                </p>
                <p className="text-sm text-gray-500">
                  Check back soon for the complete book content.
                </p>
              </div>
            </div>
          )}

          {/* Additional Book Info */}
          {(meta.isbn || meta.publisher || meta.tags) && (
            <div className="mt-12 border-t border-gray-200 pt-8">
              <h3 className="font-serif text-xl font-semibold text-deepCharcoal mb-4">
                Book Details
              </h3>
              <div className="grid gap-4 text-sm text-gray-600">
                {meta.isbn && (
                  <div>
                    <strong className="text-deepCharcoal">ISBN:</strong> {meta.isbn}
                  </div>
                )}
                {meta.publisher && (
                  <div>
                    <strong className="text-deepCharcoal">Publisher:</strong> {meta.publisher}
                  </div>
                )}
                {meta.tags && meta.tags.length > 0 && (
                  <div>
                    <strong className="text-deepCharcoal">Tags:</strong>{" "}
                    <div className="mt-2 flex flex-wrap gap-2">
                      {meta.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700"
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
      </main>
    </Layout>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  try {
    const books = await getAllBooks();
    
    console.log(`📚 Found ${books.length} books for static generation`);
    
    const paths = books
      .filter((book: { slug?: string }) => {
        if (!book?.slug) {
          console.warn('⚠️ Book missing slug:', book);
          return false;
        }
        return true;
      })
      .map((book: { slug: string }) => ({
        params: { slug: book.slug },
      }));

    console.log(`✅ Generated ${paths.length} book paths`);

    return {
      paths,
      fallback: "blocking",
    };
  } catch (err) {
    console.error("❌ Error generating static paths for /books/[slug]:", err);
    return { paths: [], fallback: "blocking" };
  }
};

export const getStaticProps: GetStaticProps<PageProps> = async ({ params }) => {
  try {
    const slugParam = params?.slug;
    const slug =
      typeof slugParam === "string"
        ? slugParam
        : Array.isArray(slugParam)
        ? slugParam[0]
        : "";

    if (!slug) {
      console.warn('❌ No slug provided');
      return { notFound: true };
    }

    console.log(`🔍 Fetching book data for: ${slug}`);
    const bookData = await getBookBySlug(slug) as BookData;

    if (!bookData) {
      console.warn(`❌ Book data not found for slug: ${slug}`);
      return { notFound: true };
    }

    if (!bookData.title) {
      console.warn(`❌ Book data missing title for slug: ${slug}`);
      return { notFound: true };
    }

    console.log(`✅ Found book: ${bookData.title}`);
    console.log(`   - Has content: ${!!bookData.content}`);
    console.log(`   - Content length: ${bookData.content?.length || 0}`);

    const { content, ...meta } = bookData;

    // Ensure ALL optional fields are serializable - replace undefined with null
    const jsonSafeMeta: PageMeta = {
      ...meta,
      // Required fields (should always have values)
      slug: meta.slug,
      title: meta.title,
      
      // String fields that might be undefined
      excerpt: meta.excerpt || null,
      description: meta.description || null,
      subtitle: meta.subtitle || null,
      author: meta.author || "Abraham of London",
      coverImage: meta.coverImage || null,
      date: meta.date || null,
      readTime: meta.readTime || null,
      lastModified: meta.lastModified || null,
      category: meta.category || null,
      isbn: meta.isbn || null,
      publisher: meta.publisher || null,
      publishedDate: meta.publishedDate || null,
      language: meta.language || null,
      price: meta.price || null,
      purchaseLink: meta.purchaseLink || null,
      
      // Array fields
      tags: meta.tags || [],
      
      // Number fields
      pages: meta.pages || null,
      rating: meta.rating || null,
      
      // Boolean fields
      featured: meta.featured || false,
      published: meta.published || false,
      draft: meta.draft || false,
      
      // Typed fields
      format: meta.format || null,
    };

    let mdxSource: MDXRemoteSerializeResult | null = null;
    
    if (content && content.trim()) {
      try {
        mdxSource = await serialize(content || "", {
          scope: jsonSafeMeta as unknown as Record<string, unknown>,
        });
        console.log(`✅ Successfully serialized MDX for: ${slug}`);
      } catch (mdxError) {
        console.error(`❌ MDX serialization failed for ${slug}:`, mdxError);
        mdxSource = null;
      }
    } else {
      console.warn(`⚠️ No content found for book: ${slug}`);
    }

    return {
      props: {
        meta: jsonSafeMeta,
        mdxSource,
      },
      revalidate: 3600,
    };
  } catch (err) {
    console.error(`💥 Error in getStaticProps for /books/[slug] (${params?.slug}):`, err);
    return { notFound: true };
  }
};