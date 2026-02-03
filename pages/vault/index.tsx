/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/vault.tsx — UPDATED FOR 2026 DEPLOYMENT (V8.2+)
import * as React from "react";
import type { GetStaticProps, InferGetStaticPropsType, NextPage } from "next";
// ... (Your existing imports)

/* ----------------------- SERVER-SIDE DATA ------------------------ */

export const getStaticProps: GetStaticProps = async () => {
  try {
    const data = await getContentlayerData();
    assertContentlayerHasDocs(data);

    // Ensure we are grabbing all relevant content types
    const all = data.allDownloads ?? [];
    const registry = getPDFRegistry(); 

    const items: VaultItem[] = all
      .map((d: any) => {
        const slug = normalizeSlug(d.slug || d._raw?.flattenedPath || "");
        const regEntry = registry[slug];

        if (!regEntry) return null; // Tightening the requirement

        return {
          slug,
          title: d.title ?? regEntry.t ?? "Untitled Asset",
          excerpt: d.excerpt ?? d.description ?? "Access restricted to authorized personnel.",
          coverImage: d.coverImage ?? null,
          fileHref: d.fileUrl ?? regEntry.publicHref ?? null,
          accessLevel: getAccessLevel(d),
          category: (d.category ?? regEntry.category ?? "Formation") as string,
          size: regEntry.w ? `${regEntry.w} words` : "N/A", // Standardizing on word count
          tags: Array.isArray(d.tags) ? d.tags : [],
          date: d.date ? String(d.date) : null,
          format: regEntry.format ?? "PDF",
          isInteractive: Boolean(regEntry.isInteractive),
          tier: regEntry.tier ?? "public",
          requiresAuth: Boolean(regEntry.requiresAuth),
          downloadCount: regEntry.downloadCount ?? 0,
        };
      })
      .filter(Boolean) as VaultItem[];

    // ... (Your category definitions)

    return { 
      props: { 
        items, 
        categories: categories, // Computed based on items
        totalAssets: items.length 
      }, 
      revalidate: 60 // Lower revalidation for launch day monitoring
    };
  } catch (error) {
    console.error("Vault Build Error:", error);
    return { props: { items: [], categories: [], totalAssets: 0 }, revalidate: 3600 };
  }
};

/* ---------------------------- COMPONENT --------------------------- */

const VaultPage: NextPage<InferGetStaticPropsType<typeof getStaticProps>> = ({ items, categories, totalAssets }) => {
  const router = useRouter();
  const { hasClearance } = useRegistry();
  const [filters, setFilters] = React.useState<FilterState>({ search: "", category: null });

  // ... (Your Memoized Filter Logic)

  return (
    <Layout title="The Vault" description="Institutional Archive of Strategic Assets.">
      <main className="min-h-screen bg-[#050505] pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          
          {/* 1. VAULT HUD — Standardized to Emerald/Forest */}
          <header className="mb-20">
            <div className="flex items-center gap-4 mb-8">
              <span className="h-[1px] w-12 bg-emerald-800" />
              <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-emerald-600">
                Archive Command // {totalAssets} Assets Authenticated
              </span>
            </div>
            <h1 className="text-6xl md:text-8xl font-serif italic text-white mb-12 tracking-tighter">The Vault.</h1>
            
            {/* TACTICAL SEARCH */}
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
          </header>

          {/* ... (2. CATEGORY PIVOTS) ... */}

          {/* 3. ASSET GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/5 border border-white/5">
            {filteredItems.map((item) => {
              const isLocked = !hasClearance(item.accessLevel);
              return (
                <div key={item.slug} className="group bg-black p-10 flex flex-col justify-between min-h-[420px] hover:bg-[#080808] transition-all border-b border-white/5 md:border-b-0">
                  <div>
                    <div className="flex justify-between items-start mb-10">
                      <div className="p-3 border border-white/5 bg-white/[0.02]">
                        <FileText size={18} className="text-zinc-800 group-hover:text-emerald-600 transition-colors" />
                      </div>
                      {/* IMPROVED PREMIUM BADGE */}
                      <span className={`text-[9px] font-bold uppercase tracking-[0.2em] px-2 py-0.5 border ${
                        isLocked 
                          ? 'text-amber-600 border-amber-900/50 bg-amber-950/10' 
                          : 'text-emerald-600 border-emerald-900/50 bg-emerald-950/10'
                      }`}>
                        {isLocked ? 'Classified' : item.tier}
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
                      onClick={() => isLocked ? router.push("/inner-circle") : window.open(item.fileHref!, "_blank")}
                      className={`w-full py-4 bg-transparent border transition-all flex items-center justify-center gap-3 ${
                        isLocked 
                          ? 'border-amber-900/30 text-amber-600 hover:bg-amber-600 hover:text-black' 
                          : 'border-white/10 text-zinc-400 hover:border-emerald-600 hover:bg-emerald-600 hover:text-black'
                      }`}
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