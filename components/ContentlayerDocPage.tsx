// components/ContentlayerDocPage.tsx — PRODUCTION STABLE (PAGES ROUTER SAFE)
import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import dynamic from "next/dynamic";

import Layout from "@/components/Layout";
import mdxComponents from "@/components/mdx-components";
import { createSeededSafeMdxComponents } from "@/lib/mdx/safe-components";

// Pages Router compatible MDXRemote
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";

// Icons
import { BookOpen } from "lucide-react";

// Motion components (client-only)
const MotionNav = dynamic(() => import("./_motion/MotionNav").then((m) => m.MotionNav), {
  ssr: false,
  loading: () => <div className="h-14 w-full bg-black/60 backdrop-blur-sm border-b border-white/10" />
});

const MotionHeader = dynamic(() => import("./_motion/MotionHeader").then((m) => m.MotionHeader), {
  ssr: false,
  loading: () => <div className="h-64 w-full bg-white/5 animate-pulse rounded-2xl" />
});

const SimpleReadTime = dynamic(() => import("@/components/enhanced/ReadTime").then((m) => m.SimpleReadTime), { ssr: true });
const SafeTableOfContents = dynamic(() => import("@/components/enhanced/TableOfContents").then((m) => m.SafeTableOfContents), { ssr: false });

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
  source: MDXRemoteSerializeResult; // ✅ Standardized naming
  canonicalPath: string;
  backHref?: string;
  label?: string;
  mdxRaw?: string; // ✅ Required for Seeding
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.abrahamoflondon.org";

export default function ContentlayerDocPage({
  doc,
  source,
  canonicalPath,
  backHref = "/content",
  label = "Reading Room",
  mdxRaw = "",
}: Props) {
  const [viewCount, setViewCount] = React.useState<number | null>(null);
  const [isShareTooltipVisible, setIsShareTooltipVisible] = React.useState(false);
  const [isBookmarked, setIsBookmarked] = React.useState(false);
  const contentRef = React.useRef<HTMLDivElement>(null);

  // ✅ SEED + PROXY: Guaranteed no missing component errors
  const safeComponents = React.useMemo(() => 
    createSeededSafeMdxComponents(mdxComponents, mdxRaw, {
      warnOnFallback: process.env.NODE_ENV === "development",
    }), [mdxRaw]
  );

  const title = doc?.title || "Untitled Volume";
  const description = doc?.excerpt || doc?.description || "Strategic assets for institutional architects.";
  const canonicalUrl = `${SITE_URL}${canonicalPath.startsWith("/") ? canonicalPath : `/${canonicalPath}`}`;

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const key = `aol_view_${canonicalPath}`;
    const prev = Number(window.localStorage.getItem(key) || "0");
    window.localStorage.setItem(key, String(prev + 1));
    setViewCount(prev + 1);
    setIsBookmarked(window.localStorage.getItem(`aol_bookmark_${doc?.slug || canonicalPath}`) === "1");
  }, [canonicalPath, doc?.slug]);

  const toggleBookmark = () => {
    setIsBookmarked(v => {
      window.localStorage.setItem(`aol_bookmark_${doc?.slug || canonicalPath}`, !v ? "1" : "0");
      return !v;
    });
  };

  return (
    <Layout title={title} description={description} ogImage={doc?.coverImage || ""}>
      <Head>
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:type" content="article" />
      </Head>

      <main className="min-h-screen bg-gradient-to-b from-black via-zinc-950 to-black text-cream">
        <MotionNav
          backHref={backHref}
          label={label}
          onShare={async () => {
            if (navigator.share) await navigator.share({ title, url: canonicalUrl });
            else {
              await navigator.clipboard.writeText(canonicalUrl);
              setIsShareTooltipVisible(true);
              setTimeout(() => setIsShareTooltipVisible(false), 2000);
            }
          }}
          isBookmarked={isBookmarked}
          toggleBookmark={toggleBookmark}
          isShareTooltipVisible={isShareTooltipVisible}
        />

        <article className="mx-auto max-w-6xl px-6 py-16 lg:py-24">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <MotionHeader
                title={title}
                excerpt={doc?.excerpt}
                category={doc?.category}
                label={label}
                featured={!!doc?.featured}
                displayDate={doc?.date ? new Date(doc.date).toLocaleDateString("en-GB") : null}
                readTime={doc?.readTime}
                viewCount={viewCount}
                author={doc?.author}
                tags={doc?.tags || []}
              />

              <div className="relative" ref={contentRef}>
                <SafeTableOfContents contentRef={contentRef} className="mb-8" />
                <div className="prose prose-invert prose-gold max-w-none prose-p:text-gray-300 prose-p:text-lg">
                  {/* ✅ Using safeComponents from the seed+proxy utility */}
                  <MDXRemote {...source} components={safeComponents as any} />
                </div>
              </div>

              <footer className="mt-24 border-t border-white/10 pt-12 text-center">
                <p className="font-serif text-2xl italic text-white mb-2">&quot;Architecture is destiny, made visible.&quot;</p>
                <SimpleReadTime content={mdxRaw} />
              </footer>
            </div>

            <aside className="lg:col-span-4">
              <div className="sticky top-24 space-y-8">
                <div className="rounded-2xl border border-white/10 bg-black/50 p-6 backdrop-blur-sm">
                   <h3 className="text-xs font-bold uppercase tracking-widest text-white mb-4">Intelligence Stats</h3>
                   <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-gold w-1/4" />
                   </div>
                   <p className="text-[10px] text-gray-500 mt-2 uppercase tracking-tighter">Reading Progress</p>
                </div>
                
                <div className="rounded-2xl border border-white/10 bg-black/50 p-6">
                  <Link href={backHref} className="flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300 transition-colors">
                    <BookOpen className="h-4 w-4" /> Back to {label}
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </article>
      </main>
    </Layout>
  );
}