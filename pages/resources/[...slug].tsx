import React from 'react';
import { GetStaticPaths, GetStaticProps, NextPage } from 'next';
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote';
import { serialize } from 'next-mdx-remote/serialize';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { getServerAllResources, getServerResourceBySlug } from "@/lib/server/content";
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

      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
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
              <div className="bg-white rounded-2xl shadow-xl p-8 lg:p-12">
                {/* Resource Card */}
                <ResourceCard 
                  title={resource.title}
                  description={resource.description}
                  resourceType={resource.resourceType}
                  difficulty={resource.difficulty}
                  timeRequired={resource.timeRequired}
                  downloads={resource.downloads}
                />

                {/* Quick Stats */}
                <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-center space-x-2">
                      <BookOpen className="w-5 h-5 text-blue-600" />
                      <span className="font-semibold text-gray-900">{resource.resourceType || 'Resource'}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Type</p>
                  </div>
                  
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center justify-center space-x-2">
                      <FileText className="w-5 h-5 text-green-600" />
                      <span className="font-semibold text-gray-900">{resource.fileFormat || 'PDF'}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Format</p>
                  </div>
                  
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="flex items-center justify-center space-x-2">
                      <Users className="w-5 h-5 text-purple-600" />
                      <span className="font-semibold text-gray-900">
                        {resource.difficulty || 'Intermediate'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Level</p>
                  </div>
                  
                  <div className="text-center p-4 bg-amber-50 rounded-lg">
                    <div className="flex items-center justify-center space-x-2">
                      <TrendingUp className="w-5 h-5 text-amber-600" />
                      <span className="font-semibold text-gray-900">
                        {resource.downloads || '100+'}+
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Downloads</p>
                  </div>
                </div>

                {/* Resource Content */}
                <div className="mt-8">
                  <ResourceContent>
                    <MDXRemote {...source} />
                  </ResourceContent>
                </div>

                {/* Download Section */}
                <div className="mt-12">
                  <ResourceDownload 
                    title={resource.title}
                    fileSize={resource.fileSize}
                    fileFormat={resource.fileFormat}
                    resourceType={resource.resourceType}
                  />
                </div>

                {/* Resource Actions */}
                <div className="mt-12 pt-8 border-t border-gray-200">
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
                {/* Resource Metadata */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <ResourceMetadata 
                    author={resource.author}
                    date={formattedDate}
                    fileSize={resource.fileSize}
                    fileFormat={resource.fileFormat}
                    timeRequired={resource.timeRequired}
                  />
                </div>

                {/* Related Resources */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Related Resources</h3>
                  <RelatedResources currentSlug={resource.slugPath} />
                </div>

                {/* Premium Features */}
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl shadow-lg p-6 border border-emerald-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Premium Features</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-emerald-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700">Professional-grade content</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-emerald-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700">Ready-to-use templates</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-emerald-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700">Step-by-step guidance</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-emerald-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700">Commercial license included</span>
                    </li>
                  </ul>
                </div>

                {/* Quick Actions */}
                <div className="bg-gradient-to-r from-gray-900 to-black rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <button className="w-full bg-white text-gray-900 rounded-lg px-4 py-3 hover:bg-gray-100 transition-colors flex items-center justify-center space-x-2">
                      <Download className="w-4 h-4" />
                      <span>Download PDF</span>
                    </button>
                    <button className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2">
                      <Share2 className="w-4 h-4" />
                      <span>Share Resource</span>
                    </button>
                    <button className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg px-4 py-3 hover:from-emerald-600 hover:to-teal-600 transition-all">
                      Save to Library
                    </button>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ResourcePage;

export const getStaticPaths: GetStaticPaths = async () => {
  const resources = await getServerAllResources();

  const paths = resources
    .filter((resource) => resource && !resource.draft)
    .map((resource) => {
      // Convert the resource slug to array format for catch-all route
      const slugPath = resource.slug || resource.url?.replace(/^\/resources\//, '');
      if (!slugPath) return null;
      
      return {
        params: { slug: slugPath.split('/').filter(Boolean) }
      };
    })
    .filter(Boolean) as Array<{ params: { slug: string[] } }>;

  return { paths, fallback: 'blocking' };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slugArray = params?.slug as string[];
  if (!slugArray || !Array.isArray(slugArray) || slugArray.length === 0) {
    return { notFound: true };
  }

  const slug = slugArray.join('/');
  const resourceData = await getServerResourceBySlug(slug);
  if (!resourceData || resourceData.draft) return { notFound: true };

  const resource = {
    title: resourceData.title || "Untitled Resource",
    excerpt: resourceData.excerpt || resourceData.description || null,
    description: resourceData.description || resourceData.excerpt || null,
    date: resourceData.date || null,
    coverImage: resourceData.coverImage || null,
    tags: Array.isArray(resourceData.tags) ? resourceData.tags : [],
    author: resourceData.author || null,
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

  return { props: { resource, source }, revalidate: 3600 };
};