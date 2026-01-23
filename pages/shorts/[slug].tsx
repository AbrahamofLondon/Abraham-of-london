/* pages/shorts/[slug].tsx — MICRO-INSIGHT ENGINE (INTEGRITY MODE) */
import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import Layout from "@/components/Layout";
import {
  getServerAllShorts,
  getServerShortBySlug,
  normalizeSlug,
} from "@/lib/contentlayer-compat";
import { prepareMDX, mdxComponents, sanitizeData } from "@/lib/server/md-utils";
import {
  Bookmark,
  Heart,
  MessageCircle,
  Eye,
  Clock,
  Zap,
  ArrowRight,
  Sparkles,
  X,
  Share2
} from "lucide-react";

// Client-only engagement components
const BackToTop = dynamic(() => import("@/components/enhanced/BackToTop"), { ssr: false });
const ShortHero = dynamic(() => import("@/components/shorts/ShortHero"), { ssr: false });
const ShortComments = dynamic(() => import("@/components/shorts/ShortComments"), { ssr: false });
const ShortNavigation = dynamic(() => import("@/components/shorts/ShortNavigation"), { ssr: false });

interface Short {
  title: string;
  excerpt: string | null;
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
  const router = useRouter();
  const [likes, setLikes] = React.useState(short.likes || 0);
  const [isLiked, setIsLiked] = React.useState(false);
  const [isBookmarked, setIsBookmarked] = React.useState(false);
  const [streak, setStreak] = React.useState(0);
  const [readProgress, setReadProgress] = React.useState(0);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      // Habit Formation: Streak Logic
      const today = new Date().toDateString();
      const lastRead = localStorage.getItem('aol_last_short');
      const currentStreak = parseInt(localStorage.getItem('aol_streak') || '0', 10);
      
      if (lastRead !== today) {
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        const newStreak = lastRead === yesterday ? currentStreak + 1 : 1;
        setStreak(newStreak);
        localStorage.setItem('aol_streak', newStreak.toString());
        localStorage.setItem('aol_last_short', today);
      } else {
        setStreak(currentStreak);
      }

      // Interaction State: Bookmarks & Likes
      const bookmarks = JSON.parse(localStorage.getItem('aol_bookmarks_shorts') || '[]');
      setIsBookmarked(bookmarks.includes(short.slugPath));
      
      const liked = JSON.parse(localStorage.getItem('aol_liked_shorts') || '[]');
      setIsLiked(liked.includes(short.slugPath));

      const handleScroll = () => {
        const progress = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
        setReadProgress(progress);
      };

      window.addEventListener('scroll', handleScroll, { passive: true });
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [short.slugPath]);

  const toggleLike = () => {
    if (!isLiked) {
      setLikes(v => v + 1);
      setIsLiked(true);
      const liked = JSON.parse(localStorage.getItem('aol_liked_shorts') || '[]');
      localStorage.setItem('aol_liked_shorts', JSON.stringify([...liked, short.slugPath]));
    }
  };

  return (
    <Layout title={`${short.title} | Field Note`}>
      <Head>
        <title>{short.title} | Abraham of London</title>
        <meta name="description" content={short.excerpt || ""} />
        <link rel="canonical" href={`https://abrahamoflondon.com${short.url}`} />
      </Head>

      {/* PROGRESS ENGINE */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-white/5 z-50">
        <div className="h-full bg-gold transition-all duration-300" style={{ width: `${readProgress}%` }} />
      </div>

      <main className="min-h-screen bg-black text-gray-300 selection:bg-gold selection:text-black pt-20 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* INTERACTION BAR */}
          <div className="mb-10 flex items-center justify-between border-b border-white/5 pb-8">
            <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest text-gray-500">
              <span className="flex items-center gap-2"><Eye size={14} className="text-gold/50" /> {short.views?.toLocaleString()}</span>
              <span className="flex items-center gap-2"><Clock size={14} className="text-gold/50" /> {short.readTime}</span>
              {streak > 1 && <span className="flex items-center gap-2 text-gold"><Zap size={14} /> {streak} Day Streak</span>}
            </div>
            
            <div className="flex items-center gap-4">
              <button onClick={toggleLike} className={`p-2 rounded-lg border transition-all ${isLiked ? 'bg-rose-500/10 border-rose-500/30 text-rose-500' : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'}`}>
                <Heart size={18} className={isLiked ? 'fill-current' : ''} />
              </button>
              <button onClick={() => {}} className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-500 hover:text-white transition-all">
                <Share2 size={18} />
              </button>
            </div>
          </div>

          <div className="grid lg:grid-cols-12 gap-12">
            <div className="lg:col-span-8">
              <div className="bg-zinc-900/40 border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl">
                <ShortHero title={short.title} theme={short.theme} author={short.author} coverImage={short.coverImage} />
                
                <article className="mt-8 prose prose-invert prose-gold max-w-none prose-p:leading-relaxed prose-p:text-gray-300">
                  <MDXRemote {...source} components={mdxComponents} />
                </article>

                <div className="mt-12 pt-8 border-t border-white/5 flex flex-wrap gap-2">
                  {short.tags.map(tag => (
                    <span key={tag} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-gray-500">#{tag}</span>
                  ))}
                </div>
              </div>

              <div className="mt-12">
                <ShortComments shortId={short.slugPath} />
              </div>
            </div>

            <aside className="lg:col-span-4 space-y-6">
              <div className="sticky top-24 space-y-6">
                <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/10">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-gold mb-6">Continue the Build</h3>
                  <ShortNavigation currentSlug={short.slugPath} />
                </div>
                
                <div className="p-8 rounded-3xl bg-gradient-to-br from-gold/10 to-transparent border border-gold/20 text-center">
                   <Sparkles className="mx-auto text-gold mb-4" />
                   <h3 className="font-serif text-xl font-bold text-white mb-2">Daily Field Notes</h3>
                   <p className="text-xs text-gray-500 mb-6">2-minute insights delivered to your dashboard daily.</p>
                   <button onClick={() => router.push('/inner-circle')} className="w-full py-3 rounded-xl bg-gold text-black text-xs font-black uppercase tracking-widest hover:bg-gold/80 transition-all">Subscribe</button>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
      <BackToTop />
    </Layout>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  const shorts = await getServerAllShorts();
  const paths = (shorts || [])
    .filter((s: any) => !s.draft)
    .map((s: any) => ({
      params: { slug: normalizeSlug(s.slug || s._raw?.flattenedPath).replace(/^shorts\//, '') }
    }))
    .filter((p: any) => p.params.slug);

  return { paths, fallback: 'blocking' };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = String(params?.slug || "");
  const data = await getServerShortBySlug(slug);

  if (!data || (data as any).draft) return { notFound: true };

  const source = await prepareMDX(data.body.raw);
  const short: Short = {
    title: data.title || "Field Note",
    excerpt: data.excerpt || null,
    date: data.date || null,
    coverImage: data.coverImage || null,
    tags: Array.isArray(data.tags) ? data.tags : [],
    author: data.author || "Abraham of London",
    url: `/shorts/${normalizeSlug(data.slug || slug)}`,
    slugPath: normalizeSlug(data.slug || slug),
    readTime: data.readTime || "2 min read",
    theme: (data as any).theme || null,
    views: (data as any).views || 0,
    likes: (data as any).likes || 0,
  };

  return { props: { short: sanitizeData(short), source }, revalidate: 3600 };
};

export default ShortPage;