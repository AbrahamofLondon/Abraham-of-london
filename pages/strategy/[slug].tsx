// pages/strategy/[slug].tsx — FINAL BUILD-PROOF (Seeded + URL Normalized)
import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { 
  BookOpen, FileSpreadsheet, Presentation, ClipboardCheck, 
  Target, ShieldCheck, Workflow, Landmark, ArrowRight, 
  Lock, Download, Calendar, MessageSquare 
} from "lucide-react";

import Layout from "@/components/Layout";
import mdxComponents from "@/components/mdx-components";
import { createSeededSafeMdxComponents } from "@/lib/mdx/safe-components";

import { serialize } from "next-mdx-remote/serialize";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";

import { safeSlice } from "@/lib/utils/safe";

// ✅ Server Helpers
import {
  getAllContentlayerDocs,
  getDocBySlug,
} from "@/lib/content/server";

import { 
  normalizeSlug, 
  sanitizeData, 
  isDraftContent 
} from "@/lib/content/shared";

// ==================== TYPES ====================
type Props = {
  strategy: any;
  source: MDXRemoteSerializeResult;
  mdxRaw: string;
};

// ==================== HELPERS ====================
function isStrategyDoc(d: any): boolean {
  const kind = String(d?.kind || d?.type || "").toLowerCase();
  if (kind === "strategy") return true;
  const flat = String(d?._raw?.flattenedPath || "").toLowerCase();
  return flat.startsWith("strategy/");
}

function strategySlugFromDoc(d: any): string {
  const raw = normalizeSlug(String(d.slug || d._raw?.flattenedPath || ""));
  return raw.replace(/^strategy\//, "").replace(/\.(md|mdx)$/i, "");
}

function getRawBody(d: any): string {
  return d?.body?.raw || d?.bodyRaw || d?.content || d?.mdx || "";
}

// ==================== STATIC PATHS ====================
export const getStaticPaths: GetStaticPaths = async () => {
  try {
    const docs = getAllContentlayerDocs();
    const paths = docs
      .filter((d: any) => isStrategyDoc(d) && !isDraftContent(d))
      .map((d: any) => ({ params: { slug: strategySlugFromDoc(d) } }));

    return { paths, fallback: "blocking" };
  } catch (e) {
    console.error("[strategy/getStaticPaths] error:", e);
    return { paths: [], fallback: "blocking" };
  }
};

// ==================== STATIC PROPS ====================
export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  try {
    const slug = String(params?.slug || "");
    const s = normalizeSlug(slug);
    
    // Resolve strategy document (checking with/without prefix)
    const strategy = (getDocBySlug(`strategy/${s}`) as any) || (getDocBySlug(s) as any);

    if (!strategy || !isStrategyDoc(strategy) || isDraftContent(strategy)) {
      return { notFound: true };
    }

    const mdxRaw = getRawBody(strategy);
    const source = await serialize(mdxRaw || " ", {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [rehypeSlug, [rehypeAutolinkHeadings, { behavior: "wrap" }]],
      },
    });

    return {
      props: {
        strategy: sanitizeData(strategy),
        source,
        mdxRaw,
      },
      revalidate: 1800,
    };
  } catch (e) {
    console.error("[strategy/getStaticProps] error:", e);
    return { notFound: true };
  }
};

// ==================== PAGE COMPONENT ====================
const StrategyDetailPage: NextPage<Props> = ({ strategy, source, mdxRaw }) => {
  const [activeSection, setActiveSection] = React.useState<string>("");
  const [progress, setProgress] = React.useState(0);

  // ✅ SEED + PROXY logic
  const safeComponents = React.useMemo(
    () => createSeededSafeMdxComponents(mdxComponents, mdxRaw),
    [mdxRaw]
  );

  React.useEffect(() => {
    const onScroll = () => {
      // Scrollspy logic
      const sections = document.querySelectorAll("h2[id], h3[id]");
      const scrollPos = window.scrollY + 120;
      sections.forEach((section: any) => {
        if (scrollPos >= section.offsetTop && scrollPos < section.offsetTop + (section.offsetHeight || 1)) {
          setActiveSection(section.id);
        }
      });

      // Progress bar
      const doc = document.documentElement;
      const pct = (window.scrollY / (doc.scrollHeight - window.innerHeight)) * 100;
      setProgress(Math.max(0, Math.min(100, pct)));
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const canonical = `https://www.abrahamoflondon.org/strategy/${strategySlugFromDoc(strategy)}`;

  return (
    <Layout title={strategy.title} description={strategy.excerpt || strategy.description}>
      <Head>
        <link rel="canonical" href={canonical} />
        <meta name="robots" content={strategy.accessLevel === "inner-circle" ? "noindex" : "index"} />
      </Head>

      <div className="relative overflow-hidden border-b border-gold/10 bg-black pt-24 pb-16">
        <div className="container relative mx-auto px-4">
          <div className="mb-6 flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-widest text-gold">{strategy.category || "Framework"}</span>
            {strategy.accessLevel === "inner-circle" && (
              <span className="rounded-full bg-gold/10 border border-gold/30 px-3 py-1 text-[10px] font-bold text-gold">INNER CIRCLE</span>
            )}
          </div>
          <h1 className="max-w-4xl font-serif text-4xl font-bold text-white sm:text-6xl">{strategy.title}</h1>
          <p className="mt-6 max-w-3xl text-lg text-zinc-400">{strategy.excerpt || strategy.description}</p>
          
          <div className="mt-8 flex gap-4">
            <Link href="#download" className="rounded-xl bg-gold px-6 py-3 text-sm font-bold text-black uppercase tracking-widest">
              Download Framework
            </Link>
            <Link href="/consulting/strategy-room" className="rounded-xl bg-white/5 border border-white/10 px-6 py-3 text-sm font-bold text-white uppercase tracking-widest">
              Strategy Room
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16 grid lg:grid-cols-4 gap-12">
        <aside className="lg:col-span-1">
          <div className="sticky top-24 space-y-8">
            <nav className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
              <h3 className="mb-4 text-xs font-bold uppercase text-white">Contents</h3>
              <div className="space-y-2">
                {["overview", "principles", "implementation", "tools"].map(id => (
                   <a key={id} href={`#${id}`} className={`block text-sm transition-colors ${activeSection === id ? "text-gold" : "text-zinc-500 hover:text-white"}`}>
                     {id.charAt(0).toUpperCase() + id.slice(1)}
                   </a>
                ))}
              </div>
            </nav>
          </div>
        </aside>

        <main className="lg:col-span-3">
          <article className="prose prose-invert prose-gold max-w-none">
            <MDXRemote {...source} components={safeComponents as any} />
          </article>
        </main>
      </div>

      <div className="fixed bottom-0 left-0 h-1 bg-gold transition-all duration-300" style={{ width: `${progress}%` }} />
    </Layout>
  );
};

export default StrategyDetailPage;