// components/ContentlayerDocPage.tsx - FIXED
import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import { ArrowLeft, Share2, Clock, Calendar, Tag, BookOpen, Eye, Users } from "lucide-react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { MDXRemote } from "next-mdx-remote/rsc";

import Layout from "@/components/Layout";
import mdxComponents from "@/components/mdx-components";

// Dynamically import enhanced components
const SimpleReadTime = dynamic(
  () => import("@/components/enhanced/ReadTime").then(mod => mod.SimpleReadTime),
  { ssr: true }
);

const SafeTableOfContents = dynamic(
  () => import("@/components/enhanced/TableOfContents").then(mod => mod.SafeTableOfContents),
  { ssr: false }
);

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
  author?: string | null;
  type?: string | null;
  featured?: boolean | null;
};

type Props = {
  doc: ContentlayerDoc;
  source: string;
  canonicalPath: string;
  backHref?: string;
  label?: string;
  components?: Record<string, React.ComponentType<any>>;
  rawContent?: string;
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.abrahamoflondon.org";

export default function ContentlayerDocPage({
  doc,
  source,
  canonicalPath,
  backHref = "/content",
  label = "Reading Room",
  components = mdxComponents,
  rawContent = "",
}: Props) {
  const [viewCount, setViewCount] = React.useState<number | null>(null);
  const [isShareTooltipVisible, setIsShareTooltipVisible] = React.useState(false);
  const [isBookmarked, setIsBookmarked] = React.useState(false);
  const contentRef = React.useRef<HTMLDivElement>(null);

  // Logical Fallbacks for metadata
  const title = doc.title?.trim() || "Untitled Volume";
  const description = doc.excerpt?.trim() || doc.description?.trim() || "Strategic assets for institutional architects.";
  const canonicalUrl = `${SITE_URL}${canonicalPath.startsWith("/") ? canonicalPath : `/${canonicalPath}`}`;
  
  // FIX: Ensure ogImage is always a string (not undefined)
  const ogImage = doc.coverImage || "";
  
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

  // Enhanced share functionality
  const onShare = React.useCallback(async () => {
    if (typeof window === "undefined") return;
    
    try {
      if (navigator.share) {
        await navigator.share({ 
          title: title, 
          text: description, 
          url: canonicalUrl 
        });
      } else {
        await navigator.clipboard.writeText(canonicalUrl);
        setIsShareTooltipVisible(true);
        setTimeout(() => setIsShareTooltipVisible(false), 2000);
      }
    } catch (err) {
      // Share cancelled or failed
    }
  }, [canonicalUrl, title, description]);

  // Simulate view count (in real app, fetch from API)
  React.useEffect(() => {
    const simulatedCount = Math.floor(Math.random() * 1000) + 100;
    setViewCount(simulatedCount);
  }, []);

  // Toggle bookmark
  const toggleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    // In real app, save to localStorage or API
  };

  return (
    // FIXED: Removed ogImage prop or ensured it's always a string
    <Layout title={title} description={description} ogImage={doc.coverImage || ""}>
      <Head>
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary_large_image" />
        {/* Add og:image tag directly in Head if we have an image */}
        {ogImage && (
          <meta property="og:image" content={ogImage} />
        )}
      </Head>

      <main className="min-h-screen bg-gradient-to-b from-black via-zinc-950 to-black text-cream">
        {/* Enhanced Navigation Bar */}
        <motion.nav 
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.5 }}
          className="sticky top-0 z-[60] border-b border-white/10 bg-black/90 backdrop-blur-2xl"
        >
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <Link
              href={backHref}
              className="group flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 transition-all hover:border-amber-500/30 hover:bg-amber-500/5"
            >
              <ArrowLeft className="h-4 w-4 transform transition-transform group-hover:-translate-x-1" />
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 group-hover:text-amber-300">
                Back to {label}
              </span>
            </Link>

            <div className="flex items-center gap-3">
              <button
                onClick={toggleBookmark}
                className={`rounded-full p-2.5 transition-all ${isBookmarked 
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                  : 'border border-white/10 bg-white/5 text-gray-400 hover:border-amber-500/20 hover:text-amber-300'
                }`}
                aria-label={isBookmarked ? "Remove bookmark" : "Bookmark this page"}
              >
                <BookOpen className="h-4 w-4" />
              </button>

              <div className="relative">
                <button
                  onClick={onShare}
                  className="flex items-center gap-2 rounded-full border border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-amber-600/5 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.2em] text-amber-300 transition-all hover:from-amber-500/20 hover:to-amber-600/10 hover:shadow-lg"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  <span>Share Asset</span>
                </button>
                
                {isShareTooltipVisible && (
                  <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-green-500/20 px-3 py-1 text-xs text-green-300 backdrop-blur-sm">
                    Link copied!
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.nav>

        {/* Content Layout with Sidebar */}
        <article className="mx-auto max-w-6xl px-6 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-8">
              <motion.header 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="mb-16 border-b border-amber-500/10 pb-12"
              >
                {/* Enhanced Category Badge */}
                <motion.div 
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  className="mb-6 inline-flex items-center gap-3 rounded-full border border-amber-500/20 bg-gradient-to-r from-amber-500/10 to-amber-600/5 px-4 py-2 backdrop-blur-sm"
                >
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-300">
                      {doc.category || label}
                    </span>
                  </div>
                  
                  {doc.featured && (
                    <span className="rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-black">
                      Featured
                    </span>
                  )}
                </motion.div>

                {/* Title with gradient */}
                <h1 className="font-serif text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
                  {title}
                </h1>

                {/* Enhanced Excerpt */}
                {doc.excerpt && (
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="mt-8 text-xl font-light leading-relaxed text-gray-300 italic border-l-4 border-amber-500/30 pl-6"
                  >
                    {doc.excerpt}
                  </motion.p>
                )}

                {/* Enhanced Metadata Grid */}
                <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {displayDate && (
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-amber-400" />
                        <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Published</span>
                      </div>
                      <p className="mt-2 font-mono text-sm text-white">{displayDate}</p>
                    </div>
                  )}
                  
                  {doc.readTime && (
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-400" />
                        <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Read Time</span>
                      </div>
                      <p className="mt-2 font-mono text-sm text-white">{doc.readTime}</p>
                    </div>
                  )}
                  
                  {viewCount && (
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-green-400" />
                        <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Views</span>
                      </div>
                      <p className="mt-2 font-mono text-sm text-white">
                        {viewCount.toLocaleString()}
                      </p>
                    </div>
                  )}
                  
                  {doc.author && (
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-purple-400" />
                        <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Author</span>
                      </div>
                      <p className="mt-2 font-mono text-sm text-white">{doc.author}</p>
                    </div>
                  )}
                </div>

                {/* Enhanced Tags */}
                {doc.tags && doc.tags.length > 0 && (
                  <div className="mt-8">
                    <h4 className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-500">Topics Covered</h4>
                    <div className="flex flex-wrap gap-2">
                      {doc.tags.map((tag, index) => (
                        <motion.span
                          key={tag}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.05 }}
                          className="group flex items-center gap-2 rounded-full border border-amber-500/20 bg-gradient-to-r from-amber-500/5 to-amber-600/5 px-4 py-2 transition-all hover:border-amber-500/40 hover:from-amber-500/10 hover:to-amber-600/10"
                        >
                          <Tag className="h-3 w-3 text-amber-400/60" />
                          <span className="text-xs font-medium text-amber-300/90">{tag}</span>
                        </motion.span>
                      ))}
                    </div>
                  </div>
                )}
              </motion.header>

              {/* Enhanced Content Area with Table of Contents */}
              <div className="relative" ref={contentRef}>
                <SafeTableOfContents 
                  contentRef={contentRef}
                  className="mb-8"
                />
                
                {/* MDX Content with enhanced styling */}
                <div className="prose prose-invert prose-gold max-w-none 
                  prose-headings:font-serif prose-headings:relative
                  prose-h2:text-3xl prose-h2:mt-16 prose-h2:mb-8 prose-h2:pt-8 prose-h2:border-t prose-h2:border-white/10
                  prose-h3:text-2xl prose-h3:mt-12 prose-h3:mb-6
                  prose-p:text-gray-300 prose-p:leading-relaxed prose-p:text-lg
                  prose-strong:text-amber-300 prose-strong:font-semibold
                  prose-a:text-amber-400 prose-a:no-underline hover:prose-a:text-amber-300 hover:prose-a:underline
                  prose-blockquote:border-l-4 prose-blockquote:border-amber-500/50 prose-blockquote:bg-gradient-to-r prose-blockquote:from-amber-500/5 prose-blockquote:to-transparent prose-blockquote:p-8 prose-blockquote:rounded-xl
                  prose-pre:bg-black prose-pre:border prose-pre:border-white/10 prose-pre:rounded-2xl prose-pre:shadow-2xl
                  prose-ul:space-y-3 prose-li:text-gray-300
                  prose-img:rounded-2xl prose-img:shadow-2xl prose-img:border prose-img:border-white/10">
                  <React.Suspense
                    fallback={
                      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-6 opacity-50">
                        <div className="relative">
                          <div className="h-12 w-12 animate-spin rounded-full border-4 border-amber-500/20 border-t-amber-500" />
                          <div className="absolute inset-0 animate-ping rounded-full border-4 border-amber-500/10" />
                        </div>
                        <div>
                          <p className="text-center text-[10px] font-bold uppercase tracking-[0.3em] text-amber-300">
                            Initializing Vault Content
                          </p>
                          <p className="mt-2 text-center text-xs text-gray-500">
                            Decrypting strategic intelligence...
                          </p>
                        </div>
                      </div>
                    }
                  >
                    <MDXRemote source={source} components={components} />
                  </React.Suspense>
                </div>
              </div>
              
              {/* Enhanced Footer */}
              <footer className="mt-24 border-t border-white/10 pt-12">
                <div className="rounded-2xl bg-gradient-to-br from-white/5 to-white/0 border border-white/10 p-8 backdrop-blur-sm">
                  <div className="flex flex-col items-center text-center">
                    <div className="mb-6 h-px w-24 bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
                    <p className="font-serif text-2xl italic text-white mb-4">
                      "Architecture is destiny, made visible."
                    </p>
                    <p className="text-sm text-gray-400 mb-8">— Abraham of London</p>
                    
                    <div className="flex items-center gap-6">
                      <SimpleReadTime content={rawContent} />
                      <span className="text-xs text-gray-500">•</span>
                      <Link
                        href={backHref}
                        className="text-sm font-medium text-amber-300 hover:text-amber-400 transition-colors"
                      >
                        Explore more from the {label}
                      </Link>
                    </div>
                  </div>
                  
                  <div className="mt-8 pt-8 border-t border-white/10">
                    <p className="font-mono text-center text-[9px] uppercase tracking-[0.4em] text-gray-600">
                      Abraham of London · Strategic Archives · Established London
                    </p>
                  </div>
                </div>
              </footer>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-4">
              <div className="sticky top-24 space-y-8">
                {/* Reading Stats */}
                <div className="rounded-2xl border border-white/10 bg-black/50 p-6 backdrop-blur-sm">
                  <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-white">
                    Reading Stats
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>Completion</span>
                        <span>25%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-1000"
                          style={{ width: '25%' }}
                        />
                      </div>
                    </div>
                    
                    {rawContent && (
                      <div className="pt-4 border-t border-white/10">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400">Words</span>
                          <span className="font-mono text-sm text-white">
                            {rawContent.split(/\s+/).length.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Related Content */}
                <div className="rounded-2xl border border-white/10 bg-black/50 p-6 backdrop-blur-sm">
                  <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-white">
                    Related Intelligence
                  </h3>
                  <div className="space-y-3">
                    {['Architectural Principles', 'Institutional Strategy', 'Founder Framework'].map((item, i) => (
                      <a
                        key={i}
                        href="#"
                        className="group flex items-center gap-3 rounded-lg p-3 transition-all hover:bg-white/5"
                      >
                        <div className="h-2 w-2 rounded-full bg-amber-500/60 group-hover:bg-amber-500" />
                        <span className="text-sm text-gray-300 group-hover:text-white">{item}</span>
                      </a>
                    ))}
                  </div>
                </div>

                {/* Download CTA */}
                {doc.type === 'download' && (
                  <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-amber-500/10 to-amber-600/5 p-6 backdrop-blur-sm">
                    <h3 className="mb-3 text-sm font-bold uppercase tracking-widest text-amber-300">
                      Download Asset
                    </h3>
                    <p className="mb-4 text-sm text-gray-300">
                      Save this framework for offline reference
                    </p>
                    <button className="w-full rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-3 text-sm font-bold text-black transition-all hover:shadow-lg hover:scale-105">
                      Download PDF
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </article>
      </main>

      <style jsx global>{`
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        .prose pre {
          position: relative;
          background: linear-gradient(135deg, #000, #111);
          background-size: 200% 200%;
          animation: gradientShift 10s ease infinite;
        }
        
        .prose pre::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, 
            transparent, 
            rgba(245, 158, 11, 0.3), 
            rgba(245, 158, 11, 0.6),
            rgba(245, 158, 11, 0.3),
            transparent
          );
        }
        
        .prose h2::before {
          content: '#';
          position: absolute;
          left: -2rem;
          opacity: 0.3;
          color: rgba(245, 158, 11, 0.5);
          font-family: monospace;
          transition: opacity 0.3s;
        }
        
        .prose h2:hover::before {
          opacity: 1;
        }
      `}</style>
    </Layout>
  );
}