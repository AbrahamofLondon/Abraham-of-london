/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * pages/vault.tsx — VAULT (2026) — PRODUCTION-SAFE, REGISTRY-FIRST
 *
 * What this fixes (no drama, just results):
 * 1) Shows PDFs that exist on disk even if no matching MDX exists.
 * 2) Uses your PDF registry as the source of truth for file URLs + existence.
 * 3) Still enriches cards with MDX metadata when available (title/excerpt/tags/category/accessLevel).
 * 4) Prevents “empty vault” when Contentlayer is flaky.
 */

import * as React from "react";
import type { GetStaticProps, InferGetStaticPropsType, NextPage } from "next";
import { useRouter } from "next/router";
import {
  Search,
  FileText,
  Download,
  Lock,
} from "lucide-react";

import Layout from "@/components/Layout";

// If your pdf-registry currently lives under /scripts, MOVE IT to /lib (recommended for Next builds),
// or re-export it from /lib/pdf-registry.ts.
// This import assumes you have it in /lib.
import { getAllPDFItems, type PDFItem } from "@/lib/pdf-registry";

// Contentlayer is optional enrichment. If it fails, vault still works.
type DownloadDoc = {
  slug?: string;
  title?: string;
  excerpt?: string;
  description?: string;
  coverImage?: string | null;
  tags?: string[];
  category?: string;
  date?: string;
  accessLevel?: string;
  tier?: string;
  requiresAuth?: boolean;
  format?: string;
  _raw?: { flattenedPath?: string };
};

async function tryGetContentlayerDownloads(): Promise<DownloadDoc[]> {
  try {
    // Use whatever you already have in your codebase.
    // This is intentionally defensive to avoid build failures.
    const mod: any = await import("@/lib/contentlayer-compat");
    const allDownloads: any[] = Array.isArray(mod.allDownloads) ? mod.allDownloads : [];
    return allDownloads as DownloadDoc[];
  } catch {
    return [];
  }
}

function normalizeSlug(input: string): string {
  return String(input || "")
    .trim()
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/\.mdx?$/i, "");
}

function hasAccessCookieClient(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie
    .split(";")
    .map((c) => c.trim())
    .some((c) => c.startsWith("aol_access="));
}

type VaultItem = {
  id: string; // registry id (usually filename without extension)
  slug: string; // same as id for routing/search
  title: string;
  excerpt: string;
  category: string;
  tags: string[];
  date: string | null;

  format: string;
  size: string;
  fileHref: string | null;

  // gating
  tier: string; // free/member/architect/inner-circle (or your mapping)
  requiresAuth: boolean;

  // UI flags
  isInteractive: boolean;
  isFillable: boolean;
};

type FilterState = {
  search: string;
  category: string | null;
};

export const getStaticProps: GetStaticProps<{
  items: VaultItem[];
  categories: string[];
  totalAssets: number;
}> = async () => {
  try {
    // 1) Registry-first: only show what exists (by default your registry returns existing-only)
    const pdfItems: PDFItem[] = getAllPDFItems({ includeMissing: false });

    // 2) Optional enrichment from Contentlayer downloads
    const downloads = await tryGetContentlayerDownloads();

    // Build lookup by slug -> doc
    const bySlug = new Map<string, DownloadDoc>();
    for (const d of downloads) {
      const slug = normalizeSlug(d.slug || d._raw?.flattenedPath || "");
      if (slug) bySlug.set(slug, d);
    }

    // 3) Merge: registry is canonical; MDX enriches when present
    const items: VaultItem[] = pdfItems.map((p) => {
      const slug = normalizeSlug(p.id);
      const d = bySlug.get(slug);

      const title =
        (d?.title && String(d.title).trim()) ||
        (p.title && String(p.title).trim()) ||
        "Untitled Asset";

      const excerpt =
        (d?.excerpt && String(d.excerpt).trim()) ||
        (d?.description && String(d.description).trim()) ||
        (p.description && String(p.description).trim()) ||
        "Access restricted to authorized personnel.";

      const category =
        (d?.category && String(d.category).trim()) ||
        (p.category && String(p.category).trim()) ||
        "Vault";

      const tags = Array.isArray(d?.tags) ? d!.tags! : Array.isArray(p.tags) ? p.tags : [];

      const date = d?.date ? String(d.date) : null;

      // Gating: if MDX explicitly says requiresAuth, respect it; else respect registry.
      const requiresAuth =
        typeof d?.requiresAuth === "boolean" ? Boolean(d.requiresAuth) : Boolean(p.requiresAuth);

      const tier =
        (d?.tier && String(d.tier)) ||
        (p.tier && String(p.tier)) ||
        "member";

      const format =
        (d?.format && String(d.format)) ||
        (p.format && String(p.format)) ||
        "PDF";

      const size =
        (p.fileSize && String(p.fileSize)) ||
        "N/A";

      const fileHref =
        (p.fileUrl && String(p.fileUrl)) ||
        null;

      return {
        id: p.id,
        slug,
        title,
        excerpt,
        category,
        tags,
        date,
        format,
        size,
        fileHref,
        tier,
        requiresAuth,
        isInteractive: Boolean(p.isInteractive),
        isFillable: Boolean(p.isFillable),
      };
    });

    // 4) Categories from computed items
    const categories = Array.from(new Set(items.map((i) => i.category))).sort((a, b) =>
      a.localeCompare(b)
    );

    return {
      props: {
        items,
        categories,
        totalAssets: items.length,
      },
      // tighter during launch/debug; raise later if desired
      revalidate: 60,
    };
  } catch (error) {
    console.error("Vault Build Error:", error);
    return {
      props: { items: [], categories: [], totalAssets: 0 },
      revalidate: 3600,
    };
  }
};

/* ---------------------------- COMPONENT --------------------------- */

const VaultPage: NextPage<InferGetStaticPropsType<typeof getStaticProps>> = ({
  items,
  categories,
  totalAssets,
}) => {
  const router = useRouter();

  const [filters, setFilters] = React.useState<FilterState>({
    search: "",
    category: null,
  });

  const [hasCookie, setHasCookie] = React.useState(false);

  React.useEffect(() => {
    setHasCookie(hasAccessCookieClient());
  }, []);

  const filteredItems = React.useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    const cat = filters.category;

    return items.filter((item) => {
      const matchesCat = !cat || item.category === cat;

      if (!q) return matchesCat;

      const hay = [
        item.title,
        item.excerpt,
        item.category,
        item.format,
        item.tier,
        ...(item.tags || []),
      ]
        .join(" ")
        .toLowerCase();

      return matchesCat && hay.includes(q);
    });
  }, [items, filters.search, filters.category]);

  return (
    <Layout title="The Vault" description="Institutional Archive of Strategic Assets.">
      <main className="min-h-screen bg-[#050505] pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          {/* VAULT HUD */}
          <header className="mb-20">
            <div className="flex items-center gap-4 mb-8">
              <span className="h-[1px] w-12 bg-emerald-800" />
              <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-emerald-600">
                Archive Command // {totalAssets} Assets Authenticated
              </span>
            </div>

            <h1 className="text-6xl md:text-8xl font-serif italic text-white mb-12 tracking-tighter">
              The Vault.
            </h1>

            {/* SEARCH */}
            <div className="relative group max-w-2xl">
              <Search
                className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-800 group-focus-within:text-emerald-500 transition-colors"
                size={18}
              />
              <input
                type="text"
                placeholder="QUERY_ASSET_REGISTRY..."
                className="w-full bg-[#0a0a0a] border border-white/5 py-6 pl-16 pr-6 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-300 focus:border-emerald-800/50 focus:bg-black outline-none transition-all"
                value={filters.search}
                onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              />
            </div>

            {/* CATEGORY PIVOTS */}
            {categories.length > 0 && (
              <div className="mt-10 flex flex-wrap gap-2">
                <button
                  onClick={() => setFilters((f) => ({ ...f, category: null }))}
                  className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.2em] border transition-all ${
                    !filters.category
                      ? "border-emerald-900/50 bg-emerald-950/10 text-emerald-500"
                      : "border-white/10 bg-white/[0.02] text-zinc-500 hover:text-white"
                  }`}
                >
                  All
                </button>

                {categories.map((c) => (
                  <button
                    key={c}
                    onClick={() => setFilters((f) => ({ ...f, category: c }))}
                    className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.2em] border transition-all ${
                      filters.category === c
                        ? "border-emerald-900/50 bg-emerald-950/10 text-emerald-500"
                        : "border-white/10 bg-white/[0.02] text-zinc-500 hover:text-white"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </header>

          {/* GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/5 border border-white/5">
            {filteredItems.map((item) => {
              const isLocked = item.requiresAuth && !hasCookie;
              const badgeText = isLocked ? "Classified" : item.tier;

              const onPrimaryAction = () => {
                if (isLocked) {
                  router.push(`/inner-circle?returnTo=${encodeURIComponent("/vault")}`);
                  return;
                }
                if (item.fileHref) {
                  window.open(item.fileHref, "_blank", "noopener,noreferrer");
                }
              };

              return (
                <div
                  key={item.id}
                  className="group bg-black p-10 flex flex-col justify-between min-h-[420px] hover:bg-[#080808] transition-all border-b border-white/5 md:border-b-0"
                >
                  <div>
                    <div className="flex justify-between items-start mb-10">
                      <div className="p-3 border border-white/5 bg-white/[0.02]">
                        <FileText
                          size={18}
                          className="text-zinc-800 group-hover:text-emerald-600 transition-colors"
                        />
                      </div>

                      <span
                        className={`text-[9px] font-bold uppercase tracking-[0.2em] px-2 py-0.5 border ${
                          isLocked
                            ? "text-amber-600 border-amber-900/50 bg-amber-950/10"
                            : "text-emerald-600 border-emerald-900/50 bg-emerald-950/10"
                        }`}
                      >
                        {badgeText}
                      </span>
                    </div>

                    <h3 className="text-2xl font-serif italic text-zinc-200 group-hover:text-white transition-colors mb-4">
                      {item.title}
                    </h3>

                    <p className="text-zinc-600 text-sm font-light leading-relaxed line-clamp-3 mb-8">
                      {item.excerpt}
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div className="flex justify-between font-mono text-[9px] uppercase tracking-widest text-zinc-800 pb-6 border-b border-white/5">
                      <span>
                        {item.format} // {item.size}
                      </span>
                      <span className="text-zinc-600">{item.category}</span>
                    </div>

                    <button
                      onClick={onPrimaryAction}
                      disabled={!isLocked && !item.fileHref}
                      className={`w-full py-4 bg-transparent border transition-all flex items-center justify-center gap-3 ${
                        isLocked
                          ? "border-amber-900/30 text-amber-600 hover:bg-amber-600 hover:text-black"
                          : "border-white/10 text-zinc-400 hover:border-emerald-600 hover:bg-emerald-600 hover:text-black disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-zinc-400"
                      }`}
                    >
                      {isLocked ? <Lock size={14} /> : <Download size={14} />}
                      <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em]">
                        {isLocked ? "Elevate Clearance" : "Download Asset"}
                      </span>
                    </button>

                    {!isLocked && !item.fileHref && (
                      <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-700">
                        Registry mismatch: file URL missing
                      </div>
                    )}
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