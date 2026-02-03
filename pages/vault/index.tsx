/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/vault.tsx — HARDENED (V8.2 Scalable Registry Integration)
import * as React from "react";
import type { GetStaticProps, InferGetStaticPropsType, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";

import Layout from "@/components/Layout";
import {
  FileText,
  Download,
  Lock,
  BookOpen,
  Building2,
  Home,
  Target,
  GraduationCap,
  ShieldAlert,
  Search,
  ChevronRight
} from "lucide-react";

import {
  assertContentlayerHasDocs,
  getContentlayerData,
  normalizeSlug,
  getAccessLevel,
} from "@/lib/content/server";
import { getPDFRegistry, type PDFTier } from "@/lib/pdf/registry";
import { useRegistry } from "@/contexts/RegistryProvider";

/* ----------------------------- TYPES ----------------------------- */

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
  format: "PDF" | "EXCEL" | "POWERPOINT" | "ZIP" | "BINARY";
  isInteractive: boolean;
  tier: PDFTier;
  requiresAuth: boolean;
  downloadCount?: number;
};

type FilterState = {
  search: string;
  category: string | null;
};

type CategoryStats = {
  key: string;
  title: string;
  count: number;
  icon: React.ComponentType<any>;
  description: string;
};

/* ----------------------- SERVER-SIDE DATA ------------------------ */

export const getStaticProps: GetStaticProps = async () => {
  try {
    const data = await getContentlayerData();
    assertContentlayerHasDocs(data);

    const all = data.allDownloads ?? [];
    const registry = getPDFRegistry();

    const items: VaultItem[] = all
      .map((d: any) => {
        const slug = normalizeSlug(d.slug || d._raw?.flattenedPath || "");
        const regEntry = (registry as any)[slug];

        if (!regEntry || !regEntry.exists) return null;

        return {
          slug,
          title: d.title ?? regEntry.title ?? "Untitled Asset",
          excerpt: d.excerpt ?? d.description ?? regEntry.description ?? null,
          coverImage: d.coverImage || regEntry.coverImage || null,
          fileHref: d.fileUrl || regEntry.publicHref || null,
          accessLevel: getAccessLevel(d),
          category: (d.category ?? regEntry.category ?? null) as string | null,
          size: regEntry.fileSize ? String(regEntry.fileSize) : "N/A",
          tags: Array.isArray(d.tags) ? d.tags : [],
          date: d.date ? String(d.date) : null,
          format: regEntry.format,
          isInteractive: Boolean(regEntry.isInteractive),
          tier: regEntry.tier,
          requiresAuth: Boolean(regEntry.requiresAuth),
          downloadCount: regEntry.downloadCount,
        };
      })
      .filter(Boolean) as VaultItem[];

    const categoryDefinitions: Record<string, any> = {
      canon: { title: "Canon Doctrine", icon: BookOpen, description: "Core canonical volumes and teaching editions" },
      governance: { title: "Governance", icon: Building2, description: "Board-level decision frameworks" },
      family: { title: "Family & Household", icon: Home, description: "Household governance and legacy planning" },
      strategy: { title: "Strategic Frameworks", icon: Target, description: "Board-ready strategic tools" },
      formation: { title: "Formation", icon: GraduationCap, description: "Personal leadership development" },
    };

    const categories: CategoryStats[] = Object.entries(categoryDefinitions).map(([key, def]) => ({
      key,
      ...def,
      count: items.filter(i => i.category === key).length,
    })).filter(c => c.count > 0);

    return { 
      props: { 
        items, 
        categories,
        totalAssets: items.length 
      }, 
      revalidate: 3600 
    };
  } catch (error) {
    return { props: { items: [], categories: [], totalAssets: 0 }, revalidate: 3600 };
  }
};

/* ---------------------------- COMPONENT --------------------------- */

const VaultPage: NextPage<InferGetStaticPropsType<typeof getStaticProps>> = ({ items, categories, totalAssets }) => {
  const router = useRouter();
  const { hasClearance } = useRegistry();
  const [filters, setFilters] = React.useState<FilterState>({ search: "", category: null });

  const filteredItems = React.useMemo(() => {
    const q = filters.search.toLowerCase();
    return items.filter(item => {
      const matchesSearch = !q || item.title.toLowerCase().includes(q) || item.excerpt?.toLowerCase().includes(q);
      const matchesCat = !filters.category || item.category === filters.category;
      return matchesSearch && matchesCat;
    });
  }, [items, filters]);

  return (
    <Layout title="The Vault" description="Institutional Archive of Strategic Assets.">
      <main className="min-h-screen bg-black pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          
          {/* 1. VAULT HUD */}
          <header className="mb-20">
            <div className="flex items-center gap-4 mb-8">
              <span className="h-[1px] w-12 bg-amber-500/50" />
              <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-amber-500">
                Institutional Archive // {totalAssets} Assets
              </span>
            </div>
            <h1 className="text-6xl md:text-8xl font-serif italic text-white mb-12">The Vault.</h1>
            
            {/* TACTICAL SEARCH */}
            <div className="relative group max-w-2xl">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-amber-500 transition-colors" size={18} />
              <input 
                type="text"
                placeholder="QUERY_ASSET_REGISTRY..."
                className="w-full bg-zinc-950 border border-white/5 py-6 pl-16 pr-6 font-mono text-xs uppercase tracking-widest text-zinc-300 focus:border-amber-500/50 outline-none transition-all"
                value={filters.search}
                onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
              />
            </div>
          </header>

          {/* 2. CATEGORY PIVOTS */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-px bg-white/5 border border-white/5 mb-20">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = filters.category === cat.key;
              return (
                <button
                  key={cat.key}
                  onClick={() => setFilters(f => ({ ...f, category: isActive ? null : cat.key }))}
                  className={`p-8 text-left transition-all relative overflow-hidden ${
                    isActive ? 'bg-zinc-900' : 'bg-black hover:bg-zinc-950'
                  }`}
                >
                  <div className="flex justify-between items-start mb-6">
                    <Icon className={`h-5 w-5 ${isActive ? 'text-amber-500' : 'text-zinc-700'}`} />
                    <span className="font-mono text-[9px] text-zinc-600">{cat.count.toString().padStart(2, '0')}</span>
                  </div>
                  <h3 className="font-serif italic text-lg text-zinc-200 mb-2">{cat.title}</h3>
                  <p className="text-[10px] font-mono uppercase tracking-tighter text-zinc-600 leading-relaxed">
                    {cat.description}
                  </p>
                  {isActive && <div className="absolute bottom-0 left-0 h-1 w-full bg-amber-500" />}
                </button>
              );
            })}
          </div>

          {/* 3. ASSET GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/5 border border-white/5">
            {filteredItems.map((item) => {
              const isLocked = !hasClearance(item.accessLevel);
              return (
                <div key={item.slug} className="group bg-black p-10 flex flex-col justify-between min-h-[380px] hover:bg-zinc-950 transition-all border-b border-white/5 md:border-b-0">
                  <div>
                    <div className="flex justify-between items-start mb-10">
                      <div className="p-3 border border-white/5 bg-white/[0.02]">
                        <FileText size={18} className="text-zinc-700 group-hover:text-amber-500 transition-colors" />
                      </div>
                      <span className={`font-mono text-[9px] px-3 py-1 border border-white/10 uppercase tracking-widest ${
                        isLocked ? 'text-amber-500' : 'text-zinc-500'
                      }`}>
                        {isLocked ? 'Classified' : item.tier}
                      </span>
                    </div>

                    <h3 className="text-2xl font-serif italic text-zinc-200 group-hover:text-white transition-colors mb-4">{item.title}</h3>
                    <p className="text-zinc-500 text-sm font-light leading-relaxed line-clamp-3 mb-8">{item.excerpt}</p>
                  </div>

                  <div className="space-y-6">
                    <div className="flex justify-between font-mono text-[9px] uppercase tracking-widest text-zinc-700 pb-6 border-b border-white/5">
                      <span>{item.format} // {item.size}</span>
                      <span className="text-zinc-500">{item.category}</span>
                    </div>

                    <button
                      onClick={() => isLocked ? router.push("/inner-circle") : window.open(item.fileHref!, "_blank")}
                      className="w-full py-4 bg-transparent border border-white/10 group-hover:border-amber-500/50 group-hover:bg-amber-500 group-hover:text-black transition-all flex items-center justify-center gap-3"
                    >
                      {isLocked ? <Lock size={14} /> : <Download size={14} />}
                      <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em]">
                        {isLocked ? 'Elevate Clearance' : 'Download Asset'}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </main>
    </Layout>
  );
};

export default VaultPage;