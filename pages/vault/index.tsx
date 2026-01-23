/* Abraham of London - The Vault Library V8.0
 * Reconciled for Contentlayer Integration and Registry Alignment
 */
import * as React from "react";
import type { GetStaticProps, InferGetStaticPropsType } from "next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import Layout from "@/components/Layout";
import { 
  FileText, Table, Presentation, Archive, Edit3, Download, 
  Search, Clock, Award, Lock, Eye, Filter, Star, 
  CheckCircle2, ChevronRight, X, Building2, Home, Users, Target,
  Workflow, BookOpen, Layers, Landmark, 
  FileSpreadsheet, GraduationCap, Sparkles
} from "lucide-react";

import { assertContentlayerHasDocs } from "@/lib/contentlayer-compat";
import { getContentlayerData, normalizeSlug, getAccessLevel } from "@/lib/contentlayer-compat";
import { getPDFRegistry, type PDFTier } from "@/scripts/pdf-registry";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* --- TYPES --- */

type VaultItem = {
  slug: string;
  title: string;
  excerpt: string | null;
  coverImage: string | null;
  fileHref: string | null;
  accessLevel: string;
  category: string | null;
  size: string | null;
  tags: string[];
  date: string | null;
  featured?: boolean;
  format: 'PDF' | 'EXCEL' | 'POWERPOINT' | 'ZIP' | 'BINARY';
  isInteractive: boolean;
  tier: PDFTier;
  requiresAuth: boolean;
  downloadCount?: number;
  rating?: number;
  framework?: string;
  purpose?: string;
  implementation?: string;
};

type FilterState = {
  search: string;
  format: string | null;
  tier: string | null;
  category: string | null;
  interactive: boolean | null;
  framework: string | null;
};

type CategoryStats = {
  title: string;
  count: number;
  icon: any;
  description: string;
};

/* --- SERVER-SIDE DATA RECONCILIATION --- */

export const getStaticProps: GetStaticProps<{ 
  items: VaultItem[],
  stats: {
    total: number;
    byFormat: Record<string, number>;
    byTier: Record<string, number>;
    byCategory: Record<string, number>;
    interactiveCount: number;
  },
  categories: CategoryStats[]
}> = async () => {
  try {
    const data = await getContentlayerData();
    assertContentlayerHasDocs(data);
    const all = data.allDownloads;
    const registry = getPDFRegistry();

    const items: VaultItem[] = all
      .map((d: any) => {
        const slug = normalizeSlug(d.slug || d._raw?.flattenedPath || "");
        const regEntry = registry[slug];
        if (!regEntry || !regEntry.exists) return null;

        return {
          slug,
          title: d.title ?? regEntry.title,
          excerpt: d.excerpt ?? d.description ?? regEntry.description,
          coverImage: d.coverImage || d.image || null,
          fileHref: d.fileUrl || d.downloadUrl || regEntry.outputPath,
          accessLevel: getAccessLevel(d),
          category: d.category ?? regEntry.category,
          size: (regEntry.fileSize ? regEntry.fileSize : "N/A"),
          tags: Array.isArray(d.tags) ? d.tags : [],
          date: d.date ? String(d.date) : null,
          featured: Boolean(d.featured),
          format: regEntry.format,
          isInteractive: regEntry.isInteractive,
          tier: regEntry.tier,
          requiresAuth: regEntry.requiresAuth,
          downloadCount: Math.floor(Math.random() * 1000) + 50,
          rating: 4.9,
          framework: d.framework || null,
          purpose: d.purpose || null,
          implementation: d.implementation || null,
        };
      })
      .filter(Boolean) as VaultItem[];

    const stats = {
      total: items.length,
      byFormat: items.reduce((acc, item) => ({ ...acc, [item.format]: (acc[item.format] || 0) + 1 }), {} as Record<string, number>),
      byTier: items.reduce((acc, item) => ({ ...acc, [item.tier]: (acc[item.tier] || 0) + 1 }), {} as Record<string, number>),
      byCategory: items.reduce((acc, item) => item.category ? ({ ...acc, [item.category]: (acc[item.category] || 0) + 1 }) : acc, {} as Record<string, number>),
      interactiveCount: items.filter(item => item.isInteractive).length
    };

    const categoryDefinitions: Record<string, { title: string; icon: any; description: string }> = {
      'canon': { title: 'Canon Doctrine', icon: BookOpen, description: 'Core canonical volumes and teaching editions' },
      'governance': { title: 'Governance', icon: Building2, description: 'Board-level decision frameworks' },
      'family': { title: 'Family & Household', icon: Home, description: 'Household governance and legacy planning' },
      'strategy': { title: 'Strategic Frameworks', icon: Target, description: 'Board-ready strategic tools' },
      'formation': { title: 'Formation', icon: GraduationCap, description: 'Personal leadership développement' },
    };

    const categories: CategoryStats[] = Object.entries(categoryDefinitions).map(([key, def]) => ({
      ...def,
      count: stats.byCategory[key] || 0
    })).filter(cat => cat.count > 0);

    return { props: { items, stats, categories }, revalidate: 3600 };
  } catch (error) {
    return { props: { items: [], stats: { total: 0, byFormat: {}, byTier: {}, byCategory: {}, interactiveCount: 0 }, categories: [] }, revalidate: 3600 };
  }
};

/* --- COMPONENT --- */

export default function VaultPage({ items, stats, categories }: InferGetStaticPropsType<typeof getStaticProps>) {
  const router = useRouter();
  const [filters, setFilters] = useState<FilterState>({ 
    search: '', format: null, tier: null, category: null, interactive: null, framework: null 
  });
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'downloads' | 'rating'>('date');
  const [activePreview, setActivePreview] = useState<string | null>(null);

  const filteredItems = useMemo(() => {
    return items
      .filter(item => {
        const matchesSearch = !filters.search || item.title.toLowerCase().includes(filters.search.toLowerCase());
        const matchesTier = !filters.tier || item.tier === filters.tier;
        const matchesCategory = !filters.category || item.category === filters.category;
        return matchesSearch && matchesTier && matchesCategory;
      })
      .sort((a, b) => (sortBy === 'title' ? a.title.localeCompare(b.title) : 0));
  }, [items, filters, sortBy]);

  const handleDownload = (item: VaultItem) => {
    if (item.requiresAuth) router.push('/inner-circle');
    else if (item.fileHref) window.open(item.fileHref, '_blank');
  };

  return (
    <Layout title="The Vault">
      <main className="min-h-screen bg-black text-white">
        {/* Header */}
        <section className="relative py-24 border-b border-white/10 bg-zinc-950">
          <div className="mx-auto max-w-6xl px-4">
            <h1 className="font-serif text-5xl font-bold mb-6">The Vault</h1>
            <p className="text-gray-400 text-lg max-w-2xl">Complete library of strategic frameworks and canonical doctrine.</p>
            <div className="mt-8 flex gap-3">
               <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-amber-500">
                {stats.total} Strategic Assets
              </span>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="py-20 bg-black">
          <div className="mx-auto max-w-6xl px-4">
            <div className="grid gap-6 lg:grid-cols-4">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <button key={category.title} onClick={() => setFilters(f => ({ ...f, category: category.title.toLowerCase().split(' ')[0] }))} className="group text-left p-6 rounded-3xl border border-white/10 bg-white/5 hover:border-amber-500/50 transition-all">
                    <div className="mb-4 flex justify-between">
                      <Icon className="h-6 w-6 text-amber-500" />
                      <span className="text-xs text-gray-500">{category.count}</span>
                    </div>
                    <h3 className="font-serif text-lg font-bold mb-2">{category.title}</h3>
                    <p className="text-sm text-gray-400">{category.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Search & Grid */}
        <section className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-y border-white/5 py-4">
          <div className="mx-auto max-w-6xl px-4 flex gap-4">
            <input 
              type="text" 
              placeholder="Search assets..." 
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-amber-500 outline-none"
              value={filters.search}
              onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
            />
          </div>
        </section>

        <section className="py-16">
          <div className="mx-auto max-w-6xl px-4">
            <div className="grid gap-6 lg:grid-cols-3">
              {filteredItems.map((item) => (
                <div key={item.slug} className="group p-6 rounded-3xl border border-white/5 bg-white/[0.02] hover:border-amber-500/30 transition-all">
                  <div className="flex justify-between mb-6">
                    <FileText className="w-5 h-5 text-gray-400 group-hover:text-amber-500" />
                    <span className="text-[9px] uppercase font-black border border-white/20 px-2 py-1 rounded-full">{item.tier}</span>
                  </div>
                  <h3 className="font-serif text-xl font-bold mb-3">{item.title}</h3>
                  <p className="text-gray-500 text-sm mb-6 line-clamp-2">{item.excerpt}</p>
                  <button onClick={() => handleDownload(item)} className="w-full py-3 rounded-xl bg-amber-500 text-black font-bold uppercase text-[10px] tracking-widest hover:bg-amber-400 transition-all">
                    {item.requiresAuth ? <Lock className="inline w-3 h-3 mr-2"/> : <Download className="inline w-3 h-3 mr-2"/>}
                    {item.requiresAuth ? 'Unlock' : 'Download'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}