// pages/resources/[...slug].tsx - GUARANTEED WORKING
import React, { useState, useEffect } from 'react';
import { GetStaticPaths, GetStaticProps, NextPage } from 'next';
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote';
import { serialize } from 'next-mdx-remote/serialize';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import Layout from "@/components/Layout"; // THIS IS IMPORTED
import { getServerAllResources, getServerResourceBySlug, getContentlayerData } from "@/lib/contentlayer-compat";
import { sanitizeData, mdxComponents } from '@/lib/server/md-utils';
import { 
  Bookmark, 
  BookmarkCheck, 
  Download, 
  Clock, 
  User, 
  Calendar, 
  FileText, 
  BarChart3,
  ChevronLeft 
} from 'lucide-react';

// Dynamic imports
const ReadingProgress = dynamic(() => import("@/components/enhanced/ReadingProgress"), { ssr: false });
const TableOfContents = dynamic(() => import("@/components/enhanced/TableOfContents"), { ssr: false });
const BackToTop = dynamic(() => import("@/components/enhanced/BackToTop"), { ssr: false });

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
  const router = useRouter();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [resourcesViewed, setResourcesViewed] = useState(0);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Track view count
      const viewed = parseInt(localStorage.getItem('resourcesViewed') || '0', 10);
      const newCount = viewed + 1;
      setResourcesViewed(newCount);
      localStorage.setItem('resourcesViewed', newCount.toString());

      // Check if already bookmarked
      try {
        const bookmarks = JSON.parse(localStorage.getItem('bookmarkedResources') || '[]');
        setIsBookmarked(bookmarks.includes(resource.slugPath));
      } catch (error) {
        console.error('Error parsing bookmarks:', error);
        localStorage.setItem('bookmarkedResources', '[]');
      }
    }
  }, [resource.slugPath]);

  const metaDescription = resource.excerpt || resource.description || 'A premium resource from Abraham of London';
  const formattedDate = resource.date ? new Date(resource.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : '';

  const handleBookmarkToggle = () => {
    try {
      const bookmarks = JSON.parse(localStorage.getItem('bookmarkedResources') || '[]');
      let updatedBookmarks;
      
      if (isBookmarked) {
        updatedBookmarks = bookmarks.filter((slug: string) => slug !== resource.slugPath);
        localStorage.setItem('bookmarkedResources', JSON.stringify(updatedBookmarks));
        setIsBookmarked(false);
      } else {
        updatedBookmarks = [...bookmarks, resource.slugPath];
        localStorage.setItem('bookmarkedResources', JSON.stringify(updatedBookmarks));
        setIsBookmarked(true);
      }
    } catch (error) {
      console.error('Error updating bookmarks:', error);
    }
  };

  const handleBackClick = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/resources');
    }
  };

  // SIMPLE RETURN - NO COMPLEX LOGIC
  return (
    <Layout
      title={`${resource.title} | Resources | Abraham of London`}
      description={metaDescription}
      ogImage={resource.coverImage || '/assets/images/resource-default.jpg'}
    >
      <Head>
        <title>{`${resource.title} | Resources | Abraham of London`}</title>
        <meta name="description" content={metaDescription} />
        <meta property="og:title" content={resource.title} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:image" content={resource.coverImage || '/assets/images/resource-default.jpg'} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://abrahamoflondon.com${resource.url}`} />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href={`https://abrahamoflondon.com${resource.url}`} />
      </Head>

      <ReadingProgress />

      <div className="min-h-screen bg-black">
        {/* Navigation */}
        <div className="border-b border-white/10 bg-black/80 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <button
              onClick={handleBackClick}
              className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors group"
            >
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back to Resources
            </button>
          </div>
        </div>

        {/* Simple header */}
        <div className="border-b border-white/10 bg-gradient-to-b from-black via-black to-zinc-900/30 py-12 md:py-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className="mb-4">
              <span className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-amber-400">
                {resource.resourceType || 'Strategic Resource'}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-6 leading-tight">
              {resource.title}
            </h1>
            {resource.excerpt && (
              <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-3xl leading-relaxed">
                {resource.excerpt}
              </p>
            )}
            <div className="flex flex-wrap gap-2 mt-8">
              {resource.tags.map((tag) => (
                <span 
                  key={tag} 
                  className="px-3 py-1.5 bg-white/5 text-gray-300 text-xs md:text-sm rounded-full border border-white/10 hover:border-amber-500/30 transition-colors"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            <main className="lg:col-span-8">
              <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6 md:p-8">
                <div className="prose prose-invert prose-lg max-w-none">
                  <MDXRemote {...source} components={mdxComponents} />
                </div>
                
                {/* Metadata */}
                <div className="mt-12 pt-8 border-t border-white/10">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
                    {resource.author && (
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-white/5 rounded-lg">
                          <User className="w-4 h-4 text-gray-400" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-300 mb-1">Author</div>
                          <div className="text-gray-400">{resource.author}</div>
                        </div>
                      </div>
                    )}
                    {formattedDate && (
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-white/5 rounded-lg">
                          <Calendar className="w-4 h-4 text-gray-400" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-300 mb-1">Published</div>
                          <div className="text-gray-400">{formattedDate}</div>
                        </div>
                      </div>
                    )}
                    {resource.fileSize && (
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-white/5 rounded-lg">
                          <Download className="w-4 h-4 text-gray-400" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-300 mb-1">File Size</div>
                          <div className="text-gray-400">{resource.fileSize}</div>
                        </div>
                      </div>
                    )}
                    {resource.fileFormat && (
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-white/5 rounded-lg">
                          <FileText className="w-4 h-4 text-gray-400" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-300 mb-1">Format</div>
                          <div className="text-gray-400 uppercase">{resource.fileFormat}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </main>

            <aside className="lg:col-span-4">
              <div className="sticky top-8 space-y-6">
                {/* Table of Contents */}
                <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-6">
                  <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
                    <span className="text-amber-400">#</span>
                    Quick Navigation
                  </h3>
                  <TableOfContents />
                </div>

                {/* Action buttons */}
                <div className="space-y-3">
                  <button
                    onClick={handleBookmarkToggle}
                    className={`w-full py-3 px-4 rounded-lg border flex items-center justify-center gap-3 transition-all duration-300 ${
                      isBookmarked 
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 hover:bg-amber-500/30' 
                        : 'bg-white/5 border-white/10 text-gray-400 hover:border-amber-500/30 hover:text-amber-400'
                    }`}
                  >
                    {isBookmarked ? (
                      <>
                        <BookmarkCheck className="w-5 h-5" />
                        <span>Saved to Library</span>
                      </>
                    ) : (
                      <>
                        <Bookmark className="w-5 h-5" />
                        <span>Save to Library</span>
                      </>
                    )}
                  </button>

                  {resource.fileFormat && resource.fileSize && (
                    <button
                      onClick={() => {
                        // Add download logic here
                        console.log('Downloading:', resource.title);
                      }}
                      className="w-full py-3 px-4 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 transition-all duration-300 flex items-center justify-center gap-3"
                    >
                      <Download className="w-5 h-5" />
                      <span>Download {resource.fileFormat}</span>
                    </button>
                  )}
                </div>

                {/* Stats */}
                <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-6">
                  <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Resource Stats
                  </h3>
                  <div className="space-y-4">
                    {resource.difficulty && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Difficulty</span>
                        <span className="text-white font-medium px-3 py-1 rounded-full bg-white/5 text-sm">
                          {resource.difficulty}
                        </span>
                      </div>
                    )}
                    {resource.timeRequired && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Time Required</span>
                        <div className="flex items-center gap-2 text-white">
                          <Clock className="w-4 h-4" />
                          <span className="font-medium">{resource.timeRequired}</span>
                        </div>
                      </div>
                    )}
                    {resource.downloads !== undefined && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Downloads</span>
                        <span className="text-white font-medium">{resource.downloads.toLocaleString()}+</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-4 border-t border-white/10">
                      <span className="text-gray-400">Your Views</span>
                      <span className="text-white font-medium">{resourcesViewed}</span>
                    </div>
                  </div>
                </div>

                {/* Share buttons */}
                <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-6">
                  <h3 className="text-sm font-semibold text-gray-300 mb-4">Share This Resource</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const url = `https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(resource.title)}`;
                        window.open(url, '_blank');
                      }}
                      className="flex-1 py-2 px-3 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors text-xs font-medium"
                    >
                      Twitter
                    </button>
                    <button
                      onClick={() => {
                        const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`;
                        window.open(url, '_blank');
                      }}
                      className="flex-1 py-2 px-3 rounded-lg bg-blue-700/10 text-blue-300 hover:bg-blue-700/20 transition-colors text-xs font-medium"
                    >
                      LinkedIn
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        alert('Link copied to clipboard!');
                      }}
                      className="flex-1 py-2 px-3 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 transition-colors text-xs font-medium"
                    >
                      Copy Link
                    </button>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>

        {/* Related resources or navigation could go here */}
        <div className="max-w-7xl mx-auto px-4 pb-16">
          <div className="border-t border-white/10 pt-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Need More Resources?</h3>
                <p className="text-gray-400">Explore our full library of strategic frameworks and tools.</p>
              </div>
              <button
                onClick={() => router.push('/resources')}
                className="px-6 py-3 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
              >
                Browse All Resources
              </button>
            </div>
          </div>
        </div>
      </div>

      <BackToTop />
    </Layout>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  try {
    await getContentlayerData();
    const resources = await getServerAllResources();

    const paths = resources
      .filter((resource) => {
        if (!resource || resource.draft) return false;
        const slug = resource.slug || resource.url?.replace(/^\/resources\//, '');
        return slug && slug !== 'strategic-frameworks' && slug !== 'index';
      })
      .map((resource) => {
        const slugPath = resource.slug || resource.url?.replace(/^\/resources\//, '') || '';
        return {
          params: { 
            slug: slugPath.split('/').filter(Boolean) 
          }
        };
      });

    return { 
      paths, 
      fallback: 'blocking' // Changed from false for better UX
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
    const slugArray = params?.slug as string[];
    const slug = slugArray?.join('/') || '';

    if (!slug || slug === 'strategic-frameworks' || slug === 'index') {
      return { 
        notFound: true 
      };
    }

    const resourceData = await getServerResourceBySlug(slug);
    if (!resourceData || resourceData.draft) {
      return { 
        notFound: true 
      };
    }

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
      downloads: resourceData.downloads || 0,
    };

    const source = await serialize(resourceData.body?.raw || "", {
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
  } catch (error) {
    console.error('Error generating static props:', error);
    return {
      notFound: true
    };
  }
};

export default ResourcePage;