import React, { useState } from 'react';
import { GetStaticPaths, GetStaticProps, NextPage } from 'next';
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote';
import { serialize } from 'next-mdx-remote/serialize';
import Head from 'next/head';
import Layout from '@/components/Layout';
import { getServerAllShorts, getServerShortBySlug } from "@/lib/server/content";
import ShortHero from '@/components/shorts/ShortHero';
import ShortContent from '@/components/shorts/ShortContent';
import ShortNavigation from '@/components/shorts/ShortNavigation';
import ShortActions from '@/components/shorts/ShortActions';
import RelatedShorts from '@/components/shorts/RelatedShorts';
import ShortMetadata from '@/components/shorts/ShortMetadata';
import ShortComments from '@/components/shorts/ShortComments';
import ShortShare from '@/components/shorts/ShortShare';
import { Bookmark, Heart, MessageCircle, Share2, Clock, Eye, Zap } from 'lucide-react';

interface Short {
  title: string;
  excerpt: string | null;
  description: string | null;
  date: string | null;
  coverImage: string | null;
  tags: string[];
  author: string | null;
  url: string;
  slugPath: string;
  readTime?: string;
  theme?: string;
  views?: number;
  likes?: number;
}

interface Props {
  short: Short;
  source: MDXRemoteSerializeResult;
}

const ShortPage: NextPage<Props> = ({ short, source }) => {
  const [likes, setLikes] = useState(short.likes || 0);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  
  const metaDescription = short.excerpt || short.description || 'A short insight from Abraham of London';
  const formattedDate = short.date ? new Date(short.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : '';

  const handleLike = () => {
    if (!isLiked) {
      setLikes(likes + 1);
      setIsLiked(true);
      // In production, you would call an API to save the like
    }
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    // In production, you would call an API to save/remove bookmark
  };

  return (
    <Layout>
      <Head>
        <title>{short.title} | Shorts | Abraham of London</title>
        <meta name="description" content={metaDescription} />
        <meta property="og:title" content={short.title} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:image" content={short.coverImage || '/assets/images/short-default.jpg'} />
        <meta property="og:type" content="article" />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* Short Hero Section */}
        <ShortHero 
          title={short.title}
          excerpt={short.excerpt}
          theme={short.theme}
          coverImage={short.coverImage}
          author={short.author}
          date={formattedDate}
          readTime={short.readTime}
        />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Quick Stats Bar */}
          <div className="mb-8 flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Eye className="w-4 h-4" />
                <span>{short.views || '1k'}+ views</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>{short.readTime || '2 min'} read</span>
              </div>
              {short.theme && (
                <div className="flex items-center space-x-2">
                  <Zap className="w-4 h-4" />
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                    {short.theme}
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={handleLike}
                className={`flex items-center space-x-2 ${
                  isLiked ? 'text-red-600' : 'text-gray-600 hover:text-red-600'
                }`}
              >
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                <span>{likes}</span>
              </button>
              
              <button
                onClick={() => setShowComments(!showComments)}
                className="flex items-center space-x-2 text-gray-600 hover:text-blue-600"
              >
                <MessageCircle className="w-5 h-5" />
                <span>Comment</span>
              </button>
              
              <button
                onClick={handleBookmark}
                className={`flex items-center space-x-2 ${
                  isBookmarked ? 'text-amber-600' : 'text-gray-600 hover:text-amber-600'
                }`}
              >
                <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Main Content */}
            <main className="lg:col-span-8">
              <div className="bg-white rounded-2xl shadow-xl p-8">
                {/* Short Content */}
                <ShortContent>
                  <MDXRemote {...source} />
                </ShortContent>

                {/* Tags */}
                {short.tags && short.tags.length > 0 && (
                  <div className="mt-8 pt-8 border-t border-gray-200">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Topics</h3>
                    <div className="flex flex-wrap gap-2">
                      {short.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="mt-8 pt-8 border-t border-gray-200">
                  <ShortActions 
                    title={short.title}
                    url={`https://abrahamoflondon.com${short.url}`}
                    onLike={handleLike}
                    isLiked={isLiked}
                    onBookmark={handleBookmark}
                    isBookmarked={isBookmarked}
                    likes={likes}
                  />
                </div>

                {/* Share Section */}
                <div className="mt-8">
                  <ShortShare 
                    title={short.title}
                    url={`https://abrahamoflondon.com${short.url}`}
                    excerpt={short.excerpt || ''}
                  />
                </div>

                {/* Comments */}
                <div className="mt-12">
                  <ShortComments 
                    showComments={showComments}
                    shortId={short.slugPath}
                    onToggleComments={() => setShowComments(!showComments)}
                  />
                </div>
              </div>
            </main>

            {/* Sidebar */}
            <aside className="lg:col-span-4">
              <div className="sticky top-8 space-y-8">
                {/* Short Metadata */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <ShortMetadata 
                    author={short.author}
                    date={formattedDate}
                    readTime={short.readTime}
                    theme={short.theme}
                    views={short.views}
                  />
                </div>

                {/* Navigation */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <ShortNavigation currentSlug={short.slugPath} />
                </div>

                {/* Related Shorts */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">More Shorts</h3>
                  <RelatedShorts currentSlug={short.slugPath} />
                </div>

                {/* Newsletter CTA */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl shadow-lg p-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Get Daily Shorts
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Receive curated insights directly in your inbox
                    </p>
                    <form className="space-y-3">
                      <input
                        type="email"
                        placeholder="Your email"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg px-4 py-2 hover:from-purple-700 hover:to-pink-700 transition-all"
                      >
                        Subscribe Now
                      </button>
                    </form>
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

export default ShortPage;

export const getStaticPaths: GetStaticPaths = async () => {
  const shorts = await getServerAllShorts();

  const paths = shorts
    .filter((short) => short && !short.draft)
    .map((short) => short.slug)
    .filter(Boolean)
    .map((slug: string) => ({ params: { slug } }));

  return { paths, fallback: 'blocking' };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = params?.slug as string;
  if (!slug) return { notFound: true };

  const shortData = await getServerShortBySlug(slug);
  if (!shortData) return { notFound: true };

  const short = {
    title: shortData.title || "Untitled Short",
    excerpt: shortData.excerpt || null,
    description: shortData.description || null,
    date: shortData.date || null,
    coverImage: shortData.coverImage || null,
    tags: Array.isArray(shortData.tags) ? shortData.tags : [],
    author: shortData.author || null,
    url: `/shorts/${shortData.slug || slug}`,
    slugPath: shortData.slug || slug,
    readTime: shortData.readTime || shortData.readingTime,
    theme: shortData.theme,
    views: shortData.views,
    likes: shortData.likes,
  };

  try {
    const source = await serialize(shortData.body || "");
    return { props: { short, source }, revalidate: 3600 };
  } catch {
    return { notFound: true };
  }
};