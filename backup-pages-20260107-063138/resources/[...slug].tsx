import React from 'react';
import { GetStaticPaths, GetStaticProps, NextPage } from 'next';
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote';
import { serialize } from 'next-mdx-remote/serialize';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import Head from 'next/head';
import Layout from '@/components/Layout';
import { getServerAllResources, getServerResourceBySlug } from '@/lib/contentlayer';


import { sanitizeData, mdxComponents } from '@/lib/server/md-utils';
// --- COMPONENTS ---
import ResourceHero from '@/components/resources/ResourceHero';
import ResourceContent from '@/components/resources/ResourceContent';
import ResourceCard from '@/components/resources/ResourceCard';
import ResourceActions from '@/components/resources/ResourceActions';
import ResourceMetadata from '@/components/resources/ResourceMetadata';
import RelatedResources from '@/components/resources/RelatedResources';
import ResourceDownload from '@/components/resources/ResourceDownload';
import { FileText, Download, Share2, BookOpen, Users, TrendingUp } from 'lucide-react';

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

      <div className="min-h-screen bg-black">
        {/* Resource Hero Section */}
        <ResourceHero 
          title={resource.title}
          excerpt={resource.excerpt}
          resourceType={resource.resourceType}
          coverImage={resource.coverImage}
          tags={resource.tags}
          author={resource.author}
          date={formattedDate}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Main Content */}
            <main className="lg:col-span-8">
              <div className="bg-zinc-900/50 border border-white/10 rounded-2xl shadow-xl p-8 lg:p-12 backdrop-blur-sm">
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
                  <div className="text-center p-4 bg-white/5 rounded-lg border border-white/5">
                    <div className="flex items-center justify-center space-x-2">
                      <BookOpen className="w-5 h-5 text-amber-400" />
                      <span className="font-semibold text-white">{resource.resourceType || 'Resource'}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">Type</p>
                  </div>
                  <div className="text-center p-4 bg-white/5 rounded-lg border border-white/5">
                    <div className="flex items-center justify-center space-x-2">
                      <FileText className="w-5 h-5 text-emerald-400" />
                      <span className="font-semibold text-white">{resource.fileFormat || 'PDF'}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">Format</p>
                  </div>
                  <div className="text-center p-4 bg-white/5 rounded-lg border border-white/5">
                    <div className="flex items-center justify-center space-x-2">
                      <Users className="w-5 h-5 text-blue-400" />
                      <span className="font-semibold text-white">{resource.difficulty || 'Expert'}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">Level</p>
                  </div>
                  <div className="text-center p-4 bg-white/5 rounded-lg border border-white/5">
                    <div className="flex items-center justify-center space-x-2">
                      <TrendingUp className="w-5 h-5 text-rose-400" />
                      <span className="font-semibold text-white">{resource.downloads || '142'}+</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">Transmissions</p>
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

                <div className="mt-12 pt-8 border-t border-white/10">
                  <ResourceActions 
                    title={resource.title}
                    url={`https://abrahamoflondon.com${resource.url}`}
                    slug={resource.slugPath}
                  />
                </div>
              </div>
            </main>

            {/* Sidebar */}
            <aside className="lg:col-span-4">
              <div className="sticky top-8 space-y-8">
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

                <div className="bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-amber-200 mb-4">Institutional Features</h3>
                  <ul className="space-y-3">
                    {['Professional-grade content', 'Ready-to-use templates', 'Step-by-step guidance', 'Commercial license included'].map((item) => (
                      <li key={item} className="flex items-start space-x-3 text-sm text-gray-300">
                        <Download className="w-4 h-4 text-amber-500 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  const resources = await getServerAllResources();

  const paths = resources
    .filter((resource) => {
      if (!resource || resource.draft) return false;
      const slug = resource.slug || resource.url?.replace(/^\/resources\//, '');
      
      // INSTITUTIONAL GATEKEEPER: yield to existing static folders
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

  // Prevent internal conflicts
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
