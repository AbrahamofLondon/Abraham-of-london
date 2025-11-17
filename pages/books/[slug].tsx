
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

  return (
    <Layout title={pageTitle}>
      <Head>
        <title>{pageTitle} | Abraham of London</title>
        {description && <meta name="description" content={description} />}
        {excerpt && !description && (
          <meta name="description" content={excerpt} />
        )}
      </Head>

      <main className="mx-auto max-w-4xl px-4 py-10">
        {/* Header */}
        <header className="mb-8">
          {safeCover && (
            <div className="relative mb-6 aspect-[16/9] overflow-hidden rounded-2xl border border-lightGrey bg-black/5">
              <Image
                src={safeCover}
                alt={title ?? ""}
                fill
                sizes="(min-width: 1024px) 960px, 100vw"
                className="object-cover"
              />
            </div>
          )}

          <p className="text-xs uppercase tracking-wide text-gray-500">
            {category || "Book"}
          </p>

          <h1 className="mt-1 font-serif text-3xl font-semibold text-deepCharcoal sm:text-4xl">
            {title}
          </h1>

          {subtitle && (
            <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
            {author && <span>By {author}</span>}
            {displayDate && (
              <>
                <span aria-hidden>•</span>
                <span>{displayDate}</span>
              </>
            )}
            {book.readTime && (
              <>
                <span aria-hidden>•</span>
                <span>{book.readTime}</span>
              </>
            )}
            {tags && tags.length > 0 && (
              <>
                <span aria-hidden>•</span>
                <span>{tags.join(" · ")}</span>
              </>
            )}
          </div>
        </header>

        {/* Short intro / excerpt */}
        {excerpt && (
          <p className="mb-6 text-sm text-gray-700">{excerpt}</p>
        )}

        {/* Main content */}
        {hasMdxSource ? (
           <article className="prose prose-sm max-w-none text-gray-800 prose-headings:font-serif prose-a:text-forest">
            <MDXRemote
              {...(mdxSource as MDXRemoteSerializeResult)}
              components={mdxComponents as any}
            />
          </article>
        ) : content ? (
          // Basic fallback if we only have raw content but no compiled MDX
          <article className="prose prose-sm max-w-none whitespace-pre-wrap text-gray-800 prose-headings:font-serif prose-a:text-forest">
            {String(content)}
          </article>
        ) : (
          <p className="mt-6 text-sm text-gray-600">
            Full details for this book are coming soon. The title and
            positioning are set first so we can design and test the
            ecosystem around it.
          </p>
        )}
      </main>
    </Layout>
  );
}