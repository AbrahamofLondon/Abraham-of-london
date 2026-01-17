/* pages/blog/[slug].tsx — ENHANCED VERSION */
import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import Layout from "@/components/Layout";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";

// Content + MDX utilities
import {
  getContentlayerData,
  isDraftContent,
  normalizeSlug,
} from "@/lib/contentlayer-compat";
import {
  prepareMDX,
  simpleMdxComponents,
  sanitizeData,
} from "@/lib/server/md-utils";

// UI components
import BlogHeader from "@/components/blog/BlogHeader";
import BlogContent from "@/components/blog/BlogContent";
import BlogSidebar from "@/components/blog/BlogSidebar";
import BlogFooter from "@/components/blog/BlogFooter";
import ShareButtons from "@/components/ShareButtons";
import AuthorBio from "@/components/AuthorBio";
import RelatedPosts from "@/components/blog/RelatedPosts";
import ResourceGrid from "@/components/blog/ResourceGrid";

import {
  ChevronLeft,
  Bookmark,
  BookmarkCheck,
  Clock,
  Calendar,
  User,
  Tag
} from "lucide-react";

// Enhanced components for better UX
const ReadingProgress = dynamic(
  () => import("@/components/enhanced/ReadingProgress"),
  { ssr: false }
);

const BackToTop = dynamic(
  () => import("@/components/enhanced/BackToTop"),
  { ssr: false }
);

const TableOfContents = dynamic(
  () => import("@/components/enhanced/TableOfContents"),
  { ssr: false }
);

const ReadTime = dynamic(
  () => import("@/components/enhanced/ReadTime"),
  { ssr: false }
);

/**
 * MDX Component Registry
 */
const extendedComponents = {
  ...simpleMdxComponents,
  ResourceGrid,
};

interface Props {
  post: {
    title: string;
    slug: string;
    date: string | null;
    author: string | null;
    excerpt: string | null;
    description: string | null;
    coverImage: string | null;
    tags: string[];
    readTime?: string | null;
  };
  source: MDXRemoteSerializeResult;
}

const BlogPostPage: NextPage<Props> = ({ post, source }) => {
  const router = useRouter();
  const [isBookmarked, setIsBookmarked] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check bookmarks
      try {
        const bookmarks = JSON.parse(localStorage.getItem('bookmarkedBlogPosts') || '[]');
        setIsBookmarked(bookmarks.includes(post.slug));
      } catch (error) {
        console.error('Error parsing bookmarks:', error);
      }

      // Track scroll for sticky header
      const handleScroll = () => {
        setIsScrolled(window.scrollY > 100);
      };

      window.addEventListener('scroll', handleScroll, { passive: true });
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [post.slug]);

  const handleBookmark = () => {
    if (typeof window !== 'undefined') {
      try {
        const bookmarks = JSON.parse(localStorage.getItem('bookmarkedBlogPosts') || '[]');
        
        if (isBookmarked) {
          const updated = bookmarks.filter((slug: string) => slug !== post.slug);
          localStorage.setItem('bookmarkedBlogPosts', JSON.stringify(updated));
          setIsBookmarked(false);
        } else {
          bookmarks.push(post.slug);
          localStorage.setItem('bookmarkedBlogPosts', JSON.stringify(bookmarks));
          setIsBookmarked(true);
        }
      } catch (error) {
        console.error('Error updating bookmarks:', error);
      }
    }
  };

  const metaDescription =
    post.excerpt || post.description || "Insight from Abraham of London";

  const publishedDate = post.date
    ? new Date(post.date).toLocaleDateString("en-GB", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  return (
    <Layout>
      <Head>
        <title>{post.title} | Blog | Abraham of London</title>
        <meta name="description" content={metaDescription} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={metaDescription} />
        <meta
          property="og:image"
          content={post.coverImage || "/assets/images/blog-default.jpg"}
        />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://abrahamoflondon.com/blog/${post.slug}`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.title} />
        <meta name="twitter:description" content={metaDescription} />
        <meta name="twitter:image" content={post.coverImage || "/assets/images/blog-default.jpg"} />
        <link rel="canonical" href={`https://abrahamoflondon.com/blog/${post.slug}`} />
      </Head>

      {/* Navigation bar */}
      <div className={`sticky top-0 z-40 transition-all duration-300 ${
        isScrolled ? 'bg-black/90 backdrop-blur-xl border-b border-white/10' : 'bg-black/50'
      }`}>
        <div className="max-w-7xl mx-auto px-4 py-3">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors group"
          >
            <ChevronLeft className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
            Back to Blog
          </button>
        </div>
      </div>

      {/* Reading progress bar at top */}
      <ReadingProgress />

      <div className="min-h-screen bg-black selection:bg-amber-500 selection:text-black">
        <BlogHeader
          title={post.title}
          author={post.author}
          date={publishedDate}
          coverImage={post.coverImage}
          tags={post.tags || []}
        />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 md:py-12 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            <main className="lg:col-span-8">
              {/* Metadata bar */}
              <div className="mb-8 flex flex-wrap items-center gap-4 text-sm text-gray-400">
                {post.author && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>{post.author}</span>
                  </div>
                )}
                {publishedDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{publishedDate}</span>
                  </div>
                )}
                {post.readTime && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{post.readTime} read</span>
                  </div>
                )}
                <button
                  onClick={handleBookmark}
                  className={`ml-auto flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors ${
                    isBookmarked 
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                      : 'bg-white/5 text-gray-400 border border-white/10 hover:border-amber-500/30 hover:text-amber-400'
                  }`}
                >
                  {isBookmarked ? (
                    <>
                      <BookmarkCheck className="w-4 h-4" />
                      <span className="text-xs font-medium">Saved</span>
                    </>
                  ) : (
                    <>
                      <Bookmark className="w-4 h-4" />
                      <span className="text-xs font-medium">Save</span>
                    </>
                  )}
                </button>
              </div>

              {/* Read time indicator */}
              {post.readTime && (
                <div className="mb-8">
                  {post.readTime && <ReadTime minutes={post.readTime} />}
                </div>
              )}

              <article className="prose prose-invert prose-lg max-w-none">
                <div className="bg-zinc-900/30 backdrop-blur-sm border border-white/10 rounded-3xl p-6 md:p-8 lg:p-12 shadow-2xl">
                  <BlogContent>
                    <MDXRemote {...source} components={extendedComponents} />
                  </BlogContent>

                  {/* Tags */}
                  {post.tags && post.tags.length > 0 && (
                    <div className="mt-12 pt-8 border-t border-white/10">
                      <div className="flex items-center gap-3 mb-4">
                        <Tag className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-300">Tags</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {post.tags.map((tag) => (
                          <button
                            key={tag}
                            onClick={() => router.push(`/blog?tag=${encodeURIComponent(tag)}`)}
                            className="px-3 py-1.5 bg-white/5 text-gray-300 text-sm rounded-full border border-white/10 hover:border-amber-500/30 hover:text-amber-400 transition-colors"
                          >
                            #{tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-12 pt-8 border-t border-white/10">
                    <ShareButtons
                      url={`https://abrahamoflondon.com/blog/${post.slug}`}
                      title={post.title}
                      excerpt={metaDescription}
                    />
                  </div>

                  {post.author ? (
                    <div className="mt-12">
                      <AuthorBio author={post.author} />
                    </div>
                  ) : null}
                </div>
              </article>

              <div className="mt-12">
                <RelatedPosts currentPostSlug={post.slug} />
              </div>
            </main>

            <aside className="lg:col-span-4">
              <div className="sticky top-24 space-y-6">
                {/* Table of contents for long articles */}
                <div className="bg-zinc-900/30 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                    </svg>
                    <h3 className="text-sm font-semibold text-gray-300">Table of Contents</h3>
                  </div>
                  <TableOfContents />
                </div>

                <BlogSidebar
                  author={post.author}
                  publishedDate={publishedDate}
                  tags={post.tags || []}
                />

                {/* Call to action */}
                <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20 rounded-2xl p-6">
                  <div className="text-center">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/20 mb-4">
                      <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-serif font-bold text-white mb-2">
                      Enjoyed This Article?
                    </h3>
                    <p className="text-sm text-gray-400 mb-6">
                      Subscribe to get weekly insights and exclusive content.
                    </p>
                    <button
                      onClick={() => router.push('/newsletter')}
                      className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-black py-3 rounded-xl font-bold text-sm hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg shadow-amber-900/30"
                    >
                      Subscribe to Newsletter
                    </button>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>

        <BlogFooter />
      </div>

      {/* Back to top button */}
      <BackToTop />
    </Layout>
  );
};

export default BlogPostPage;

// -------------------------------
// Helpers
// -------------------------------
function toBlogSlug(p: any): string | null {
  const s = String(p?.slug ?? "").trim();
  if (s) return normalizeSlug(s);

  const raw = String(p?._raw?.flattenedPath ?? "").trim();
  if (!raw) return null;

  // Extract slug from path, handling both /posts/ and /blog/ prefixes
  const slug = raw.replace(/^\/(posts|blog)\//, "").replace(/^\/+/, "");
  return normalizeSlug(slug);
}

// -------------------------------
// SSG
// -------------------------------
export const getStaticPaths: GetStaticPaths = async () => {
  try {
    const { allPosts } = await getContentlayerData();

    const filtered = (allPosts || [])
      .filter((x: any) => x && !x.draft)
      .filter((x: any) => {
        const slug = x.slug || x._raw?.flattenedPath || "";
        return slug && !String(slug).includes("replace") && slug.trim() !== '';
      });

    const paths = filtered
      .map((p: any) => toBlogSlug(p))
      .filter(Boolean)
      .map((slug: string) => ({ 
        params: { 
          slug: slug.split('/').filter(Boolean) 
        } 
      }));

    return { 
      paths, 
      fallback: 'blocking' 
    };
  } catch (error) {
    console.error('Error generating static paths:', error);
    return {
      paths: [],
      fallback: 'blocking'
    };
  }
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  try {
    const slug = Array.isArray(params?.slug) 
      ? params.slug.join('/')
      : String(params?.slug ?? "").trim();
    
    if (!slug) return { notFound: true };

    const { allPosts } = await getContentlayerData();

    const doc = (allPosts || []).find((p: any) => {
      const s = normalizeSlug(p?.slug ?? p?._raw?.flattenedPath ?? "");
      return s === normalizeSlug(slug);
    }) ?? null;

    if (!doc || isDraftContent(doc)) return { notFound: true };

    const rawMdx = (doc as any)?.body?.raw ?? (doc as any)?.body ?? "";
    const source = await prepareMDX(typeof rawMdx === "string" ? rawMdx : "");

    const post = sanitizeData({
      title: doc.title || "Untitled Transmission",
      slug: normalizeSlug(doc.slug || slug),
      date: doc.date || null,
      author: doc.author || "Abraham of London",
      excerpt: doc.excerpt || null,
      description: doc.description || null,
      coverImage: doc.coverImage || null,
      tags: Array.isArray(doc.tags) ? doc.tags : [],
      readTime: doc.readTime || null,
    });

    return { 
      props: { post, source }, 
      revalidate: 1800 
    };
  } catch (error) {
    console.error('Error generating static props:', error);
    return {
      notFound: true
    };
  }
};