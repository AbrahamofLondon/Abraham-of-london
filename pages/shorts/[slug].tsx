import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import { motion, useScroll, useTransform } from "framer-motion";
import { Heart, Eye, Clock, Zap, Share2, ArrowLeft, Shield } from "lucide-react";

import Layout from "@/components/Layout";

// ✅ CORE: Contentlayer Helpers
import {
  getAllContentlayerDocs,
  getDocBySlug,
  isDraftContent,
  normalizeSlug,
  sanitizeData,
} from "@/lib/contentlayer-helper";

// ✅ SECURITY: Seed + Proxy MDX
import { createSeededSafeMdxComponents } from "@/lib/mdx/safe-components";
import mdxComponents from "@/components/mdx-components";

// Client-only components
const ShortComments = dynamic(
  () => import("@/components/shorts/ShortComments").then((m) => m.default ?? (m as any).ShortComments),
  { ssr: false }
);

const ShortNavigation = dynamic(
  () => import("@/components/shorts/ShortNavigation").then((m) => m.default ?? (m as any).ShortNavigation),
  { ssr: false }
);

type Short = {
  title: string;
  excerpt: string | null;
  date: string | null;
  coverImage: string | null;
  tags: string[];
  author: string | null;
  url: string;
  slugPath: string;
  readTime: string | null;
  theme: string | null;
  views: number;
  likes: number;
};

type Props = {
  short: Short;
  source: MDXRemoteSerializeResult | null;
  mdxRaw: string;
};

const ShortPage: NextPage<Props> = ({ short, source, mdxRaw }) => {
  const router = useRouter();
  const [isClient, setIsClient] = React.useState(false);
  const [isLiked, setIsLiked] = React.useState(false);
  const { scrollYProgress } = useScroll();

  // Focus Mode: Interface fades on scroll to center the intellect
  const navOpacity = useTransform(scrollYProgress, [0, 0.05], [1, 0]);
  const progressLine = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  // ✅ SEED + PROXY Implementation
  const safeComponents = React.useMemo(
    () =>
      createSeededSafeMdxComponents(mdxComponents, mdxRaw, {
        warnOnFallback: false,
      }),
    [mdxRaw]
  );

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  // ✅ DYNAMIC OG IMAGE URL CONSTRUCTION
  const ogUrl = `https://www.abrahamoflondon.org/api/og/short?title=${encodeURIComponent(
    short.title
  )}&category=${encodeURIComponent(short.theme || "Intel")}&readTime=${encodeURIComponent(
    short.readTime || "2 min"
  )}`;

  const handleShare = async () => {
    if (!isClient) return;
    const shareUrl = `https://www.abrahamoflondon.org${short.url}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: short.title, url: shareUrl });
      } else {
        await navigator.clipboard.writeText(shareUrl);
      }
    } catch (err) {
      console.error("Share failed", err);
    }
  };

  return (
    <Layout title={`${short.title} | Field Note`} className="bg-black">
      <Head>
        <title>{short.title} | Abraham of London</title>
        <meta name="description" content={short.excerpt || ""} />
        <link rel="canonical" href={`https://www.abrahamoflondon.org${short.url}`} />
        
        {/* ✅ PRODUCTION OG METADATA */}
        <meta property="og:type" content="article" />
        <meta property="og:title" content={short.title} />
        <meta property="og:description" content={short.excerpt || ""} />
        <meta property="og:url" content={`https://www.abrahamoflondon.org${short.url}`} />
        <meta property="og:image" content={ogUrl} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        
        {/* ✅ TWITTER METADATA */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={short.title} />
        <meta name="twitter:description" content={short.excerpt || ""} />
        <meta name="twitter:image" content={ogUrl} />
      </Head>

      {/* Progress Line: Subtle aesthetic guide */}
      <motion.div 
        style={{ width: progressLine }} 
        className="fixed top-0 left-0 h-[1px] bg-gold z-[100] transition-all duration-75" 
      />

      {/* Monastic Nav: Fades out for maximum focus */}
      <motion.nav 
        style={{ opacity: navOpacity }}
        className="fixed top-0 inset-x-0 z-50 px-8 py-10 flex justify-between items-center"
      >
        <button 
          onClick={() => router.push("/shorts")} 
          className="p-3 hover:bg-white/5 rounded-full transition-colors group"
        >
          <ArrowLeft className="h-5 w-5 text-white/30 group-hover:text-gold transition-colors" />
        </button>
        <div className="flex items-center gap-6 font-mono text-[9px] tracking-[0.5em] text-white/10 uppercase">
          <Shield className="h-3 w-3" /> Secure Node
        </div>
        <button 
          onClick={handleShare} 
          className="p-3 hover:bg-white/5 rounded-full transition-colors group"
        >
          <Share2 className="h-4 w-4 text-white/30 group-hover:text-gold transition-colors" />
        </button>
      </motion.nav>

      <main className="max-w-2xl mx-auto px-6 pt-56 pb-40">
        <header className="mb-24">
          <motion.div 
            initial={{ opacity: 0, y: 5 }} 
            animate={{ opacity: 1, y: 0 }}
            className="font-mono text-[10px] text-gold/60 uppercase tracking-[0.6em] mb-10"
          >
            Entry // {short.theme || "Intel"}
          </motion.div>
          <h1 className="font-serif text-6xl md:text-7xl italic leading-tight text-white mb-12 tracking-tight">
            {short.title}
          </h1>
          <div className="flex items-center gap-6 text-white/20 font-mono text-[9px] uppercase tracking-widest">
             <span className="flex items-center gap-2"><Eye size={12}/> {short.views} Views</span>
             <span className="h-1 w-1 rounded-full bg-white/10" />
             <span>ID: {short.slugPath.toUpperCase()}</span>
          </div>
        </header>

        {/* The Body: Clean, elegant, focused */}
        <article className="prose prose-invert prose-gold max-w-none 
          prose-p:text-white/60 prose-p:text-xl prose-p:leading-[1.9] prose-p:font-light prose-p:mb-10
          prose-headings:font-serif prose-headings:italic prose-headings:text-white prose-headings:mt-20
          prose-strong:text-gold/90 prose-strong:font-medium
          prose-blockquote:border-gold/20 prose-blockquote:bg-white/[0.01] prose-blockquote:px-10 prose-blockquote:py-2 prose-blockquote:rounded-r-xl prose-blockquote:text-gold/60"
        >
          {source && (
            <MDXRemote 
              {...source} 
              components={safeComponents as any} 
            />
          )}
        </article>

        {/* Engagement Layer */}
        <footer className="mt-40 pt-20 border-t border-white/[0.05]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-32">
            <button 
              onClick={() => setIsLiked(!isLiked)}
              className={`flex items-center justify-center gap-3 px-10 py-5 rounded-full border transition-all duration-700 ${
                isLiked ? 'bg-gold/10 border-gold/40 text-gold' : 'border-white/10 text-white/30 hover:border-white/30'
              }`}
            >
              <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
              <span className="font-mono text-[10px] uppercase tracking-widest">Signal Endorsement</span>
            </button>
            <div className="flex flex-wrap gap-3">
              {short.tags.map(tag => (
                <span key={tag} className="text-[10px] font-mono text-white/10 italic border border-white/5 px-3 py-1 rounded-full">#{tag}</span>
              ))}
            </div>
          </div>

          <div className="space-y-40">
            {isClient && <ShortNavigation currentSlug={short.slugPath} />}
            {isClient && <ShortComments shortId={short.slugPath} />}
          </div>
          
          <div className="mt-48 text-center">
            <button onClick={() => router.push('/shorts')} className="group inline-flex flex-col items-center gap-8">
              <div className="h-20 w-[1px] bg-gradient-to-b from-gold to-transparent group-hover:h-32 transition-all duration-1000" />
              <span className="font-mono text-[9px] uppercase tracking-[0.5em] text-white/20 group-hover:text-gold transition-colors">
                Terminate Briefing
              </span>
            </button>
          </div>
        </footer>
      </main>
    </Layout>
  );
};

export default ShortPage;

// --- Server-Side Logic ---

function getShortSlug(doc: any): string {
  const fromSlug = normalizeSlug(String(doc.slug || ""));
  const fromFlat = normalizeSlug(String(doc._raw?.flattenedPath || ""));
  return (fromSlug || fromFlat).replace(/^shorts\//, "");
}

function getRawBody(doc: any): string {
  return doc?.body?.raw || doc?.bodyRaw || doc?.content || "";
}

export const getStaticPaths: GetStaticPaths = async () => {
  const docs = getAllContentlayerDocs();
  const shorts = docs.filter((d: any) => d.kind === "Short" || d._raw?.sourceFileDir?.toLowerCase?.().includes("short"));
  
  const paths = shorts
    .filter((s: any) => !isDraftContent(s))
    .map((s: any) => ({ params: { slug: getShortSlug(s) } }));

  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  try {
    const slug = typeof params?.slug === "string" ? params.slug : "";
    const data = getDocBySlug(`shorts/${slug}`) || getDocBySlug(slug);

    if (!data || isDraftContent(data)) return { notFound: true };

    const mdxRaw = getRawBody(data);
    const source = await serialize(mdxRaw || " ", {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [rehypeSlug],
      },
    });

    const short: Short = {
      title: data.title || "Field Note",
      excerpt: data.excerpt || null,
      date: data.date || null,
      coverImage: data.coverImage || null,
      tags: Array.isArray(data.tags) ? data.tags : [],
      author: data.author || "Abraham of London",
      url: `/shorts/${getShortSlug(data)}`,
      slugPath: getShortSlug(data),
      readTime: data.readTime || "2 min read",
      theme: (data as any).theme || null,
      views: Number((data as any).views || 0),
      likes: Number((data as any).likes || 0),
    };

    return {
      props: {
        short: sanitizeData(short),
        source: JSON.parse(JSON.stringify(source)),
        mdxRaw,
      },
      revalidate: 3600,
    };
  } catch (err) {
    console.error("Shorts SSR Error:", err);
    return { notFound: true };
  }
};