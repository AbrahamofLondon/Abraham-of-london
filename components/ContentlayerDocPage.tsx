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
import { useMDXComponent } from "next-contentlayer2/hooks";

// Icons
import { BookOpen } from "lucide-react";

// Motion components (client-only) – all default exports
const MotionNav = dynamic(() => import("./_motion/MotionNav"), {
  ssr: false,
  loading: () => (
    <div className="h-14 w-full border-b border-white/10 bg-black/60 backdrop-blur-sm" />
  ),
});

const MotionHeader = dynamic(() => import("./_motion/MotionHeader"), {
  ssr: false,
  loading: () => <div className="h-64 w-full animate-pulse rounded-2xl bg-white/5" />,
});

// Enhanced components – named exports
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
  body?: {
    raw?: string | null;
    code?: string | null;
  } | null;
  content?: string | null;
};

type Props = {
  doc: ContentlayerDoc;
  source?: MDXRemoteSerializeResult;
  canonicalPath: string;
  backHref?: string;
  label?: string;
  mdxRaw?: string;
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.abrahamoflondon.org";

function ContentlayerBodyRenderer({
  code,
  components,
}: {
  code: string;
  components: Record<string, React.ComponentType<any>>;
}) {
  const Component = useMDXComponent(code);
  return <Component components={components} />;
}

export default function ContentlayerDocPage({
  doc,
  source,
  canonicalPath,
  backHref = "/content",
  label = "Reading Room",
  mdxRaw,
}: Props) {
  const [viewCount, setViewCount] = React.useState<number | null>(null);
  const [isShareTooltipVisible, setIsShareTooltipVisible] = React.useState(false);
  const [isBookmarked, setIsBookmarked] = React.useState(false);
  const contentRef = React.useRef<HTMLDivElement>(null);

  const effectiveMdxRaw =
    mdxRaw ?? doc?.body?.raw ?? doc?.content ?? "";

  const contentlayerCode =
    typeof doc?.body?.code === "string" && doc.body.code.trim().length > 0
      ? doc.body.code
      : null;

  // SEED + PROXY: Guaranteed no missing component errors
  const safeComponents = React.useMemo(
    () =>
      createSeededSafeMdxComponents(mdxComponents, effectiveMdxRaw, {
        warnOnFallback: process.env.NODE_ENV === "development",
      }),
    [effectiveMdxRaw]
  );

  const title = doc?.title || "Untitled Volume";
  const description =
    doc?.excerpt || doc?.description || "Strategic assets for institutional architects.";
  const canonicalUrl = `${SITE_URL}${canonicalPath.startsWith("/") ? canonicalPath : `/${canonicalPath}`}`;

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const key = `aol_view_${canonicalPath}`;
    const prev = Number(window.localStorage.getItem(key) || "0");
    window.localStorage.setItem(key, String(prev + 1));
    setViewCount(prev + 1);
    setIsBookmarked(
      window.localStorage.getItem(`aol_bookmark_${doc?.slug || canonicalPath}`) === "1"
    );
  }, [canonicalPath, doc?.slug]);

  const toggleBookmark = () => {
    if (typeof window === "undefined") return;
    setIsBookmarked((v) => {
      window.localStorage.setItem(
        `aol_bookmark_${doc?.slug || canonicalPath}`,
        !v ? "1" : "0"
      );
      return !v;
    });
  };

  const nullToUndefined = <T,>(value: T | null | undefined): T | undefined =>
    value == null ? undefined : value;

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
            if (typeof navigator === "undefined") return;

            if (navigator.share) {
              await navigator.share({ title, url: canonicalUrl });
            } else if (navigator.clipboard?.writeText) {
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
                excerpt={nullToUndefined(doc?.excerpt)}
                category={nullToUndefined(doc?.category)}
                label={label}
                featured={!!doc?.featured}
                displayDate={
                  doc?.date ? new Date(doc.date).toLocaleDateString("en-GB") : undefined
                }
                readTime={nullToUndefined(doc?.readTime)}
                viewCount={nullToUndefined(viewCount)}
                author={nullToUndefined(doc?.author)}
                tags={doc?.tags || []}
              />

              <div className="relative" ref={contentRef}>
                <SafeTableOfContents
                  contentRef={contentRef as React.RefObject<HTMLElement>}
                  className="mb-8"
                />

                <div className="prose prose-invert prose-gold max-w-none prose-p:text-lg prose-p:text-gray-300">
                  {source ? (
                    <MDXRemote {...source} components={safeComponents as any} />
                  ) : contentlayerCode ? (
                    <ContentlayerBodyRenderer
                      code={contentlayerCode}
                      components={safeComponents as Record<string, React.ComponentType<any>>}
                    />
                  ) : effectiveMdxRaw ? (
                    <pre className="whitespace-pre-wrap text-sm text-gray-300">
                      {effectiveMdxRaw}
                    </pre>
                  ) : (
                    <p className="text-gray-400">No content available.</p>
                  )}
                </div>
              </div>

              <footer className="mt-24 border-t border-white/10 pt-12 text-center">
                <p className="mb-2 font-serif text-2xl italic text-white">
                  &quot;Architecture is destiny, made visible.&quot;
                </p>
                <SimpleReadTime content={effectiveMdxRaw} />
              </footer>
            </div>

            <aside className="lg:col-span-4">
              <div className="sticky top-24 space-y-8">
                <div className="rounded-2xl border border-white/10 bg-black/50 p-6 backdrop-blur-sm">
                  <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-white">
                    Intelligence Stats
                  </h3>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-1/4 bg-gold" />
                  </div>
                  <p className="mt-2 text-[10px] uppercase tracking-tighter text-gray-500">
                    Reading Progress
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/50 p-6">
                  <Link
                    href={backHref}
                    className="flex items-center gap-2 text-sm text-amber-400 transition-colors hover:text-amber-300"
                  >
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