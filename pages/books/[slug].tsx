/* pages/books/[slug].tsx — MANUSCRIPT READER (PRODUCTION, PAGES ROUTER SAFE) */
import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";

import Layout from "@/components/Layout";

// ✅ Use your compat/contentlayer exports (no server-only)
import { allBooks } from "@/lib/contentlayer-compat";

import { prepareMDX, simpleMdxComponents } from "@/lib/server/md-utils";
import { sanitizeData } from "@/lib/content/shared";

// UI Components
import BookHero from "@/components/books/BookHero";
import BookDetails from "@/components/books/BookDetails";
import BookContent from "@/components/books/BookContent";
import PurchaseOptions from "@/components/books/PurchaseOptions";
import BookReviews from "@/components/books/BookReviews";
import RelatedBooks from "@/components/books/RelatedBooks";

import { ChevronLeft, Bookmark, BookmarkCheck, Layers, Download, ExternalLink } from "lucide-react";

type BookDoc = any;

type Book = {
  title: string;
  excerpt: string | null;
  coverImage: string | null;
  slug: string;
  url: string;
  isbn: string | null;
  author: string | null;
  publisher: string | null;
  pages: number | null;
  publishedDate: string | null;
  description: string | null;
  availableFormats?: string[];
  categories?: string[];
};

type Props = {
  book: Book;
  source: MDXRemoteSerializeResult;
};

function normalizeSlug(input: string): string {
  return (input || "").trim().replace(/^\/+/, "").replace(/\/+$/, "");
}

function isDraftContent(doc: any): boolean {
  if (!doc) return true;
  if (doc.draft === true) return true;
  if (doc.published === false) return true;
  if (doc.status && String(doc.status).toLowerCase() === "draft") return true;
  return false;
}

function getAllPublishedBooks(): BookDoc[] {
  const books = Array.isArray(allBooks) ? allBooks : [];
  return books.filter((b) => b && !isDraftContent(b));
}

function findBookBySlug(slug: string): BookDoc | null {
  const target = normalizeSlug(slug);
  const books = getAllPublishedBooks();

  for (const doc of books) {
    const candidates = [
      doc?.slug,
      doc?.href?.replace(/^\//, ""),
      doc?._raw?.flattenedPath,
      doc?._raw?.flattenedPath?.replace(/^books\//, ""),
    ]
      .filter(Boolean)
      .map((s: string) => normalizeSlug(String(s)));

    if (candidates.includes(target)) return doc;
  }
  return null;
}

const BookPage: NextPage<Props> = ({ book, source }) => {
  const router = useRouter();
  const [isBookmarked, setIsBookmarked] = React.useState(false);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem("ic_bookmarks") || "[]";
      const list = JSON.parse(raw);
      setIsBookmarked(Array.isArray(list) && list.includes(book.slug));
    } catch {
      localStorage.setItem("ic_bookmarks", "[]");
    }
  }, [book.slug]);

  const toggleBookmark = () => {
    try {
      const raw = localStorage.getItem("ic_bookmarks") || "[]";
      const list = Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : [];
      const next = isBookmarked ? list.filter((s: string) => s !== book.slug) : [...list, book.slug];
      localStorage.setItem("ic_bookmarks", JSON.stringify(next));
      setIsBookmarked(!isBookmarked);
    } catch {
      // silent fail
    }
  };

  const formattedDate = book.publishedDate
    ? new Date(book.publishedDate).toLocaleDateString("en-GB", { year: "numeric", month: "long" })
    : "In Preparation";

  return (
    <Layout title={`${book.title} | Books`}>
      <Head>
        <title>{book.title} | Abraham of London</title>
        <meta name="description" content={book.excerpt || ""} />
        <meta property="og:type" content="book" />
        {book.coverImage ? <meta property="og:image" content={book.coverImage} /> : null}
        <link rel="canonical" href={`https://abrahamoflondon.com/books/${book.slug}`} />
      </Head>

      <div className="min-h-screen bg-black text-cream selection:bg-gold selection:text-black">
        <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <button
              onClick={() => router.push("/books")}
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-white transition-all group"
            >
              <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Back to Library
            </button>

            <button
              onClick={toggleBookmark}
              className={[
                "p-2 rounded-lg border transition-all",
                isBookmarked
                  ? "bg-gold/10 border-gold/30 text-gold"
                  : "bg-white/5 border-white/10 text-gray-500 hover:text-white",
              ].join(" ")}
              aria-label="Bookmark"
            >
              {isBookmarked ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
            </button>
          </div>
        </div>

        <BookHero
          title={book.title}
          author={book.author || "Abraham of London"}
          coverImage={book.coverImage || ""}
          excerpt={book.excerpt}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
          <div className="grid lg:grid-cols-12 gap-12">
            <main className="lg:col-span-8">
              <div className="bg-zinc-900/40 border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl">
                <BookDetails
                  isbn={book.isbn}
                  publisher={book.publisher}
                  pages={book.pages}
                  publishedDate={formattedDate}
                />

                <article className="mt-12 prose prose-invert prose-gold max-w-none prose-headings:font-serif prose-p:leading-relaxed prose-p:text-gray-300">
                  <BookContent>
                    <MDXRemote {...source} components={simpleMdxComponents as any} />
                  </BookContent>
                </article>

                {Array.isArray(book.categories) && book.categories.length ? (
                  <div className="mt-16 pt-8 border-t border-white/5 flex flex-wrap gap-2">
                    {book.categories.map((c) => (
                      <span
                        key={c}
                        className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-gray-500"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                ) : null}

                <div className="mt-12 pt-8 border-t border-white/5">
                  <PurchaseOptions book={book} />
                </div>
              </div>

              <div className="mt-12">
                <BookReviews bookTitle={book.title} />
              </div>
            </main>

            <aside className="lg:col-span-4 space-y-8">
              <div className="sticky top-24 space-y-6">
                <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-sm">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-gold mb-6 flex items-center gap-2">
                    <Layers size={16} /> Related Intelligence
                  </h3>
                  <RelatedBooks currentBookSlug={book.slug} />
                </div>

                <div className="p-6 rounded-3xl bg-gradient-to-br from-gold/10 to-transparent border border-gold/20">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-white mb-6 flex items-center gap-2">
                    <Download size={16} className="text-gold" /> Formats
                  </h3>
                  <div className="space-y-2">
                    {["Standard PDF", "Institutional EPUB", "Archival Audio"].map((f) => (
                      <button
                        key={f}
                        className="w-full text-left px-4 py-3 rounded-xl bg-white/5 border border-white/5 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-gold hover:bg-white/10 transition-all flex justify-between items-center group"
                        type="button"
                      >
                        {f} <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-all" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5">
                  <h3 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-widest">Metadata</h3>
                  <div className="space-y-3 font-mono text-[10px] uppercase text-gray-600">
                    <div className="flex justify-between">
                      <span>Pages</span>
                      <span className="text-gray-400">{book.pages || "---"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>ISBN</span>
                      <span className="text-gray-400">{book.isbn || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Release</span>
                      <span className="text-gray-400">{book.publishedDate ? "GA" : "Draft"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  try {
    const books = getAllPublishedBooks();
    const paths = books
      .map((b: any) => {
        const slug = b?.slug || b?._raw?.flattenedPath?.replace(/^books\//, "");
        return typeof slug === "string" ? normalizeSlug(slug) : "";
      })
      .filter(Boolean)
      .map((slug: string) => ({ params: { slug } }));

    return { paths, fallback: "blocking" };
  } catch (e) {
    console.error("[books/getStaticPaths] error:", e);
    return { paths: [], fallback: "blocking" };
  }
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  try {
    const slug = typeof params?.slug === "string" ? params.slug : Array.isArray(params?.slug) ? params?.slug.join("/") : "";
    const normalized = normalizeSlug(slug);
    if (!normalized) return { notFound: true };

    const doc = findBookBySlug(normalized);
    if (!doc) return { notFound: true };

    const rawMdx = String(doc?.body?.raw ?? doc?.bodyRaw ?? doc?.body ?? "");
    const mdxResult = await prepareMDX(rawMdx);

    // prepareMDX may return either MDXRemoteSerializeResult or { source, ... }
    const source: MDXRemoteSerializeResult =
      (mdxResult as any)?.compiledSource
        ? (mdxResult as MDXRemoteSerializeResult)
        : (mdxResult as any)?.source
          ? ((mdxResult as any).source as MDXRemoteSerializeResult)
          : ({ compiledSource: "", scope: {}, frontmatter: {} } as any);

    const book: Book = {
      title: doc?.title || "Untitled Volume",
      excerpt: doc?.excerpt || doc?.description || null,
      coverImage: doc?.coverImage || null,
      slug: doc?.slug || normalized,
      url: `/books/${doc?.slug || normalized}`,
      isbn: doc?.isbn ?? null,
      author: doc?.author ?? null,
      publisher: doc?.publisher ?? null,
      pages: doc?.pages ?? null,
      publishedDate: doc?.date ?? null,
      description: doc?.description ?? null,
      availableFormats: Array.isArray(doc?.availableFormats) ? doc.availableFormats : [],
      categories: Array.isArray(doc?.categories) ? doc.categories : [],
    };

    return {
      props: {
        book: sanitizeData(book),
        source: JSON.parse(JSON.stringify(source)),
      },
      revalidate: 1800,
    };
  } catch (e) {
    console.error(`[books/getStaticProps] fatal for slug ${String(params?.slug)}:`, e);
    return { notFound: true };
  }
};

export default BookPage;