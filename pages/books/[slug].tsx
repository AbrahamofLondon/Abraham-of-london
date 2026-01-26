/* pages/books/[slug].tsx — MANUSCRIPT READER (INTEGRITY MODE) */
import React, { useState, useEffect } from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";

import Layout from "@/components/Layout";

// Server-side imports
import { getAllContentlayerDocs } from "@/lib/content/real";
import { sanitizeData } from "@/lib/content/shared";

// MDX utilities
import { prepareMDX, simpleMdxComponents } from "@/lib/server/md-utils";

// UI Components
import BookHero from "@/components/books/BookHero";
import BookDetails from "@/components/books/BookDetails";
import BookContent from "@/components/books/BookContent";
import PurchaseOptions from "@/components/books/PurchaseOptions";
import BookReviews from "@/components/books/BookReviews";
import RelatedBooks from "@/components/books/RelatedBooks";
import { 
  Share2, 
  Download, 
  Layers, 
  ChevronLeft, 
  Bookmark, 
  BookmarkCheck, 
  ExternalLink,
  Clock,
  Calendar
} from "lucide-react";

// 🔥 CRITICAL FIX: Dynamically import MDXRemote to avoid SSR issues
const MDXRemote = dynamic(
  () => import('next-mdx-remote').then((mod) => mod.MDXRemote),
  { 
    ssr: false,
    loading: () => (
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-gray-700 rounded w-3/4"></div>
        <div className="h-4 bg-gray-700 rounded w-1/2"></div>
      </div>
    )
  }
);

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
  source: any; // Changed from MDXRemoteSerializeResult to any for safety
};

// Server-side helper functions
function getServerAllBooks(): any[] {
  const allDocs = getAllContentlayerDocs();
  return allDocs.filter(
    (doc: any) => doc.type === "Book" || doc._raw?.sourceFileDir === "books"
  );
}

function getServerBookBySlug(slug: string): any | null {
  const normalized = slug.replace(/^\/+|\/+$/g, "");
  const books = getServerAllBooks();
  
  for (const doc of books) {
    const docSlug = doc.slug || "";
    const docHref = doc.href || "";
    const flattenedPath = doc._raw?.flattenedPath || "";
    
    const compareSlug = (s: string) => s.replace(/^\/+|\/+$/g, "");
    
    if (
      compareSlug(docSlug) === normalized ||
      compareSlug(docHref.replace(/^\//, "")) === normalized ||
      compareSlug(flattenedPath) === normalized
    ) {
      return doc;
    }
  }
  
  return null;
}

// 🔥 SAFE MDX COMPONENTS: Ensure no undefined components
const getSafeMdxComponents = () => {
  const safeComponents: any = {};
  
  if (typeof simpleMdxComponents === 'object') {
    Object.keys(simpleMdxComponents).forEach(key => {
      const Comp = (simpleMdxComponents as any)[key];
      if (Comp && typeof Comp === 'function') {
        safeComponents[key] = Comp;
      } else {
        // Fallback component for safety
        safeComponents[key] = ({ children, ...props }: any) => {
          return React.createElement('div', props, children);
        };
      }
    });
  }
  
  return safeComponents;
};

const BookPage: NextPage<Props> = ({ book, source }) => {
  const router = useRouter();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [mdxComponents, setMdxComponents] = useState<any>({});

  useEffect(() => {
    setIsClient(true);
    setMdxComponents(getSafeMdxComponents());
  }, []);

  useEffect(() => {
    if (isClient) {
      try {
        const bookmarks = JSON.parse(localStorage.getItem('ic_bookmarks') || '[]');
        setIsBookmarked(bookmarks.includes(book.slug));
      } catch (e) {
        localStorage.setItem('ic_bookmarks', '[]');
      }
    }
  }, [book.slug, isClient]);

  const toggleBookmark = () => {
    try {
      const bookmarks = JSON.parse(localStorage.getItem('ic_bookmarks') || '[]');
      const updated = isBookmarked 
        ? bookmarks.filter((s: string) => s !== book.slug)
        : [...bookmarks, book.slug];
      localStorage.setItem('ic_bookmarks', JSON.stringify(updated));
      setIsBookmarked(!isBookmarked);
    } catch (e) { /* silent fail */ }
  };

  const formattedDate = book.publishedDate 
    ? new Date(book.publishedDate).toLocaleDateString('en-GB', { year: 'numeric', month: 'long' })
    : 'In Preparation';

  return (
    <Layout title={`${book.title} | The Canon`}>
      <Head>
        <title>{book.title} | Abraham of London</title>
        <meta name="description" content={book.excerpt || ""} />
        <meta property="og:type" content="book" />
        <meta property="og:image" content={book.coverImage || ""} />
        <link rel="canonical" href={`https://abrahamoflondon.com/books/${book.slug}`} />
      </Head>

      <div className="min-h-screen bg-black text-cream selection:bg-gold selection:text-black">
        {/* TOP NAVIGATION: VAULT ESCAPE */}
        <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <button onClick={() => router.push('/books')} className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-white transition-all group">
              <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Back to Library
            </button>
            <div className="flex gap-4">
              <button onClick={toggleBookmark} className={`p-2 rounded-lg border transition-all ${isBookmarked ? 'bg-gold/10 border-gold/30 text-gold' : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'}`}>
                {isBookmarked ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
              </button>
            </div>
          </div>
        </div>

        {/* INSTITUTIONAL HERO */}
        <BookHero
          title={book.title}
          author={book.author || "Abraham of London"}
          coverImage={book.coverImage || ""}
          excerpt={book.excerpt}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
          <div className="grid lg:grid-cols-12 gap-12">
            
            {/* MANUSCRIPT CORE */}
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
                    {source && isClient ? (
                      <MDXRemote 
                        {...source} 
                        components={mdxComponents}
                      />
                    ) : (
                      // Server-side/fallback rendering
                      <div className="prose prose-invert max-w-none">
                        <div 
                          dangerouslySetInnerHTML={{ 
                            __html: source?.compiledSource || 
                            '<p>Content loading...</p>' 
                          }} 
                        />
                      </div>
                    )}
                  </BookContent>
                </article>

                {/* TAGS & CATEGORIES */}
                {book.categories && (
                  <div className="mt-16 pt-8 border-t border-white/5 flex flex-wrap gap-2">
                    {book.categories.map(c => (
                      <span key={c} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-gray-500">{c}</span>
                    ))}
                  </div>
                )}

                <div className="mt-12 pt-8 border-t border-white/5">
                   <PurchaseOptions book={book} />
                </div>
              </div>
              
              <div className="mt-12">
                <BookReviews bookTitle={book.title} />
              </div>
            </main>

            {/* STRATEGIC SIDEBAR */}
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
                    {['Standard PDF', 'Institutional EPUB', 'Archival Audio'].map(f => (
                      <button key={f} className="w-full text-left px-4 py-3 rounded-xl bg-white/5 border border-white/5 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-gold hover:bg-white/10 transition-all flex justify-between items-center group">
                        {f} <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-all" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5">
                   <h3 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-widest">Metadata</h3>
                   <div className="space-y-3 font-mono text-[10px] uppercase text-gray-600">
                      <div className="flex justify-between"><span>Pages</span><span className="text-gray-400">{book.pages || '---'}</span></div>
                      <div className="flex justify-between"><span>ISBN</span><span className="text-gray-400">{book.isbn || 'N/A'}</span></div>
                      <div className="flex justify-between"><span>Release</span><span className="text-gray-400">{book.publishedDate ? 'GA' : 'Draft'}</span></div>
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
    const books = getServerAllBooks();
    
    const paths = books
      .filter((b: any) => b && !b.draft)
      .map((b: any) => ({
        params: { slug: b.slug || b._raw?.flattenedPath?.replace(/^books\//, '') }
      }))
      .filter((p: any) => p.params.slug);

    return { paths, fallback: 'blocking' };
  } catch (error) {
    return { paths: [], fallback: 'blocking' };
  }
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  try {
    const slug = params?.slug as string;
    if (!slug) return { notFound: true };

    const data: any = getServerBookBySlug(slug);
    if (!data || data.draft) return { notFound: true };

    const rawMdx = String(data?.body?.raw ?? data?.body ?? "");
    let source: any = {};
    
    if (rawMdx.trim()) {
      try {
        source = await prepareMDX(rawMdx);
      } catch (mdxError) {
        console.error(`MDX compilation error for ${slug}:`, mdxError);
        source = { compiledSource: '' };
      }
    } else {
      source = { compiledSource: '' };
    }

    const book: Book = {
      title: data.title || "Untitled Volume",
      excerpt: data.excerpt || data.description || null,
      coverImage: data.coverImage || null,
      slug: data.slug || slug,
      url: `/books/${data.slug || slug}`,
      isbn: data.isbn ?? null,
      author: data.author ?? null,
      publisher: data.publisher ?? null,
      pages: data.pages ?? null,
      publishedDate: data.date ?? null,
      description: data.description ?? null,
      availableFormats: data.availableFormats || [],
      categories: data.categories || [],
    };

    return {
      props: { 
        book: sanitizeData(book), 
        source: JSON.parse(JSON.stringify(source)) // Ensure serializable
      },
      revalidate: 1800,
    };
  } catch (error) {
    console.error(`Error in getStaticProps for /books/${params?.slug}:`, error);
    return { notFound: true };
  }
};

export default BookPage;