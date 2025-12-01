// pages/books/[slug].tsx
import * as React from "react";
import type { GetStaticPaths, GetStaticProps } from "next";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";

import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";

import SiteLayout from "@/components/SiteLayout";
import mdxComponents from "@/components/mdx-components";
import Quote from "@/components/Quote";
import Callout from "@/components/Callout";
import Divider from "@/components/Divider";
import { allBooks, type Book } from "contentlayer/generated";

// ---- SLUG ALIASES ----------------------------------------------------
const BOOK_SLUG_ALIASES: Record<string, string> = {
  "the-architecture-of-human-purpose-landing": "the-architecture-of-human-purpose",
};

function resolveBookBySlug(slug: string): Book | undefined {
  const canonicalSlug = BOOK_SLUG_ALIASES[slug] ?? slug;
  return allBooks.find((b) => b.slug === canonicalSlug);
}

// ---- TYPES -----------------------------------------------------------
interface BookPageMeta {
  title: string;
  subtitle?: string | null;
  description?: string | null;
  excerpt?: string | null;
  slug: string;
  coverImage?: string | null;
  author?: string | null;
  readTime?: string | null;
  tags: string[];
  featured: boolean;
  draft: boolean;
  lastModified?: string | null;
  category?: string | null;
  isbn?: string | null;
  publisher?: string | null;
  publishedDate?: string | null;
  language?: string | null;
  price?: string | null;
  purchaseLink?: string | null;
  accessLevel?: string | null;
  lockMessage?: string | null;
  pages?: number | null;
  rating?: number | null;
  status?: string | null;
  format?: string | null;
  published?: boolean | null;
}

interface BookPageProps {
  meta: BookPageMeta;
  mdxSource: MDXRemoteSerializeResult;
}

// ---- HELPER FUNCTION -------------------------------------------------
function removeUndefined<T extends Record<string, any>>(obj: T): Partial<T> {
  const result: Partial<T> = {};
  Object.keys(obj).forEach(key => {
    if (obj[key] !== undefined) {
      result[key as keyof T] = obj[key];
    }
  });
  return result;
}

// ---- ENHANCED MDX COMPONENTS -----------------------------------------
type MDXComponentProps = {
  children?: React.ReactNode;
  className?: string;
} & Record<string, unknown>;

type AnchorProps = React.ComponentPropsWithoutRef<"a">;

const enhancedMdxComponents = {
  ...mdxComponents,
  Quote: (props: MDXComponentProps) => (
    <div className="my-8">
      <Quote {...props} />
    </div>
  ),
  Callout: (props: MDXComponentProps) => (
    <div className="my-6">
      <Callout {...props} />
    </div>
  ),
  Divider: (props: MDXComponentProps) => (
    <div className="my-10">
      <Divider {...props} />
    </div>
  ),
  a: ({ href, children, ...props }: AnchorProps) => {
    const safeHref = href ?? "#";
    const isInternal = safeHref.startsWith("/") || safeHref.startsWith("#");

    if (isInternal) {
      return (
        <Link
          href={safeHref}
          className="text-softGold hover:text-softGold/80 transition-colors duration-200 underline underline-offset-4"
          {...props}
        >
          {children}
        </Link>
      );
    }

    return (
      <a
        href={safeHref}
        target="_blank"
        rel="noopener noreferrer"
        className="text-softGold hover:text-softGold/80 transition-colors duration-200 underline underline-offset-4"
        {...props}
      >
        {children}
      </a>
    );
  },
};

// ---- ENHANCED SHARE COMPONENT ----------------------------------------
type BookShareProps = {
  meta: BookPageMeta;
};

function BookShare({ meta }: BookShareProps): JSX.Element {
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.abrahamoflondon.org";
  const url = `${SITE_URL}/books/${meta.slug}`;
  const text = `"${meta.title}" by Abraham of London`;
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(text);

  const shareButtons = [
    {
      name: "LinkedIn",
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      icon: "👔",
    },
    {
      name: "X",
      url: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      icon: "🐦",
    },
    {
      name: "WhatsApp",
      url: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
      icon: "💬",
    },
    {
      name: "Email",
      url: `mailto:?subject=${encodedText}&body=${encodedText}%0A%0A${encodedUrl}`,
      icon: "✉️",
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs uppercase tracking-[0.18em] text-gray-500 mr-2">
        Share:
      </span>
      {shareButtons.map((button) => (
        <a
          key={button.name}
          href={button.url}
          target="_blank"
          rel="noopener noreferrer"
          className="
            inline-flex items-center gap-1.5
            rounded-full border border-gray-600 
            px-3 py-1.5 text-xs text-gray-200 
            transition-all duration-200 
            hover:border-softGold hover:text-softGold 
            hover:shadow-lg hover:scale-105
          "
          title={`Share on ${button.name}`}
        >
          <span className="text-xs">{button.icon}</span>
          {button.name}
        </a>
      ))}
    </div>
  );
}

// ---- MAIN PAGE COMPONENT ---------------------------------------------
const BookPage = ({ meta, mdxSource }: BookPageProps) => {
  const {
    title,
    subtitle,
    description,
    excerpt,
    coverImage,
    author,
    readTime,
    tags,
    category,
    publishedDate,
    pages,
    language,
    isbn,
    rating,
    price,
    purchaseLink,
    publisher,
    accessLevel,
    lockMessage,
    lastModified,
  } = meta;

  const [hasAccess, setHasAccess] = React.useState(false);
  const [checkedAccess, setCheckedAccess] = React.useState(false);

  React.useEffect(() => {
    const checkAccess = () => {
      if (typeof document !== "undefined") {
        const hasCookie = document.cookie
          .split(";")
          .map((part) => part.trim())
          .some((part) => part.startsWith("innerCircleAccess=true"));
        setHasAccess(hasCookie);
      }
      setCheckedAccess(true);
    };
    checkAccess();
  }, []);

  const pageTitle = `${title} | Books | Abraham of London`;
  const desc = description || excerpt || subtitle || "Book from Abraham of London.";
  const isInnerCircle = accessLevel === "inner-circle";
  const isLocked = isInnerCircle && (!checkedAccess || !hasAccess);
  
  const catalogueDate = lastModified && !Number.isNaN(new Date(lastModified).getTime())
    ? new Date(lastModified).toLocaleDateString("en-GB", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  const joinUrl = `/inner-circle?returnTo=${encodeURIComponent(`/books/${meta.slug}`)}`;

  // Enhanced metadata display
  const metadataItems = [
    { label: "Read time", value: readTime },
    { label: "Published", value: publishedDate },
    { label: "Pages", value: pages },
    { label: "Language", value: language },
    { label: "ISBN", value: isbn },
    { label: "Rating", value: rating ? `${rating}/5` : null },
    { label: "Category", value: category },
    { label: "Price", value: price },
  ].filter((item) => item.value);

  return (
    <SiteLayout pageTitle={pageTitle} metaDescription={desc}>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={desc} />
        <link rel="canonical" href={`${process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.abrahamoflondon.org"}/books/${meta.slug}`} />
        {coverImage && <meta property="og:image" content={coverImage} />}
        {coverImage && <meta name="twitter:image" content={coverImage} />}
      </Head>

      <article className="min-h-screen bg-gradient-to-b from-charcoal to-charcoal-dark text-cream">
        {/* Enhanced Header Section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-charcoal via-charcoal/95 to-charcoal/90">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-softGold/5 via-transparent to-transparent"></div>
          </div>

          <div className="relative mx-auto max-w-7xl px-6 py-16">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
              {/* Cover Image - Enhanced */}
              <div className="flex items-start justify-center lg:col-span-1">
                {coverImage && (
                  <div className="relative group">
                    <div className="absolute -inset-4 bg-gradient-to-r from-softGold/20 to-softGold/10 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500"></div>
                    <div className="relative">
                      <Image
                        src={coverImage}
                        alt={title}
                        width={400}
                        height={560}
                        className="h-auto w-full max-w-xs rounded-xl shadow-2xl transform group-hover:scale-105 transition-transform duration-500 border-2 border-softGold/30"
                        priority
                      />
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Metadata - Enhanced */}
              <div className="lg:col-span-2">
                <header className="mb-8">
                  {/* Title Section */}
                  <div className="mb-6">
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      <h1 className="font-serif text-4xl lg:text-5xl font-bold text-cream leading-tight">
                        {title}
                      </h1>

                      {isInnerCircle && (
                        <span className="inline-flex items-center rounded-full border border-softGold/70 bg-softGold/10 px-4 py-2 text-sm font-semibold uppercase tracking-[0.18em] text-softGold transform hover:scale-105 transition-transform duration-200">
                          <span className="mr-2">🔒</span>
                          Inner Circle Volume
                        </span>
                      )}
                    </div>

                    {subtitle && (
                      <p className="text-xl lg:text-2xl text-gray-300 font-light leading-relaxed">
                        {subtitle}
                      </p>
                    )}
                  </div>

                  {/* Author & Publisher */}
                  <div className="mb-6 space-y-3">
                    {author && (
                      <p className="text-lg text-gray-300">
                        By{" "}
                        <span className="font-semibold text-softGold">
                          {author}
                        </span>
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                      {publisher && (
                        <span className="flex items-center gap-2">
                          <span className="w-1 h-1 bg-softGold rounded-full"></span>
                          Published by {publisher}
                        </span>
                      )}
                      {catalogueDate && (
                        <span className="flex items-center gap-2">
                          <span className="w-1 h-1 bg-softGold rounded-full"></span>
                          Added {catalogueDate}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  {description && (
                    <p className="mb-6 text-lg leading-relaxed text-gray-300 border-l-4 border-softGold/50 pl-4">
                      {description}
                    </p>
                  )}

                  {/* Enhanced Inner Circle Banner */}
                  {isInnerCircle && (
                    <div className="rounded-2xl border border-softGold/50 bg-black/40 p-6 backdrop-blur-sm transform hover:scale-[1.02] transition-transform duration-300">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-softGold/80 mb-2">
                        🔒 Inner Circle Exclusive
                      </p>
                      <p className="text-cream leading-relaxed">
                        {lockMessage || "This volume is catalogued as part of the Inner Circle library. Full access is reserved for members who are building the next generation of purpose-driven leadership."}
                      </p>
                    </div>
                  )}
                </header>

                {/* Enhanced Metadata Grid */}
                {metadataItems.length > 0 && (
                  <section className="mb-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {metadataItems.map((item, index) => (
                        <div
                          key={item.label}
                          className="text-center p-4 rounded-xl bg-black/30 border border-gray-700/50 transform hover:scale-105 transition-all duration-200"
                          style={{ animationDelay: `${index * 100}ms` }}
                        >
                          <div className="text-sm font-semibold text-softGold mb-1">
                            {item.label}
                          </div>
                          <div className="text-lg font-medium text-cream">
                            {item.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Enhanced Action Buttons */}
                <div className="flex flex-wrap items-center gap-4">
                  {purchaseLink && (
                    <a
                      href={purchaseLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-full bg-softGold px-8 py-4 text-sm font-semibold text-black shadow-lg transition-all duration-300 hover:bg-softGold/90 hover:shadow-xl hover:scale-105 transform"
                    >
                      <span>🛒</span>
                      Purchase Book
                    </a>
                  )}

                  <div className="flex-1 min-w-[200px]">
                    <BookShare meta={meta} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="mx-auto max-w-4xl px-6 pb-20">
          <section className="prose prose-invert prose-lg max-w-none prose-headings:font-serif prose-headings:text-cream prose-h1:mb-8 prose-h1:text-4xl prose-h1:font-bold prose-h1:leading-tight prose-h2:mb-6 prose-h2:text-3xl prose-h2:font-semibold prose-h3:mb-4 prose-h3:text-2xl prose-h3:font-semibold prose-h4:mb-4 prose-h4:text-xl prose-h4:font-semibold prose-p:mb-6 prose-p:text-gray-200 prose-p:leading-relaxed prose-p:text-lg prose-strong:font-semibold prose-strong:text-cream prose-a:text-softGold prose-a:no-underline hover:prose-a:underline prose-ul:text-gray-200 prose-ol:text-gray-200 prose-li:mb-2 prose-li:leading-relaxed prose-blockquote:border-softGold prose-blockquote:border-l-4 prose-blockquote:bg-charcoal/50 prose-blockquote:pl-6 prose-blockquote:py-4 prose-blockquote:italic prose-blockquote:text-gray-300 prose-blockquote:rounded-r-xl prose-blockquote:my-8 prose-hr:my-12 prose-hr:border-gray-600 prose-img:rounded-2xl prose-img:shadow-2xl prose-img:mx-auto prose-pre:border prose-pre:border-gray-700 prose-pre:bg-gray-900 prose-pre:rounded-xl prose-pre:p-6 prose-table:border-gray-600 prose-td:border-gray-600 prose-th:bg-gray-800 prose-th:text-cream">
            {isInnerCircle && isLocked ? (
              <div className="rounded-2xl border-2 border-softGold/50 bg-gradient-to-br from-black/70 to-charcoal/90 px-8 py-16 text-center backdrop-blur-sm transform hover:scale-[1.01] transition-transform duration-500">
                <div className="max-w-md mx-auto">
                  <div className="text-6xl mb-6">🔒</div>
                  <h3 className="font-serif text-3xl text-cream mb-4">
                    Inner Circle Volume
                  </h3>
                  <p className="text-lg leading-relaxed text-gray-200 mb-8">
                    {lockMessage || "This manuscript is reserved for Inner Circle members. Unlock access to read the full volume and join a community of builders shaping the future."}
                  </p>
                  <Link
                    href={joinUrl}
                    className="inline-flex items-center gap-2 rounded-full bg-softGold px-8 py-4 text-sm font-semibold text-black transition-all duration-300 hover:bg-softGold/90 hover:scale-105 hover:shadow-xl transform"
                  >
                    <span>⚡</span>
                    Join the Inner Circle
                  </Link>
                </div>
              </div>
            ) : mdxSource ? (
              <MDXRemote {...mdxSource} components={enhancedMdxComponents as any} />
            ) : (
              <div className="rounded-2xl border-2 border-dashed border-gray-600 bg-charcoal/30 py-20 text-center transform hover:scale-[1.01] transition-transform duration-500">
                <div className="max-w-md mx-auto">
                  <div className="text-6xl mb-6">📖</div>
                  <h3 className="font-serif text-3xl text-cream mb-4">
                    Content Coming Soon
                  </h3>
                  <p className="text-lg leading-relaxed text-gray-300 mb-8">
                    The full manuscript of this volume is being prepared for publication. This is an early catalogue entry from the Abraham of London library archives.
                  </p>
                  <Link
                    href="/subscribe"
                    className="inline-flex items-center gap-2 rounded-full bg-softGold px-6 py-3 text-sm font-semibold text-black transition-all duration-300 hover:bg-softGold/90 hover:scale-105"
                  >
                    <span>✨</span>
                    Join the Founding Readers Circle
                  </Link>
                </div>
              </div>
            )}
          </section>

          {/* Enhanced Additional Info */}
          {(publisher || (tags && tags.length > 0)) && (
            <div className="mt-20 border-t border-gray-700 pt-12">
              <h3 className="font-serif text-2xl font-semibold text-cream mb-8 text-center">
                Book Details
              </h3>
              <div className="grid gap-8 md:grid-cols-2">
                {publisher && (
                  <div className="text-center p-6 rounded-xl bg-black/30 border border-gray-700/50">
                    <div className="text-sm font-semibold text-softGold mb-2">
                      Publisher
                    </div>
                    <div className="text-lg text-cream">{publisher}</div>
                  </div>
                )}

                {tags && tags.length > 0 && (
                  <div className="text-center p-6 rounded-xl bg-black/30 border border-gray-700/50">
                    <div className="text-sm font-semibold text-softGold mb-4">
                      Tags & Categories
                    </div>
                    <div className="flex flex-wrap justify-center gap-2">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-gray-600 bg-gray-700/50 px-4 py-2 text-sm text-gray-300 transform hover:scale-105 transition-transform duration-200"
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
        </div>
      </article>
    </SiteLayout>
  );
};

// ---- SSG ---------------------------------------------------------------
export const getStaticPaths: GetStaticPaths = async () => {
  const basePaths = allBooks.map((book) => ({
    params: { slug: book.slug },
  }));

  const aliasPaths = Object.keys(BOOK_SLUG_ALIASES).map((alias) => ({
    params: { slug: alias },
  }));

  return {
    paths: [...basePaths, ...aliasPaths],
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps<BookPageProps> = async ({ params }) => {
  const rawSlug = params?.slug;
  const slug = typeof rawSlug === "string" ? rawSlug : Array.isArray(rawSlug) ? rawSlug[0] : "";

  const book = resolveBookBySlug(slug);

  if (!book) {
    return { notFound: true };
  }

  const mdxSource = await serialize(book.body.raw, {
    mdxOptions: {
      remarkPlugins: [remarkGfm],
      rehypePlugins: [rehypeSlug],
    },
  });

  // Build clean meta object without undefined values
  const cleanMeta = removeUndefined({
    title: book.title,
    subtitle: book.subtitle ?? null,
    description: book.description ?? null,
    excerpt: book.excerpt ?? null,
    slug: slug,
    coverImage: book.coverImage ?? null,
    author: book.author ?? "Abraham of London",
    readTime: book.readTime ?? null,
    tags: book.tags ?? [],
    featured: !!book.featured,
    draft: !!book.draft,
    lastModified: book.lastModified ?? null,
    // Additional fields from the previous design
    category: book.category ?? null,
    isbn: book.isbn ?? null,
    publisher: book.publisher ?? null,
    publishedDate: book.publishedDate ?? null,
    language: book.language ?? null,
    price: book.price ?? null,
    purchaseLink: book.purchaseLink ?? null,
    accessLevel: book.accessLevel ?? null,
    lockMessage: book.lockMessage ?? null,
    pages: book.pages ?? null,
    rating: book.rating ?? null,
    status: book.status ?? null,
    format: book.format ?? null,
    published: book.published ?? null,
  });

  return {
    props: {
      meta: cleanMeta as BookPageMeta,
      mdxSource,
    },
    revalidate: 3600,
  };
};

export default BookPage;