/* pages/shorts/[slug].tsx — VIRAL MICRO-EXPERIENCE ENGINE */
import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import dynamic from "next/dynamic";
import Layout from "@/components/Layout";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";

import {
  getServerAllShorts,
  getServerShortBySlug,
  normalizeSlug,
} from "@/lib/contentlayer-compat";
import { prepareMDX, mdxComponents, sanitizeData } from "@/lib/server/md-utils";

import ShortHero from "@/components/shorts/ShortHero";
import ShortContent from "@/components/shorts/ShortContent";
import ShortNavigation from "@/components/shorts/ShortNavigation";
import ShortActions from "@/components/shorts/ShortActions";
import ShortMetadata from "@/components/shorts/ShortMetadata";
import ShortComments from "@/components/shorts/ShortComments";

import { Bookmark, Heart, MessageCircle, Eye, Clock, Zap, ArrowRight, Sparkles } from "lucide-react";

// Enhanced components for viral engagement
const BackToTop = dynamic(
  () => import("@/components/enhanced/BackToTop"),
  { ssr: false }
);

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
  readTime: string | null;
  theme: string | null;
  views: number | null;
  likes: number | null;
}

interface Props {
  short: Short;
  source: MDXRemoteSerializeResult;
}

const ShortPage: NextPage<Props> = ({ short, source }) => {
  const [likes, setLikes] = React.useState(short.likes || 0);
  const [isLiked, setIsLiked] = React.useState(false);
  const [isBookmarked, setIsBookmarked] = React.useState(false);
  const [showComments, setShowComments] = React.useState(false);
  const [readProgress, setReadProgress] = React.useState(0);
  const [showStreakPrompt, setShowStreakPrompt] = React.useState(false);
  const [streak, setStreak] = React.useState(0);
  const [hasFinishedReading, setHasFinishedReading] = React.useState(false);

  // Track reading streak for habit formation
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const today = new Date().toDateString();
      const lastRead = localStorage.getItem('lastShortRead');
      const currentStreak = parseInt(localStorage.getItem('shortStreak') || '0');
      
      if (lastRead !== today) {
        // Check if it's consecutive day
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        const newStreak = lastRead === yesterday ? currentStreak + 1 : 1;
        
        setStreak(newStreak);
        localStorage.setItem('shortStreak', newStreak.toString());
        localStorage.setItem('lastShortRead', today);
        
        // Show streak prompt after 3-day streak
        if (newStreak >= 3) {
          setTimeout(() => setShowStreakPrompt(true), 10000);
        }
      } else {
        setStreak(currentStreak);
      }

      // Track bookmarks
      const bookmarks = JSON.parse(localStorage.getItem('bookmarkedShorts') || '[]');
      setIsBookmarked(bookmarks.includes(short.slugPath));

      // Track reading completion
      const handleScroll = () => {
        const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
        setReadProgress(scrollPercent);
        
        if (scrollPercent > 80 && !hasFinishedReading) {
          setHasFinishedReading(true);
          // Track completion
          const completed = JSON.parse(localStorage.getItem('completedShorts') || '[]');
          if (!completed.includes(short.slugPath)) {
            completed.push(short.slugPath);
            localStorage.setItem('completedShorts', JSON.stringify(completed));
          }
        }
      };

      window.addEventListener('scroll', handleScroll, { passive: true });
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [short.slugPath, hasFinishedReading]);

  const handleLike = () => {
    if (!isLiked) {
      setLikes((v) => v + 1);
      setIsLiked(true);
      
      // Track interaction
      if (typeof window !== 'undefined') {
        const liked = JSON.parse(localStorage.getItem('likedShorts') || '[]');
        liked.push(short.slugPath);
        localStorage.setItem('likedShorts', JSON.stringify(liked));
      }
    }
  };

  const handleBookmark = () => {
    if (typeof window !== 'undefined') {
      const bookmarks = JSON.parse(localStorage.getItem('bookmarkedShorts') || '[]');
      
      if (isBookmarked) {
        const updated = bookmarks.filter((slug: string) => slug !== short.slugPath);
        localStorage.setItem('bookmarkedShorts', JSON.stringify(updated));
        setIsBookmarked(false);
      } else {
        bookmarks.push(short.slugPath);
        localStorage.setItem('bookmarkedShorts', JSON.stringify(bookmarks));
        setIsBookmarked(true);
      }
    }
  };

  const metaDescription =
    short.excerpt ||
    short.description ||
    "A short insight from Abraham of London";

  const formattedDate = short.date
    ? new Date(short.date).toLocaleDateString("en-GB", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  return (
    <Layout>
      <Head>
        <title>{short.title} | Abraham of London</title>
        <meta name="description" content={metaDescription} />
        <meta property="og:title" content={short.title} />
        <meta
          property="og:image"
          content={short.coverImage || "/assets/images/short-default.jpg"}
        />
      </Head>

      {/* Thin reading progress bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-white/5 z-50">
        <div
          className="h-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-300"
          style={{ width: `${readProgress}%` }}
        />
      </div>

      <div className="min-h-screen bg-[#050505] selection:bg-amber-500 selection:text-black">
        <ShortHero
          title={short.title}
          excerpt={short.excerpt}
          theme={short.theme}
          coverImage={short.coverImage}
          author={short.author}
          date={formattedDate}
          readTime={short.readTime}
        />

        {/* Streak celebration prompt */}
        {showStreakPrompt && streak >= 3 && (
          <div className="fixed top-20 right-4 z-50 max-w-sm animate-slide-in">
            <div className="bg-gradient-to-br from-amber-900/95 via-amber-800/95 to-amber-900/95 backdrop-blur-xl border-2 border-amber-500/50 rounded-2xl p-6 shadow-2xl">
              <button
                onClick={() => setShowStreakPrompt(false)}
                className="absolute top-2 right-2 text-amber-200 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 bg-amber-500/20 rounded-full flex items-center justify-center">
                    <Zap className="w-6 h-6 text-amber-300" />
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-white mb-1">🔥 {streak}-Day Streak!</h4>
                  <p className="text-sm text-amber-100 mb-3">
                    You're building a serious reading habit. Keep it going!
                  </p>
                  <button
                    onClick={() => window.location.href = '/shorts'}
                    className="text-sm font-semibold text-amber-300 hover:text-white transition-colors flex items-center gap-2"
                  >
                    Read another
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
          {/* Engagement bar */}
          <div className="mb-10 flex items-center justify-between text-xs font-bold uppercase tracking-widest text-zinc-500 border-b border-white/5 pb-8">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <Eye className="w-4 h-4 text-amber-500/50" />
                <span>{short.views || 0}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-amber-500/50" />
                <span>{short.readTime || "2 min"}</span>
              </div>
              {short.theme && (
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span className="text-amber-500">{short.theme}</span>
                </div>
              )}
              {streak > 0 && (
                <div className="flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-orange-500" />
                  <span className="text-orange-500">{streak} day streak</span>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-6">
              <button
                onClick={handleLike}
                className={`group flex items-center space-x-2 transition-all hover:scale-110 ${
                  isLiked ? "text-rose-500" : "hover:text-rose-400"
                }`}
                type="button"
              >
                <Heart className={`w-5 h-5 transition-all ${isLiked ? "fill-current animate-bounce-once" : ""}`} />
                <span>{likes}</span>
              </button>

              <button
                onClick={() => setShowComments((v) => !v)}
                className="flex items-center space-x-2 hover:text-amber-400 transition-all hover:scale-110"
                type="button"
              >
                <MessageCircle className="w-5 h-5" />
              </button>

              <button
                onClick={handleBookmark}
                className={`group flex items-center space-x-2 transition-all hover:scale-110 ${
                  isBookmarked ? "text-amber-500" : "hover:text-amber-400"
                }`}
                type="button"
              >
                <Bookmark
                  className={`w-5 h-5 transition-all ${isBookmarked ? "fill-current" : ""}`}
                />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <main className="lg:col-span-8">
              <div className="bg-zinc-900/30 border border-white/5 backdrop-blur-xl rounded-3xl p-8 lg:p-12 shadow-2xl">
                <div className="prose prose-invert prose-amber max-w-none prose-headings:font-serif prose-headings:text-amber-100 prose-p:text-gray-300 prose-p:leading-relaxed">
                  <ShortContent>
                    <MDXRemote {...source} components={mdxComponents} />
                  </ShortContent>
                </div>

                {short.tags.length > 0 && (
                  <div className="mt-12 pt-8 border-t border-white/10">
                    <div className="flex flex-wrap gap-2">
                      {short.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1 bg-white/5 text-zinc-400 rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/5 hover:border-amber-500/30 hover:bg-amber-500/5 transition-colors cursor-pointer"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-12 border-t border-white/10 pt-8">
                  <ShortActions
                    title={short.title}
                    url={`https://www.abrahamoflondon.org${short.url}`}
                    onLike={handleLike}
                    isLiked={isLiked}
                    onBookmark={handleBookmark}
                    isBookmarked={isBookmarked}
                    likes={likes}
                  />
                </div>

                {/* Next short teaser for binge reading */}
                {hasFinishedReading && (
                  <div className="mt-12 p-8 bg-gradient-to-br from-amber-900/20 to-amber-800/10 rounded-2xl border-2 border-amber-500/30">
                    <div className="text-center">
                      <Sparkles className="w-12 h-12 text-amber-400 mx-auto mb-4" />
                      <h3 className="text-xl font-serif font-bold text-white mb-2">
                        Enjoyed this insight?
                      </h3>
                      <p className="text-gray-300 mb-6">
                        Keep your momentum going with another 2-minute read.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                          onClick={() => window.location.href = '/shorts'}
                          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold rounded-xl hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg shadow-amber-900/50"
                        >
                          <Zap className="w-5 h-5" />
                          Read Another
                        </button>
                        <button
                          onClick={() => window.location.href = '/inner-circle'}
                          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 transition-colors"
                        >
                          Get Daily Shorts
                          <ArrowRight className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-12">
                <ShortComments
                  showComments={showComments}
                  shortId={short.slugPath}
                  onToggleComments={() => setShowComments((v) => !v)}
                />
              </div>
            </main>

            <aside className="lg:col-span-4 self-start sticky top-8">
              <div className="space-y-8">
                <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6">
                  <ShortMetadata
                    author={short.author}
                    date={formattedDate}
                    readTime={short.readTime}
                    theme={short.theme}
                    views={short.views}
                  />
                </div>

                {/* Reading stats widget */}
                {streak > 0 && (
                  <div className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-500/20 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-10 w-10 bg-orange-500/20 rounded-full flex items-center justify-center">
                        <Zap className="w-5 h-5 text-orange-400" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white uppercase tracking-wider">Your Streak</h4>
                        <p className="text-2xl font-bold text-orange-400">{streak} days</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400">
                      {streak < 7 
                        ? `${7 - streak} more days to unlock a special reward! 🎁`
                        : "You're on fire! Keep building your knowledge base 🔥"}
                    </p>
                  </div>
                )}

                <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6">
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4">
                    Continue Reading
                  </h3>
                  <ShortNavigation currentSlug={short.slugPath} />
                </div>

                <div className="bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20 rounded-2xl p-8">
                  <div className="text-center">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/20 mb-4">
                      <Sparkles className="w-6 h-6 text-amber-400" />
                    </div>
                    <h3 className="text-lg font-serif font-bold text-white mb-2">
                      Daily Field Notes
                    </h3>
                    <p className="text-sm text-zinc-400 mb-6">
                      2-minute insights delivered daily. Build your strategic thinking habit.
                    </p>
                    <button
                      onClick={() => window.location.href = '/inner-circle'}
                      className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-black py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg shadow-amber-900/30"
                      type="button"
                    >
                      Subscribe Now
                    </button>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>

      <BackToTop />

      <style jsx global>{`
        @keyframes bounce-once {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes slide-in {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-bounce-once {
          animation: bounce-once 0.6s ease-out;
        }
        .animate-slide-in {
          animation: slide-in 0.5s ease-out;
        }
      `}</style>
    </Layout>
  );
};

export default ShortPage;

export const getStaticPaths: GetStaticPaths = async () => {
  const shorts = await getServerAllShorts();

  const paths = (shorts || [])
    .filter((x: any) => x && !(x as any).draft)
    .map((s: any) => normalizeSlug(s?.slug ?? s?._raw?.flattenedPath ?? ""))
    .filter(Boolean)
    .filter((slug: string) => !slug.includes("replace"))
    .map((slug: string) => ({ params: { slug } }));

  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = String(params?.slug ?? "").trim();
  if (!slug) return { notFound: true };

  const data = await getServerShortBySlug(slug);
  if (!data) return { notFound: true };

  const rawMdx = (data as any)?.body?.raw ?? (data as any)?.body ?? "";
  const source = await prepareMDX(typeof rawMdx === "string" ? rawMdx : "");

  const short: Short = {
    title: data.title || "Field Note",
    excerpt: data.excerpt || null,
    description: data.description || null,
    date: data.date || null,
    coverImage: data.coverImage || null,
    tags: Array.isArray(data.tags) ? data.tags : [],
    author: data.author || "Abraham of London",
    url: `/shorts/${normalizeSlug(data.slug || slug)}`,
    slugPath: normalizeSlug(data.slug || slug),
    readTime: data.readTime || (data as any).readingTime || null,
    theme: (data as any).theme || null,
    views: (data as any).views || 0,
    likes: (data as any).likes || 0,
  };

  return {
    props: { short: sanitizeData(short), source },
    revalidate: 3600,
  };
};