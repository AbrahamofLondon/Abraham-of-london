// components/content/ContentLayout.tsx - FIXED
import * as React from "react";
import Head from "next/head";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import Layout from "@/components/Layout";
import mdxComponents from "@/components/mdx-components";
// Import the utility function directly instead of the whole config
import { getPageTitle, siteConfig } from '@/lib/imports';

interface ContentLayoutProps {
  frontmatter: {
    slug: string;
    title: string;
    excerpt?: string;
    description?: string;
    date?: string;
    author?: string;
    category?: string;
    tags?: string[];
    readTime?: string;
    coverImage?: string | { src?: string } | null;
    url?: string;
    subtitle?: string;
    volumeNumber?: string;
    featured?: boolean;
    [key: string]: any;
  };
  mdxSource: MDXRemoteSerializeResult;
  contentType?: string;
  children?: React.ReactNode;
}

export default function ContentLayout({
  frontmatter,
  mdxSource,
  contentType = "content",
  children,
}: ContentLayoutProps): JSX.Element {
  // Safe access with fallbacks
  const title = frontmatter.title || `${contentType.charAt(0).toUpperCase() + contentType.slice(1)}`;
  
  // Use the utility function directly
  const pageTitle = getPageTitle(title);
  
  // Use excerpt first, then description, then title
  const description = frontmatter.excerpt || frontmatter.description || title;
  
  // URL can be from frontmatter or constructed
  const url = frontmatter.url || `/${contentType}/${frontmatter.slug}`;
  const fullUrl = `${siteConfig.siteUrl}${url}`;
  
  return (
    <Layout title={title} className={`bg-charcoal content-${contentType}`}>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={description} />
        {frontmatter.tags && frontmatter.tags.length > 0 && (
          <meta name="keywords" content={frontmatter.tags.join(", ")} />
        )}
        
        {/* Open Graph */}
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={fullUrl} />
        {frontmatter.coverImage && (
          <meta property="og:image" content={
            typeof frontmatter.coverImage === 'string' 
              ? frontmatter.coverImage 
              : (frontmatter.coverImage as any)?.src || ''
          } />
        )}
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        
        {/* Canonical URL */}
        <link rel="canonical" href={fullUrl} />
      </Head>

      <main className="mx-auto max-w-4xl px-4 py-12 sm:py-16 lg:py-20 text-cream">
        <article className="prose prose-invert prose-lg max-w-none">
          {/* Header Section */}
          <header className="mb-10 border-b border-softGold/20 pb-8">
            <div className="mb-4">
              <span className="inline-block rounded-full bg-softGold/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-softGold">
                {contentType}
              </span>
              {frontmatter.volumeNumber && (
                <span className="ml-2 inline-block rounded-full bg-charcoal-light px-3 py-1 text-xs font-medium text-cream/70">
                  Volume {frontmatter.volumeNumber}
                </span>
              )}
              {frontmatter.featured && (
                <span className="ml-2 inline-block rounded-full bg-softGold px-3 py-1 text-xs font-semibold text-charcoal">
                  Featured
                </span>
              )}
            </div>
            
            <h1 className="mb-4 font-serif text-4xl md:text-5xl font-semibold leading-tight text-cream">
              {title}
            </h1>
            
            {frontmatter.subtitle && (
              <p className="mb-6 text-xl text-cream/80 italic">
                {frontmatter.subtitle}
              </p>
            )}
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-cream/70">
              {frontmatter.date && (
                <time dateTime={frontmatter.date} className="flex items-center">
                  <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {new Date(frontmatter.date).toLocaleDateString("en-GB", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </time>
              )}
              
              {frontmatter.author && (
                <span className="flex items-center">
                  <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {frontmatter.author}
                </span>
              )}
              
              {frontmatter.readTime && (
                <span className="flex items-center">
                  <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {frontmatter.readTime} min read
                </span>
              )}
            </div>
            
            {frontmatter.tags && frontmatter.tags.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {frontmatter.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-softGold/10 px-3 py-1 text-xs font-medium text-softGold transition-colors hover:bg-softGold/20"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </header>

          {/* Content */}
          <div className="mt-8">
            <MDXRemote {...mdxSource} components={mdxComponents} />
            {children}
          </div>
        </article>
      </main>
    </Layout>
  );
}

