/* pages/vault/index.tsx — THE INSTITUTIONAL ARCHIVE (2026) */
/* eslint-disable @typescript-eslint/no-explicit-any */

import * as React from "react";
import type { GetStaticProps, InferGetStaticPropsType, NextPage } from "next";
import Link from "next/link";
import { 
  Search, 
  FileText, 
  Download, 
  Lock, 
  ArrowRight, 
  Database, 
  ShieldCheck, 
  Layers 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import Layout from "@/components/Layout";
import { useClientRouter } from "@/lib/router/useClientRouter";
import { getAllPDFItems, type PDFItem } from "@/lib/pdf-registry";
import { allBriefs, allDownloads } from "@/lib/contentlayer";

/* ---------------------------- TYPES & UTILS --------------------------- */

type VaultItemKind = "brief" | "download" | "pdf";

type VaultItem = {
  id: string;
  kind: VaultItemKind;
  slug: string;
  href: string;
  title: string;
  excerpt: string;
  category: string;
  tags: string[];
  format: string;
  size: string;
  tier: string;
  requiresAuth: boolean;
  isIntelligenceBrief: boolean;
};

type FilterState = { search: string; category: string | null };

const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(" ");

function normalizeSlug(input: string): string {
  return String(input || "").trim().replace(/\\/g, "/").replace(/^\/+/, "").replace(/\/+$/, "").replace(/\.mdx?$/i, "");
}

function bareFromPrefixed(input: string): string {
  const s = normalizeSlug(input);
  return s.replace(/^(content|vault|briefs|downloads|resources)\//i, "");
}

function hasAccessCookieClient(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.split(";").map((c) => c.trim()).some((c) => c.startsWith("aol_access="));
}

function uniq<T>(arr: T[]): T[] { return Array.from(new Set(arr)); }

function safeStr(v: unknown, fallback = ""): string {
  const s = String(v ?? "").trim();
  return s || fallback;
}

/* ---------------------------- DATA FETCHING --------------------------- */

export const getStaticProps: GetStaticProps<{
  items: VaultItem[];
  categories: string[];
  totalAssets: number;
}> = async () => {
  try {
    const briefs = (allBriefs || []).filter((b: any) => !b?.draft).map((b: any): VaultItem => {
      const bare = bareFromPrefixed(b.slug || b._raw?.flattenedPath || "");
      return {
        id: `brief:${bare}`,
        kind: "brief",
        slug: bare,
        href: `/vault/briefs/${bare}`,
        title: safeStr(b.title, "Untitled Brief"),
        excerpt: safeStr(b.excerpt || b.abstract || b.description, "Intelligence brief."),
        category: safeStr(b.series || b.category, "Briefs"),
        tags: Array.isArray(b.tags) ? b.tags.map(String) : [],
        format: "MDX",
        size: "—",
        tier: safeStr(b.accessLevel || b.tier || "member"),
        requiresAuth: Boolean(b.requiresAuth) || safeStr(b.accessLevel || b.tier, "public") !== "public",
        isIntelligenceBrief: true,
      };
    });

    const downloads = (allDownloads || []).filter((d: any) => !d?.draft).map((d: any): VaultItem => {
      const raw = normalizeSlug(d.slug || d._raw?.flattenedPath || "");
      const bare = raw.replace(/^downloads\//i, "");
      return {
        id: `dl:${bare}`,
        kind: "download",
        slug: bare,
        href: safeStr(d.fileUrl || d.fileHref || d.downloadUrl, "") || `/downloads/${bare}`,
        title: safeStr(d.title, "Untitled Asset"),
        excerpt: safeStr(d.excerpt || d.description, "Vault asset."),
        category: safeStr(d.category, "Downloads"),
        tags: Array.isArray(d.tags) ? d.tags.map(String) : [],
        format: safeStr(d.format, "PDF").toUpperCase(),
        size: safeStr(d.size, "—"),
        tier: safeStr(d.accessLevel || d.tier || "member"),
        requiresAuth: Boolean(d.requiresAuth) || safeStr(d.accessLevel || d.tier, "public") !== "public",
        isIntelligenceBrief: false,
      };
    });

    const pdfItems: PDFItem[] = getAllPDFItems({ includeMissing: false });
    const pdfs: VaultItem[] = (pdfItems || []).map((p) => {
      const bare = bareFromPrefixed(p.id);
      return {
        id: `pdf:${bare}`,
        kind: "pdf",
        slug: bare,
        href: p.fileUrl ? String(p.fileUrl) : "/vault",
        title: safeStr(p.title, "Untitled PDF"),
        excerpt: safeStr(p.description, "Vault PDF asset."),
        category: safeStr(p.category, "Vault"),
        tags: Array.isArray(p.tags) ? p.tags.map(String) : [],
        format: safeStr(p.format, "PDF").toUpperCase(),
        size: safeStr(p.fileSize, "—"),
        tier: safeStr(p.tier, "member"),
        requiresAuth: Boolean(p.requiresAuth),
        isIntelligenceBrief: false,
      };
    });

    const merged = [...briefs, ...downloads, ...pdfs];
    const seen = new Set<string>();
    const items = merged.filter((it) => {
      const key = `${it.kind}:${it.href}:${it.slug}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const categories = uniq(items.map((i) => i.category)).sort((a, b) => a.localeCompare(b));

    return { props: { items, categories, totalAssets: items.length }, revalidate: 300 };
  } catch (error) {
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

  React.useEffect(() => { setHasCookie(hasAccessCookieClient()); }, []);

  const filteredItems = React.useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return items.filter((item) => {
      const matchesCat = !filters.category || item.category === filters.category;
      if (!q) return matchesCat;
      const haystack = `${item.title} ${item.excerpt} ${item.category} ${item.tags.join(" ")}`.toLowerCase();
      return matchesCat && haystack.includes(q);
    });
  }, [items, filters]);

  const handlePrimaryAction = (item: VaultItem) => {
    if (!router) return;
    if (item.requiresAuth && !hasCookie) {
      router.push(`/inner-circle?returnTo=${encodeURIComponent("/vault")}`);
      return;
    }
    if (item.kind === "brief" || item.isIntelligenceBrief || item.href.startsWith("/")) {
      router.push(item.href);
      return;
    }
    window.open(item.href, "_blank", "noopener,noreferrer");
  };

  if (!router) return <div className="min-h-screen bg-[#050505]" />;

  return (
    <Layout title="The Vault | Abraham of London" description="Institutional Archive.">
      <main className="relative min-h-screen bg-[#050505] pt-40 pb-32 px-6 overflow-hidden">
        {/* ATMOSPHERIC BACKGROUND */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(212,175,55,0.05),_transparent_50%)] pointer-events-none" />
        <div 
          className="absolute inset-0 opacity-[0.03] pointer-events-none" 
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0 L30 60 M0 30 L60 30' stroke='white' stroke-width='0.5' fill='none'/%3E%3C/svg%3E")` }} 
        />

        <div className="relative max-w-7xl mx-auto">
          {/* COMMAND HUD */}
          <header className="mb-24 flex flex-col lg:flex-row lg:items-end justify-between gap-12">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-4">
                <span className="h-[1px] w-12 bg-amber-500/40" />
                <p className="font-mono text-[9px] uppercase tracking-[0.5em] text-amber-500/80">
                  <Database size={10} className="inline mr-2" /> Archive Registry // {totalAssets} Assets
                </p>
              </div>
              <h1 className="text-7xl md:text-9xl font-serif font-medium tracking-tighter text-white">
                The <span className="italic font-light text-amber-200/90">Vault.</span>
              </h1>
              <p className="max-w-md text-zinc-500 font-light italic text-lg border-l border-white/10 pl-6">
                Institutional Archive of Strategic Intelligence and Private Frameworks.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full lg:max-w-md space-y-5"
            >
              <div className="relative group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-amber-500 transition-colors" size={16} />
                <input
                  type="text"
                  placeholder="QUERY_REGISTRY..."
                  className="w-full bg-white/[0.02] border border-white/10 py-5 pl-14 pr-6 font-mono text-[10px] uppercase tracking-[0.2em] text-white focus:border-amber-500/50 outline-none transition-all"
                  value={filters.search}
                  onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {["All", ...categories].map((c) => (
                  <button
                    key={c}
                    onClick={() => setFilters(f => ({ ...f, category: c === "All" ? null : c }))}
                    className={cx(
                      "px-4 py-2 text-[9px] font-black uppercase tracking-widest border transition-all",
                      (c === "All" && !filters.category) || filters.category === c
                        ? "border-amber-500/40 bg-amber-500/10 text-amber-200"
                        : "border-white/5 bg-transparent text-zinc-600 hover:text-zinc-300"
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </motion.div>
          </header>

          {/* ASSET GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-px bg-white/5 border border-white/5">
            <AnimatePresence mode="popLayout">
              {filteredItems.map((item) => {
                const isLocked = item.requiresAuth && !hasCookie;
                return (
                  <motion.div
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    key={item.id}
                    className="group relative bg-[#050505] p-10 flex flex-col justify-between min-h-[460px] hover:bg-[#080808] transition-colors duration-500"
                  >
                    <div className="space-y-8">
                      <div className="flex justify-between items-start">
                        <div className="w-12 h-12 border border-white/10 flex items-center justify-center group-hover:border-amber-500/50 transition-colors">
                          {item.kind === "brief" ? <ShieldCheck size={20} className="text-amber-200/50" /> : <FileText size={20} className="text-zinc-600" />}
                        </div>
                        <span className={cx(
                          "text-[8px] font-black uppercase tracking-[0.3em] px-3 py-1 border",
                          isLocked ? "border-amber-900/50 text-amber-700 bg-amber-950/20" : "border-emerald-900/50 text-emerald-700 bg-emerald-950/20"
                        )}>
                          {isLocked ? "Classified" : item.tier}
                        </span>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-3xl font-serif text-white group-hover:text-amber-100 transition-colors leading-tight">
                          {item.title}
                        </h3>
                        <p className="text-zinc-500 font-light leading-relaxed text-sm line-clamp-4 italic group-hover:text-zinc-400 transition-colors">
                          {item.excerpt}
                        </p>
                      </div>
                    </div>

                    <div className="mt-12 space-y-6">
                      <div className="flex justify-between font-mono text-[8px] uppercase tracking-[0.4em] text-zinc-700 border-b border-white/5 pb-4">
                        <span>{item.format} // {item.size}</span>
                        <span className="text-amber-900/60">{item.category}</span>
                      </div>

                      <button
                        onClick={() => handlePrimaryAction(item)}
                        className={cx(
                          "w-full group/btn flex items-center justify-between py-4 px-6 border transition-all duration-500",
                          isLocked 
                            ? "border-amber-900/30 text-amber-700 hover:bg-amber-600 hover:text-black hover:border-amber-500"
                            : "border-white/10 text-zinc-400 hover:bg-white hover:text-black hover:border-white"
                        )}
                      >
                        <span className="font-mono text-[10px] font-black uppercase tracking-[0.3em]">
                          {isLocked ? "Elevate Clearance" : item.kind === "brief" ? "Open Briefing" : "Download"}
                        </span>
                        {isLocked ? <Lock size={14} /> : <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {filteredItems.length === 0 && (
            <div className="py-24 text-center">
              <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-zinc-600">No Registry Matches Found</p>
            </div>
          )}
        </div>
      </main>
    </Layout>
  );
};

export default VaultPage;