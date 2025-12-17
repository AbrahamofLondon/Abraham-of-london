import * as React from "react";
import type { NextPage, GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Clock,
  Zap,
  Heart,
  Share2,
  Bookmark,
  Eye,
  RefreshCw,
  TrendingUp,
  Filter,
  Search,
  Grid,
  List,
  MessageCircle,
  ChevronRight,
} from "lucide-react";

import Layout from "@/components/Layout";
// Optimized Imports
import { 
  getPublicShorts, 
  type ShortIndexItem 
} from "@/lib/shorts";
import { normalizeSlug, getDocHref } from "@/lib/contentlayer-helper";

type ShortsIndexProps = {
  shorts: ShortIndexItem[];
};

// Elevated Color Palette - Synchronized with Kingdom Vault
const themeGradients = {
  faith: "from-blue-500/10 via-transparent to-indigo-500/5 border-blue-500/20",
  resilience: "from-gold/10 via-transparent to-orange-500/5 border-gold/20",
  purpose: "from-emerald-500/10 via-transparent to-teal-500/5 border-emerald-500/20",
  leadership: "from-purple-500/10 via-transparent to-pink-500/5 border-purple-500/20",
  fatherhood: "from-rose-500/10 via-transparent to-red-500/5 border-rose-500/20",
  strategy: "from-cyan-500/10 via-transparent to-sky-500/5 border-cyan-500/20",
} as const;

const themeIcons = {
  faith: "🙏",
  resilience: "💪",
  purpose: "🎯",
  leadership: "👑",
  fatherhood: "👨‍👦",
  strategy: "♟️",
} as const;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { type: "spring", stiffness: 100, damping: 18 },
  },
  hover: {
    y: -6,
    transition: { type: "spring", stiffness: 400, damping: 25 },
  },
  tap: { scale: 0.98 },
};

const ShortsIndexPage: NextPage<ShortsIndexProps> = ({ shorts }) => {
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedTheme, setSelectedTheme] = React.useState<string>("all");
  const [interactions, setInteractions] = React.useState<Record<string, any>>({});
  const [bookmarks, setBookmarks] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    const mockInteractions: Record<string, any> = {};
    shorts.forEach((short, index) => {
      mockInteractions[short.slug] = {
        reads: 120 + index * 42,
        likes: 12 + Math.floor(Math.random() * 20),
        shares: 4 + Math.floor(Math.random() * 10),
        saves: 6 + Math.floor(Math.random() * 12),
      };
    });
    setInteractions(mockInteractions);
  }, [shorts]);

  const themes = React.useMemo(() => {
    const allThemes = new Set<string>();
    shorts.forEach((short) => { if (short.theme) allThemes.add(short.theme.toLowerCase()); });
    return ["all", ...Array.from(allThemes)].sort();
  }, [shorts]);

  const filteredShorts = React.useMemo(() => {
    return shorts.filter((short) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = searchQuery === "" || 
        short.title.toLowerCase().includes(q) || 
        short.excerpt?.toLowerCase().includes(q);
      const matchesTheme = selectedTheme === "all" || short.theme?.toLowerCase() === selectedTheme;
      return matchesSearch && matchesTheme;
    });
  }, [shorts, searchQuery, selectedTheme]);

  const handleLike = (slug: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setInteractions(prev => ({
      ...prev,
      [slug]: { ...prev[slug], likes: (prev[slug]?.likes ?? 0) + 1 }
    }));
  };

  const handleBookmark = (slug: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBookmarks(prev => {
      const next = new Set(prev);
      next.has(slug) ? next.delete(slug) : next.add(slug);
      return next;
    });
  };

  const sharePage = async (platform?: string) => {
    const url = window.location.href;
    const text = "Strategic shorts for focused minds — Abraham of London";
    if (platform === "twitter") {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, "_blank");
    } else if (navigator.share) {
      try { await navigator.share({ title: "Shorts", text, url }); } catch (e) {}
    } else {
      navigator.clipboard.writeText(url);
      alert("Link copied.");
    }
  };

  return (
    <Layout title="Shorts" description="Bite-sized wisdom for high-capacity builders.">
      <Head>
        <title>Shorts | Bite-Sized Wisdom</title>
      </Head>

      <main className="min-h-screen bg-black">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-white/5 pb-20 pt-32">
          {/* Subliminal Backdrop */}
          <div className="pointer-events-none absolute inset-0">
             <div className="absolute inset-0 bg-gradient-to-b from-gold/5 via-transparent to-transparent" />
             <div className="absolute inset-0 opacity-[0.03] [background-image:radial-gradient(circle_at_center,_var(--tw-gradient-from)_1px,_transparent_1px)] [background-size:40px_40px] from-gold" />
          </div>

          <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-8 inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/5 px-4 py-1.5 backdrop-blur-md"
            >
              <Sparkles className="h-3.5 w-3.5 text-gold" />
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold">Scrollable Wisdom</span>
            </motion.div>

            <h1 className="font-serif text-5xl font-semibold text-white sm:text-6xl">
              Shorts
              <span className="mt-4 block text-lg font-light tracking-wide text-gray-400">
                Bite-sized fuel for high-stakes building.
              </span>
            </h1>

            <div className="mt-12 flex justify-center gap-8">
               {[
                 { label: "Reads", icon: Eye, val: "12.4k+" },
                 { label: "Likes", icon: Heart, val: "1.2k+" },
                 { label: "Saved", icon: Bookmark, val: "840+" }
               ].map((stat) => (
                 <div key={stat.label} className="text-center">
                   <div className="flex items-center justify-center gap-2 text-gold">
                      <stat.icon size={14} />
                      <span className="font-mono text-sm font-bold">{stat.val}</span>
                   </div>
                   <p className="text-[10px] uppercase tracking-widest text-gray-600 mt-1">{stat.label}</p>
                 </div>
               ))}
            </div>
          </div>
        </section>

        {/* Controls Section */}
        <section className="sticky top-0 z-40 border-b border-white/5 bg-black/80 backdrop-blur-xl">
          <div className="mx-auto max-w-7xl px-6 py-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <input
                  type="text"
                  placeholder="Filter by keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-sm text-white placeholder-gray-600 outline-none focus:border-gold/40 transition-all"
                />
              </div>

              <div className="flex items-center gap-4">
                <select
                  value={selectedTheme}
                  onChange={(e) => setSelectedTheme(e.target.value)}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-widest text-gray-400 outline-none focus:border-gold/40"
                >
                  {themes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <div className="flex rounded-xl border border-white/10 p-1">
                  <button onClick={() => setViewMode("grid")} className={`p-2 rounded-lg ${viewMode === "grid" ? "bg-gold text-black" : "text-gray-500"}`}><Grid size={16} /></button>
                  <button onClick={() => setViewMode("list")} className={`p-2 rounded-lg ${viewMode === "list" ? "bg-gold text-black" : "text-gray-500"}`}><List size={16} /></button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Grid Content */}
        <section id="shorts-grid" className="mx-auto max-w-7xl px-6 py-20">
          <AnimatePresence mode="popLayout">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className={viewMode === "grid" ? "grid gap-8 md:grid-cols-2 lg:grid-cols-3" : "space-y-6 max-w-3xl mx-auto"}
            >
              {filteredShorts.map((short) => {
                const themeKey = (short.theme?.toLowerCase() as keyof typeof themeGradients) || "faith";
                const gradient = themeGradients[themeKey] || themeGradients.faith;
                const icon = themeIcons[themeKey as keyof typeof themeIcons] || "💭";
                const stats = interactions[short.slug] || { likes: 0, reads: 0, shares: 0, saves: 0 };

                return (
                  <motion.article
                    key={short.slug}
                    variants={cardVariants}
                    whileHover="hover"
                    className={`group relative flex flex-col overflow-hidden rounded-3xl border bg-gradient-to-br ${gradient} p-6 backdrop-blur-sm transition-shadow hover:shadow-[0_0_30px_-10px_rgba(212,175,55,0.2)]`}
                  >
                    <div className="mb-6 flex items-center justify-between">
                      <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1">
                        <span className="text-xs">{icon}</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-300">{short.theme}</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-mono text-[10px] text-gray-500">
                        <Clock size={12} /> {short.readTime || "2m"}
                      </div>
                    </div>

                    <Link href={`/shorts/${short.slug}`}>
                      <h3 className="mb-4 font-serif text-2xl font-semibold leading-tight text-white group-hover:text-gold transition-colors">
                        {short.title}
                      </h3>
                    </Link>

                    <p className="mb-8 text-sm leading-relaxed text-gray-400 line-clamp-3">
                      {short.excerpt}
                    </p>

                    <div className="mt-auto flex items-center justify-between border-t border-white/5 pt-6">
                      <div className="flex items-center gap-5">
                        <button onClick={(e) => handleLike(short.slug, e)} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-400 transition-colors">
                          <Heart size={14} className={stats.likes > 20 ? "fill-red-400 text-red-400" : ""} />
                          <span className="font-mono">{stats.likes}</span>
                        </button>
                        <button onClick={(e) => handleBookmark(short.slug, e)} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gold transition-colors">
                          <Bookmark size={14} className={bookmarks.has(short.slug) ? "fill-gold text-gold" : ""} />
                        </button>
                        <button onClick={(e) => sharePage()} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-400 transition-colors">
                          <Share2 size={14} />
                        </button>
                      </div>

                      <Link href={`/shorts/${short.slug}`} className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold hover:opacity-70 transition-opacity flex items-center gap-1">
                        Open <ChevronRight size={12} />
                      </Link>
                    </div>
                  </motion.article>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </section>

        {/* Footer CTA */}
        <section className="mx-auto max-w-4xl px-6 pb-32 pt-20 text-center">
           <div className="rounded-3xl border border-white/5 bg-gradient-to-br from-zinc-900 to-black p-12">
              <Zap className="mx-auto mb-6 text-gold" size={32} />
              <h2 className="font-serif text-3xl font-semibold text-white">Make it a daily discipline.</h2>
              <p className="mx-auto mt-4 max-w-md text-gray-400">
                One short a day. Five minutes of clarity to cut through twenty-four hours of noise.
              </p>
              <div className="mt-10 flex flex-wrap justify-center gap-4">
                 <button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="rounded-xl bg-gold px-8 py-3 text-sm font-bold text-black hover:bg-white transition-colors">
                    Start Daily Reading
                 </button>
                 <button onClick={() => sharePage()} className="rounded-xl border border-white/10 px-8 py-3 text-sm font-bold text-white hover:bg-white/5 transition-colors">
                    Share Library
                 </button>
              </div>
           </div>
        </section>
      </main>
    </Layout>
  );
};

export const getStaticProps: GetStaticProps<ShortsIndexProps> = async () => {
  // Using the helper we verified
  const shorts = getPublicShorts();
  return {
    props: { shorts },
    revalidate: 1800,
  };
};

export default ShortsIndexPage;