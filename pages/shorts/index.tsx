import * as React from "react";
import type { NextPage, GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Clock, Zap, Heart, Bookmark,
  Search, Grid, List, ChevronRight
} from "lucide-react";

import Layout from "@/components/Layout";
import { getPublishedShorts, normalizeSlug } from "@/lib/contentlayer-helper";

// Define a strict, serializable interface for the frontend
interface SerializedShort {
  slug: string;
  title: string;
  excerpt: string;
  theme: string;
  readTime: string;
}

type ShortsIndexProps = {
  shorts: SerializedShort[];
};

const themeGradients = {
  faith: "from-blue-600/10 via-blue-500/5 border-blue-500/20",
  resilience: "from-amber-600/10 via-gold/5 border-gold/20",
  purpose: "from-emerald-600/10 via-emerald-500/5 border-emerald-500/20",
  leadership: "from-purple-600/10 via-purple-500/5 border-purple-500/20",
  fatherhood: "from-rose-600/10 via-rose-500/5 border-rose-500/20",
  strategy: "from-cyan-600/10 via-sky-500/5 border-cyan-500/20",
} as const;

const themeIcons = {
  faith: "🙏", resilience: "💪", purpose: "🎯", leadership: "👑", fatherhood: "👨‍👦", strategy: "♟️",
} as const;

const cardVariants = {
  hidden: { opacity: 0, y: 15, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 100, damping: 18 } },
  hover: { y: -8, transition: { type: "spring", stiffness: 400, damping: 25 } },
  tap: { scale: 0.97 },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const ShortsIndexPage: NextPage<ShortsIndexProps> = ({ shorts }) => {
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedTheme, setSelectedTheme] = React.useState<string>("all");
  const [interactions, setInteractions] = React.useState<Record<string, any>>({});
  const [bookmarks, setBookmarks] = React.useState<Set<string>>(new Set());

  // Initialize UI-only state after mount to avoid hydration mismatch
  React.useEffect(() => {
    const mockData: Record<string, any> = {};
    shorts.forEach((s, i) => {
      mockData[s.slug] = {
        likes: 12 + (i % 5), // Deterministic but feels varied
        saves: 5 + (i % 3)
      };
    });
    setInteractions(mockData);
  }, [shorts]);

  const themes = React.useMemo(() => 
    ["all", ...Array.from(new Set(shorts.map(s => s.theme.toLowerCase())))].sort()
  , [shorts]);

  const filteredShorts = React.useMemo(() => {
    return shorts.filter((s) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = searchQuery === "" || 
        s.title.toLowerCase().includes(q) || 
        s.excerpt.toLowerCase().includes(q);
      const matchesTheme = selectedTheme === "all" || s.theme.toLowerCase() === selectedTheme;
      return matchesSearch && matchesTheme;
    });
  }, [shorts, searchQuery, selectedTheme]);

  const handleInteraction = (slug: string, type: 'likes' | 'saves', e: React.MouseEvent) => {
    e.stopPropagation();
    if (type === 'saves') {
      setBookmarks(prev => {
        const next = new Set(prev);
        next.has(slug) ? next.delete(slug) : next.add(slug);
        return next;
      });
    }
    setInteractions(prev => ({
      ...prev,
      [slug]: { ...prev[slug], [type]: (prev[slug]?.[type] ?? 0) + 1 }
    }));
  };

  return (
    <Layout title="Shorts" description="Sharpening the mind in the gaps of the day.">
      <main className="min-h-screen bg-[#050505] text-cream">
        <section className="relative overflow-hidden border-b border-white/5 pb-24 pt-36">
          <div className="pointer-events-none absolute inset-0 z-0">
             <div className="absolute inset-0 opacity-[0.03] [background-image:linear-gradient(rgba(212,175,55,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(212,175,55,0.2)_1px,transparent_1px)] [background-size:100px_100px]" />
             <div className="absolute inset-0 bg-gradient-to-b from-gold/5 via-transparent to-transparent" />
          </div>

          <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-5 py-2 backdrop-blur-xl">
              <Sparkles className="h-3.5 w-3.5 text-gold animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gold">Scrollable Wisdom</span>
            </motion.div>
            <h1 className="font-serif text-5xl font-bold tracking-tight text-white sm:text-7xl">Shorts</h1>
            <p className="mt-6 text-xl font-light italic text-gray-400">Micro-strategy for high-capacity builders.</p>
          </div>
        </section>

        <section className="sticky top-0 z-40 border-b border-white/10 bg-black/80 backdrop-blur-2xl">
          <div className="mx-auto max-w-7xl px-6 py-4 flex flex-col md:flex-row gap-6 md:items-center md:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                type="text"
                placeholder="Filter conviction..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-12 pr-4 text-sm text-white placeholder-gray-600 outline-none transition-all focus:border-gold/50"
              />
            </div>
            <div className="flex items-center gap-6">
              <select 
                value={selectedTheme} 
                onChange={(e) => setSelectedTheme(e.target.value)}
                className="bg-transparent text-[10px] font-black uppercase tracking-widest text-gray-400 outline-none hover:text-gold transition-colors"
              >
                {themes.map(t => <option key={t} value={t} className="bg-zinc-900">{t}</option>)}
              </select>
              <div className="flex gap-2 border-l border-white/10 pl-6">
                <button onClick={() => setViewMode("grid")} className={`p-2 transition-colors ${viewMode === "grid" ? "text-gold" : "text-gray-600"}`}><Grid size={20} /></button>
                <button onClick={() => setViewMode("list")} className={`p-2 transition-colors ${viewMode === "list" ? "text-gold" : "text-gray-600"}`}><List size={20} /></button>
              </div>
            </div>
          </div>
        </section>

        <section id="shorts-grid" className="mx-auto max-w-7xl px-6 py-20 lg:py-32">
          <AnimatePresence mode="popLayout">
            <motion.div 
              variants={containerVariants} 
              initial="hidden" 
              animate="visible" 
              className={viewMode === "grid" ? "grid gap-10 md:grid-cols-2 lg:grid-cols-3" : "mx-auto max-w-3xl space-y-8"}
            >
              {filteredShorts.map((short) => {
                const themeKey = (short.theme.toLowerCase() as keyof typeof themeGradients) || "faith";
                const stats = interactions[short.slug] || { likes: 0, saves: 0 };
                
                return (
                  <motion.article
                    key={short.slug}
                    variants={cardVariants}
                    whileHover="hover"
                    className={`group relative flex flex-col overflow-hidden rounded-[2.5rem] border bg-gradient-to-br ${themeGradients[themeKey] || themeGradients.faith} p-8 backdrop-blur-md transition-all duration-500 hover:shadow-[0_20px_50px_-20px_rgba(212,175,55,0.15)]`}
                  >
                    <div className="mb-8 flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-300">{themeIcons[themeKey] || "💭"} {short.theme}</span>
                      <span className="font-mono text-[10px] font-bold text-gray-500">{short.readTime}</span>
                    </div>
                    <Link href={`/shorts/${short.slug}`}>
                      <h3 className="mb-4 font-serif text-2xl font-bold text-white group-hover:text-gold transition-colors">{short.title}</h3>
                    </Link>
                    <p className="mb-10 text-sm leading-[1.6] text-gray-400 line-clamp-3">{short.excerpt}</p>
                    <div className="mt-auto flex items-center justify-between border-t border-white/10 pt-8">
                      <div className="flex gap-6">
                        <button onClick={(e) => handleInteraction(short.slug, 'likes', e)} className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-rose-400 transition-colors">
                          <Heart size={16} className={stats.likes > 10 ? "fill-rose-500 text-rose-500" : ""} /> {stats.likes}
                        </button>
                        <button onClick={(e) => handleInteraction(short.slug, 'saves', e)} className={bookmarks.has(short.slug) ? "text-gold" : "text-gray-500"}><Bookmark size={16} className={bookmarks.has(short.slug) ? "fill-gold" : ""} /></button>
                      </div>
                      <Link href={`/shorts/${short.slug}`} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-gold">ENTRY <ChevronRight size={14} /></Link>
                    </div>
                  </motion.article>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </section>

        <section className="mx-auto max-w-5xl px-6 pb-40 pt-20">
           <motion.div whileHover={{ y: -5 }} className="relative overflow-hidden rounded-[3rem] border border-gold/20 bg-gradient-to-b from-zinc-900 to-black p-16 text-center shadow-2xl">
              <Zap className="mx-auto mb-8 text-gold" size={48} />
              <h2 className="font-serif text-4xl font-bold text-white sm:text-5xl">The Daily Discipline.</h2>
              <p className="mx-auto mt-6 max-w-lg text-lg text-gray-400">Do not outsource your mind. One short a day anchors your strategy against the noise of the age.</p>
              <div className="mt-12 flex justify-center gap-6">
                 <button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="rounded-2xl bg-gold px-10 py-4 text-xs font-black uppercase tracking-[0.2em] text-black hover:scale-105 transition-all">Start Daily Rhythm</button>
              </div>
           </motion.div>
        </section>
      </main>
    </Layout>
  );
};

export const getStaticProps: GetStaticProps<ShortsIndexProps> = async () => {
  const rawShorts = getPublishedShorts();
  
  // CRITICAL: Explicitly map only what is needed and ensure string types
  // This prevents non-serializable objects from crashing the Next.js export
  const shorts: SerializedShort[] = rawShorts.map(s => ({
    slug: normalizeSlug(s),
    title: String(s.title || ""),
    excerpt: String(s.excerpt || s.description || ""),
    theme: String(s.theme || "General"),
    readTime: String(s.readTime || "2m"),
  }));

  return {
    props: { shorts },
    revalidate: 1800,
  };
};

export default ShortsIndexPage;