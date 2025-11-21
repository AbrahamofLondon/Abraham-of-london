// pages/books/[slug].tsx

import type {
  GetStaticPaths,
  GetStaticProps,
  InferGetStaticPropsType,
} from "next";
import Head from "next/head";
import Image from "next/image";
import Layout from "@/components/Layout";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import { mdxComponents } from "@/components/mdx-components";
import { getAllBooks, getBookBySlug } from "@/lib/books";

/**
 * Shape we actually need on the page – kept loose to avoid
 * fighting with server-side types.
 */
type SerializableBook = {
  slug: string;
  title?: string;
  subtitle?: string;
  description?: string;
  excerpt?: string;
  author?: string;
  date?: string | null;
  coverImage?: string | null;
  category?: string | null;
  tags?: string[] | null;
  readTime?: string | null;
  mdxSource?: MDXRemoteSerializeResult | null;
  content?: string | null;
  status?: string | null;
  [key: string]: unknown;
};

type BookPageProps = {
  book: SerializableBook;
};

/* -------------------------------------------------------------------------- */
/*  Static paths                                                              */
/* -------------------------------------------------------------------------- */

export const getStaticPaths: GetStaticPaths = async () => {
  const books = await Promise.resolve(getAllBooks());

  const slugs =
    Array.isArray(books) && books.length
      ? books
          .map((b: any) => b?.slug)
          .filter(
            (s): s is string =>
              typeof s === "string" && s.trim().length > 0,
          )
      : [];

  const paths = slugs.map((slug) => ({ params: { slug } }));

  return {
    paths,
    fallback: false,
  };
};

/* -------------------------------------------------------------------------- */
/*  Static props – fully JSON-safe                                            */
/* -------------------------------------------------------------------------- */

export const getStaticProps: GetStaticProps<BookPageProps> = async (ctx) => {
  const slugParam = ctx.params?.slug;
  const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam ?? "";

  if (!slug) {
    return { notFound: true };
  }

  const rawBook = await Promise.resolve(getBookBySlug(slug));

  if (!rawBook) {
    return { notFound: true };
  }

  // 🔐 Make every Date a string so Next.js can serialise it
  const serialised = JSON.parse(
    JSON.stringify(rawBook, (_key, value) =>
      value instanceof Date ? value.toISOString() : value,
    ),
  ) as SerializableBook;

  return {
    props: {
      book: serialised,
    },
    revalidate: 3600,
  };
};

/* -------------------------------------------------------------------------- */
/*  Page component                                                            */
/* -------------------------------------------------------------------------- */

export default function BookPage(
  props: InferGetStaticPropsType<typeof getStaticProps>,
) {
  const { book } = props;

  const {
    title,
    subtitle,
    description,
    excerpt,
    author,
    date,
    coverImage,
    category,
    tags,
    mdxSource,
    content,
    readTime,
    status,
  } = book;

  const pageTitle = title || "Book";

  const displayDate =
    date && typeof date === "string" && !Number.isNaN(Date.parse(date))
      ? new Intl.DateTimeFormat("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }).format(new Date(date))
      : null;

  const safeCover =
    typeof coverImage === "string" && coverImage.trim().length > 0
      ? coverImage
      : null;

  const hasMdxSource =
    mdxSource &&
    typeof mdxSource === "object" &&
    "compiledSource" in mdxSource;

  const displayDescription = description || excerpt || "";

  return (
    <Layout title={pageTitle}>
      <Head>
        <title>{pageTitle} | Abraham of London</title>
        {displayDescription && (
          <meta name="description" content={displayDescription} />
        )}
      </Head>

      {/* Premium background frame */}
      <div className="bg-gradient-to-b from-black via-deepCharcoal to-black">
        <main className="mx-auto max-w-6xl px-4 pb-16 pt-10 lg:pt-12">
          {/* Breadcrumb */}
          <nav className="mb-6 text-sm text-gray-400">
            <a
              href="/"
              className="hover:text-softGold hover:underline underline-offset-4"
            >
              Home
            </a>
            <span className="mx-2 select-none text-gray-500">/</span>
            <a
              href="/books"
              className="hover:text-softGold hover:underline underline-offset-4"
            >
              Books
            </a>
            {title && (
              <>
                <span className="mx-2 select-none text-gray-500">/</span>
                <span className="text-gray-300 line-clamp-1">{title}</span>
              </>
            )}
          </nav>

          {/* HERO PANEL */}
          <section className="mb-10 rounded-3xl border border-white/15 bg-gradient-to-br from-softGold/10 via-deepCharcoal to-black p-6 shadow-2xl shadow-black/40 md:p-8 lg:p-10">
            <div className="pointer-events-none absolute -z-10 h-80 w-80 rounded-full bg-softGold/15 blur-3xl" />
            <div className="pointer-events-none absolute right-[-10%] top-1/2 -z-10 h-96 w-96 -translate-y-1/2 rounded-full bg-forest/15 blur-3xl" />

            <div className="grid gap-8 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)]">
              {/* Cover / Placeholder */}
              <div className="flex items-stretch justify-center">
                {safeCover ? (
                  <div className="relative h-64 w-44 overflow-hidden rounded-2xl border border-white/20 bg-black/40 shadow-2xl shadow-black/60 md:h-80 md:w-56">
                    <Image
                      src={safeCover}
                      alt={title ?? ""}
                      fill
                      sizes="(max-width: 768px) 50vw, 320px"
                      className="object-cover"
                      priority
                    />
                  </div>
                ) : (
                  <div className="flex h-64 w-44 items-center justify-center rounded-2xl border border-dashed border-softGold/40 bg-black/40 shadow-xl shadow-black/60 md:h-80 md:w-56">
                    <span className="px-4 text-center text-xs font-semibold uppercase tracking-[0.2em] text-softGold/80">
                      Cover Design
                      <br />
                      In Progress
                    </span>
                  </div>
                )}
              </div>

              {/* Meta & positioning */}
              <div className="flex flex-col justify-center">
                <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-softGold">
                  <span>{category || "Book"}</span>
                  {status && (
                    <>
                      <span className="text-white/30">•</span>
                      <span className="rounded-full bg-softGold/15 px-3 py-1 text-[10px] tracking-[0.25em] text-softGold">
                        {status}
                      </span>
                    </>
                  )}
                </div>

                <h1 className="mb-2 max-w-3xl font-serif text-3xl font-semibold text-white md:text-4xl lg:text-5xl">
                  {title}
                </h1>

                {subtitle && (
                  <p className="mb-4 max-w-3xl text-base text-amber-100/90 md:text-lg">
                    {subtitle}
                  </p>
                )}

                {displayDescription && (
                  <p className="mb-6 max-w-3xl text-sm text-gray-200 md:text-base">
                    {displayDescription}
                  </p>
                )}

                <div className="mb-5 flex flex-wrap items-center gap-3 text-xs text-gray-300 md:text-sm">
                  {author && (
                    <span>
                      <span className="font-semibold text-softGold">Author</span>{" "}
                      {author}
                    </span>
                  )}
                  {displayDate && (
                    <>
                      <span aria-hidden className="text-gray-500">
                        •
                      </span>
                      <span>
                        <span className="font-semibold text-softGold">
                          Established
                        </span>{" "}
                        {displayDate}
                      </span>
                    </>
                  )}
                  {readTime && (
                    <>
                      <span aria-hidden className="text-gray-500">
                        •
                      </span>
                      <span>
                        <span className="font-semibold text-softGold">
                          Est. read
                        </span>{" "}
                        {readTime}
                      </span>
                    </>
                  )}
                </div>

                {tags && tags.length > 0 && (
                  <div className="mb-6 flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center rounded-full bg-black/40 px-3 py-1 text-xs text-gray-200"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Top-level CTA row */}
                <div className="flex flex-wrap gap-3">
                  <a
                    href="#book-content"
                    className="inline-flex items-center rounded-full bg-softGold px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-slate-950 shadow-lg shadow-black/50 transition hover:bg-softGold/90"
                  >
                    Read Overview
                  </a>
                  <a
                    href="/contact"
                    className="inline-flex items-center rounded-full border border-white/40 px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-white/90 transition hover:bg-white/10"
                  >
                    Discuss this project
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* MAIN CONTENT CARD */}
          <section
            id="book-content"
            className="mx-auto max-w-4xl rounded-3xl bg-white/95 p-6 shadow-xl shadow-black/30 ring-1 ring-black/5 md:p-10"
          >
            {/* Short intro / excerpt */}
            {excerpt && (
              <p className="mb-6 text-sm font-medium uppercase tracking-[0.22em] text-gray-500">
                {excerpt}
              </p>
            )}

            {hasMdxSource ? (
              <article className="prose prose-lg max-w-none text-deepCharcoal prose-headings:font-serif prose-headings:text-deepCharcoal prose-a:text-forest prose-a:no-underline hover:prose-a:underline">
                <MDXRemote
                  {...(mdxSource as MDXRemoteSerializeResult)}
                  components={mdxComponents as any}
                />
              </article>
            ) : content ? (
              // Basic fallback if we only have raw content but no compiled MDX
              <article className="prose prose-lg max-w-none whitespace-pre-wrap text-deepCharcoal prose-headings:font-serif prose-a:text-forest">
                {String(content)}
              </article>
            ) : (
              <p className="mt-2 text-sm text-gray-700">
                Full details for this book are coming soon. The title and
                positioning are being set first so we can design and test the
                ecosystem around it.
              </p>
            )}

            {/* CTA STRIP */}
            <section className="mt-10 rounded-2xl bg-gradient-to-r from-forest via-deepCharcoal to-softGold p-6 text-center text-white md:p-8">
              <h2 className="mb-3 text-xl font-serif font-semibold md:text-2xl">
                This isn&apos;t just a book – it&apos;s part of a system.
              </h2>
              <p className="mx-auto mb-6 max-w-2xl text-sm opacity-90 md:text-base">
                Plug into the wider Fathering Without Fear / Abraham of London
                ecosystem: downloads, events, and private strategy work that
                take these ideas off the page and into real life.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <a
                  href="/downloads"
                  className="inline-flex items-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-deepCharcoal transition hover:bg-gray-100"
                >
                  Explore Strategic Downloads
                </a>
                <a
                  href="/events"
                  className="inline-flex items-center rounded-full border border-white px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  View Upcoming Events
                </a>
                <a
                  href="/newsletter"
                  className="inline-flex items-center rounded-full border border-white/60 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Join the Inner Circle
                </a>
              </div>
            </section>
          </section>
        </main>
      </div>
    </Layout>
  );
}