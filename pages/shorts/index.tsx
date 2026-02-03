import * as React from "react";
import type { NextPage, GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Zap, ArrowUpRight, Clock, Search, Grid, List, 
  Target, Command, ShieldCheck, Fingerprint 
} from "lucide-react";
import Layout from "@/components/Layout";
import { getAllCombinedDocs, normalizeSlug, sanitizeData } from "@/lib/content/server";

const GridBackground = () => (
  <div className="absolute inset-0 z-0 pointer-events-none">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(212,175,55,0.08)_0%,transparent_70%)]" />
    <div 
      className="absolute inset-0 opacity-[0.03]" 
      style={{ 
        backgroundImage: `radial-gradient(circle, #ffffff 1px, transparent 1px)`, 
        backgroundSize: '40px 40px' 
      }} 
    />
  </div>
);

const ShortsIndexPage: NextPage<any> = ({ shorts, totalCount }) => {
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [streak, setStreak] = React.useState(0);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const STREAK_KEY = "aol_shorts_streak";
    const LAST_VISIT_KEY = "aol_shorts_last_timestamp";
    const now = Date.now();
    const lastVisit = parseInt(localStorage.getItem(LAST_VISIT_KEY) || "0");
    const currentStreak = parseInt(localStorage.getItem(STREAK_KEY) || "1");
    const msInDay = 86400000;

    if (lastVisit && now - lastVisit < msInDay && new Date(lastVisit).getDate() === new Date(now).getDate()) {
      setStreak(currentStreak);
    } else if (lastVisit && now - lastVisit < msInDay * 2) {
      const next = currentStreak + 1;
      localStorage.setItem(STREAK_KEY, next.toString());
      localStorage.setItem(LAST_VISIT_KEY, now.toString());
      setStreak(next);
    } else {
      localStorage.setItem(STREAK_KEY, "1");
      localStorage.setItem(LAST_VISIT_KEY, now.toString());
      setStreak(1);
    }
  }, []);

  const filtered = shorts.filter((s: any) => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.excerpt?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout title="Shorts // Abraham of London" className="bg-black min-h-screen text-white/90 selection:bg-gold/30">
      <Head>
        <title>Shorts // Abraham of London</title>
      </Head>

      <section className="relative pt-48 pb-32 overflow-hidden border-b border-white/[0.03]">
        <GridBackground />
        
        <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center items-center gap-4 mb-12"
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.6em] text-gold/60 flex items-center gap-2">
              <Fingerprint className="h-3 w-3" /> Secure Archives
            </span>
          </motion.div>

          <h1 className="font-serif text-8xl md:text-[10rem] tracking-tighter mb-10 text-white italic leading-none">
            Shorts<span className="text-gold/40">.</span>
          </h1>

          <p className="font-sans font-light text-xl text-white/40 max-w-2xl mx-auto mb-16 leading-relaxed">
            High-density reflections curated for the <span className="text-white/80 italic font-medium">disciplined mind.</span>
          </p>

          <div className="inline-flex items-center gap-8 px-10 py-5 rounded-full border border-white/5 bg-white/[0.02] backdrop-blur-3xl shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center">
                <Zap className="h-4 w-4 text-gold fill-gold/20" />
                <motion.div 
                  animate={{ scale: [1, 2.2, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                  className="absolute h-4 w-4 bg-gold rounded-full blur-md" 
                />
              </div>
              <span className="font-mono text-xs tracking-[0.3em] text-white/80 uppercase">{streak} Day Pulse</span>
            </div>
            <div className="w-[1px] h-4 bg-white/10" />
            <div className="flex items-center gap-2 font-mono text-[10px] text-white/30 uppercase tracking-widest">
              <Target className="h-3.5 w-3.5 text-gold/40" /> {totalCount} Signals Encoded
            </div>
          </div>
        </div>
      </section>

      <nav className="sticky top-0 z-50 bg-black/80 backdrop-blur-2xl border-b border-white/[0.05]">
        <div className="mx-auto max-w-7xl px-6 py-6 flex items-center justify-between">
          <div className="relative w-full max-w-sm group">
            <Search className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-gold transition-colors" />
            <input 
              type="text"
              placeholder="Filter by keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-none py-2 pl-8 pr-4 text-sm font-light focus:ring-0 placeholder:text-white/10 text-white"
            />
          </div>
          <div className="flex items-center gap-2 bg-white/[0.03] p-1.5 rounded-xl border border-white/5">
            <button onClick={() => setViewMode('grid')} className={`p-2.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-gold/10 text-gold' : 'text-white/20 hover:text-white/40'}`}><Grid className="h-4 w-4" /></button>
            <button onClick={() => setViewMode('list')} className={`p-2.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-gold/10 text-gold' : 'text-white/20 hover:text-white/40'}`}><List className="h-4 w-4" /></button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-6 py-32">
        <AnimatePresence mode="popLayout">
          <motion.div 
            layout
            className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16" : "max-w-3xl mx-auto space-y-12"}
          >
            {filtered.map((short: any) => (
              <Link key={short._id} href={`/shorts/${short.slug}`} className="group block">
                <article className="h-full flex flex-col p-12 rounded-[2.5rem] border border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.03] hover:border-gold/20 transition-all duration-1000">
                  <div className="flex justify-between items-center mb-20">
                    <span className="font-mono text-[9px] uppercase tracking-[0.5em] text-white/20 group-hover:text-gold/50 transition-colors">
                      Entry_{short.category || "Insight"}
                    </span>
                    <ArrowUpRight className="h-4 w-4 text-white/5 group-hover:text-gold group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-500" />
                  </div>
                  <h2 className="font-serif text-4xl text-white/80 mb-8 leading-[1.1] transition-colors group-hover:text-white italic">
                    {short.title}
                  </h2>
                  <p className="font-sans font-light text-white/40 text-lg leading-relaxed line-clamp-3 mb-12">
                    {short.excerpt}
                  </p>
                  <div className="mt-auto pt-8 flex items-center justify-between border-t border-white/[0.03]">
                    <div className="flex items-center gap-3 font-mono text-[9px] text-white/20 uppercase tracking-[0.3em]">
                      <Clock className="h-3.5 w-3.5" /> {short.readTime}
                    </div>
                    <div className="h-1.5 w-1.5 rounded-full bg-gold/20 group-hover:bg-gold/60 transition-colors" />
                  </div>
                </article>
              </Link>
            ))}
          </motion.div>
        </AnimatePresence>
      </main>
    </Layout>
  );
};

export default ShortsIndexPage;

export const getStaticProps: GetStaticProps = async () => {
  const allDocuments = getAllCombinedDocs();
  const shorts = allDocuments
    .filter((d) => d.slug.startsWith("shorts/"))
    .sort((a, b) => new Date(b.date || "").getTime() - new Date(a.date || "").getTime())
    .map((s) => ({
      _id: s._id,
      slug: normalizeSlug(s.slug).replace(/^shorts\//, ""),
      title: s.title,
      excerpt: s.excerpt || s.description || "",
      category: s.category || "Intel",
      readTime: s.readTime || "2 min",
    }));

  return { props: { shorts: sanitizeData(shorts), totalCount: shorts.length }, revalidate: 3600 };
};