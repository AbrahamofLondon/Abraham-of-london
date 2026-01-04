import React, { useState } from 'react';
import { GetStaticPaths, GetStaticProps, NextPage } from 'next';
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote';
import { serialize } from 'next-mdx-remote/serialize';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import Head from 'next/head';
import Layout from '@/components/Layout';
import { getServerAllDownloads, getServerDownloadBySlug } from "@/lib/server/content";
import DownloadHero from '@/components/downloads/DownloadHero';
import DownloadContent from '@/components/downloads/DownloadContent';
import DownloadCard from '@/components/downloads/DownloadCard';
import DownloadForm from '@/components/downloads/DownloadForm';
import RelatedDownloads from '@/components/downloads/RelatedDownloads';
import { useAuth } from '@/hooks/useAuth';

interface Download {
  title: string;
  excerpt: string | null;
  description: string | null;
  category: string;
  fileUrl: string | null;
  fileHref: string | null;
  coverImage: string | null;
  slug: string;
  date: string | null;
  tags: string[];
  fileSize?: string;
  fileFormat?: string;
  requiresEmail?: boolean;
}

interface Props {
  download: Download;
  source: MDXRemoteSerializeResult;
}

const DownloadPage: NextPage<Props> = ({ download, source }) => {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(download.requiresEmail && !user);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [downloadStarted, setDownloadStarted] = useState(false);

  const metaDescription = download.excerpt || download.description || 'A premium resource download from Abraham of London';

  const handleDownload = async () => {
    if (download.requiresEmail && !user && !email) {
      setShowForm(true);
      return;
    }

    setIsSubmitting(true);
    
    // In a real app, you would:
    // 1. Track the download
    // 2. Send email if required
    // 3. Trigger the actual download
    
    setTimeout(() => {
      setDownloadStarted(true);
      setIsSubmitting(false);
      
      // Trigger download
      if (download.fileUrl) {
        window.open(download.fileUrl, '_blank');
      }
    }, 1500);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Submit email to your API
    try {
      // await submitEmailForDownload(email, download.slug);
      handleDownload();
    } catch (error) {
      console.error('Failed to submit email:', error);
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <Head>
        <title>{download.title} | Downloads | Abraham of London</title>
        <meta name="description" content={metaDescription} />
        <meta property="og:title" content={download.title} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:image" content={download.coverImage || '/assets/images/download-default.jpg'} />
        <meta property="og:type" content="article" />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* Download Hero Section */}
        <DownloadHero 
          title={download.title}
          category={download.category}
          excerpt={download.excerpt}
          coverImage={download.coverImage}
          tags={download.tags}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Main Content */}
            <main className="lg:col-span-8">
              <div className="bg-white rounded-2xl shadow-xl p-8 lg:p-12">
                {/* Download Card */}
                <DownloadCard 
                  title={download.title}
                  description={download.description}
                  fileSize={download.fileSize}
                  fileFormat={download.fileFormat}
                  date={download.date}
                  tags={download.tags}
                />

                {/* Download Content */}
                <div className="mt-8">
                  <DownloadContent>
                    <MDXRemote {...source} />
                  </DownloadContent>
                </div>

                {/* Download CTA */}
                <div className="mt-12">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8">
                    <div className="text-center">
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">
                        Ready to Download?
                      </h3>
                      <p className="text-gray-600 mb-6">
                        Get instant access to this premium resource
                      </p>
                      
                      {showForm ? (
                        <DownloadForm 
                          email={email}
                          setEmail={setEmail}
                          onSubmit={handleEmailSubmit}
                          isSubmitting={isSubmitting}
                        />
                      ) : (
                        <button
                          onClick={handleDownload}
                          disabled={isSubmitting}
                          className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50"
                        >
                          {isSubmitting ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              Preparing Download...
                            </>
                          ) : downloadStarted ? (
                            'Download Started!'
                          ) : (
                            <>
                              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                              Download Now ({download.fileSize || 'Free'})
                            </>
                          )}
                        </button>
                      )}
                      
                      {downloadStarted && (
                        <p className="mt-4 text-sm text-green-600">
                          ✅ Your download has started. Check your browser's download folder.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </main>

            {/* Sidebar */}
            <aside className="lg:col-span-4">
              <div className="sticky top-8 space-y-8">
                {/* Related Downloads */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Related Resources</h3>
                  <RelatedDownloads currentSlug={download.slug} />
                </div>

                {/* Download Stats */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Resource Details</h3>
                  <dl className="space-y-3">
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Format</dt>
                      <dd className="font-medium text-gray-900">{download.fileFormat || 'PDF'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">File Size</dt>
                      <dd className="font-medium text-gray-900">{download.fileSize || 'Variable'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Pages</dt>
                      <dd className="font-medium text-gray-900">Premium Quality</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">License</dt>
                      <dd className="font-medium text-gray-900">Personal Use</dd>
                    </div>
                  </dl>
                </div>

                {/* Premium Notice */}
                <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl shadow-lg p-6 border border-amber-200">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Premium Resource</h4>
                      <p className="mt-1 text-sm text-gray-600">
                        This is a premium resource. Please do not redistribute without permission.
                      </p>
                    </div>
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

export default DownloadPage;

export const getStaticPaths: GetStaticPaths = async () => {
  const downloads = await getServerAllDownloads();

  const paths = downloads
    .filter((download) => download && !download.draft)
    .map((download) => download.slug)
    .filter(Boolean)
    .map((slug: string) => ({ params: { slug } }));

  return { paths, fallback: 'blocking' };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = params?.slug as string;
  if (!slug) return { notFound: true };

  const downloadData = await getServerDownloadBySlug(slug);
  if (!downloadData || downloadData.draft) return { notFound: true };

  const download = {
    title: downloadData.title || "Download",
    excerpt: downloadData.excerpt || null,
    description: downloadData.description || downloadData.excerpt || null,
    category: downloadData.category || "Strategic Resource",
    fileUrl: downloadData.fileUrl || null,
    fileHref: downloadData.fileHref || null,
    coverImage: downloadData.coverImage || null,
    slug: downloadData.slug || slug,
    date: downloadData.date || null,
    tags: Array.isArray(downloadData.tags) ? downloadData.tags : [],
    fileSize: downloadData.fileSize,
    fileFormat: downloadData.fileFormat,
    requiresEmail: downloadData.requiresEmail || false,
  };

  const source = await serialize(downloadData.body || " ", {
    mdxOptions: {
      remarkPlugins: [remarkGfm],
      rehypePlugins: [rehypeSlug],
    },
  });

  return { props: { download, source }, revalidate: 3600 };
};