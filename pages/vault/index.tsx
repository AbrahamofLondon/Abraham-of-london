/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * pages/vault/index.tsx — THE VAULT (2026)
 * PRODUCTION-SAFE, REGISTRY-FIRST, INTELLIGENCE-ROUTING
 */

import * as React from "react";
import type { GetStaticProps, InferGetStaticPropsType, NextPage } from "next";
import { 
  Search, 
  FileText, 
  Download, 
  Lock, 
  ArrowRight,
  Database,
  ShieldCheck
} from "lucide-react";

import Layout from "@/components/Layout";
import { useClientRouter, useClientQuery, useClientIsReady } from "@/lib/router/useClientRouter";
import { getAllPDFItems, type PDFItem } from "@/lib/pdf-registry";

/* ---------------------------- TYPES & UTILS --------------------------- */

type DownloadDoc = {
  slug?: string;
  title?: string;
  excerpt?: string;
  description?: string;
  category?: string;
  tier?: string;
  requiresAuth?: boolean;
  format?: string;
  _raw?: { flattenedPath?: string };
};

type VaultItem = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  tags: string[];
  format: string;
  size: string;
  fileHref: string | null;
  tier: string;
  requiresAuth: boolean;
  isIntelligenceBrief: boolean; // Flag for routing to /vault/[slug]
};

type FilterState = {
  search: string;
  category: string | null;
};

function normalizeSlug(input: string): string {
  return String(input || "").trim().replace(/^\/+/, "").replace(/\/+$/, "").replace(/\.mdx?$/i, "");
}

function hasAccessCookieClient(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.split(";").map(c => c.trim()).some(c => c.startsWith("aol_access="));
}

/* ---------------------------- DATA FETCHING --------------------------- */

export const getStaticProps: GetStaticProps<{
  items: VaultItem[];
  categories: string[];
  totalAssets: number;
}> = async () => {
  try {
    const pdfItems: PDFItem[] = getAllPDFItems({ includeMissing: false });
    
    // Attempt to load MDX descriptors for enrichment
    let downloads: DownloadDoc[] = [];
    try {
      const mod: any = await import("@/lib/contentlayer-compat");
      downloads = Array.isArray(mod.allDownloads) ? mod.allDownloads : [];
    } catch {
      downloads = [];
    }

    const bySlug = new Map<string, DownloadDoc>();
    for (const d of downloads) {
      const slug = normalizeSlug(d.slug || d._raw?.flattenedPath || "");
      if (slug) bySlug.set(slug, d);
    }

    const items: VaultItem[] = pdfItems.map((p) => {
      const slug = normalizeSlug(p.id);
      const d = bySlug.get(slug);

      const category = (d?.category || p.category || "Vault").trim();
      
      return {
        id: p.id,
        slug,
        title: (d?.title || p.title || "Untitled Asset").trim(),
        excerpt: (d?.excerpt || d?.description || p.description || "Access restricted to authorized personnel.").trim(),
        category,
        tags: Array.isArray(d?.tags) ? d!.tags! : (Array.isArray(p.tags) ? p.tags : []),
        format: (d?.format || p.format || "PDF").toUpperCase(),
        size: p.fileSize || "N/A",
        fileHref: p.fileUrl || null,
        tier: d?.tier || p.tier || "member",
        requiresAuth: typeof d?.requiresAuth === "boolean" ? d.requiresAuth : !!p.requiresAuth,
        isIntelligenceBrief: category === "Briefing" || category === "Dossier" || p.format === "MDX"
      };
    });

    const categories = Array.from(new Set(items.map(i => i.category))).sort();

    return {
      props: { items, categories, totalAssets: items.length },
      revalidate: 60,
    };
  } catch (error) {
    console.error("Vault Build Error:", error);
    return { props: { items: [], categories: [], totalAssets: 0 }, revalidate: 3600 };
  }
};

/* ---------------------------- COMPONENT --------------------------- */

const VaultPage: NextPage<InferGetStaticPropsType<typeof getStaticProps>> = ({
  items,
  categories,
  totalAssets,
}) => {
  const router = useClientRouter();
  const [filters, setFilters] = React.useState<FilterState>({ search: "", category: null });
  const [hasCookie, setHasCookie] = React.useState(false);

  React.useEffect(() => {
    setHasCookie(hasAccessCookieClient());
  }, []);

  const filteredItems = React.useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return items.filter(item => {
      const matchesCat = !filters.category || item.category === filters.category;
      if (!q) return matchesCat;
      const haystack = `${item.title} ${item.excerpt} ${item.category} ${item.tags.join(" ")}`.toLowerCase();
      return matchesCat && haystack.includes(q);
    });
  }, [items, filters]);

  const handlePrimaryAction = (item: VaultItem) => {
    if (item.requiresAuth && !hasCookie) {
      router?.push(`/inner-circle?returnTo=${encodeURIComponent("/vault")}`);
      return;
    }

    // STRATEGIC ROUTING: If it's a briefing, enter the Intelligence View
    if (item.isIntelligenceBrief) {
      router?.push(`/vault/${item.slug}`);
    } else if (item.fileHref) {
      window.open(item.fileHref, "_blank", "noopener,noreferrer");
    }
  };

  if (!router) return <div className="min-h-screen bg-[#050505]" />;

  return (
    <Layout title="The Vault" description="Institutional Archive of Strategic Assets.">
      <main className="min-h-screen bg-gradient-to-b from-[#050505] to-black pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          
          {/* HEADER HUD */}
          <header className="mb-20">
            <div className="flex items-center gap-4 mb-8">
              <span className="h-[1px] w-12 bg-emerald-800" />
              <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-emerald-600 flex items-center gap-2">
                <Database size={10} />
                Archive Command // {totalAssets} Assets Authenticated
              </span>
            </div>

            <h1 className="text-6xl md:text-8xl font-serif italic text-white mb-12 tracking-tighter">
              The Vault.
            </h1>

            {/* SEARCH ENGINE */}
            <div className="relative group max-w-2xl">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-800 group-focus-within:text-emerald-500 transition-colors" size={18} />
              <input
                type="text"
                placeholder="QUERY_ASSET_REGISTRY..."
                className="w-full bg-[#0a0a0a] border border-white/5 py-6 pl-16 pr-6 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-300 focus:border-emerald-800/50 focus:bg-black outline-none transition-all"
                value={filters.search}
                onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
              />
            </div>

            {/* FILTER PIVOTS */}
            <div className="mt-10 flex flex-wrap gap-2">
              {["All", ...categories].map((c) => (
                <button
                  key={c}
                  onClick={() => setFilters(f => ({ ...f, category: c === "All" ? null : c }))}
                  className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.2em] border transition-all ${
                    (c === "All" && !filters.category) || filters.category === c
                      ? "border-emerald-900/50 bg-emerald-950/10 text-emerald-500"
                      : "border-white/10 bg-white/[0.02] text-zinc-500 hover:text-white"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </header>

          {/* ASSET GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/5 border border-white/5">
            {filteredItems.map((item) => {
              const isLocked = item.requiresAuth && !hasCookie;
              
              return (
                <div key={item.id} className="group bg-black p-10 flex flex-col justify-between min-h-[420px] hover:bg-[#080808] transition-all relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight className="h-5 w-5 text-emerald-500/50" />
                  </div>

                  <div>
                    <div className="flex justify-between items-start mb-10">
                      <div className="p-3 border border-white/5 bg-white/[0.02] rounded-xl group-hover:border-emerald-500/20 transition-colors">
                        {item.isIntelligenceBrief ? <ShieldCheck size={18} className="text-emerald-500" /> : <FileText size={18} className="text-zinc-800 group-hover:text-emerald-500" />}
                      </div>
                      <span className={`text-[9px] font-bold uppercase tracking-[0.2em] px-2 py-0.5 border rounded-full ${isLocked ? "text-amber-600 border-amber-900/50 bg-amber-950/10" : "text-emerald-600 border-emerald-900/50 bg-emerald-950/10"}`}>
                        {isLocked ? "Classified" : item.tier}
                      </span>
                    </div>

                    <h3 className="text-2xl font-serif italic text-zinc-200 group-hover:text-white transition-colors mb-4">{item.title}</h3>
                    <p className="text-zinc-600 text-sm font-light leading-relaxed line-clamp-3 mb-8">{item.excerpt}</p>
                  </div>

                  <div className="space-y-6">
                    <div className="flex justify-between font-mono text-[9px] uppercase tracking-widest text-zinc-800 pb-6 border-b border-white/5">
                      <span>{item.format} // {item.size}</span>
                      <span className="text-zinc-600">{item.category}</span>
                    </div>

                    <button
                      onClick={() => handlePrimaryAction(item)}
                      className={`w-full py-4 bg-transparent border transition-all flex items-center justify-center gap-3 rounded-xl ${
                        isLocked 
                          ? "border-amber-900/30 text-amber-600 hover:bg-amber-600 hover:text-black" 
                          : "border-white/10 text-zinc-400 hover:border-emerald-600 hover:bg-emerald-600 hover:text-black"
                      }`}
                    >
                      {isLocked ? <Lock size={14} /> : item.isIntelligenceBrief ? <ArrowRight size={14} /> : <Download size={14} />}
                      <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em]">
                        {isLocked ? "Elevate Clearance" : item.isIntelligenceBrief ? "Enter Briefing" : "Download Asset"}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredItems.length === 0 && (
            <div className="mt-16 text-center text-zinc-600 font-mono text-[10px] uppercase tracking-[0.3em]">
              No assets match the current filter.
            </div>
          )}
        </div>
      </main>
    </Layout>
  );
};

export default VaultPage;