/* Abraham of London - Strategic Frameworks Library V8.0
 * Reconciled for Database-Backed Retrieval and Dynamic Filtering
 */
import * as React from "react";
import type { NextPage, GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { 
  ArrowRight, 
  ChevronRight, 
  ScrollText, 
  Briefcase, 
  Search,
  Filter,
  Target,
  BookOpen,
  Users,
  Award,
  Zap,
  Clock,
  Download,
  Sparkles
} from "lucide-react";

import Layout from "@/components/Layout";

// STRATEGIC FIX: Import the database-backed server getters
import { 
  getServerAllFrameworks, 
  type Framework 
} from "@/lib/resources/strategic-frameworks";

import { sanitizeData } from "@/lib/server/md-utils";

interface PageProps {
  frameworks: Framework[];
  categories: string[];
  tags: string[];
}

const LIBRARY_HREF = "/frameworks";

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
    bg: "bg-amber-500/10"
  },
  emerald: {
    border: "border-emerald-400/20 hover:border-emerald-400/35",
    chip: "border-emerald-400/25 bg-emerald-400/10 text-emerald-200",
    link: "text-emerald-200 hover:text-emerald-100",
    bg: "bg-emerald-500/10"
  },
  blue: {
    border: "border-sky-400/20 hover:border-sky-400/35",
    chip: "border-sky-400/25 bg-sky-400/10 text-sky-200",
    link: "text-sky-200 hover:text-sky-100",
    bg: "bg-sky-500/10"
  },
  rose: {
    border: "border-rose-400/20 hover:border-rose-400/35",
    chip: "border-rose-400/25 bg-rose-400/10 text-rose-200",
    link: "text-rose-200 hover:text-rose-100",
    bg: "bg-rose-500/10"
  },
  indigo: {
    border: "border-indigo-400/20 hover:border-indigo-400/35",
    chip: "border-indigo-400/25 bg-indigo-400/10 text-indigo-200",
    link: "text-indigo-200 hover:text-indigo-100",
    bg: "bg-indigo-500/10"
  },
  purple: {
    border: "border-purple-400/20 hover:border-purple-400/35",
    chip: "border-purple-400/25 bg-purple-400/10 text-purple-200",
    link: "text-purple-200 hover:text-purple-100",
    bg: "bg-purple-500/10"
  }
} as const;

function TierBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/12 bg-white/7 px-2.5 py-1 text-[11px] font-semibold text-white/80">
      {label}
    </span>
  );
}

const StrategicFrameworksLibraryPage: NextPage<PageProps> = ({ frameworks, categories, tags }) => {
  const reduceMotion = useReducedMotion();
  const motionProps = reduceMotion ? ({ initial: false } as const) : ({ initial: "hidden" as const } as const);

  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<string>("all");
  const [selectedTier, setSelectedTier] = React.useState<string>("all");

  const filteredFrameworks = React.useMemo(() => {
    const q = searchQuery.toLowerCase();
    return frameworks.filter((f) => {
      const matchesSearch = !searchQuery || 
        f.title.toLowerCase().includes(q) || 
        f.oneLiner.toLowerCase().includes(q) || 
        f.tags?.some(t => t.toLowerCase().includes(q));
      const matchesCategory = selectedCategory === "all" || f.category === selectedCategory;
      const matchesTier = selectedTier === "all" || f.tier.includes(selectedTier);
      return matchesSearch && matchesCategory && matchesTier;
    });
  }, [frameworks, searchQuery, selectedCategory, selectedTier]);

  const featuredFrameworks = frameworks.filter(f => f.featured).slice(0, 2);

  return (
    <Layout title="Strategic Frameworks" className="bg-black min-h-screen">
      <section className="relative isolate overflow-hidden border-b border-white/8">
        <div className="absolute inset-0 bg-[#06060b]" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <motion.div variants={stagger} {...motionProps} animate="visible">
            <motion.div variants={fadeUp} className="flex flex-wrap items-center justify-between gap-3 mb-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-400/10 px-4 py-2">
                <ScrollText className="h-4 w-4 text-amber-200" />
                <span className="text-xs font-black uppercase tracking-[0.22em] text-amber-200">Canon-derived dossiers</span>
              </div>
            </motion.div>

            <motion.h1 variants={fadeUp} className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              Strategic Frameworks
            </motion.h1>

            <motion.p variants={fadeUp} className="text-lg text-white/80 mb-10 max-w-3xl">
              Operational tools for Boards, Founders, and Households. Transform principles into executable systems with clear ownership and accountability.
            </motion.p>
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
                placeholder="Search dossiers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div className="flex gap-4">
              <select 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-sm"
              >
                <option value="all">All Categories</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredFrameworks.map((framework) => {
              const A = ACCENTS[framework.accent || 'gold'];
              return (
                <Link key={framework.key} href={`${LIBRARY_HREF}/${framework.slug}`} className="group block">
                  <div className={`rounded-2xl border ${A.border} bg-gradient-to-br from-white/5 to-white/0 p-6 transition-all hover:bg-white/10`}>
                    <div className="flex items-start justify-between mb-4">
                      <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.22em] ${A.chip}`}>
                        {framework.tag}
                      </span>
                    </div>
                    <h3 className="font-serif text-xl font-semibold text-white mb-2">{framework.title}</h3>
                    <p className="text-sm leading-relaxed text-white/70 mb-4">{framework.oneLiner}</p>
                    <div className={`flex items-center gap-2 text-sm font-semibold ${A.link}`}>
                      Open framework <ChevronRight className="h-4 w-4" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export const getStaticProps: GetStaticProps<PageProps> = async () => {
  try {
    const frameworks = await getServerAllFrameworks();
    const categories = [...new Set(frameworks.map(f => f.category).filter(Boolean))] as string[];
    const allTags = frameworks.flatMap(f => f.tags || []);
    const tags = [...new Set(allTags)].slice(0, 20);

    return {
      props: { 
        frameworks: sanitizeData(frameworks), 
        categories, 
        tags 
      },
      revalidate: 3600,
    };
  } catch (error) {
    console.error("Database connection failed for frameworks index:", error);
    return { props: { frameworks: [], categories: [], tags: [] }, revalidate: 300 };
  }
};

export default StrategicFrameworksLibraryPage;