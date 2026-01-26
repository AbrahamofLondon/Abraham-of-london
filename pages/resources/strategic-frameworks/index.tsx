/* Abraham of London - Strategic Frameworks Library V8.2
 * FIXED: Build-Safe with Static Data Fallback
 */
import * as React from "react";
import type { NextPage, GetStaticProps } from "next";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { 
  ArrowRight, 
  ChevronRight, 
  ScrollText, 
  Search
} from "lucide-react";

import Layout from "@/components/Layout";

// FIXED: Import static functions for build time
import { 
  getAllFrameworks,           // STATIC - always works
  getServerAllFrameworks,     // SERVER - with fallback
  type Framework 
} from "@/lib/resources/strategic-frameworks";

interface PageProps {
  frameworks: Framework[];
  categories: string[];
  isFallbackData: boolean;
}

const LIBRARY_HREF = "/resources/strategic-frameworks";

const easeSettle: [number, number, number, number] = [0.16, 1, 0.3, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: easeSettle } },
};

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.06 } },
};

const ACCENTS = {
  gold: {
    border: "border-amber-400/20 hover:border-amber-400/35",
    chip: "border-amber-400/25 bg-amber-400/10 text-amber-200",
    link: "text-amber-200 hover:text-amber-100",
  },
  emerald: {
    border: "border-emerald-400/20 hover:border-emerald-400/35",
    chip: "border-emerald-400/25 bg-emerald-400/10 text-emerald-200",
    link: "text-emerald-200 hover:text-emerald-100",
  },
  blue: {
    border: "border-sky-400/20 hover:border-sky-400/35",
    chip: "border-sky-400/25 bg-sky-400/10 text-sky-200",
    link: "text-sky-200 hover:text-sky-100",
  },
  rose: {
    border: "border-rose-400/20 hover:border-rose-400/35",
    chip: "border-rose-400/25 bg-rose-400/10 text-rose-200",
    link: "text-rose-200 hover:text-rose-100",
  },
  indigo: {
    border: "border-indigo-400/20 hover:border-indigo-400/35",
    chip: "border-indigo-400/25 bg-indigo-400/10 text-indigo-200",
    link: "text-indigo-200 hover:text-indigo-100",
  },
};

const StrategicFrameworksLibraryPage: NextPage<PageProps> = ({ 
  frameworks, 
  categories,
  isFallbackData 
}) => {
  const reduceMotion = useReducedMotion();
  const motionProps = reduceMotion ? { initial: false } : { initial: "hidden" };

  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<string>("all");

  const filteredFrameworks = React.useMemo(() => {
    const q = searchQuery.toLowerCase();
    return frameworks.filter((f) => {
      const matchesSearch = !searchQuery || 
        f.title.toLowerCase().includes(q) || 
        f.oneLiner.toLowerCase().includes(q);
      const matchesCategory = selectedCategory === "all" || 
        (f.tier && f.tier.includes(selectedCategory as any));
      return matchesSearch && matchesCategory;
    });
  }, [frameworks, searchQuery, selectedCategory]);

  return (
    <Layout 
      title="Strategic Frameworks" 
      className="bg-black min-h-screen"
    >
      {isFallbackData && (
        <div className="fixed top-4 right-4 z-50 bg-amber-500/20 border border-amber-500/30 rounded-lg px-4 py-2 text-amber-200 text-sm backdrop-blur-sm">
          ⚠️ Using static data (Database unavailable during build)
        </div>
      )}

      {/* Hero Section */}
      <section className="relative isolate overflow-hidden border-b border-white/8">
        <div className="absolute inset-0 bg-[#06060b]" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <motion.div variants={stagger} animate="visible">
            <motion.div variants={fadeUp} className="mb-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-400/10 px-4 py-2">
                <ScrollText className="h-4 w-4 text-amber-200" />
                <span className="text-xs font-black uppercase tracking-[0.22em] text-amber-200">
                  Canon-derived dossiers
                </span>
              </div>
            </motion.div>

            <motion.h1 variants={fadeUp} className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              Strategic Frameworks
            </motion.h1>

            <motion.p variants={fadeUp} className="text-lg text-white/80 mb-10 max-w-3xl">
              Operational tools for Boards, Founders, and Households. 
              Transform principles into executable systems.
            </motion.p>

            <motion.div variants={fadeUp} className="flex items-center gap-4 text-sm text-white/60">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                <span>{frameworks.length} operational frameworks</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Filters */}
      <section className="sticky top-0 z-40 border-b border-white/10 bg-black/80 backdrop-blur-xl py-4">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search frameworks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
            
            <select 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
            >
              <option value="all">All Categories</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Framework Grid */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {filteredFrameworks.length === 0 ? (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 mb-6">
                <Search className="h-8 w-8 text-white/40" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No frameworks found</h3>
              <p className="text-white/60 max-w-md mx-auto">
                Try adjusting your search or filters.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredFrameworks.map((framework) => {
                const A = ACCENTS[framework.accent || 'gold'];
                return (
                  <Link 
                    key={framework.key} 
                    href={`${LIBRARY_HREF}/${framework.slug}`} 
                    className="group block"
                  >
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                      className={`rounded-2xl border ${A.border} bg-gradient-to-br from-white/5 to-white/0 p-6 transition-all hover:bg-white/10 hover:scale-[1.02]`}
                    >
                      <div className="mb-4">
                        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.22em] ${A.chip}`}>
                          {framework.tag || "Framework"}
                        </span>
                      </div>
                      
                      <h3 className="font-serif text-xl font-semibold text-white mb-2">
                        {framework.title}
                      </h3>
                      
                      <p className="text-sm leading-relaxed text-white/70 mb-4">
                        {framework.oneLiner}
                      </p>
                      
                      <div className="flex items-center justify-between mt-6">
                        <div className={`inline-flex items-center gap-2 text-sm font-semibold ${A.link}`}>
                          Explore <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

// FIXED: Simple, reliable getStaticProps
export const getStaticProps: GetStaticProps<PageProps> = async () => {
  console.log('[Framework Index] Building static page...');
  
  let frameworks: Framework[] = [];
  let isFallbackData = false;
  
  // ALWAYS use static data during build
  if (typeof window === 'undefined') {
    // Server-side: try database, but fallback to static
    try {
      frameworks = await getServerAllFrameworks();
      // Check if we got the static fallback
      const staticFrameworks = getAllFrameworks();
      isFallbackData = frameworks.length === staticFrameworks.length;
    } catch (error) {
      console.log('[Framework Index] Database failed, using static data:', error);
      frameworks = getAllFrameworks();
      isFallbackData = true;
    }
  } else {
    // Client-side (shouldn't happen in getStaticProps)
    frameworks = getAllFrameworks();
    isFallbackData = true;
  }
  
  // Extract categories from tiers
  const categories = [...new Set(frameworks.flatMap(f => f.tier || []))] as string[];
  
  return {
    props: { 
      frameworks: JSON.parse(JSON.stringify(frameworks)), // Safe serialization
      categories, 
      isFallbackData
    },
    revalidate: 3600, // Revalidate every hour
  };
};

export default StrategicFrameworksLibraryPage;