// pages/canon/[slug].tsx - CORRECTED VERSION
// ✅ Pages Router (no 'use client')
// ✅ Clean boundary imports
// ✅ No duplicate functions
// ✅ Proper JSON serialization

import React, { useEffect, useMemo, useState, useCallback } from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";

import Layout from "@/components/Layout";
import CanonHero from "@/components/canon/CanonHero";
import CanonContent from "@/components/canon/CanonContent";
import CanonNavigation from "@/components/canon/CanonNavigation";
import CanonStudyGuide from "@/components/canon/CanonStudyGuide";
import AccessGate from "@/components/AccessGate";

// ✅ CORRECT: Server-side imports from single boundary
import { getServerAllCanons, getServerCanonBySlug } from "@/lib/content/server";
import { sanitizeData, resolveDocCoverImage } from "@/lib/content/shared";

// ✅ CORRECT: MDX components from existing import
import { mdxComponents } from "@/lib/server/md-utils";

import { ChevronRight, Lock, BookOpen, Clock, Users, Sparkles } from "lucide-react";

// Enhanced reading UX for dense content
const ReadingProgress = dynamic(() => import("@/components/enhanced/ReadingProgress"), { ssr: false });
const TableOfContents = dynamic(() => import("@/components/enhanced/TableOfContents"), { ssr: false });
const ReadTime = dynamic(() => import("@/components/enhanced/ReadTime"), { ssr: false });
const BackToTop = dynamic(() => import("@/components/enhanced/BackToTop"), { ssr: false });

// 🔥 CRITICAL FIX: Dynamically import MDXRemote to avoid SSR issues
const MDXRemote = dynamic(
  () => import('next-mdx-remote').then((mod) => mod.MDXRemote),
  { 
    ssr: false,
    loading: () => (
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-gray-700 rounded w-3/4"></div>
        <div className="h-4 bg-gray-700 rounded w-1/2"></div>
        <div className="h-4 bg-gray-700 rounded w-5/6"></div>
      </div>
    )
  }
);

type Tier = "public" | "inner-circle" | "private";

function asTier(v: unknown): Tier {
  const s = String(v || "").toLowerCase();
  if (s === "private") return "private";
  if (s === "inner-circle") return "inner-circle";
  return "public";
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

type Props = {
  canon: Canon;
  locked: boolean;
  source?: any; // Changed from MDXRemoteSerializeResult to any for safety
};

// ✅ CORRECT: MDX helper (build-time only)
async function prepareMDX(raw: string): Promise<any> {
  if (!raw || typeof raw !== 'string' || !raw.trim()) {
    return { compiledSource: '<p>Content is being prepared.</p>' };
  }
  
  try {
    const { serialize } = await import('next-mdx-remote/serialize');
    const remarkGfm = await import('remark-gfm');
    const rehypeSlug = await import('rehype-slug');
    
    return await serialize(raw, {
      mdxOptions: {
        remarkPlugins: [remarkGfm.default || remarkGfm],
        rehypePlugins: [rehypeSlug.default || rehypeSlug],
      },
    });
  } catch (error) {
    console.error('MDX compilation error:', error);
    return { compiledSource: '<p>Content failed to load.</p>' };
  }
}

// 🔥 SAFE MDX COMPONENTS: Ensure no undefined components
const getSafeMdxComponents = () => {
  const safeComponents: any = {};
  
  if (mdxComponents && typeof mdxComponents === 'object') {
    Object.keys(mdxComponents).forEach(key => {
      const Comp = (mdxComponents as any)[key];
      if (Comp && typeof Comp === 'function') {
        safeComponents[key] = Comp;
      } else {
        // Fallback component for safety
        safeComponents[key] = ({ children, ...props }: any) => {
          console.warn(`MDX Component "${key}" is not properly defined`);
          return React.createElement('div', props, children);
        };
      }
    });
  }
  
  return safeComponents;
};

// ====================================================================
// getStaticPaths
// ====================================================================
export const getStaticPaths: GetStaticPaths = async () => {
  const canons = getServerAllCanons();
  
  // Build paths for ALL canons (including private)
  const paths = canons.map((canon) => {
    const raw = canon.slug || canon._raw?.flattenedPath || "";
    const cleaned = raw.replace(/^\/+|\/+$/g, "").replace(/^canon\//, "").replace(/\.(md|mdx)$/i, "");
    return cleaned ? { params: { slug: cleaned } } : null;
  }).filter(Boolean) as Array<{ params: { slug: string } }>;

  return {
    paths,
    fallback: "blocking",
  };
};

// ====================================================================
// getStaticProps
// ====================================================================
export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  try {
    const raw = params?.slug;
    const slug = Array.isArray(raw) ? raw[0] : raw;
    if (!slug) return { notFound: true };

    const canonData = getServerCanonBySlug(slug);
    if (!canonData) return { notFound: true };

    // ✅ CORRECT: JSON-safe canon object (no undefined)
    const canon: Canon = {
      title: typeof canonData.title === "string" && canonData.title.trim() ? canonData.title : "Canon",
      excerpt: typeof canonData.excerpt === "string" && canonData.excerpt.trim() ? canonData.excerpt : null,
      subtitle: typeof canonData.subtitle === "string" && canonData.subtitle.trim() ? canonData.subtitle : null,
      slug: typeof canonData.slug === "string" && canonData.slug.trim() ? canonData.slug : slug,
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
      // Compile public canon at build time
      const rawMdx = String(canonData?.body?.raw ?? canonData?.body ?? "");
      let source: any = {};
      
      if (rawMdx.trim()) {
        try {
          source = await prepareMDX(rawMdx);
        } catch (mdxError) {
          console.error(`MDX compilation error for ${slug}:`, mdxError);
          source = { compiledSource: '' };
        }
      } else {
        source = { compiledSource: '' };
      }

      return {
        props: sanitizeData({ 
          canon, 
          locked: false, 
          source: JSON.parse(JSON.stringify(source)) // 🔥 CRITICAL: Ensure serializable
        }),
        revalidate: 1800,
      };
    }

    // For locked content, source = undefined (client will fetch from /api/canon/[slug])
    return {
      props: sanitizeData({ canon, locked: true }),
      revalidate: 1800,
    };
  } catch (error) {
    console.error(`Error in getStaticProps for /canon/${params?.slug}:`, error);
    return { notFound: true };
  }
};

// ====================================================================
// Canon Page Component
// ====================================================================
const CanonPage: NextPage<Props> = ({ canon, locked, source }) => {
  const router = useRouter();
  const [dynamicSource, setDynamicSource] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [mdxComponents, setMdxComponents] = useState<any>({});

  useEffect(() => {
    setIsClient(true);
    setMdxComponents(getSafeMdxComponents());
  }, []);

  // Fetch locked canon content on mount
  useEffect(() => {
    if (isClient && locked && !dynamicSource) {
      setIsLoading(true);
      fetch(`/api/canon/${canon.slug}`)
        .then((res) => {
          if (!res.ok) throw new Error('Failed to fetch');
          return res.json();
        })
        .then((data) => {
          if (data.ok && data.source) {
            setDynamicSource(data.source);
          }
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [locked, canon.slug, dynamicSource, isClient]);

  const displaySource = locked ? dynamicSource : source;

  const canonNavLinks = useMemo(() => {
    const all = getServerAllCanons();
    return all
      .filter((c: any) => !c.draft)
      .map((c: any) => ({
        title: c.title,
        slug: c.slug,
        locked: asTier(c.accessLevel) !== "public",
      }));
  }, []);

  if (router.isFallback) {
    return (
      <Layout title="Loading...">
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
            <p className="text-gold">Loading manuscript...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <>
      <Head>
        <title>{`${canon.title} – Abraham Canon`}</title>
        <meta name="description" content={canon.excerpt || ""} />
      </Head>

      <Layout title={canon.title}>
        {/* Reading progress bar */}
        <ReadingProgress />

        <main className="min-h-screen bg-gradient-to-b from-black via-black to-gray-900">
          <CanonHero canon={canon} locked={locked} />

          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-4">
              {/* Left sidebar - Table of Contents */}
              <div className="lg:col-span-1">
                {displaySource?.compiledSource && (
                  <TableOfContents content={displaySource.compiledSource} />
                )}
              </div>

              {/* Main content */}
              <div className="lg:col-span-2">
                {locked && !displaySource ? (
                  <AccessGate
                    title={canon.title}
                    message={canon.lockMessage || "This manuscript is reserved for Abraham's inner circle."}
                    tierRequired={canon.accessLevel}
                    isLoading={isLoading}
                  />
                ) : displaySource && isClient ? (
                  <MDXRemote {...displaySource} components={mdxComponents} />
                ) : displaySource ? (
                  // Server-side fallback
                  <div className="prose prose-invert max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: displaySource.compiledSource || '' }} />
                  </div>
                ) : (
                  <CanonContent source={displaySource} />
                )}

                {/* Study guide for dense content */}
                {displaySource?.compiledSource && <CanonStudyGuide content={displaySource.compiledSource} />}
              </div>

              {/* Right sidebar - Navigation */}
              <div className="lg:col-span-1">
                <CanonNavigation links={canonNavLinks} currentSlug={canon.slug} />
                
                {/* Reading stats */}
                <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
                  <h3 className="mb-4 font-serif text-lg font-semibold text-cream">
                    <BookOpen className="mr-2 inline-block h-5 w-5" />
                    Reading Stats
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-300">
                      <Clock className="mr-3 h-4 w-4 text-gold" />
                      <span>Estimated read time: {canon.readTime || "15-20 min"}</span>
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
              </div>
            </div>
          </div>

          {/* Back to top button */}
          <BackToTop />
        </main>
      </Layout>
    </>
  );
};

export default CanonPage;