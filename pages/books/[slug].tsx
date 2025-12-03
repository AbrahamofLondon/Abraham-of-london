// pages/books/[slug].tsx
import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";

import Layout from "@/components/Layout";
import mdxComponents from "@/components/mdx-components";
import { getAllBooks, getBookBySlug } from "@/lib/content";

type BookDoc = ReturnType<typeof getAllBooks>[number];

type BookPageProps = {
  book: BookDoc;
  mdxSource: MDXRemoteSerializeResult;
};

const BookPage: NextPage<BookPageProps> = ({ book, mdxSource }) => {
  const {
    slug,
    title,
    subtitle,
    description,
    excerpt,
    author,
    publisher,
    date,
    readTime,
    coverImage,
    tags,
    aesthetic,
  } = book as BookDoc & {
    aesthetic?: {
      title: string;
      icon: string;
    };
  };

  const SITE_URL =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.abrahamoflondon.org";
  const canonicalUrl = `${SITE_URL}/books/${slug}`;

  const metaDescription =
    description || excerpt || "Curated volume from the Abraham of London Canon.";

  const dateLabel =
    date && !Number.isNaN(new Date(date).getTime())
      ? new Date(date).toLocaleDateString("en-GB", {
          year: "numeric",
          month: "short",
          day: "2-digit",
        })
      : null;

  const categoryLabel = aesthetic?.title ?? "Curated Volume";
  const categoryIcon = aesthetic?.icon ?? "◆";

  return (
    <Layout title={title}>
      <Head>
        <title>{`${title} | Curated Volume | Abraham of London`}</title>
        <meta name="description" content={metaDescription} />
        <link rel="canonical" href={canonicalUrl} />

        <meta
          property="og:title"
          content={`${title} | Curated Volume | Abraham of London`}
        />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:type" content="book" />
        <meta property="og:url" content={canonicalUrl} />
        {coverImage && (
          <meta
            property="og:image"
            content={
              coverImage.startsWith("http")
                ? coverImage
                : `${SITE_URL}${coverImage}`
            }
          />
        )}
      </Head>

      <main className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-charcoal text-cream">
        {/* HERO */}
        <section className="relative border-b border-softGold/20">
          <div className="pointer-events-none absolute inset-0 opacity-70">
            <div className="absolute inset-x-0 -top-40 h-72 bg-[radial-gradient(circle_at_top,_rgba(233,200,130,0.22),_transparent_70%)]" />
            <div className="absolute inset-y-0 left-[10%] w-px bg-gradient-to-b from-softGold/70 via-softGold/0 to-transparent" />
            <div className="absolute inset-y-0 right-[14%] w-px bg-gradient-to-t from-softGold/60 via-softGold/0 to-transparent" />
          </div>

          <div className="relative mx-auto flex max-w-6xl flex-col gap-8 px-4 pb-12 pt-16 md:flex-row md:items-end md:pb-16 md:pt-20">
            {/* Left: copy */}
            <div className="flex-1 space-y-5">
              <p className="inline-flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-[0.32em] text-softGold/80">
                <span>{categoryIcon}</span>
                <span>{categoryLabel}</span>
              </p>
              <h1 className="font-serif text-3xl font-semibold text-cream sm:text-4xl md:text-5xl">
                {title}
              </h1>
              {(subtitle || description || excerpt) && (
                <p className="max-w-3xl text-sm leading-relaxed text-gray-200 sm:text-[0.95rem]">
                  {subtitle || description || excerpt}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-3 text-[0.8rem] text-gray-300">
                {author && <span>By {author}</span>}
                {publisher && (
                  <>
                    <span className="h-3 w-px bg-white/20" />
                    <span>{publisher}</span>
                  </>
                )}
                {dateLabel && (
                  <>
                    <span className="h-3 w-px bg-white/20" />
                    <span>{dateLabel}</span>
                  </>
                )}
                {readTime && (
                  <>
                    <span className="h-3 w-px bg-white/20" />
                    <span>{readTime}</span>
                  </>
                )}
              </div>

              {tags && tags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2 text-[0.75rem] text-softGold/80">
                  {tags.slice(0, 6).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-softGold/30 px-2 py-0.5"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Right: simple meta card */}
            <aside className="w-full max-w-xs rounded-3xl border border-softGold/30 bg-black/60 px-5 py-5 text-xs text-gray-200 shadow-[0_18px_40px_rgba(0,0,0,0.9)] backdrop-blur-sm">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-softGold/80">
                Shelf Reference
              </p>
              <div className="mt-3 space-y-2">
                <p>
                  <span className="text-softGold/80">Slug:</span> {slug}
                </p>
                {dateLabel && (
                  <p>
                    <span className="text-softGold/80">Catalogued:</span>{" "}
                    {dateLabel}
                  </p>
                )}
                {tags && tags.length > 0 && (
                  <p>
                    <span className="text-softGold/80">Tags:</span>{" "}
                    {tags.join(" · ")}
                  </p>
                )}
              </div>
            </aside>
          </div>
        </section>

        {/* BODY */}
        <section className="mx-auto max-w-4xl px-4 pb-24 pt-10">
          <article
            className="
              prose prose-invert prose-lg max-w-none
              prose-headings:font-serif prose-headings:text-cream
              prose-h1:text-4xl prose-h1:mb-6
              prose-h2:text-3xl prose-h2:mt-8 prose-h2:mb-4
              prose-h3:text-2xl prose-h3:mt-6 prose-h3:mb-3
              prose-p:text-gray-200 prose-p:leading-relaxed
              prose-strong:text-cream prose-strong:font-semibold
              prose-em:text-gray-300
              prose-a:text-softGold prose-a:no-underline hover:prose-a:underline
              prose-blockquote:border-softGold/60 prose-blockquote:text-gray-100
              prose-blockquote:bg-black/40 prose-blockquote:px-6 prose-blockquote:py-4
              prose-blockquote:rounded-r-3xl
              prose-hr:border-gray-700
              prose-img:rounded-2xl prose-img:shadow-2xl
            "
          >
            <MDXRemote {...mdxSource} components={mdxComponents} />
          </article>

          {/* FOOTER */}
          <div className="mt-16 border-t border-white/10 pt-8 text-xs text-gray-400">
            <p>
              Catalogued as part of the{" "}
              <a
                href="/content"
                className="text-softGold hover:text-softGold/80"
              >
                Abraham of London Content Library
              </a>{" "}
              and the{" "}
              <a
                href="/canon"
                className="text-softGold hover:text-softGold/80"
              >
                Canon of Purpose & Governance
              </a>
              .
            </p>
          </div>
        </section>
      </main>
    </Layout>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  const books = getAllBooks();

  const paths =
    books?.map((book) => ({
      params: { slug: book.slug },
    })) ?? [];

  return {
    paths,
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps<BookPageProps> = async ({
  params,
}) => {
  const slugParam = params?.slug;
  const slug =
    typeof slugParam === "string"
      ? slugParam
      : Array.isArray(slugParam)
      ? slugParam[0]
      : "";

  if (!slug) return { notFound: true };

  const book = getBookBySlug(slug);

  if (!book) {
    return { notFound: true };
  }

  const raw = (book as any).body?.raw ?? "";
  const clean = String(raw).trim();

  const mdxSource = await serialize(clean || "# Draft Book", {
    mdxOptions: {
      remarkPlugins: [],
      rehypePlugins: [],
    },
    scope: book as unknown as Record<string, unknown>,
  });

  return {
    props: {
      book,
      mdxSource,
    },
    revalidate: 1800, // 30 min
  };
};

export default BookPage;