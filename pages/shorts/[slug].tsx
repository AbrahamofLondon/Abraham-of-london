// pages/shorts/[slug].tsx — FINAL BUILD-PROOF (seed + proxy, Pages Router)
import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";

import Layout from "@/components/Layout";

// ✅ FIXED: Use contentlayer-helper for ALL server-side functions
import {
  getAllContentlayerDocs,
  getDocBySlug,
  isDraftContent,
  normalizeSlug,
  sanitizeData,
} from "@/lib/contentlayer-helper";

// ✅ STANDARDIZED: Use createSeededSafeMdxComponents for seed + proxy
import { createSeededSafeMdxComponents } from "@/lib/mdx/safe-components";
import mdxComponents from "@/components/mdx-components";

import {
  Heart,
  Eye,
  Clock,
  Zap,
  Sparkles,
  Share2,
} from "lucide-react";

// Client-only engagement components
const BackToTop = dynamic(() => import("@/components/enhanced/BackToTop"), { ssr: false });
const ShortHero = dynamic(
  () => import("@/components/shorts/ShortHero").then((m) => m.default ?? (m as any).ShortHero),
  { ssr: false }
);

const ShortComments = dynamic(
  () => import("@/components/shorts/ShortComments").then((m) => m.default ?? (m as any).ShortComments),
  { ssr: false }
);

const ShortNavigation = dynamic(
  () => import("@/components/shorts/ShortNavigation").then((m) => m.default ?? (m as any).ShortNavigation),
  { ssr: false }
);

type ShortDoc = {
  title?: string | null;
  excerpt?: string | null;
  date?: string | null;
  coverImage?: string | null;
  tags?: string[] | null;
  author?: string | null;
  slug?: string | null;
  readTime?: string | null;
  draft?: boolean;
  kind?: string;
  href?: string;
  body?: { raw?: string };
  bodyRaw?: string;
  _raw?: { flattenedPath?: string };
  [k: string]: any;
};

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
  mdxRaw: string; // ✅ ADDED: Required for seeding
};

function getShortSlug(doc: ShortDoc): string {
  // prefer slug; fallback to flattenedPath; strip "shorts/" prefix if present
  const fromSlug = normalizeSlug(String(doc.slug || ""));
  const fromFlat = normalizeSlug(String(doc._raw?.flattenedPath || ""));
  const chosen = fromSlug || fromFlat;
  return chosen.replace(/^shorts\//, "");
}

// Paranoid MDX extraction
function getRawBody(doc: ShortDoc): string {
  return (
    doc?.body?.raw ||
    (typeof doc?.bodyRaw === "string" ? doc.bodyRaw : "") ||
    (typeof doc?.content === "string" ? doc.content : "") ||
    (typeof doc?.body === "string" ? doc.body : "") ||
    (typeof doc?.mdx === "string" ? doc.mdx : "") ||
    ""
  );
}

const ShortPage: NextPage<Props> = ({ short, source, mdxRaw }) => {
  const router = useRouter();
  const [likes, setLikes] = React.useState<number>(short.likes || 0);
  const [isLiked, setIsLiked] = React.useState<boolean>(false);
  const [isBookmarked, setIsBookmarked] = React.useState<boolean>(false);
  const [streak, setStreak] = React.useState<number>(0);
  const [readProgress, setReadProgress] = React.useState<number>(0);
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
  }, []);

  React.useEffect(() => {
    if (!isClient) return;

    // Habit Formation: Streak Logic
    const today = new Date().toDateString();
    const lastRead = localStorage.getItem("aol_last_short");
    const currentStreak = parseInt(localStorage.getItem("aol_streak") || "0", 10);

    if (lastRead !== today) {
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      const newStreak = lastRead === yesterday ? currentStreak + 1 : 1;
      setStreak(newStreak);
      localStorage.setItem("aol_streak", String(newStreak));
      localStorage.setItem("aol_last_short", today);
    } else {
      setStreak(currentStreak);
    }

    // Interaction State: Bookmarks & Likes
    try {
      const bookmarks = JSON.parse(localStorage.getItem("aol_bookmarks_shorts") || "[]");
      setIsBookmarked(Array.isArray(bookmarks) && bookmarks.includes(short.slugPath));

      const liked = JSON.parse(localStorage.getItem("aol_liked_shorts") || "[]");
      setIsLiked(Array.isArray(liked) && liked.includes(short.slugPath));
    } catch {
      setIsBookmarked(false);
      setIsLiked(false);
    }

    const handleScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? (window.scrollY / max) * 100 : 0;
      setReadProgress(Math.max(0, Math.min(100, progress)));
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [short.slugPath, isClient]);

  const toggleLike = () => {
    if (!isClient || isLiked) return;

    setLikes((v) => v + 1);
    setIsLiked(true);

    try {
      const liked = JSON.parse(localStorage.getItem("aol_liked_shorts") || "[]");
      const next = Array.isArray(liked) ? Array.from(new Set([...liked, short.slugPath])) : [short.slugPath];
      localStorage.setItem("aol_liked_shorts", JSON.stringify(next));
    } catch {
      localStorage.setItem("aol_liked_shorts", JSON.stringify([short.slugPath]));
    }
  };

  const handleShare = async () => {
    if (!isClient) return;

    const shareUrl = `https://www.abrahamoflondon.org${short.url}`;
    const payload = { title: short.title, text: short.excerpt || "", url: shareUrl };

    try {
      // Prefer Web Share API if available
      if (navigator.share) {
        await navigator.share(payload);
        return;
      }
    } catch {
      // fall through to clipboard
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      // you can swap this for your toaster if you have one
      // eslint-disable-next-line no-console
      console.log("Copied to clipboard:", shareUrl);
    } catch {
      // eslint-disable-next-line no-console
      console.log("Share failed:", shareUrl);
    }
  };

  return (
    <Layout title={`${short.title} | Field Note`}>
      <Head>
        <title>{short.title} | Abraham of London</title>
        <meta name="description" content={short.excerpt || ""} />
        <link rel="canonical" href={`https://www.abrahamoflondon.org${short.url}`} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={short.title} />
        <meta property="og:description" content={short.excerpt || ""} />
        <meta property="og:url" content={`https://www.abrahamoflondon.org${short.url}`} />
      </Head>

      {/* PROGRESS ENGINE */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-white/5 z-50">
        <div className="h-full bg-gold transition-all duration-300" style={{ width: `${readProgress}%` }} />
      </div>

      <main className="min-h-screen bg-black text-gray-300 selection:bg-gold selection:text-black pt-20 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* INTERACTION BAR */}
          <div className="mb-10 flex items-center justify-between border-b border-white/5 pb-8">
            <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest text-gray-500">
              <span className="flex items-center gap-2">
                <Eye size={14} className="text-gold/50" /> {Number(short.views || 0).toLocaleString()}
              </span>
              <span className="flex items-center gap-2">
                <Clock size={14} className="text-gold/50" /> {short.readTime || "2 min read"}
              </span>
              {streak > 1 ? (
                <span className="flex items-center gap-2 text-gold">
                  <Zap size={14} /> {streak} Day Streak
                </span>
              ) : null}
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={toggleLike}
                className={`p-2 rounded-lg border transition-all ${
                  isLiked
                    ? "bg-rose-500/10 border-rose-500/30 text-rose-500"
                    : "bg-white/5 border-white/10 text-gray-500 hover:text-white"
                }`}
                aria-label="Like"
                disabled={!isClient}
              >
                <Heart size={18} className={isLiked ? "fill-current" : ""} />
              </button>

              <button
                onClick={handleShare}
                className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-500 hover:text-white transition-all"
                aria-label="Share"
                disabled={!isClient}
              >
                <Share2 size={18} />
              </button>
            </div>
          </div>

          <div className="grid lg:grid-cols-12 gap-12">
            <div className="lg:col-span-8">
              <div className="bg-zinc-900/40 border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl">
                {isClient ? (
                  <ShortHero
                    title={short.title}
                    theme={short.theme}
                    author={short.author}
                    coverImage={short.coverImage}
                  />
                ) : (
                  <div className="h-48 bg-white/5 animate-pulse rounded-xl mb-8"></div>
                )}

                <article className="mt-8 prose prose-invert prose-gold max-w-none prose-p:leading-relaxed prose-p:text-gray-300">
                  {source ? (
                    /* ✅ SEED + PROXY: Guaranteed no missing component errors */
                    <MDXRemote 
                      {...source} 
                      components={safeComponents as any}
                    />
                  ) : (
                    // Fallback when no MDX source is available
                    <div className="prose prose-invert max-w-none">
                      <p className="text-gray-500 italic">Content unavailable.</p>
                    </div>
                  )}
                </article>

                <div className="mt-12 pt-8 border-t border-white/5 flex flex-wrap gap-2">
                  {short.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-gray-500"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-12">
                {isClient ? (
                  <ShortComments shortId={short.slugPath} />
                ) : (
                  <div className="h-32 rounded-lg bg-white/5 animate-pulse flex items-center justify-center">
                    <p className="text-xs text-gray-500">Loading comments…</p>
                  </div>
                )}
              </div>
            </div>

            <aside className="lg:col-span-4 space-y-6">
              <div className="sticky top-24 space-y-6">
                <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/10">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-gold mb-6">
                    Continue the Build
                  </h3>
                  {isClient ? (
                    <ShortNavigation currentSlug={short.slugPath} />
                  ) : (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-16 rounded-lg bg-white/5 animate-pulse"></div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-8 rounded-3xl bg-gradient-to-br from-gold/10 to-transparent border border-gold/20 text-center">
                  <Sparkles className="mx-auto text-gold mb-4" />
                  <h3 className="font-serif text-xl font-bold text-white mb-2">Daily Field Notes</h3>
                  <p className="text-xs text-gray-500 mb-6">
                    2-minute insights delivered to your dashboard daily.
                  </p>
                  <button
                    onClick={() => router.push("/inner-circle")}
                    className="w-full py-3 rounded-xl bg-gold text-black text-xs font-black uppercase tracking-widest hover:bg-gold/80 transition-all"
                    disabled={!isClient}
                  >
                    Subscribe
                  </button>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>

      {isClient && <BackToTop />}
    </Layout>
  );
};

export default ShortPage;

// ---------------------------------------------
// SSG (Pages Router)
// ---------------------------------------------
export const getStaticPaths: GetStaticPaths = async () => {
  // We use compat docs and filter by kind/dir — no server-only functions.
  const docs = getAllContentlayerDocs();

  const shorts = docs.filter((d: any) => d.kind === "Short" || d._raw?.sourceFileDir?.toLowerCase?.().includes("short"));

  const paths = shorts
    .filter((s: any) => !isDraftContent(s))
    .map((s: any) => getShortSlug(s))
    .filter((slug: string) => Boolean(slug))
    .map((slug: string) => ({ params: { slug } }));

  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  try {
    const slug = typeof params?.slug === "string" ? params.slug : Array.isArray(params?.slug) ? params?.slug.join("/") : "";
    const normalized = normalizeSlug(slug);
    if (!normalized) return { notFound: true };

    // Prefer Short lookup by slugPath: `shorts/<slug>` or `<slug>` depending on how contentlayer stores it.
    // Try both to be resilient.
    const direct = getDocBySlug(`shorts/${normalized}`) || getDocBySlug(normalized);
    const data = (direct as ShortDoc | null) ?? null;

    if (!data || isDraftContent(data)) return { notFound: true };

    // ✅ EXTRACT MDX RAW CONTENT FOR SEEDING
    const mdxRaw = getRawBody(data);
    
    // ✅ USE DIRECT SERIALIZE
    let source: MDXRemoteSerializeResult | null = null;
    if (typeof mdxRaw === "string" && mdxRaw.trim()) {
      try {
        source = await serialize(mdxRaw || " ", {
          mdxOptions: {
            remarkPlugins: [remarkGfm],
            rehypePlugins: [rehypeSlug],
          },
        });
      } catch (mdxError) {
        console.error(`MDX compilation error for ${normalized}:`, mdxError);
        source = null;
      }
    }

    const slugPath = getShortSlug(data);
    const url = `/shorts/${slugPath}`;

    const short: Short = {
      title: data.title || "Field Note",
      excerpt: data.excerpt || null,
      date: data.date || null,
      coverImage: data.coverImage || null,
      tags: Array.isArray(data.tags) ? data.tags : [],
      author: data.author || "Abraham of London",
      url,
      slugPath,
      readTime: data.readTime || "2 min read",
      theme: (data as any).theme || null,
      views: Number((data as any).views || 0),
      likes: Number((data as any).likes || 0),
    };

    return {
      props: {
        short: sanitizeData(short),
        source: source ? JSON.parse(JSON.stringify(source)) : null, // Ensure serializable
        mdxRaw, // ✅ PASS MDX RAW FOR SEEDING
      },
      revalidate: 3600,
    };
  } catch (error) {
    console.error(`Error in getStaticProps for /shorts/${params?.slug}:`, error);
    return { notFound: true };
  }
};