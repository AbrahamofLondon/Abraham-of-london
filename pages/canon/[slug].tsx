import React from 'react';
import { GetStaticPaths, GetStaticProps, NextPage } from 'next';
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote';
import { serialize } from 'next-mdx-remote/serialize';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import Head from 'next/head';
import Layout from '@/components/Layout';
import { getServerAllCanons, getServerCanonBySlug } from "@/lib/server/content";
import CanonHero from '@/components/canon/CanonHero';
import CanonContent from '@/components/canon/CanonContent';
import CanonNavigation from '@/components/canon/CanonNavigation';
import CanonStudyGuide from '@/components/canon/CanonStudyGuide';
import AccessGate from '@/components/AccessGate';
import { useAuth } from '@/hooks/useAuth';

interface Canon {
  title: string;
  excerpt: string | null;
  subtitle: string | null;
  slug: string;
  accessLevel: string;
  lockMessage: string | null;
  coverImage: string | null;
  volumeNumber?: string;
  order?: number;
}

interface Props {
  canon: Canon;
  locked: boolean;
  source?: MDXRemoteSerializeResult;
}

const CanonPage: NextPage<Props> = ({ canon, locked, source }) => {
  const { user, isLoading } = useAuth();
  const hasAccess = !locked || (user && user.accessLevel === 'inner-circle');
  const metaDescription = canon.excerpt || 'A canonical work from Abraham of London';

  if (locked && !hasAccess && !isLoading) {
    return (
      <Layout>
        <Head>
          <title>{canon.title} | Canon | Abraham of London</title>
          <meta name="description" content={metaDescription} />
        </Head>
        <AccessGate 
          title={canon.title}
          message={canon.lockMessage || "This content is reserved for Inner Circle members."}
          requiredTier="inner-circle"
        />
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>{canon.title} | Canon | Abraham of London</title>
        <meta name="description" content={metaDescription} />
        <meta property="og:title" content={canon.title} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:image" content={canon.coverImage || '/assets/images/canon-default.jpg'} />
        <meta property="og:type" content="article" />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
        {/* Canon Hero Section */}
        <CanonHero 
          title={canon.title}
          subtitle={canon.subtitle}
          volumeNumber={canon.volumeNumber}
          coverImage={canon.coverImage}
          excerpt={canon.excerpt}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Navigation Sidebar */}
            <div className="lg:col-span-3">
              <CanonNavigation currentSlug={canon.slug} />
            </div>

            {/* Main Content */}
            <main className="lg:col-span-6">
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl p-8 lg:p-12">
                {locked && hasAccess && (
                  <div className="mb-8 p-4 bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-lg border border-purple-500/30">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </div>
                      </div>
                      <p className="text-sm text-purple-200">
                        Inner Circle Exclusive Content
                      </p>
                    </div>
                  </div>
                )}

                <CanonContent>
                  {source && <MDXRemote {...source} />}
                </CanonContent>

                <div className="mt-12 pt-8 border-t border-gray-700">
                  <div className="flex flex-wrap gap-4">
                    <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all">
                      Save to Library
                    </button>
                    <button className="px-6 py-3 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors">
                      Download PDF
                    </button>
                    <button className="px-6 py-3 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors">
                      Share Insight
                    </button>
                  </div>
                </div>
              </div>
            </main>

            {/* Study Guide Sidebar */}
            <div className="lg:col-span-3">
              <CanonStudyGuide canonTitle={canon.title} />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CanonPage;

export const getStaticPaths: GetStaticPaths = async () => {
  const canons = await getServerAllCanons();

  const paths = canons
    .filter((canon) => canon && !canon.draft)
    .map((canon) => canon.slug)
    .filter(Boolean)
    .map((slug: string) => ({ params: { slug } }));

  return { paths, fallback: 'blocking' };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = params?.slug as string;
  if (!slug) return { notFound: true };

  const canonData = await getServerCanonBySlug(slug);
  if (!canonData || canonData.draft) return { notFound: true };

  const canon = {
    title: canonData.title || "Canon",
    excerpt: canonData.excerpt || null,
    subtitle: canonData.subtitle || null,
    slug: canonData.slug || slug,
    accessLevel: canonData.accessLevel || "public",
    lockMessage: canonData.lockMessage || null,
    coverImage: canonData.coverImage || null,
    volumeNumber: canonData.volumeNumber,
    order: canonData.order,
  };

  // Gated: ship a lock page only
  if (canon.accessLevel !== "public") {
    return { props: { canon, locked: true }, revalidate: 1800 };
  }

  const raw = canonData.body || "";

  let source: MDXRemoteSerializeResult;
  try {
    source = await serialize(raw || " ", {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [rehypeSlug, [rehypeAutolinkHeadings, { behavior: "wrap" }]],
      },
    });
  } catch {
    source = await serialize("Content is being prepared.");
  }

  return { props: { canon, locked: false, source }, revalidate: 1800 };
};