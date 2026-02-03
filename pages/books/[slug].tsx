// pages/books/[slug].tsx — HARDENED (Module Sovereignty / Decryption-Ready)
import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import type { MDXRemoteSerializeResult } from "next-mdx-remote";

// ✅ INSTITUTIONAL IMPORTS
import Layout from "@/components/Layout";
import { MDXLayoutRenderer } from "@/components/mdx/MDXLayoutRenderer";
import { BriefSummaryCard } from "@/components/mdx/BriefSummaryCard";
import AccessGate from "@/components/AccessGate";

// Governance & Data
import { 
  getDocBySlug, 
  getAllBooks, 
  normalizeSlug, 
  sanitizeData 
} from "@/lib/contentlayer-helper";
import { useAccess, type Tier } from "@/hooks/useAccess";
import { prepareMDX } from "@/lib/server/md-utils";
import { Loader2 } from "lucide-react";

/* -----------------------------------------------------------------------------
  TYPES
----------------------------------------------------------------------------- */
type BookDoc = {
  title: string;
  subtitle?: string | null;
  description?: string | null;
  excerpt?: string | null;
  slug: string;
  accessLevel: Tier;
  category?: string | null;
  date?: string | null;
  author?: string | null;
  coverImage?: string | null;
};

interface Props {
  book: BookDoc;
  initialLocked: boolean;
  initialSource: MDXRemoteSerializeResult | null;
  mdxRaw: string;
}

/* -----------------------------------------------------------------------------
  PAGE COMPONENT
----------------------------------------------------------------------------- */
const BookPage: NextPage<Props> = ({ book, initialLocked, initialSource, mdxRaw }) => {
  const router = useRouter();
  const { hasClearance, verify, isValidating } = useAccess();
  
  const [source, setSource] = React.useState<MDXRemoteSerializeResult | null>(initialSource);
  const [loadingContent, setLoadingContent] = React.useState(false);

  const isAuthorized = hasClearance(book.accessLevel);

  /**
   * Secure fetch for gated literature. 
   * Fetches only if authorized and initialSource was null (locked).
   */
  const fetchSecurePayload = React.useCallback(async () => {
    if (loadingContent || source) return;
    setLoadingContent(true);
    
    try {
      const res = await fetch(`/api/books/${encodeURIComponent(book.slug)}`);
      const json = await res.json();
      if (res.ok && json.source) {
        setSource(json.source);
      }
    } catch (e) {
      console.error("[BOOK_DECRYPT_ERROR] Unauthorized access or network failure.");
    } finally {
      setLoadingContent(false);
    }
  }, [book.slug, loadingContent, source]);

  React.useEffect(() => {
    if (isAuthorized && !source) {
      fetchSecurePayload();
    }
  }, [isAuthorized, source, fetchSecurePayload]);

  if (router.isFallback) return <Layout title="Accessing Archive...">...</Layout>;

  return (
    <Layout title={book.title} description={book.description || book.excerpt || ""} className="bg-black">
      <Head>
        <link rel="canonical" href={`https://www.abrahamoflondon.org/books/${book.slug}`} />
        <meta name="robots" content={initialLocked ? "noindex, nofollow" : "index, follow"} />
      </Head>

      <header className="border-b border-white/5 bg-zinc-950/50">
        <div className="mx-auto max-w-5xl px-6 py-24 lg:py-32">
          <div className="font-mono text-[10px] text-amber-500 uppercase tracking-[0.5em] mb-8">
            Literature // {book.category || "Volume"}
          </div>
          <h1 className="text-5xl md:text-7xl font-serif italic text-white leading-tight">
            {book.title}
          </h1>
          {book.subtitle && (
            <p className="mt-8 text-xl text-white/40 font-light max-w-2xl leading-relaxed italic">
              {book.subtitle}
            </p>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12 lg:py-20">
        <BriefSummaryCard 
          category={book.category || "BOOK"} 
          classification={book.accessLevel}
          date={book.date || undefined}
          author={book.author || undefined}
        />
        
        <div className="relative mt-12">
          {!isAuthorized && !isValidating ? (
            <div className="relative min-h-[500px]">
              <AccessGate 
                title="Classified Volume"
                message={`Decryption of "${book.title}" requires ${book.accessLevel.replace('-', ' ')} clearance.`}
                requiredTier={book.accessLevel}
                onUnlocked={() => verify()}
              />
            </div>
          ) : (
            <div className="relative min-h-[400px]">
              {loadingContent && (
                <div className="flex items-center gap-3 py-12 text-amber-500 animate-pulse font-mono text-xs uppercase tracking-widest">
                  <Loader2 className="animate-spin" size={16} />
                  Synchronizing Intelligence...
                </div>
              )}
              <div className={`prose prose-invert prose-amber max-w-none transition-opacity duration-1000 ${loadingContent ? 'opacity-20' : 'opacity-100'}`}>
                {source && <MDXLayoutRenderer code={source as any} />}
              </div>
            </div>
          )}
        </div>
      </main>
    </Layout>
  );
};

/* -----------------------------------------------------------------------------
  DATA FETCHING
----------------------------------------------------------------------------- */

export const getStaticPaths: GetStaticPaths = async () => {
  const books = getAllBooks() || [];
  const paths = books
    .filter((b: any) => !b.draft)
    .map((b: any) => ({
      params: { slug: normalizeSlug(b.slug || b._raw?.flattenedPath || "").replace(/^books\//, "") }
    }));
  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = String(params?.slug || "");
  const rawDoc = getDocBySlug(`books/${slug}`) || getDocBySlug(slug);

  if (!rawDoc || rawDoc.draft) return { notFound: true };

  const accessLevel = (rawDoc.accessLevel || "inner-circle") as Tier;
  const initialLocked = accessLevel !== "public";
  const mdxRaw = String(rawDoc.body?.raw || "");

  // Hybrid Protection: Public volumes are pre-built; locked volumes remain on server.
  let initialSource = null;
  if (!initialLocked) {
    initialSource = await prepareMDX(mdxRaw);
  }

  const book: BookDoc = {
    title: rawDoc.title || "Institutional Volume",
    subtitle: rawDoc.subtitle || null,
    slug,
    accessLevel,
    category: rawDoc.category || null,
    date: rawDoc.date ? String(rawDoc.date) : null,
    author: rawDoc.author || "Abraham of London",
  };

  return {
    props: sanitizeData({ 
      book, 
      initialLocked, 
      initialSource: initialLocked ? null : initialSource, 
      mdxRaw 
    }),
    revalidate: 3600,
  };
};

export default BookPage;