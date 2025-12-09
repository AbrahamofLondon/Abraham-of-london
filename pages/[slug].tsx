// pages/[slug].tsx - FIXED IMPORTS
import * as React from "react";
import Head from "next/head";
import type { GetStaticPaths, GetStaticProps } from "next";
import {
  MDXRemote,
  type MDXRemoteSerializeResult,
} from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import { useRouter } from "next/router";
import Link from "next/link";

import Layout from "@/components/Layout";
import mdxComponents from "@/components/mdx-components";
import { getAllPosts, getPostBySlug } from "@/lib/posts";

const FALLBACK_COLLECTIONS = ["Print", "Resource"] as const;

/* -------------------------------------------------------------------------- */
/* PREMIUM COMPONENTS                                                         */
/* -------------------------------------------------------------------------- */

interface ArticleHeroProps {
  title: string;
  subtitle?: string;
  category: string;
  date?: string | null;
  readTime?: string | null;
  coverImage?: string;
  coverAspect?: "book" | "wide" | "square";
  coverFit?: "cover" | "contain";
}

const ArticleHero: React.FC<ArticleHeroProps> = ({
  title,
  subtitle,
  category,
  date,
  readTime,
  coverImage,
}) => {
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section className="relative min-h-[85vh] overflow-hidden">
      {/* ... rest of ArticleHero component remains the same ... */}
    </section>
  );
};

/* -------------------------------------------------------------------------- */
/* MAIN PAGE                                                                  */
/* -------------------------------------------------------------------------- */

type PageMeta = {
  slug?: string;
  title: string;
  excerpt?: string | null;
  description?: string | null;
  category?: string | null;
  tags?: string[] | null;
  readTime?: string | number | null;
  date?: string | null;
  coverImage?: string | { src?: string } | null;
  coverAspect?: "book" | "wide" | "square";
  coverFit?: "cover" | "contain";
  accessLevel?: string;
  lockMessage?: string | null;
  author?: string | null;
  [key: string]: unknown;
};

type PageProps = {
  meta: PageMeta;
  mdxSource: MDXRemoteSerializeResult;
};

function ContentPage({ meta, mdxSource }: PageProps): JSX.Element {
  const router = useRouter();
  const {
    title,
    description,
    excerpt,
    category,
    tags,
    date,
    readTime,
    coverImage,
    coverAspect,
    coverFit,
    accessLevel,
    lockMessage,
    slug,
    author,
  } = meta;

  const [hasAccess, setHasAccess] = React.useState(false);
  const [checkedAccess, setCheckedAccess] = React.useState(false);
  const [isContentVisible, setIsContentVisible] = React.useState(false);

  React.useEffect(() => {
    setHasAccess(typeof document !== 'undefined' && 
      document.cookie.split(';').some(c => c.trim().startsWith('innerCircleAccess=true')));
    setCheckedAccess(true);
    
    const timer = setTimeout(() => setIsContentVisible(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const displaySubtitle = excerpt || description || undefined;
  const primaryCategory = category || (Array.isArray(tags) && tags.length > 0 ? String(tags[0]) : "Structural Essay");
  
  const canonicalTitle = title || "";
  const displayDescription = description || excerpt || "";
  const effectiveSlug = slug || "";
  
  const canonicalUrl = effectiveSlug.length > 0
    ? `https://www.abrahamoflondon.org/${effectiveSlug}`
    : "https://www.abrahamoflondon.org/";

  const isInnerCircle = accessLevel === "inner-circle";
  const isLocked = isInnerCircle && (!checkedAccess || !hasAccess);
  const returnToPath = `/${effectiveSlug}`;
  const joinUrl = `/inner-circle?returnTo=${encodeURIComponent(returnToPath)}`;

  const resolvedCoverImage = typeof coverImage === 'string' 
    ? coverImage 
    : coverImage?.src || undefined;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": canonicalTitle,
    "description": displayDescription,
    "datePublished": date || new Date().toISOString(),
    "dateModified": date || new Date().toISOString(),
    "author": {
      "@type": "Person",
      "name": author || "Abraham of London",
      "url": "https://abrahamoflondon.org"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Abraham of London",
      "logo": {
        "@type": "ImageObject",
        "url": "https://abrahamoflondon.org/images/logo.png"
      }
    },
    ...(resolvedCoverImage ? { "image": resolvedCoverImage } : {})
  };

  return (
    <Layout 
      title={canonicalTitle}
      description={displayDescription}
      canonicalUrl={canonicalUrl}
      ogImage={resolvedCoverImage}
      ogType="article"
      structuredData={structuredData}
      keywords={Array.isArray(tags) ? tags : []}
    >
      <Head>
        {resolvedCoverImage && (
          <>
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />
          </>
        )}
      </Head>

      {/* Hero Section */}
      <ArticleHero
        title={title}
        subtitle={displaySubtitle}
        category={primaryCategory}
        date={date}
        readTime={typeof readTime === 'number' ? `${readTime} min read` : readTime}
        coverImage={resolvedCoverImage}
        coverAspect={coverAspect}
        coverFit={coverFit}
      />

      {/* Access Banner */}
      {isInnerCircle && (
        <div className={`mx-auto max-w-4xl px-4 pt-8 transition-all duration-1000 delay-300 ${isContentVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="relative overflow-hidden rounded-xl border border-[#d4af37]/30 bg-gradient-to-r from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a] p-6">
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-gradient-to-br from-[#d4af37]/10 to-transparent rounded-full blur-2xl" />
            
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-2 h-2 rounded-full bg-[#d4af37] animate-pulse" />
                <div className="text-sm tracking-widest uppercase text-[#d4af37]">Inner Circle Structure</div>
              </div>
              
              <p className="text-[#ccc] leading-relaxed mb-6">
                {lockMessage || "This architectural framework is reserved for Inner Circle members. Unlock complete structural access."}
              </p>
              
              {!hasAccess && (
                <div className="flex items-center gap-4">
                  <Link
                    href={joinUrl}
                    className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium bg-gradient-to-r from-[#d4af37] to-[#b8941f] rounded-lg hover:opacity-90 transition-opacity"
                  >
                    <span>Access Structure</span>
                    <span className="transform transition-transform group-hover:translate-x-1">→</span>
                  </Link>
                  <Link
                    href="/inner-circle"
                    className="text-sm text-[#999] hover:text-[#d4af37] transition-colors"
                  >
                    Learn about Inner Circle
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className={`relative transition-all duration-1000 delay-500 ${isContentVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0a0a]/50 to-[#0a0a0a]" />
        </div>

        <article className="mx-auto max-w-4xl px-4 pb-32 pt-16">
          <div className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-32 -translate-x-40 hidden lg:block">
              <div className="sticky top-32">
                <div className="relative">
                  <div className="h-px w-24 bg-gradient-to-r from-transparent to-[#3a3a3a]/50" />
                  <div className="mt-4 text-xs text-[#666]">Structural Depth</div>
                  <div className="mt-2 h-48 w-px bg-gradient-to-b from-[#d4af37]/30 via-transparent to-transparent" />
                </div>
              </div>
            </div>

            <div className="relative">
              {isInnerCircle && isLocked ? (
                <div className="rounded-2xl border border-[#2a2a2a] bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] p-12 text-center">
                  <div className="text-6xl opacity-10 mb-6">𓃲</div>
                  <h3 className="text-2xl font-light mb-6">Architectural Framework Locked</h3>
                  <p className="text-[#999] leading-relaxed max-w-md mx-auto mb-8">
                    This structural analysis requires Inner Circle access. 
                    Join to unlock the complete architectural framework.
                  </p>
                  <Link
                    href={joinUrl}
                    className="inline-flex items-center gap-3 px-8 py-4 text-base font-medium bg-gradient-to-r from-[#d4af37] to-[#b8941f] rounded-lg hover:opacity-90 transition-opacity"
                  >
                    <span>Unlock Structure</span>
                    <span className="transform transition-transform group-hover:translate-x-2">↠</span>
                  </Link>
                </div>
              ) : (
                <div className="prose prose-lg max-w-none
                  prose-headings:font-light prose-headings:leading-tight
                  prose-h1:text-4xl prose-h2:text-3xl prose-h3:text-2xl
                  prose-p:text-[#ccc] prose-p:leading-relaxed prose-p:text-base
                  prose-strong:text-[#fff] prose-strong:font-medium
                  prose-a:text-[#d4af37] prose-a:no-underline hover:prose-a:underline
                  prose-ul:text-[#ccc] prose-ol:text-[#ccc]
                  prose-li:marker:text-[#d4af37]/50
                  prose-blockquote:border-l-[#d4af37]/30 prose-blockquote:text-[#ccc] prose-blockquote:pl-6
                  prose-hr:border-[#2a2a2a] prose-hr:my-12
                  prose-img:rounded-xl prose-img:border prose-img:border-[#2a2a2a] prose-img:shadow-2xl
                  prose-pre:bg-[#0a0a0a] prose-pre:border prose-pre:border-[#2a2a3a] prose-pre:rounded-xl prose-pre:shadow-lg
                  prose-code:text-[#d4af37] prose-code:bg-[#1a1a1a] prose-code:px-1 prose-code:py-0.5 prose-code:rounded
                  prose-table:text-[#ccc] prose-table:border prose-table:border-[#2a2a2a]
                  prose-th:border-b prose-th:border-[#2a2a2a] prose-th:text-[#d4af37]
                  prose-td:border-t prose-td:border-[#2a2a2a]
                ">
                  <MDXRemote {...mdxSource} components={mdxComponents} />
                </div>
              )}
            </div>

            <div className="absolute right-0 top-0 bottom-0 w-48 translate-x-48 hidden xl:block">
              <div className="sticky top-32">
                {tags && Array.isArray(tags) && tags.length > 0 && (
                  <div className="mb-8">
                    <div className="text-xs tracking-widest uppercase text-[#666] mb-3">Structural Tags</div>
                    <div className="flex flex-wrap gap-2">
                      {tags.slice(0, 5).map((tag, index) => (
                        <span key={index} className="text-xs px-2 py-1 rounded border border-[#2a2a2a] text-[#999]">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="border-t border-[#2a2a2a] pt-8">
                  <div className="text-xs tracking-widest uppercase text-[#666] mb-3">Reading Progress</div>
                  <div className="h-1 bg-[#2a2a2a] rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#d4af37] to-[#b8941f] rounded-full" 
                      style={{ width: '0%' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </article>

        <div className="border-t border-[#2a2a2a]">
          <div className="mx-auto max-w-4xl px-4 py-16">
            <div className="flex items-center justify-between">
              <Link 
                href="/content"
                className="group flex items-center gap-3 text-sm text-[#999] hover:text-[#d4af37] transition-colors"
              >
                <span className="transform transition-transform group-hover:-translate-x-1">←</span>
                <span>Return to Collection</span>
              </Link>
              
              <div className="text-sm text-[#666]">
                Structural Layer Complete
              </div>
            </div>
          </div>
        </div>
      </main>

      <div className="fixed inset-0 pointer-events-none z-50">
        <div className="absolute w-64 h-64 rounded-full bg-gradient-to-r from-[#d4af37]/5 to-transparent blur-3xl"
          style={{
            transform: 'translate(var(--mouse-x), var(--mouse-y))',
            transition: 'transform 0.1s ease-out'
          }}
        />
      </div>

      <script
        dangerouslySetInnerHTML={{
          __html: `
            document.addEventListener('mousemove', (e) => {
              document.documentElement.style.setProperty('--mouse-x', e.clientX + 'px');
              document.documentElement.style.setProperty('--mouse-y', e.clientY + 'px');
            });
            
            window.addEventListener('scroll', () => {
              const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
              const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
              const scrolled = (winScroll / height) * 100;
              const progressBar = document.querySelector('.bg-gradient-to-r');
              if (progressBar) {
                progressBar.style.width = scrolled + '%';
              }
            });
          `
        }}
      />
    </Layout>
  );
}

/* -------------------------------------------------------------------------- */
/* STATIC GENERATION - FIXED VERSION                                          */
/* -------------------------------------------------------------------------- */

export const getStaticPaths: GetStaticPaths = async () => {
  try {
    const allItems: unknown[] = [];
    
    // Get posts (await if it returns a promise)
    const posts = await getAllPosts();
    allItems.push(...posts);

    // FIXED: Remove fallback collections since the imports don't exist
    // You need to either:
    // 1. Create these functions, or
    // 2. Remove this section entirely

    const seen = new Set<string>();
    const paths = allItems
      .filter((item: unknown) => {
        const withSlug = item as { slug?: unknown };
        return withSlug?.slug;
      })
      .map((item: unknown) => {
        const withSlug = item as { slug: unknown };
        return String(withSlug.slug);
      })
      .filter((slug) => {
        if (seen.has(slug)) return false;
        seen.add(slug);
        return true;
      })
      .map((slug) => ({ params: { slug } }));

    return {
      paths,
      fallback: "blocking",
    };
  } catch (err) {
    console.error("Error generating static paths for /[slug]:", err);
    return { paths: [], fallback: "blocking" };
  }
};

export const getStaticProps: GetStaticProps<PageProps> = async ({ params }) => {
  try {
    const slugParam = params?.slug;
    const slug = typeof slugParam === "string" ? slugParam : Array.isArray(slugParam) ? slugParam[0] : "";

    if (!slug) return { notFound: true };

    let data: (PageMeta & { content?: string }) | null = null;
    
    // Only try to get post since other imports don't exist
    const postCandidate = await getPostBySlug(slug);
    if (postCandidate) {
      data = postCandidate as PageMeta & { content?: string };
    }

    if (!data || !data.title) {
      return { notFound: true };
    }

    const { content, ...meta } = data;
    const jsonSafeMeta = JSON.parse(JSON.stringify(meta)) as PageMeta;
    const mdxSource = await serialize(content || "", {
      scope: jsonSafeMeta as unknown as Record<string, unknown>,
    });

    return {
      props: {
        meta: jsonSafeMeta,
        mdxSource,
      },
      revalidate: 3600,
    };
  } catch (err) {
    console.error("Error in getStaticProps for /[slug]:", err);
    return { notFound: true };
  }
};

export default ContentPage;