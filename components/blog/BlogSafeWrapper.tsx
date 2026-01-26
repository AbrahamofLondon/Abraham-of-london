// components/blog/BlogSafeWrapper.tsx
'use client';

import React, { Suspense, lazy } from 'react';

interface BlogPost {
  title: string;
  slug: string;
  date: string;
  excerpt?: string;
  tags?: string[];
  // ... other blog post fields
}

interface BlogSafeWrapperProps {
  posts: BlogPost[];
}

// Lazy load components that might have server dependencies
const BlogCard = lazy(() => import('./BlogCard'));
const BlogFeatured = lazy(() => import('./BlogFeatured'));
const BlogSidebar = lazy(() => import('./BlogSidebar'));

// Safe fallback components
const SafeBlogCard = ({ post }: { post: BlogPost }) => (
  <div className="blog-card-safe">
    <h3>{post.title}</h3>
    <p>{post.excerpt}</p>
    <span>{post.date}</span>
  </div>
);

const SafeBlogFeatured = ({ post }: { post: BlogPost }) => (
  <div className="featured-safe">
    <h2>{post.title}</h2>
    <p>{post.excerpt}</p>
  </div>
);

const SafeBlogSidebar = () => (
  <div className="sidebar-safe">
    <h3>Categories</h3>
    <ul>
      <li>General</li>
      <li>Technical</li>
      <li>Updates</li>
    </ul>
  </div>
);

export default function BlogSafeWrapper({ posts }: BlogSafeWrapperProps) {
  // Use a state to handle lazy loading errors
  const [hasError, setHasError] = React.useState(false);

  if (hasError) {
    // Fallback to safe components if lazy loading fails
    return (
      <div className="blog-container">
        <div className="blog-content">
          <h1>Blog</h1>
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
    <div className="blog-container">
      <div className="blog-content">
        <h1>Blog</h1>
        
        {/* Featured post (if any) */}
        {posts[0] && (
          <Suspense fallback={<SafeBlogFeatured post={posts[0]} />}>
            <BlogFeatured post={posts[0]} />
          </Suspense>
        )}
        
        {/* Posts grid */}
        <div className="posts-grid">
          {posts.map((post) => (
            <Suspense key={post.slug} fallback={<SafeBlogCard post={post} />}>
              <BlogCard post={post} />
            </Suspense>
          ))}
        </div>
      </div>
      
      <Suspense fallback={<SafeBlogSidebar />}>
        <BlogSidebar />
      </Suspense>
    </div>
  );
}