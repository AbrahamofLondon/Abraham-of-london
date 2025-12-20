// components/ContentlayerDocPage.tsx
import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import { ArrowLeft, Share2, Clock, Calendar, Tag } from "lucide-react";
import { motion } from "framer-motion";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";

import Layout from "@/components/Layout";
import mdxComponents from "@/components/mdx-components";

type ContentlayerDoc = {
  title?: string | null;
  excerpt?: string | null;
  description?: string | null;
  coverImage?: string | null;
  category?: string | null;
  date?: string | null;
  readTime?: string | null;
  tags?: string[] | null;
  slug?: string | null;
};

type Props = {
  doc: ContentlayerDoc;
  source: MDXRemoteSerializeResult; // Changed from body.code to source
  canonicalPath: string;
  backHref?: string;
  label?: string;
  components?: Record<string, React.ComponentType<any>>;
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.abrahamoflondon.org";

export default function ContentlayerDocPage({
  doc,
  source,
  canonicalPath,
  backHref = "/content",
  label = "Reading Room",
  components = mdxComponents,
}: Props) {
  
  // Logical Fallbacks for metadata
  const title = doc.title?.trim() || "Untitled Volume";
  const description = doc.excerpt?.trim() || doc.description?.trim() || "Strategic assets for institutional architects.";
  const canonicalUrl = `${SITE_URL}${canonicalPath.startsWith("/") ? canonicalPath : `/${canonicalPath}`}`;
  
  // Format Date for en-GB standards
  const displayDate = React.useMemo(() => {
    if (!doc.date) return null;
    const d = new Date(doc.date);
    return isNaN(d.getTime()) ? null : d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }, [doc.date]);

  const onShare = React.useCallback(() => {
    if (typeof window === "undefined") return;
    if (navigator.share) {
      navigator.share({ title, text: description, url: canonicalUrl }).catch(() => {});
    } else {
      navigator.clipboard.writeText(canonicalUrl);
    }
  }, [canonicalUrl, title, description]);

  return (
    <Layout title={title} description={description} ogImage={doc.coverImage ?? undefined}>
      <Head>
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>

      <main className="min-h-screen bg-black text-cream">
        {/* Navigation Bar - Sticky for readability */}
        <nav className="sticky top-0 z-[60] border-b border-white/5 bg-black/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
            <Link
              href={backHref}
              className="group flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 transition-colors hover:text-gold"
            >
              <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
              <span>Back to {label}</span>
            </Link>

            <button
              onClick={onShare}
              className="flex items-center gap-2 rounded-full border border-gold/20 bg-gold/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-gold transition-all hover:bg-gold hover:text-black"
            >
              <Share2 className="h-3 w-3" />
              <span>Share Asset</span>
            </button>
          </div>
        </nav>

        {/* Content Layout */}
        <article className="mx-auto max-w-4xl px-6 py-16 lg:py-24">
          <header className="mb-16 border-b border-gold/10 pb-12">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[9px] font-black uppercase tracking-[0.3em] text-gold/80"
            >
              <div className="h-1 w-1 rounded-full bg-gold animate-pulse" />
              {doc.category || label}
            </motion.div>

            <h1 className="font-serif text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
              {title}
            </h1>

            {doc.excerpt && (
              <p className="mt-8 text-xl font-light leading-relaxed text-gray-400 italic">
                {doc.excerpt}
              </p>
            )}

            <div className="mt-10 flex flex-wrap items-center gap-6 font-mono text-[10px] uppercase tracking-widest text-gray-500">
              {displayDate && (
                <div className="flex items-center gap-2">
                  <Calendar size={12} className="text-gold/40" />
                  <span>{displayDate}</span>
                </div>
              )}
              {doc.readTime && (
                <div className="flex items-center gap-2">
                  <Clock size={12} className="text-gold/40" />
                  <span>{doc.readTime}</span>
                </div>
              )}
            </div>

            {doc.tags && doc.tags.length > 0 && (
              <div className="mt-8 flex flex-wrap gap-2">
                {doc.tags.map((tag) => (
                  <span key={tag} className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-tighter text-gray-600">
                    <Tag size={10} /> {tag}
                  </span>
                ))}
              </div>
            )}
          </header>

          {/* MDX Content Area */}
          <div className="prose prose-invert prose-gold max-w-none prose-headings:font-serif prose-p:text-gray-300 prose-p:leading-relaxed prose-strong:text-gold/90 prose-a:text-gold prose-a:no-underline hover:prose-a:underline">
            <React.Suspense
              fallback={
                <div className="min-h-[400px] flex flex-col items-center justify-center space-y-4 opacity-50">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold">Initializing Vault Content</p>
                </div>
              }
            >
              <MDXRemote {...source} components={components} />
            </React.Suspense>
          </div>
          
          <footer className="mt-24 border-t border-white/5 pt-12 text-center">
            <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-gray-700">
              Abraham of London · Strategic Archives · Established London
            </p>
          </footer>
        </article>
      </main>
    </Layout>
  );
}