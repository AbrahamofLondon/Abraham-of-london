// pages/canon/[slug].tsx — PRODUCTION (Pages Router, Static Export Safe)
// ✅ No client-side import of server-only modules
// ✅ JSON-serializable props only
// ✅ Locked content fetched via API (client-only)
// ✅ Nav links computed at build-time (not in React render)
// ✅ MDX compiled at build-time for public content

import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";

import Layout from "@/components/Layout";
import CanonHero from "@/components/canon/CanonHero";
import CanonNavigation from "@/components/canon/CanonNavigation";
import CanonStudyGuide from "@/components/canon/CanonStudyGuide";
import AccessGate from "@/components/AccessGate";

// ✅ Server boundary (build-time only)
import { getServerAllCanons, getServerCanonBySlug } from "@/lib/content/server";

// ✅ Shared helpers (isomorphic)
import { sanitizeData, resolveDocCoverImage } from "@/lib/content/shared";

// ✅ MDX components registry (safe to use client-side as plain object)
import { mdxComponents } from "@/lib/server/md-utils";

import { BookOpen, Clock, Users, Sparkles } from "lucide-react";

// Client-only enhancements
const ReadingProgress = dynamic(() => import("@/components/enhanced/ReadingProgress"), { ssr: false });
const TableOfContents = dynamic(() => import("@/components/enhanced/TableOfContents"), { ssr: false });
const BackToTop = dynamic(() => import("@/components/enhanced/BackToTop"), { ssr: false });

// ✅ MDXRemote as client-only (keeps SSR clean if your MDX stack is touchy)
const MDXRemote = dynamic(() => import("next-mdx-remote").then((m) => m.MDXRemote), {
  ssr: false,
  loading: () => (
    <div className="animate-pulse space-y-4">
      <div className="h-4 bg-gray-700 rounded w-3/4" />
      <div className="h-4 bg-gray-700 rounded w-1/2" />
      <div className="h-4 bg-gray-700 rounded w-5/6" />
    </div>
  ),
});

type Tier = "public" | "inner-circle" | "private";

function asTier(v: unknown): Tier {
  const s = String(v || "").toLowerCase().trim();
  if (s === "private") return "private";
  if (s === "inner-circle" || s === "inner circle") return "inner-circle";
  return "public";
}

function normalizeSlug(input: unknown): string {
  const s = String(input || "").trim();
  if (!s) return "";
  return s
    .replace(/^\/+|\/+$/g, "")
    .replace(/^canon\//i, "")
    .replace(/\.(md|mdx)$/i, "");
}

type Canon = {
  title: string;
  excerpt: string | null;
  subtitle: string | null;
  slug: string;
  accessLevel: Tier;
  lockMessage: string | null;
  coverImage: string | null;
  volumeNumber?: string;
  order?: number;
  readTime?: string | number | null;
  author?: string;
  date?: string;
  tags?: string[];
};

type NavLink = {
  title: string;
  slug: string;
  locked: boolean;
};

type Props = {
  canon: Canon;
  locked: boolean;
  navLinks: NavLink[];
  source?: any; // MDXRemoteSerializeResult-like
};

// ------------------------------------------------------------
// Build-time MDX compiler
// ------------------------------------------------------------
async function compileMdx(raw: string): Promise<any> {
  const content = typeof raw === "string" ? raw : "";
  if (!content.trim()) return { compiledSource: "" };

  try {
    const { serialize } = await import("next-mdx-remote/serialize");
    const remarkGfm = await import("remark-gfm");
    const rehypeSlug = await import("rehype-slug");

    return await serialize(content, {
      mdxOptions: {
        remarkPlugins: [remarkGfm.default || (remarkGfm as any)],
        rehypePlugins: [rehypeSlug.default || (rehypeSlug as any)],
      },
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("MDX compilation error:", err);
    return { compiledSource: "" };
  }
}

// ------------------------------------------------------------
// Safe MDX components (avoid undefined entries)
// ------------------------------------------------------------
function getSafeMdxComponents() {
  const safe: Record<string, any> = {};
  const src = mdxComponents as any;

  if (src && typeof src === "object") {
    for (const key of Object.keys(src)) {
      const Comp = src[key];
      if (Comp && (typeof Comp === "function" || typeof Comp === "object")) {
        safe[key] = Comp;
      }
    }
  }
  return safe;
}

// ------------------------------------------------------------
// SSG
// ------------------------------------------------------------
export const getStaticPaths: GetStaticPaths = async () => {
  const canons = getServerAllCanons();

  const paths = canons
    .map((c: any) => normalizeSlug(c?.slug || c?._raw?.flattenedPath || ""))
    .filter(Boolean)
    .map((slug) => ({ params: { slug } }));

  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  try {
    const raw = (params as any)?.slug;
    const slug = normalizeSlug(Array.isArray(raw) ? raw[0] : raw);
    if (!slug) return { notFound: true };

    const canonData = getServerCanonBySlug(slug);
    if (!canonData) return { notFound: true };

    // Build nav at build-time (NO server imports in component)
    const all = getServerAllCanons();
    const navLinks: NavLink[] = all
      .filter((c: any) => !c?.draft)
      .map((c: any) => {
        const s = normalizeSlug(c?.slug || c?._raw?.flattenedPath || "");
        return {
          title: String(c?.title || "Canon"),
          slug: s,
          locked: asTier(c?.accessLevel) !== "public",
        };
      })
      .filter((x) => Boolean(x.slug));

    const canon: Canon = {
      title: typeof canonData.title === "string" && canonData.title.trim() ? canonData.title : "Canon",
      excerpt: typeof canonData.excerpt === "string" && canonData.excerpt.trim() ? canonData.excerpt : null,
      subtitle: typeof canonData.subtitle === "string" && canonData.subtitle.trim() ? canonData.subtitle : null,
      slug: normalizeSlug(canonData.slug || slug) || slug,
      accessLevel: asTier(canonData.accessLevel),
      lockMessage: typeof canonData.lockMessage === "string" && canonData.lockMessage.trim() ? canonData.lockMessage : null,
      coverImage: resolveDocCoverImage(canonData) || canonData.coverImage || null,
      volumeNumber: typeof canonData.volumeNumber === "string" ? canonData.volumeNumber : undefined,
      order: typeof canonData.order === "number" ? canonData.order : undefined,
      readTime: canonData.readTime ?? null,
      author: typeof canonData.author === "string" ? canonData.author : undefined,
      date: typeof canonData.date === "string" ? canonData.date : undefined,
      tags: Array.isArray(canonData.tags) ? canonData.tags : undefined,
    };

    const isPublic = canon.accessLevel === "public";

    if (isPublic) {
      const rawMdx = String(canonData?.body?.raw ?? canonData?.body ?? "");
      const source = await compileMdx(rawMdx);

      return {
        props: sanitizeData({
          canon,
          locked: false,
          navLinks,
          source: JSON.parse(JSON.stringify(source)), // ensure serializable
        }),
        revalidate: 1800,
      };
    }

    return {
      props: sanitizeData({ canon, locked: true, navLinks }),
      revalidate: 1800,
    };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Error in getStaticProps for /canon/[slug]:", err);
    return { notFound: true };
  }
};

// ------------------------------------------------------------
// Page
// ------------------------------------------------------------
const CanonPage: NextPage<Props> = ({ canon, locked, source, navLinks }) => {
  const router = useRouter();
  const [isClient, setIsClient] = React.useState(false);
  const [mdxSafeComponents, setMdxSafeComponents] = React.useState<Record<string, any>>({});
  const [dynamicSource, setDynamicSource] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
    setMdxSafeComponents(getSafeMdxComponents());
  }, []);

  // Locked content fetch (client-only)
  React.useEffect(() => {
    if (!isClient) return;
    if (!locked) return;
    if (dynamicSource) return;

    setIsLoading(true);
    fetch(`/api/canon/${encodeURIComponent(canon.slug)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch canon source");
        return res.json();
      })
      .then((data) => {
        if (data?.ok && data?.source) setDynamicSource(data.source);
      })
      .catch((e) => console.error(e))
      .finally(() => setIsLoading(false));
  }, [isClient, locked, canon.slug, dynamicSource]);

  const displaySource = locked ? dynamicSource : source;

  if (router.isFallback) {
    return (
      <Layout title="Loading…">
        <div className="flex min-h-screen items-center justify-center bg-black">
          <div className="text-center">
            <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
            <p className="text-gold">Loading manuscript…</p>
          </div>
        </div>
      </Layout>
    );
  }

  const robots = locked ? "noindex, nofollow" : "index, follow";

  return (
    <>
      <Head>
        <title>{`${canon.title} – Abraham Canon`}</title>
        <meta name="description" content={canon.excerpt || ""} />
        <meta name="robots" content={robots} />
        <link rel="canonical" href={`https://www.abrahamoflondon.org/canon/${canon.slug}`} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={canon.title} />
        <meta property="og:description" content={canon.excerpt || ""} />
      </Head>

      <Layout title={canon.title} description={canon.excerpt || ""} className="bg-black min-h-screen">
        <ReadingProgress />

        <main className="min-h-screen bg-gradient-to-b from-black via-black to-gray-900">
          <CanonHero canon={canon as any} locked={locked} />

          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-4">
              {/* TOC */}
              <aside className="lg:col-span-1">
                {displaySource?.compiledSource ? (
                  <TableOfContents content={displaySource.compiledSource} />
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-gray-400">
                    Table of contents will appear once content is available.
                  </div>
                )}
              </aside>

              {/* CONTENT */}
              <section className="lg:col-span-2">
                {locked && !displaySource ? (
                  <AccessGate
                    title={canon.title}
                    message={canon.lockMessage || "This manuscript is reserved for Abraham's inner circle."}
                    tierRequired={canon.accessLevel}
                    isLoading={isLoading}
                  />
                ) : displaySource && isClient ? (
                  <article className="prose prose-invert prose-gold max-w-none">
                    <MDXRemote {...displaySource} components={mdxSafeComponents} />
                  </article>
                ) : displaySource ? (
                  <article className="prose prose-invert prose-gold max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: displaySource.compiledSource || "" }} />
                  </article>
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-gray-400">
                    Content is being prepared.
                  </div>
                )}

                {displaySource?.compiledSource ? (
                  <div className="mt-10">
                    <CanonStudyGuide content={displaySource.compiledSource} />
                  </div>
                ) : null}
              </section>

              {/* NAV + STATS */}
              <aside className="lg:col-span-1">
                <CanonNavigation links={navLinks as any} currentSlug={canon.slug} />

                <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
                  <h3 className="mb-4 font-serif text-lg font-semibold text-cream">
                    <BookOpen className="mr-2 inline-block h-5 w-5" />
                    Reading Stats
                  </h3>

                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-300">
                      <Clock className="mr-3 h-4 w-4 text-gold" />
                      <span>Estimated read time: {canon.readTime || "15–20 min"}</span>
                    </div>

                    <div className="flex items-center text-sm text-gray-300">
                      <Users className="mr-3 h-4 w-4 text-gold" />
                      <span>Access: {canon.accessLevel}</span>
                    </div>

                    <div className="flex items-center text-sm text-gray-300">
                      <Sparkles className="mr-3 h-4 w-4 text-gold" />
                      <span>Volume: {canon.volumeNumber || "I"}</span>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </div>

          <BackToTop />
        </main>
      </Layout>
    </>
  );
};

export default CanonPage;