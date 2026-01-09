import React, { useState, useEffect } from 'react';
import { GetStaticPaths, GetStaticProps, NextPage } from 'next';
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote';
import { serialize } from 'next-mdx-remote/serialize';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import Layout from '@/components/Layout';
import { getServerAllResources, getServerResourceBySlug, getContentlayerData } from "@/lib/contentlayer-compat";
import { sanitizeData, mdxComponents } from '@/lib/server/md-utils';

// Components
import ResourceHero from '@/components/resources/ResourceHero';
import ResourceContent from '@/components/resources/ResourceContent';
import ResourceCard from '@/components/resources/ResourceCard';
import ResourceActions from '@/components/resources/ResourceActions';
import ResourceMetadata from '@/components/resources/ResourceMetadata';
import RelatedResources from '@/components/resources/RelatedResources';
import ResourceDownload from '@/components/resources/ResourceDownload';
import { FileText, Download, Share2, BookOpen, Users, TrendingUp, Bookmark, CheckCircle, Library } from 'lucide-react';

// Enhanced components for power users
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
  const [showCollectionPrompt, setShowCollectionPrompt] = useState(false);
  const [resourcesViewed, setResourcesViewed] = useState(0);
  const user = null; // Replace with actual auth

  // Track resource viewing for collection prompt
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const viewed = parseInt(localStorage.getItem('resourcesViewed') || '0');
      const newCount = viewed + 1;
      setResourcesViewed(newCount);
      localStorage.setItem('resourcesViewed', newCount.toString());

      // Show collection builder prompt after 3 resources
      if (newCount === 3 && !user) {
        setTimeout(() => setShowCollectionPrompt(true), 5000);
      }

      // Track bookmarks
      const bookmarks = JSON.parse(localStorage.getItem('bookmarkedResources') || '[]');
      setIsBookmarked(bookmarks.includes(resource.slugPath));
    }
  }, [resource.slugPath, user]);

  const handleBookmark = () => {
    if (typeof window !== 'undefined') {
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
    }
  };

  const metaDescription = resource.excerpt || resource.description || 'A premium resource from Abraham of London';
  const formattedDate = resource.date ? new Date(resource.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : '';

  return (
    <Layout>
      <Head>
        <title>{resource.title} | Resources | Abraham of London</title>
        <meta name="description" content={metaDescription} />
        <meta property="og:title" content={resource.title} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:image" content={resource.coverImage || '/assets/images/resource-default.jpg'} />
        <meta property="og:type" content="article" />
      </Head>

      <ReadingProgress />

      <div className="min-h-screen bg-black">
        <ResourceHero 
          title={resource.title}
          excerpt={resource.excerpt}
          resourceType={resource.resourceType}
          coverImage={resource.coverImage}
          tags={resource.tags}
          author={resource.author}
          date={formattedDate}
        />

        {/* Collection builder prompt for engaged users */}
        {showCollectionPrompt && !user && (
          <div className="sticky top-0 z-50 bg-gradient-to-r from-purple-900/95 via-blue-900/95 to-purple-900/95 backdrop-blur-xl border-b border-purple-500/30 shadow-2xl">
            <div className="max-w-7xl mx-auto px-4 py-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="hidden sm:flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30">
                    <Library className="w-7 h-7 text-purple-300" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                      <p className="font-semibold text-white">You've explored {resourcesViewed} resources!</p>
                    </div>
                    <p className="text-sm text-purple-200">Build your personal library with Inner Circle — unlimited access to 50+ frameworks, worksheets & playbooks</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => window.location.href = '/inner-circle'}
                    className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold rounded-lg hover:from-purple-400 hover:to-blue-400 transition-all shadow-lg shadow-purple-900/50 whitespace-nowrap"
                  >
                    Build Library
                  </button>
                  <button
                    onClick={() => setShowCollectionPrompt(false)}
                    className="text-purple-200 hover:text-white transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <main className="lg:col-span-8">
              <div className="bg-zinc-900/50 border border-white/10 rounded-2xl shadow-xl p-8 lg:p-12 backdrop-blur-sm">
                {/* Bookmark button for power users */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                      {resource.resourceType || 'Strategic Resource'}
                    </span>
                  </div>
                  <button
                    onClick={handleBookmark}
                    className={`group flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                      isBookmarked 
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' 
                        : 'bg-white/5 border-white/10 text-gray-400 hover:border-amber-500/50 hover:text-amber-300'
                    }`}
                  >
                    <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                    <span className="text-sm font-medium">
                      {isBookmarked ? 'Saved' : 'Save'}
                    </span>
                  </button>
                </div>

                <ResourceCard 
                  title={resource.title}
                  description={resource.description}
                  resourceType={resource.resourceType}
                  difficulty={resource.difficulty}
                  timeRequired={resource.timeRequired}
                  downloads={resource.downloads}
                />

                {/* Quick Stats Grid */}
                <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-white/5 rounded-lg border border-white/5 hover:border-amber-500/30 transition-colors">
                    <div className="flex items-center justify-center space-x-2">
                      <BookOpen className="w-5 h-5 text-amber-400" />
                      <span className="font-semibold text-white">{resource.resourceType || 'Resource'}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">Type</p>
                  </div>
                  <div className="text-center p-4 bg-white/5 rounded-lg border border-white/5 hover:border-emerald-500/30 transition-colors">
                    <div className="flex items-center justify-center space-x-2">
                      <FileText className="w-5 h-5 text-emerald-400" />
                      <span className="font-semibold text-white">{resource.fileFormat || 'PDF'}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">Format</p>
                  </div>
                  <div className="text-center p-4 bg-white/5 rounded-lg border border-white/5 hover:border-blue-500/30 transition-colors">
                    <div className="flex items-center justify-center space-x-2">
                      <Users className="w-5 h-5 text-blue-400" />
                      <span className="font-semibold text-white">{resource.difficulty || 'Expert'}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">Level</p>
                  </div>
                  <div className="text-center p-4 bg-white/5 rounded-lg border border-white/5 hover:border-rose-500/30 transition-colors">
                    <div className="flex items-center justify-center space-x-2">
                      <TrendingUp className="w-5 h-5 text-rose-400" />
                      <span className="font-semibold text-white">{resource.downloads || '142'}+</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">Downloads</p>
                  </div>
                </div>

                <div className="mt-8 prose prose-invert max-w-none">
                  <ResourceContent>
                    <MDXRemote {...source} components={mdxComponents} />
                  </ResourceContent>
                </div>

                <div className="mt-12">
                  <ResourceDownload 
                    title={resource.title}
                    fileSize={resource.fileSize}
                    fileFormat={resource.fileFormat}
                    resourceType={resource.resourceType}
                  />
                </div>

                {/* Learning path suggestion for power users */}
                {resourcesViewed >= 2 && !user && (
                  <div className="mt-12 p-8 bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-2xl border-2 border-blue-500/30">
                    <div className="flex items-start gap-6">
                      <div className="flex-shrink-0">
                        <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                          <Library className="w-8 h-8 text-white" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-serif font-semibold text-white mb-2">
                          Building a serious knowledge base?
                        </h3>
                        <p className="text-gray-300 mb-4">
                          You've accessed {resourcesViewed} resources. Inner Circle members get unlimited access to our complete library, plus:
                        </p>
                        <ul className="space-y-2 mb-6">
                          {[
                            'Downloadable PDF bundles for offline study',
                            'Early access to new frameworks & templates',
                            'Members-only strategy sessions',
                            'Private community access'
                          ].map((benefit) => (
                            <li key={benefit} className="flex items-center gap-3 text-sm text-gray-300">
                              <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                              <span>{benefit}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="flex flex-wrap gap-4">
                          <a
                            href="/inner-circle"
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-xl hover:from-blue-400 hover:to-purple-400 transition-all shadow-lg shadow-blue-900/50"
                          >
                            Explore Inner Circle
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                          </a>
                          <button
                            onClick={() => window.location.href = `/resources`}
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 transition-colors"
                          >
                            Browse More Resources
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-12 pt-8 border-t border-white/10">
                  <ResourceActions 
                    title={resource.title}
                    url={`https://abrahamoflondon.com${resource.url}`}
                    slug={resource.slugPath}
                  />
                </div>
              </div>
            </main>

            <aside className="lg:col-span-4">
              <div className="sticky top-8 space-y-8">
                {/* Table of Contents for deep content */}
                <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
                  <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                    </svg>
                    Quick Navigation
                  </h3>
                  <TableOfContents />
                </div>

                <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
                  <ResourceMetadata 
                    author={resource.author}
                    date={formattedDate}
                    fileSize={resource.fileSize}
                    fileFormat={resource.fileFormat}
                    timeRequired={resource.timeRequired}
                  />
                </div>

                <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
                  <h3 className="text-lg font-serif font-semibold text-white mb-4">Related Intelligence</h3>
                  <RelatedResources currentSlug={resource.slugPath} />
                </div>

                {/* Power user features */}
                <div className="bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-amber-200 mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Institutional Features
                  </h3>
                  <ul className="space-y-3">
                    {[
                      'Professional-grade content',
                      'Ready-to-use templates',
                      'Step-by-step guidance',
                      'Commercial license included'
                    ].map((item) => (
                      <li key={item} className="flex items-start space-x-3 text-sm text-gray-300">
                        <Download className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Progress tracker */}
                {resourcesViewed > 1 && (
                  <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-xl p-6">
                    <h3 className="text-sm font-semibold text-purple-200 mb-3">Your Library Progress</h3>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-300">Resources Explored</span>
                          <span className="font-semibold text-white">{resourcesViewed}</span>
                        </div>
                        <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min((resourcesViewed / 10) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                      <p className="text-xs text-gray-400">
                        {resourcesViewed < 10 
                          ? `Explore ${10 - resourcesViewed} more to complete your starter collection`
                          : 'You're building a serious knowledge base! 🎯'}
                      </p>
                    </div>
                  </div>
                )}
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

  const resource = {
    title: resourceData.title || "Untitled Intelligence",
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

  return { props: { resource: sanitizeData(resource), source }, revalidate: 3600 };
};

export default ResourcePage;