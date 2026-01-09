// pages/resources/[...slug].tsx - CLEAN WORKING VERSION
import React, { useState, useEffect } from 'react';
import { GetStaticPaths, GetStaticProps, NextPage } from 'next';
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote';
import { serialize } from 'next-mdx-remote/serialize';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import Layout from "@/components/Layout"; // THIS MUST EXIST
import { 
  getServerAllResources, 
  getServerResourceBySlug, 
  getContentlayerData 
} from "@/lib/contentlayer-compat";
import { sanitizeData, mdxComponents } from '@/lib/server/md-utils';

// Dynamic imports for enhanced components
const ReadingProgress = dynamic(
  () => import("@/components/enhanced/ReadingProgress"),
  { ssr: false }
);

const TableOfContents = dynamic(
  () => import("@/components/enhanced/TableOfContents"),
  { ssr: false }
);

const BackToTop = dynamic(
  () => import("@/components/enhanced/BackToTop"),
  { ssr: false }
);

interface Resource {
  title: string;
  excerpt: string | null;
  description: string | null;
  date: string | null;
  coverImage: string | null;
  tags: string[];
  author: string | null;
  url: string;
  slugPath: string;
  resourceType?: string;
  fileSize?: string;
  fileFormat?: string;
  difficulty?: string;
  timeRequired?: string;
  downloads?: number;
}

interface Props {
  resource: Resource;
  source: MDXRemoteSerializeResult;
}

const ResourcePage: NextPage<Props> = ({ resource, source }) => {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [resourcesViewed, setResourcesViewed] = useState(0);

  // Track resource viewing
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const viewed = parseInt(localStorage.getItem('resourcesViewed') || '0');
      const newCount = viewed + 1;
      setResourcesViewed(newCount);
      localStorage.setItem('resourcesViewed', newCount.toString());

      // Track bookmarks
      const bookmarks = JSON.parse(localStorage.getItem('bookmarkedResources') || '[]');
      setIsBookmarked(bookmarks.includes(resource.slugPath));
    }
  }, [resource.slugPath]);

  const metaDescription = resource.excerpt || resource.description || 'A premium resource from Abraham of London';
  const formattedDate = resource.date ? new Date(resource.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : '';

  return (
    <Layout
      title={`${resource.title} | Resources | Abraham of London`}
      description={metaDescription}
      ogImage={resource.coverImage || '/assets/images/resource-default.jpg'}
      canonicalUrl={`/resources/${resource.slugPath}`}
    >
      <ReadingProgress />
      
      <div className="min-h-screen bg-black">
        {/* Simple hero section */}
        <section className="border-b border-white/10 bg-gradient-to-b from-black to-zinc-900/50">
          <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
            <div className="mb-4">
              <span className="text-sm font-semibold uppercase tracking-wider text-amber-400">
                {resource.resourceType || 'Strategic Resource'}
              </span>
            </div>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              {resource.title}
            </h1>
            {resource.excerpt && (
              <p className="text-xl text-gray-300 mb-8 max-w-3xl">
                {resource.excerpt}
              </p>
            )}
            <div className="flex flex-wrap gap-3">
              {resource.tags.map((tag) => (
                <span key={tag} className="px-3 py-1 bg-white/5 text-gray-300 text-sm rounded-full border border-white/10">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <main className="lg:col-span-8">
              <div className="bg-zinc-900/50 border border-white/10 rounded-2xl shadow-xl p-8 backdrop-blur-sm">
                {/* Content section */}
                <div className="prose prose-invert max-w-none">
                  <MDXRemote {...source} components={mdxComponents} />
                </div>
                
                {/* Metadata */}
                <div className="mt-12 pt-8 border-t border-white/10">
                  <div className="flex flex-col sm:flex-row gap-6 text-sm text-gray-400">
                    {resource.author && (
                      <div>
                        <div className="font-semibold text-gray-300">Author</div>
                        <div>{resource.author}</div>
                      </div>
                    )}
                    {formattedDate && (
                      <div>
                        <div className="font-semibold text-gray-300">Published</div>
                        <div>{formattedDate}</div>
                      </div>
                    )}
                    {resource.fileSize && (
                      <div>
                        <div className="font-semibold text-gray-300">File Size</div>
                        <div>{resource.fileSize}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </main>

            <aside className="lg:col-span-4">
              <div className="sticky top-8 space-y-6">
                {/* Table of Contents */}
                <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
                  <h3 className="text-sm font-semibold text-gray-300 mb-4">Quick Navigation</h3>
                  <TableOfContents />
                </div>

                {/* Bookmark button */}
                <button
                  onClick={() => {
                    const bookmarks = JSON.parse(localStorage.getItem('bookmarkedResources') || '[]');
                    if (isBookmarked) {
                      const updated = bookmarks.filter((slug: string) => slug !== resource.slugPath);
                      localStorage.setItem('bookmarkedResources', JSON.stringify(updated));
                      setIsBookmarked(false);
                    } else {
                      bookmarks.push(resource.slugPath);
                      localStorage.setItem('bookmarkedResources', JSON.stringify(bookmarks));
                      setIsBookmarked(true);
                    }
                  }}
                  className={`w-full py-3 px-4 rounded-lg border transition-colors flex items-center justify-center gap-2 ${
                    isBookmarked 
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' 
                      : 'bg-white/5 border-white/10 text-gray-400 hover:border-amber-500/50 hover:text-amber-300'
                  }`}
                >
                  <svg className="w-5 h-5" fill={isBookmarked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                  {isBookmarked ? 'Saved to Library' : 'Save to Library'}
                </button>
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
  await getContentlayerData();
  const resources = await getServerAllResources();

  const paths = resources
    .filter((resource) => {
      if (!resource || resource.draft) return false;
      const slug = resource.slug || resource.url?.replace(/^\/resources\//, '');
      return slug !== 'strategic-frameworks' && slug !== 'index';
    })
    .map((resource) => {
      const slugPath = resource.slug || resource.url?.replace(/^\/resources\//, '');
      return {
        params: { slug: slugPath.split('/').filter(Boolean) }
      };
    });

  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slugArray = params?.slug as string[];
  const slug = slugArray?.join('/') || '';

  if (slug === 'strategic-frameworks') return { notFound: true };

  const resourceData = await getServerResourceBySlug(slug);
  if (!resourceData || resourceData.draft) return { notFound: true };

  const resource: Resource = {
    title: resourceData.title || "Untitled Resource",
    excerpt: resourceData.excerpt || resourceData.description || null,
    description: resourceData.description || resourceData.excerpt || null,
    date: resourceData.date || null,
    coverImage: resourceData.coverImage || null,
    tags: Array.isArray(resourceData.tags) ? resourceData.tags : [],
    author: resourceData.author || "Abraham of London",
    url: `/resources/${resourceData.slug || slug}`,
    slugPath: resourceData.slug || slug,
    resourceType: resourceData.resourceType,
    fileSize: resourceData.fileSize,
    fileFormat: resourceData.fileFormat,
    difficulty: resourceData.difficulty,
    timeRequired: resourceData.timeRequired,
    downloads: resourceData.downloads,
  };

  const source = await serialize(resourceData.body || "", {
    mdxOptions: {
      remarkPlugins: [remarkGfm],
      rehypePlugins: [rehypeSlug],
    },
  });

  return { 
    props: { 
      resource: sanitizeData(resource), 
      source 
    }, 
    revalidate: 3600 
  };
};

export default ResourcePage;