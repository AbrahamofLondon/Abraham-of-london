// components/ContentlayerDocPage.tsx — PRODUCTION STABLE (PAGES ROUTER SAFE)
import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import dynamic from "next/dynamic";

import Layout from "@/components/Layout";
import mdxComponents from "@/components/mdx-components";

// ✅ Pages Router compatible MDXRemote
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";

// Icons (safe)
import { ArrowLeft, Share2, Clock, Calendar, Tag, BookOpen, Eye, Users } from "lucide-react";

// ✅ framer-motion should never be a hard dependency in a pages route render path.
// If you want motion, load it client-side only.
const MotionNav = dynamic(() => import("./_motion/MotionNav").then((m) => m.MotionNav), {
  ssr: false,
});
const MotionHeader = dynamic(() => import("./_motion/MotionHeader").then((m) => m.MotionHeader), {
  ssr: false,
});

const SimpleReadTime = dynamic(
  () => import("@/components/enhanced/ReadTime").then((mod) => mod.SimpleReadTime),
  { ssr: true }
);

const SafeTableOfContents = dynamic(
  () => import("@/components/enhanced/TableOfContents").then((mod) => mod.SafeTableOfContents),
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
  // ✅ In Pages Router, use serialized MDX (not a raw string)
  mdxSource: MDXRemoteSerializeResult;
  canonicalPath: string;
  backHref?: string;
  label?: string;
  components?: Record<string, React.ComponentType<any>>;
  rawContent?: string;
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.abrahamoflondon.org";

function safeCanonicalUrl(path: string) {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${p}`;
}

function formatDateEnGb(input?: string | null) {
  if (!input) return null;
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function ContentlayerDocPage({
  doc,
  mdxSource,
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

  const title = (doc.title ?? "").trim() || "Untitled Volume";
  const description =
    (doc.excerpt ?? "").trim() ||
    (doc.description ?? "").trim() ||
    "Strategic assets for institutional architects.";

  const canonicalUrl = safeCanonicalUrl(canonicalPath);
  const ogImage = (doc.coverImage ?? "").trim();

  const displayDate = React.useMemo(() => formatDateEnGb(doc.date), [doc.date]);

  const onShare = React.useCallback(async () => {
    if (typeof window === "undefined") return;

    try {
      if (navigator.share) {
        await navigator.share({ title, text: description, url: canonicalUrl });
        return;
      }
      await navigator.clipboard.writeText(canonicalUrl);
      setIsShareTooltipVisible(true);
      window.setTimeout(() => setIsShareTooltipVisible(false), 2000);
    } catch {
      // user cancelled or browser blocked share/clipboard
    }
  }, [canonicalUrl, title, description]);

  React.useEffect(() => {
    // placeholder; replace with API call later
    setViewCount(Math.floor(Math.random() * 1000) + 100);
  }, []);

  const toggleBookmark = React.useCallback(() => {
    setIsBookmarked((v) => !v);
  }, []);

  const ProseClass = `
    prose prose-invert prose-gold max-w-none
    prose-headings:font-serif prose-headings:relative
    prose-h2:text-3xl prose-h2:mt-16 prose-h2:mb-8 prose-h2:pt-8 prose-h2:border-t prose-h2:border-white/10
    prose-h3:text-2xl prose-h3:mt-12 prose-h3:mb-6
    prose-p:text-gray-300 prose-p:leading-relaxed prose-p:text-lg
    prose-strong:text-amber-300 prose-strong:font-semibold
    prose-a:text-amber-400 prose-a:no-underline hover:prose-a:text-amber-300 hover:prose-a:underline
    prose-blockquote:border-l-4 prose-blockquote:border-amber-500/50 prose-blockquote:bg-gradient-to-r prose-blockquote:from-amber-500/5 prose-blockquote:to-transparent prose-blockquote:p-8 prose-blockquote:rounded-xl
    prose-pre:bg-black prose-pre:border prose-pre:border-white/10 prose-pre:rounded-2xl prose-pre:shadow-2xl
    prose-ul:space-y-3 prose-li:text-gray-300
    prose-img:rounded-2xl prose-img:shadow-2xl prose-img:border prose-img:border-white/10
  `;

  return (
    <Layout title={title} description={description} ogImage={ogImage || ""}>
      <Head>
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary_large_image" />
        {ogImage ? <meta property="og:image" content={ogImage} /> : null}
      </Head>

      <main className="min-h-screen bg-gradient-to-b from-black via-zinc-950 to-black text-cream">
        {/* If motion chunks fail, you still ship. */}
        <MotionNav
          backHref={backHref}
          label={label}
          onShare={onShare}
          isBookmarked={isBookmarked}
          toggleBookmark={toggleBookmark}
          isShareTooltipVisible={isShareTooltipVisible}
        />

        <article className="mx-auto max-w-6xl px-6 py-16 lg:py-24">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
            {/* Main */}
            <div className="lg:col-span-8">
              <MotionHeader
                title={title}
                excerpt={doc.excerpt ?? ""}
                category={doc.category ?? ""}
                label={label}
                featured={!!doc.featured}
                displayDate={displayDate}
                readTime={doc.readTime ?? ""}
                viewCount={viewCount}
                author={doc.author ?? ""}
                tags={doc.tags ?? []}
              />

              <div className="relative" ref={contentRef}>
                <SafeTableOfContents contentRef={contentRef} className="mb-8" />

                <div className={ProseClass}>
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
                    <MDXRemote {...mdxSource} components={components as any} />
                  </React.Suspense>
                </div>
              </div>

              <footer className="mt-24 border-t border-white/10 pt-12">
                <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/0 p-8 backdrop-blur-sm">
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
            <aside className="lg:col-span-4">
              <div className="sticky top-24 space-y-8">
                <div className="rounded-2xl border border-white/10 bg-black/50 p-6 backdrop-blur-sm">
                  <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-white">
                    Reading Stats
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <div className="mb-1 flex justify-between text-xs text-gray-400">
                        <span>Completion</span>
                        <span>25%</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-1000"
                          style={{ width: "25%" }}
                        />
                      </div>
                    </div>

                    {rawContent ? (
                      <div className="border-t border-white/10 pt-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400">Words</span>
                          <span className="font-mono text-sm text-white">
                            {rawContent.split(/\s+/).filter(Boolean).length.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/50 p-6 backdrop-blur-sm">
                  <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-white">
                    Related Intelligence
                  </h3>
                  <div className="space-y-3">
                    {["Architectural Principles", "Institutional Strategy", "Founder Framework"].map((item) => (
                      <a
                        key={item}
                        href="#"
                        className="group flex items-center gap-3 rounded-lg p-3 transition-all hover:bg-white/5"
                      >
                        <div className="h-2 w-2 rounded-full bg-amber-500/60 group-hover:bg-amber-500" />
                        <span className="text-sm text-gray-300 group-hover:text-white">{item}</span>
                      </a>
                    ))}
                  </div>
                </div>

                {String(doc.type || "").toLowerCase() === "download" ? (
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
                ) : null}
              </div>
            </aside>
          </div>
        </article>

        <style jsx global>{`
          @keyframes gradientShift {
            0%,
            100% {
              background-position: 0% 50%;
            }
            50% {
              background-position: 100% 50%;
            }
          }

          .prose pre {
            position: relative;
            background: linear-gradient(135deg, #000, #111);
            background-size: 200% 200%;
            animation: gradientShift 10s ease infinite;
          }

          .prose pre::before {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 1px;
            background: linear-gradient(
              90deg,
              transparent,
              rgba(245, 158, 11, 0.3),
              rgba(245, 158, 11, 0.6),
              rgba(245, 158, 11, 0.3),
              transparent
            );
          }

          .prose h2::before {
            content: "#";
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
      </main>
    </Layout>
  );
}