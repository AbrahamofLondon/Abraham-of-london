/* pages/blog/[slug].tsx — ESSAY READER (INTEGRITY MODE) */
import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";

import Layout from "@/components/Layout";

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

// Client-only hydration-safe components
const ReadingProgress = dynamic(() => import("@/components/enhanced/ReadingProgress"), { ssr: false });
const BackToTop = dynamic(() => import("@/components/enhanced/BackToTop"), { ssr: false });
const TableOfContents = dynamic(() => import("@/components/enhanced/TableOfContents"), { ssr: false });
const ReadTime = dynamic(() => import("@/components/enhanced/ReadTime"), { ssr: false });

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
    readTime: string | null;
  };
  source: MDXRemoteSerializeResult;
}

const BlogPostPage: NextPage<Props> = ({ post, source }) => {
  const router = useRouter();
  const [isBookmarked, setIsBookmarked] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const bookmarks = JSON.parse(localStorage.getItem('ic_bookmarks_blog') || '[]');
        setIsBookmarked(bookmarks.includes(post.slug));
      } catch (e) { /* ignore */ }

      const handleScroll = () => setIsScrolled(window.scrollY > 100);
      window.addEventListener('scroll', handleScroll, { passive: true });
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [post.slug]);

  const toggleBookmark = () => {
    try {
      const bookmarks = JSON.parse(localStorage.getItem('ic_bookmarks_blog') || '[]');
      const updated = isBookmarked 
        ? bookmarks.filter((s: string) => s !== post.slug)
        : [...bookmarks, post.slug];
      localStorage.setItem('ic_bookmarks_blog', JSON.stringify(updated));
      setIsBookmarked(!isBookmarked);
    } catch (e) { /* ignore */ }
  };

  const formattedDate = post.date
    ? new Date(post.date).toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })
    : "Draft";

  return (
    <Layout title={`${post.title} | Essays`}>
      <Head>
        <title>{post.title} | Abraham of London</title>
        <meta name="description" content={post.excerpt || ""} />
        <meta property="og:type" content="article" />
        <meta property="og:image" content={post.coverImage || ""} />
        <link rel="canonical" href={`https://abrahamoflondon.com/blog/${post.slug}`} />
      </Head>

      <ReadingProgress />

      <div className={`sticky top-0 z-40 transition-all duration-300 ${isScrolled ? 'bg-black/90 backdrop-blur-xl border-b border-white/10' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 py-3">
          <button onClick={() => router.push('/blog')} className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-white transition-all group">
            <ChevronLeft size={14} /> Back to Archive
          </button>
        </div>
      </div>

      <div className="min-h-screen bg-black selection:bg-gold selection:text-black">
        <BlogHeader
          title={post.title}
          author={post.author}
          date={formattedDate}
          coverImage={post.coverImage}
          tags={post.tags}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
          <div className="grid lg:grid-cols-12 gap-12">
            
            {/* ESSAY CORE */}
            <main className="lg:col-span-8">
              <div className="flex items-center gap-6 mb-8 text-[10px] font-mono uppercase text-gray-500">
                <span className="flex items-center gap-2"><User size={12} /> {post.author}</span>
                <span className="flex items-center gap-2"><Calendar size={12} /> {formattedDate}</span>
                <span className="flex items-center gap-2"><Clock size={12} /> {post.readTime}</span>
                <button onClick={toggleBookmark} className={`ml-auto flex items-center gap-2 transition-colors ${isBookmarked ? 'text-gold' : 'hover:text-gold'}`}>
                  {isBookmarked ? <BookmarkCheck size={14} /> : <Bookmark size={14} />} {isBookmarked ? 'Saved' : 'Save'}
                </button>
              </div>

              <article className="prose prose-invert prose-gold max-w-none prose-p:leading-relaxed prose-p:text-gray-300">
                <div className="bg-zinc-900/40 border border-white/5 rounded-3xl p-8 md:p-12 shadow-2xl">
                  <BlogContent>
                    <MDXRemote {...source} components={extendedComponents} />
                  </BlogContent>
                  
                  <div className="mt-16 pt-8 border-t border-white/5">
                    <ShareButtons url={`https://abrahamoflondon.com/blog/${post.slug}`} title={post.title} />
                  </div>
                </div>
              </article>

              <div className="mt-12">
                <AuthorBio author={post.author || "Abraham of London"} />
                <RelatedPosts currentPostSlug={post.slug} />
              </div>
            </main>

            {/* STRATEGIC SIDEBAR */}
            <aside className="lg:col-span-4 space-y-8">
              <div className="sticky top-24 space-y-6">
                <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-sm">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-gold mb-6">Navigation</h3>
                  <TableOfContents />
                </div>

                <div className="p-8 rounded-3xl bg-gradient-to-br from-gold/10 to-transparent border border-gold/20">
                  <h3 className="font-serif text-xl font-bold text-white mb-4">Join the Build</h3>
                  <p className="text-xs text-gray-400 mb-6 leading-relaxed">Field notes and strategic clarity delivered to founders and builders weekly.</p>
                  <button onClick={() => router.push('/newsletter')} className="w-full py-3 rounded-xl bg-gold text-black text-xs font-black uppercase tracking-widest hover:bg-gold/80 transition-all">Subscribe</button>
                </div>
              </div>
            </aside>

          </div>
        </div>
      </div>
      <BackToTop />
    </Layout>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  const { allPosts } = await getContentlayerData();
  const paths = (allPosts || [])
    .filter((p: any) => !p.draft)
    .map((p: any) => ({
      params: { slug: normalizeSlug(p.slug || p._raw?.flattenedPath).replace(/^blog\//, '') }
    }))
    .filter((p: any) => p.params.slug);

  return { paths, fallback: 'blocking' };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = String(params?.slug || "");
  const { allPosts } = await getContentlayerData();
  const doc = allPosts.find((p: any) => normalizeSlug(p.slug || p._raw?.flattenedPath).endsWith(slug));

  if (!doc || isDraftContent(doc)) return { notFound: true };

  const source = await prepareMDX(doc.body.raw);
  const post = sanitizeData({
    title: doc.title || "Untitled",
    slug: normalizeSlug(doc.slug || slug),
    date: doc.date || null,
    author: doc.author || "Abraham of London",
    excerpt: doc.excerpt || doc.description || null,
    description: doc.description || null,
    coverImage: doc.coverImage || null,
    tags: Array.isArray(doc.tags) ? doc.tags : [],
    readTime: doc.readTime || "5 min read",
  });

  return { props: { post, source }, revalidate: 1800 };
};

export default BlogPostPage;