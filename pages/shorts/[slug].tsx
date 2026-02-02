// pages/shorts/[slug].tsx — HARDENED (Bare Slug + Seeded Proxy)
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
import { Heart, Eye, Share2, ArrowLeft, Shield } from "lucide-react";

import Layout from "@/components/Layout";

// ✅ Governance
import { 
  getAllContentlayerDocs, 
  getDocBySlug, 
  isDraftContent, 
  normalizeSlug, 
  sanitizeData 
} from "@/lib/contentlayer-helper";
import { createSeededSafeMdxComponents } from "@/lib/mdx/safe-components";
import mdxComponents from "@/components/mdx-components";

// ✅ Dynamic Components
const ShortComments = dynamic(() => import("@/components/shorts/ShortComments"), { ssr: false });
const ShortNavigation = dynamic(() => import("@/components/shorts/ShortNavigation"), { ssr: false });

/* -----------------------------------------------------------------------------
  TYPES
----------------------------------------------------------------------------- */
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
};

interface Props {
  short: Short;
  source: MDXRemoteSerializeResult | null;
  mdxRaw: string;
}

/* -----------------------------------------------------------------------------
  PAGE COMPONENT
----------------------------------------------------------------------------- */
const ShortPage: NextPage<Props> = ({ short, source, mdxRaw }) => {
  const router = useRouter();
  const { scrollYProgress } = useScroll();
  
  // UI Aesthetic Logic
  const navOpacity = useTransform(scrollYProgress, [0, 0.05], [1, 0]);
  const progressLine = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  
  const safeComponents = React.useMemo(() => 
    createSeededSafeMdxComponents(mdxComponents, mdxRaw, {
      warnOnFallback: process.env.NODE_ENV === "development",
    }), [mdxRaw]
  );

  if (router.isFallback) return <Layout title="Accessing Node...">...</Layout>;

  return (
    <Layout title={`${short.title} | Field Note`} className="bg-black">
      <Head>
        <link rel="canonical" href={`https://www.abrahamoflondon.org/shorts/${short.slugPath}`} />
        <meta name="robots" content="index, follow" />
      </Head>

      {/* Reading Progress Line */}
      <motion.div 
        style={{ width: progressLine }} 
        className="fixed top-0 left-0 h-[1px] bg-gold z-[100] transition-all duration-75" 
      />

      {/* Monastic Navigation */}
      <motion.nav 
        style={{ opacity: navOpacity }} 
        className="fixed top-0 inset-x-0 z-50 px-8 py-10 flex justify-between items-center pointer-events-none"
      >
        <button 
          onClick={() => router.push("/shorts")} 
          className="p-3 hover:bg-white/5 rounded-full transition-colors group pointer-events-auto"
        >
          <ArrowLeft className="h-5 w-5 text-white/30 group-hover:text-gold transition-colors" />
        </button>
        
        <div className="font-mono text-[9px] tracking-[0.5em] text-white/10 uppercase flex items-center gap-2">
          <Shield size={12} className="text-gold/20" /> Secure Briefing
        </div>

        <button className="p-3 hover:bg-white/5 rounded-full group pointer-events-auto">
          <Share2 size={16} className="text-white/30 group-hover:text-gold transition-colors" />
        </button>
      </motion.nav>

      <main className="max-w-2xl mx-auto px-6 pt-56 pb-40">
        <header className="mb-24">
          <div className="font-mono text-[10px] text-gold/60 uppercase tracking-[0.6em] mb-10">
            Entry // {short.theme || "Tactical"}
          </div>
          <h1 className="font-serif text-6xl md:text-7xl italic leading-tight text-white mb-12 tracking-tight">
            {short.title}
          </h1>
          <div className="flex items-center gap-6 text-white/20 font-mono text-[9px] uppercase tracking-widest">
             <span className="flex items-center gap-2"><Eye size={12}/> {short.views} Views</span>
             <span className="h-1 w-1 rounded-full bg-white/10" />
             <span>ID: {short.slugPath.toUpperCase()}</span>
          </div>
        </header>

        <article className="prose prose-invert prose-gold max-w-none prose-p:text-white/60 prose-p:text-xl prose-p:leading-[1.9] prose-p:font-light">
          {source && (
            <MDXRemote 
              {...source} 
              components={safeComponents as any} 
            />
          )}
        </article>

        <footer className="mt-40 pt-20 border-t border-white/[0.05]">
          <div className="flex flex-wrap gap-3 mb-20">
            {short.tags.map(tag => (
              <span key={tag} className="text-[10px] font-mono text-white/10 italic border border-white/5 px-3 py-1 rounded-full">#{tag}</span>
            ))}
          </div>

          <div className="space-y-32">
            <ShortNavigation currentSlug={short.slugPath} />
            <ShortComments shortId={short.slugPath} />
          </div>
        </footer>
      </main>
    </Layout>
  );
};

/* -----------------------------------------------------------------------------
  BUILD LOGIC
----------------------------------------------------------------------------- */
export const getStaticPaths: GetStaticPaths = async () => {
  const docs = getAllContentlayerDocs();
  // Filter for shorts by kind or directory path
  const shorts = docs.filter((d: any) => 
    d.kind === "Short" || d._raw?.sourceFileDir?.toLowerCase().includes("shorts")
  );

  const paths = shorts
    .filter((s: any) => !isDraftContent(s))
    .map((s: any) => {
      const bareSlug = normalizeSlug(s.slug || s._raw.flattenedPath).replace(/^shorts\//, "");
      return { params: { slug: bareSlug } };
    });

  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  try {
    const slug = String(params?.slug || "");
    
    // ✅ Resilient Lookup
    const data = getDocBySlug(`shorts/${slug}`) || getDocBySlug(slug);

    if (!data || isDraftContent(data)) return { notFound: true };

    const mdxRaw = data.body?.raw || "";
    const source = await serialize(mdxRaw, { 
      mdxOptions: { 
        remarkPlugins: [remarkGfm], 
        rehypePlugins: [rehypeSlug] 
      } 
    });

    const short: Short = {
      title: data.title || "Untitled Brief",
      excerpt: data.excerpt || null,
      date: data.date ? String(data.date) : null,
      coverImage: data.coverImage || null,
      tags: Array.isArray(data.tags) ? data.tags : [],
      author: data.author || "Abraham of London",
      url: `/shorts/${slug}`,
      slugPath: slug,
      readTime: (data as any).readTime || "2 min read",
      theme: (data as any).theme || null,
      views: Number((data as any).views || 0),
    };

    return {
      props: sanitizeData({
        short,
        source,
        mdxRaw
      }),
      revalidate: 3600,
    };
  } catch (err) {
    console.error("Shorts Build Error:", err);
    return { notFound: true };
  }
};

export default ShortPage;