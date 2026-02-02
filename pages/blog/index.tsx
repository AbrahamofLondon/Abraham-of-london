/* pages/blog/index.tsx — ESSAY ARCHIVE (BUILD-SAFE) */
import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Link from "next/link";
import Image from "next/image";
import Head from "next/head";
import Layout from "@/components/Layout";
import { Calendar, Clock, Search, ArrowRight, Tag, TrendingUp } from "lucide-react";

import { getPublishedPosts } from "@/lib/content/server";
// ✅ Centralized shared logic for consistent path generation
import { normalizeSlug, joinHref } from "@/lib/content/shared";
import { resolveDocCoverImage, sanitizeData } from "@/lib/content/client-utils";
import { safeSlice, safeArraySlice } from "@/lib/utils/safe";

type BlogPost = {
  slug: string;
  url: string;
  title: string;
  excerpt: string | null;
  date: string | null;
  dateIso: string | null;
  readTime: string | null;
  coverImage: string | null;
  tags: string[];
  author: string | null;
  featured?: boolean;
};

type BlogIndexProps = {
  items: BlogPost[];
  featuredItems: BlogPost[];
  popularTags: string[];
  totalPosts: number;
  lastUpdated: string;
};

const BlogIndex: NextPage<BlogIndexProps> = ({ items, featuredItems, popularTags, totalPosts }) => {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedTag, setSelectedTag] = React.useState<string | null>(null);

  const filteredPosts = React.useMemo(() => {
    return items.filter(post => {
      const matchesSearch = !searchQuery || 
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesTag = !selectedTag || post.tags.includes(selectedTag);
      return matchesSearch && matchesTag;
    });
  }, [items, searchQuery, selectedTag]);

  return (
    <Layout title="Essays">
      <div className="min-h-screen bg-black text-white pt-24 px-6">
        <div className="max-w-7xl mx-auto">
          <header className="text-center mb-16">
            <h1 className="text-5xl font-serif font-bold mb-4 text-cream">Essays & Insights</h1>
            <p className="text-gray-400 max-w-2xl mx-auto">Explorations in the craft of building meaningful institutions.</p>
          </header>

          <div className="grid gap-12">
            {filteredPosts.map(post => (
              <Link key={post.slug} href={post.url} className="group border-b border-white/5 pb-12 block">
                <article className="flex flex-col md:flex-row gap-8">
                  {post.coverImage && (
                    <div className="relative w-full md:w-64 h-48 rounded-xl overflow-hidden shrink-0">
                      <Image src={post.coverImage} alt={post.title} fill className="object-cover transition-transform group-hover:scale-105" />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-4 text-xs text-amber-500/60 uppercase tracking-widest mb-3">
                      <span>{post.date}</span>
                      <span>{post.readTime}</span>
                    </div>
                    <h2 className="text-3xl font-serif font-bold group-hover:text-amber-500 transition-colors mb-4">{post.title}</h2>
                    <p className="text-gray-400 line-clamp-2 mb-6">{post.excerpt}</p>
                    <div className="flex items-center text-sm font-bold text-amber-500">
                      READ ESSAY <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-2 transition-transform" />
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export const getStaticProps: GetStaticProps<BlogIndexProps> = async () => {
  try {
    const allPosts = getPublishedPosts();
    const items: BlogPost[] = allPosts.map((doc: any) => {
      // ✅ STRATEGY: Strip 'blog/' prefix and use joinHref
      const bareSlug = normalizeSlug(doc.slug || doc._raw?.flattenedPath || "").replace(/^blog\//, "");
      
      return {
        slug: bareSlug,
        url: joinHref("blog", bareSlug), // ✅ FIX: Prevents /blog//blog/
        title: doc.title || "Untitled Essay",
        excerpt: doc.excerpt || doc.description || null,
        date: doc.date ? new Date(doc.date).toLocaleDateString("en-GB") : null,
        dateIso: doc.date ? new Date(doc.date).toISOString() : null,
        readTime: doc.readTime || "5 min read",
        coverImage: resolveDocCoverImage(doc),
        tags: Array.isArray(doc.tags) ? doc.tags : [],
        author: doc.author || "Abraham of London",
        featured: !!doc.featured
      };
    }).sort((a, b) => (b.dateIso || "").localeCompare(a.dateIso || ""));

    return {
      props: sanitizeData({
        items,
        featuredItems: items.filter(i => i.featured).slice(0, 3),
        popularTags: [], // Implement tag counting if needed
        totalPosts: items.length,
        lastUpdated: new Date().toISOString()
      }),
      revalidate: 3600,
    };
  } catch (error) {
    return { props: { items: [], featuredItems: [], popularTags: [], totalPosts: 0, lastUpdated: "" }, revalidate: 60 };
  }
};

export default BlogIndex;