// pages/books/[slug].tsx — FINAL BUILD-PROOF (seed + proxy, Pages Router)
import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";

import Layout from "@/components/Layout";
import { allBooks } from "@/lib/contentlayer-compat";
import { sanitizeData } from "@/lib/content/shared";
import { createSeededSafeMdxComponents } from "@/lib/mdx/safe-components";
import mdxComponents from "@/components/mdx-components";

import BookHero from "@/components/books/BookHero";
import BookDetails from "@/components/books/BookDetails";
import BookContent from "@/components/books/BookContent";

// Make ALL components that might have .map() operations client-only
const PurchaseOptions = dynamic(() => import("@/components/books/PurchaseOptions"), {
  ssr: false,
  loading: () => (
    <div className="h-32 rounded-lg bg-white/5 animate-pulse flex items-center justify-center">
      <p className="text-xs text-gray-500">Loading purchase options…</p>
    </div>
  ),
});

// Make RelatedBooks client-only to prevent SSG crashes
const RelatedBooks = dynamic(() => import("@/components/books/RelatedBooks"), {
  ssr: false,
  loading: () => (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-16 rounded-lg bg-white/5 animate-pulse"></div>
      ))}
    </div>
  ),
});

// Make BookReviews client-only as well
const BookReviews = dynamic(() => import("@/components/books/BookReviews"), {
  ssr: false,
  loading: () => (
    <div className="h-32 rounded-lg bg-white/5 animate-pulse flex items-center justify-center">
      <p className="text-xs text-gray-500">Loading reviews…</p>
    </div>
  ),
});

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
  mdxRaw: string; // ✅ Required for seeding
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

// Paranoid MDX extraction
function getRawBody(d: any): string {
  return (
    d?.body?.raw ||
    (typeof d?.bodyRaw === "string" ? d.bodyRaw : "") ||
    (typeof d?.content === "string" ? d.content : "") ||
    (typeof d?.body === "string" ? d.body : "") ||
    (typeof d?.mdx === "string" ? d.mdx : "") ||
    ""
  );
}

// SAFE array mapping utility
function safeMap<T>(array: T[] | undefined | null, renderFn: (item: T, index: number) => React.ReactNode): React.ReactNode[] {
  if (!Array.isArray(array) || array.length === 0) return [];
  return array.map(renderFn);
}

// SAFE string utility
function safeString(value: unknown, fallback: string = ""): string {
  if (value == null) return fallback;
  const str = String(value).trim();
  return str || fallback;
}

const BookPage: NextPage<Props> = ({ book, source, mdxRaw }) => {
  const router = useRouter();
  const [isBookmarked, setIsBookmarked] = React.useState(false);
  const [isClient, setIsClient] = React.useState(false);

  // ✅ SEED (enumerable) + PROXY (read-safe) => stops ResourcesCTA/BrandFrame/Rule/etc forever
  const safeComponents = React.useMemo(
    () =>
      createSeededSafeMdxComponents(mdxComponents, mdxRaw, {
        warnOnFallback: process.env.NODE_ENV === "development",
      }),
    [mdxRaw]
  );

  React.useEffect(() => {
    setIsClient(true);
    
    try {
      const raw = localStorage.getItem("ic_bookmarks") || "[]";
      const list = JSON.parse(raw);
      setIsBookmarked(Array.isArray(list) && list.includes(book.slug));
    } catch {
      localStorage.setItem("ic_bookmarks", "[]");
    }
  }, [book.slug]);

  const toggleBookmark = () => {
    if (!isClient) return;
    
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

  // SAFE: Format array for rendering
  const safeCategories = Array.isArray(book.categories) ? book.categories : [];
  const formatOptions = ["Standard PDF", "Institutional EPUB", "Archival Audio"];

  return (
    <Layout title={`${book.title} | Books`}>
      <Head>
        <title>{safeString(book.title, "Book")} | Abraham of London</title>
        <meta name="description" content={safeString(book.excerpt, "")} />
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
              disabled={!isClient}
            >
              <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Back to Library
            </button>

            <button
              onClick={toggleBookmark}
              disabled={!isClient}
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
          title={safeString(book.title, "Untitled Book")}
          author={safeString(book.author, "Abraham of London")}
          coverImage={safeString(book.coverImage, "")}
          excerpt={book.excerpt || undefined}
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
                    {/* ✅ GUARANTEED SAFE: Seed + Proxy ensures components[anyKey] exists */}
                    <MDXRemote {...source} components={safeComponents as any} />
                  </BookContent>
                </article>

                {safeCategories.length > 0 && (
                  <div className="mt-16 pt-8 border-t border-white/5 flex flex-wrap gap-2">
                    {safeCategories.map((c, index) => (
                      <span
                        key={`${c}-${index}`}
                        className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-gray-500"
                      >
                        {safeString(c, "Category")}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-12 pt-8 border-t border-white/5">
                  {isClient ? (
                    <PurchaseOptions book={book} />
                  ) : (
                    <div className="h-32 rounded-lg bg-white/5 animate-pulse flex items-center justify-center">
                      <p className="text-xs text-gray-500">Loading purchase options…</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-12">
                {isClient ? (
                  <BookReviews bookTitle={book.title} />
                ) : (
                  <div className="h-32 rounded-lg bg-white/5 animate-pulse flex items-center justify-center">
                    <p className="text-xs text-gray-500">Loading reviews…</p>
                  </div>
                )}
              </div>
            </main>

            <aside className="lg:col-span-4 space-y-8">
              <div className="sticky top-24 space-y-6">
                <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-sm">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-gold mb-6 flex items-center gap-2">
                    <Layers size={16} /> Related Intelligence
                  </h3>
                  {isClient ? (
                    <RelatedBooks currentBookSlug={book.slug} />
                  ) : (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-16 rounded-lg bg-white/5 animate-pulse"></div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-6 rounded-3xl bg-gradient-to-br from-gold/10 to-transparent border border-gold/20">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-white mb-6 flex items-center gap-2">
                    <Download size={16} className="text-gold" /> Formats
                  </h3>
                  <div className="space-y-2">
                    {formatOptions.map((f) => (
                      <button
                        key={f}
                        className="w-full text-left px-4 py-3 rounded-xl bg-white/5 border border-white/5 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-gold hover:bg-white/10 transition-all flex justify-between items-center group"
                        type="button"
                        disabled={!isClient}
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

    // ✅ EXTRACT MDX RAW CONTENT FOR SEEDING
    const mdxRaw = getRawBody(doc);
    
    // ✅ USE DIRECT SERIALIZE
    const source = await serialize(mdxRaw || " ", {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [rehypeSlug],
      },
    });

    // SAFE: Build book object with null checks
    const book: Book = {
      title: safeString(doc?.title, "Untitled Volume"),
      excerpt: doc?.excerpt || doc?.description || null,
      coverImage: doc?.coverImage || null,
      slug: doc?.slug || normalized,
      url: `/books/${doc?.slug || normalized}`,
      isbn: doc?.isbn ?? null,
      author: doc?.author ?? null,
      publisher: doc?.publisher ?? null,
      pages: typeof doc?.pages === "number" ? doc.pages : null,
      publishedDate: doc?.date ?? null,
      description: doc?.description ?? null,
      availableFormats: Array.isArray(doc?.availableFormats) ? doc.availableFormats : [],
      categories: Array.isArray(doc?.categories) ? doc.categories : [],
    };

    return {
      props: {
        book: sanitizeData(book),
        source: JSON.parse(JSON.stringify(source)),
        mdxRaw, // ✅ PASS MDX RAW FOR SEEDING
      },
      revalidate: 1800,
    };
  } catch (e) {
    console.error(`[books/getStaticProps] fatal for slug ${String(params?.slug)}:`, e);
    return { notFound: true };
  }
};

export default BookPage;