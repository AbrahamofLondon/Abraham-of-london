'use client';

import React, { Suspense, lazy } from 'react';

// ------------------------------------------------------------------
// 🎯 Full Blog Post type with all fields needed for real data
// ------------------------------------------------------------------
interface BlogPost {
  slug: string;
  title: string;
  date: string;
  excerpt?: string;
  tags?: string[];               // ✅ used by sidebar + cards
  author?: string | null;       // ✅ used by sidebar
  tier?: 'free' | 'member' | 'architect'; // ✅ used by sidebar
}

interface BlogSafeWrapperProps {
  posts: BlogPost[];
}

// ------------------------------------------------------------------
// 🚀 Lazy‑load actual components (now they exist)
// ------------------------------------------------------------------
const BlogCard = lazy(() => import('./BlogCard'));
const BlogFeatured = lazy(() => import('./BlogFeatured'));
const BlogSidebar = lazy(() => import('./BlogSidebar'));

// ------------------------------------------------------------------
// 🛡️ Safe fallbacks (identical design, zero dependencies)
// ------------------------------------------------------------------
const SafeBlogCard = ({ post }: { post: BlogPost }) => (
  <div className="group relative overflow-hidden rounded-3xl border border-white/5 bg-zinc-900/40 p-6 backdrop-blur-sm">
    <h3 className="font-serif text-2xl font-medium text-cream">{post.title}</h3>
    <p className="mt-2 text-sm text-gray-400 line-clamp-3">{post.excerpt}</p>
    <span className="mt-4 block text-[10px] uppercase tracking-widest text-amber-500">
      {post.date}
    </span>
  </div>
);

const SafeBlogFeatured = ({ post }: { post: BlogPost }) => (
  <section className="rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-transparent p-8">
    <h2 className="font-serif text-3xl font-medium text-cream">{post.title}</h2>
    <p className="mt-4 text-lg text-gray-400">{post.excerpt}</p>
  </section>
);

const SafeBlogSidebar = () => (
  <div className="space-y-8">
    <div className="bg-zinc-900/40 border border-white/5 rounded-3xl p-8">
      <h3 className="font-serif text-lg text-cream">Abraham of London</h3>
      <p className="text-xs text-gray-500 mt-2">Principal Content</p>
    </div>
  </div>
);

// ------------------------------------------------------------------
// 🧠 Main Component – fully typed, real data flowing
// ------------------------------------------------------------------
export default function BlogSafeWrapper({ posts }: BlogSafeWrapperProps) {
  const [hasError, setHasError] = React.useState(false);
  const featured = posts[0]; // first post is the featured one

  // 📊 Real sidebar metadata – derived from the featured post
  const sidebarProps = {
    author: featured?.author || 'Abraham of London',
    publishedDate: featured?.date || new Date().toLocaleDateString('en-GB', {
      year: 'numeric', month: 'short', day: '2-digit'
    }),
    tags: featured?.tags || [],
    tier: featured?.tier || 'free',
  };

  if (hasError) {
    // Fallback if lazy loading completely fails
    return (
      <div className="blog-container">
        <div className="blog-content">
          <h1 className="font-serif text-4xl text-cream mb-8">Blog</h1>
          <div className="posts-grid">
            {posts.map((post) => (
              <SafeBlogCard key={post.slug} post={post} />
            ))}
          </div>
        </div>
        <SafeBlogSidebar />
      </div>
    );
  }

  return (
    <div className="blog-container grid grid-cols-1 lg:grid-cols-3 gap-12">
      {/* Main content area */}
      <div className="lg:col-span-2 space-y-12">
        <h1 className="font-serif text-4xl md:text-5xl text-cream border-b border-white/10 pb-6">
          Intelligence Briefings
        </h1>

        {/* Featured post – only if exists */}
        {featured && (
          <Suspense fallback={<SafeBlogFeatured post={featured} />}>
            <BlogFeatured post={featured} />
          </Suspense>
        )}

        {/* Post grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {posts.map((post) => (
            <Suspense key={post.slug} fallback={<SafeBlogCard post={post} />}>
              <BlogCard post={post} />
            </Suspense>
          ))}
        </div>
      </div>

      {/* Sidebar – with real blog metadata */}
      <div className="lg:col-span-1">
        <Suspense fallback={<SafeBlogSidebar />}>
          <BlogSidebar {...sidebarProps} />
        </Suspense>
      </div>
    </div>
  );
}