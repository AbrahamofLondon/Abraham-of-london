/* pages/vault/index.tsx — THE VAULT (2026) — SSOT + BRIEFS ROUTING */
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
  Layers,
} from "lucide-react";

import Layout from "@/components/Layout";
import { useClientRouter } from "@/lib/router/useClientRouter";

import { getAllPDFItems, type PDFItem } from "@/lib/pdf-registry";
import { allBriefs, allDownloads } from "@/lib/contentlayer";

/* ---------------------------- TYPES & UTILS --------------------------- */

type VaultItemKind = "brief" | "download" | "pdf";

type VaultItem = {
  id: string;
  kind: VaultItemKind;
  slug: string; // bare slug (no prefix)
  href: string; // canonical route to open
  title: string;
  excerpt: string;
  category: string;
  tags: string[];
  format: string;
  size: string;
  tier: string; // display only (SSOT handled elsewhere)
  requiresAuth: boolean;
  isIntelligenceBrief: boolean;
};

type FilterState = { search: string; category: string | null };

function normalizeSlug(input: string): string {
  return String(input || "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/\.mdx?$/i, "");
}

function bareFromPrefixed(input: string): string {
  const s = normalizeSlug(input);
  return s
    .replace(/^content\//i, "")
    .replace(/^vault\//i, "")
    .replace(/^briefs\//i, "")
    .replace(/^downloads\//i, "")
    .replace(/^resources\//i, "");
}

function hasAccessCookieClient(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie
    .split(";")
    .map((c) => c.trim())
    .some((c) => c.startsWith("aol_access="));
}

function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

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
    // 1) BRIEFS (canonical: /vault/briefs/<slug>) — SOURCE OF TRUTH
    const briefs = (allBriefs || [])
      .filter((b: any) => !b?.draft)
      .map((b: any): VaultItem => {
        const bare = bareFromPrefixed(b.slug || b._raw?.flattenedPath || "");
        const title = safeStr(b.title, "Untitled Brief");
        const excerpt = safeStr(b.excerpt || b.abstract || b.description, "Intelligence brief.");
        const tags = Array.isArray(b.tags) ? b.tags.map(String) : [];
        const category = safeStr(b.series || b.category, "Briefs");

        return {
          id: `brief:${bare}`,
          kind: "brief",
          slug: bare,
          href: `/vault/briefs/${bare}`,
          title,
          excerpt,
          category,
          tags,
          format: "MDX",
          size: "—",
          tier: safeStr(b.accessLevel || b.tier || "member"),
          requiresAuth: Boolean(b.requiresAuth) || safeStr(b.accessLevel || b.tier, "public") !== "public",
          isIntelligenceBrief: true,
        };
      });

    // 2) DOWNLOADS MDX (canonical: /downloads/<slug>) — OPTIONAL, if you use downloads contentlayer
    const downloads = (allDownloads || [])
      .filter((d: any) => !d?.draft)
      .map((d: any): VaultItem => {
        const raw = normalizeSlug(d.slug || d._raw?.flattenedPath || "");
        const bare = raw.replace(/^downloads\//i, "");
        const title = safeStr(d.title, "Untitled Asset");
        const excerpt = safeStr(d.excerpt || d.description, "Vault asset.");
        const tags = Array.isArray(d.tags) ? d.tags.map(String) : [];
        const category = safeStr(d.category, "Downloads");

        // prefer explicit fileUrl if present, else route to downloads page
        const fileHref =
          safeStr(d.fileUrl || d.fileHref || d.downloadUrl, "") || `/downloads/${bare}`;

        return {
          id: `dl:${bare}`,
          kind: "download",
          slug: bare,
          href: fileHref,
          title,
          excerpt,
          category,
          tags,
          format: safeStr(d.format, "PDF").toUpperCase(),
          size: safeStr(d.size, "—"),
          tier: safeStr(d.accessLevel || d.tier || "member"),
          requiresAuth: Boolean(d.requiresAuth) || safeStr(d.accessLevel || d.tier, "public") !== "public",
          isIntelligenceBrief: false,
        };
      });

    // 3) PDF REGISTRY (fallback assets) — OPTIONAL
    const pdfItems: PDFItem[] = getAllPDFItems({ includeMissing: false });
    const pdfs: VaultItem[] = (pdfItems || []).map((p) => {
      const bare = bareFromPrefixed(p.id);
      const title = safeStr(p.title, "Untitled PDF");
      const excerpt = safeStr(p.description, "Vault PDF asset.");
      const category = safeStr(p.category, "Vault");
      const tags = Array.isArray(p.tags) ? p.tags.map(String) : [];
      const href = p.fileUrl ? String(p.fileUrl) : "";

      return {
        id: `pdf:${bare}`,
        kind: "pdf",
        slug: bare,
        href: href || "/vault",
        title,
        excerpt,
        category,
        tags,
        format: safeStr(p.format, "PDF").toUpperCase(),
        size: safeStr(p.fileSize, "—"),
        tier: safeStr(p.tier, "member"),
        requiresAuth: Boolean(p.requiresAuth),
        isIntelligenceBrief: false,
      };
    });

    // Merge: briefs first (always), then downloads, then pdfs (de-dupe by href/slug)
    const merged = [...briefs, ...downloads, ...pdfs];

    const seen = new Set<string>();
    const items = merged.filter((it) => {
      const key = `${it.kind}:${it.href}:${it.slug}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const categories = uniq(items.map((i) => i.category)).sort((a, b) => a.localeCompare(b));

    return {
      props: { items, categories, totalAssets: items.length },
      revalidate: 300,
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
    return items.filter((item) => {
      const matchesCat = !filters.category || item.category === filters.category;
      if (!q) return matchesCat;
      const haystack = `${item.title} ${item.excerpt} ${item.category} ${item.tags.join(" ")} ${item.slug}`.toLowerCase();
      return matchesCat && haystack.includes(q);
    });
  }, [items, filters]);

  const handlePrimaryAction = (item: VaultItem) => {
    if (!router) return;

    if (item.requiresAuth && !hasCookie) {
      router.push(`/inner-circle?returnTo=${encodeURIComponent("/vault")}`);
      return;
    }

    // BRIEFS are ALWAYS routed internally
    if (item.kind === "brief" || item.isIntelligenceBrief) {
      router.push(item.href);
      return;
    }

    // For downloads/pdfs: if it's internal route, use router; if external URL, open
    if (item.href.startsWith("/")) {
      router.push(item.href);
      return;
    }
    window.open(item.href, "_blank", "noopener,noreferrer");
  };

  if (!router) return <div className="min-h-screen bg-[#050505]" />;

  return (
    <Layout title="The Vault" description="Institutional Archive of Strategic Assets.">
      <main className="relative min-h-screen bg-gradient-to-b from-[#050505] via-black to-[#050505] pt-32 pb-20 px-6">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(245,158,11,0.03),_transparent_50%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_rgba(255,255,255,0.02),_transparent_50%)] pointer-events-none" />

        <div
          className="absolute inset-0 opacity-[0.02] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cpath d='M10 10 L90 10 M10 30 L90 30 M10 50 L90 50 M10 70 L90 70 M10 90 L90 90 M10 10 L10 90 M30 10 L30 90 M50 10 L50 90 M70 10 L70 90 M90 10 L90 90' stroke='rgba(255,255,255,0.1)' stroke-width='0.5' fill='none' /%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative max-w-7xl mx-auto">
          {/* HEADER HUD */}
          <header className="mb-16">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-4 mb-8">
                  <span className="h-[1px] w-12 bg-gradient-to-r from-amber-700/50 to-transparent" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-amber-700/80 flex items-center gap-2">
                    <Database size={10} className="text-amber-700" />
                    Archive Command // {totalAssets} Assets
                  </span>
                </div>

                <h1 className="text-6xl md:text-8xl font-serif italic text-white/95 mb-6 tracking-tighter leading-none">
                  The Vault.
                </h1>

                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href="/vault/briefs"
                    className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-5 py-2 text-[10px] font-mono uppercase tracking-[0.35em] text-emerald-200/80 hover:bg-emerald-500/15 transition-colors"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Briefs Index <ArrowRight className="h-4 w-4" />
                  </Link>

                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-5 py-2 text-[10px] font-mono uppercase tracking-[0.35em] text-white/45">
                    <Layers className="h-4 w-4 text-white/35" />
                    Cookies: {hasCookie ? "present" : "none"}
                  </span>
                </div>
              </div>

              {/* SEARCH ENGINE */}
              <div className="w-full max-w-2xl">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-900/20 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity rounded-2xl blur-xl" />
                  <div className="relative">
                    <Search
                      className="absolute left-6 top-1/2 -translate-y-1/2 text-amber-800/50 group-focus-within:text-amber-600 transition-colors"
                      size={18}
                    />
                    <input
                      type="text"
                      placeholder="QUERY_ASSET_REGISTRY..."
                      className="w-full bg-black/60 backdrop-blur-sm border border-white/10 py-6 pl-16 pr-6 font-mono text-[10px] uppercase tracking-[0.2em] text-white/70 placeholder:text-zinc-700 focus:border-amber-800/50 focus:bg-black/80 outline-none transition-all rounded-2xl"
                      value={filters.search}
                      onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                    />
                  </div>
                </div>

                {/* FILTER PIVOTS */}
                <div className="mt-5 flex flex-wrap gap-2">
                  {["All", ...categories].map((c) => (
                    <button
                      key={c}
                      onClick={() => setFilters((f) => ({ ...f, category: c === "All" ? null : c }))}
                      className={`px-4 py-2 text-[10px] font-mono uppercase tracking-[0.2em] border transition-all rounded-lg ${
                        (c === "All" && !filters.category) || filters.category === c
                          ? "border-amber-800/50 bg-amber-950/30 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.1)]"
                          : "border-white/10 bg-black/40 text-zinc-600 hover:text-zinc-300 hover:border-amber-800/30"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </header>

          {/* ASSET GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => {
              const isLocked = item.requiresAuth && !hasCookie;

              const Icon = item.kind === "brief" ? ShieldCheck : FileText;
              const ActionIcon = isLocked ? Lock : item.kind === "brief" ? ArrowRight : Download;

              return (
                <div
                  key={item.id}
                  className="group relative bg-gradient-to-b from-zinc-900/90 to-black border border-white/5 hover:border-amber-900/40 rounded-2xl p-8 flex flex-col justify-between min-h-[440px] transition-all duration-700 hover:shadow-[0_20px_40px_-20px_rgba(245,158,11,0.3)]"
                >
                  <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_30%_20%,_rgba(245,158,11,0.02),_transparent_70%)] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

                  <div className="absolute top-4 left-4 w-8 h-8 border-t border-l border-amber-900/30 rounded-tl-xl pointer-events-none" />
                  <div className="absolute top-4 right-4 w-8 h-8 border-t border-r border-amber-900/30 rounded-tr-xl pointer-events-none" />
                  <div className="absolute bottom-4 left-4 w-8 h-8 border-b border-l border-amber-900/30 rounded-bl-xl pointer-events-none" />
                  <div className="absolute bottom-4 right-4 w-8 h-8 border-b border-r border-amber-900/30 rounded-br-xl pointer-events-none" />

                  <div className="relative">
                    <div className="flex justify-between items-start mb-8">
                      <div className="p-3 bg-gradient-to-br from-black to-zinc-900 border border-white/10 rounded-xl group-hover:border-amber-900/30 transition-colors shadow-xl">
                        <Icon size={20} className={item.kind === "brief" ? "text-emerald-200/80" : "text-zinc-600 group-hover:text-amber-600/80 transition-colors"} />
                      </div>

                      <span
                        className={`text-[9px] font-bold uppercase tracking-[0.2em] px-3 py-1 border rounded-full backdrop-blur-sm ${
                          isLocked
                            ? "text-amber-600/80 border-amber-900/30 bg-amber-950/20"
                            : "text-emerald-600/80 border-emerald-900/30 bg-emerald-950/20"
                        }`}
                      >
                        {isLocked ? "CLASSIFIED" : safeStr(item.tier, "PUBLIC").toUpperCase()}
                      </span>
                    </div>

                    <h3 className="text-2xl font-serif italic text-white/90 group-hover:text-white transition-colors mb-4 leading-tight">
                      {item.title}
                    </h3>

                    <p className="text-zinc-500 text-sm font-light leading-relaxed line-clamp-3 mb-8 group-hover:text-zinc-400 transition-colors">
                      {item.excerpt}
                    </p>
                  </div>

                  <div className="relative space-y-6">
                    <div className="flex justify-between font-mono text-[8px] uppercase tracking-widest text-zinc-700 pb-6 border-b border-white/5">
                      <span className="text-zinc-600">
                        {item.format} // {item.size}
                      </span>
                      <span className="text-amber-800/60">{item.category}</span>
                    </div>

                    <button
                      onClick={() => handlePrimaryAction(item)}
                      className={`w-full py-4 bg-transparent border transition-all flex items-center justify-center gap-3 rounded-xl group/btn ${
                        isLocked
                          ? "border-amber-900/30 text-amber-700 hover:bg-amber-600 hover:text-black hover:border-amber-500"
                          : "border-white/10 text-zinc-400 hover:border-amber-600 hover:bg-amber-600 hover:text-black"
                      }`}
                    >
                      <ActionIcon size={14} className="group-hover/btn:text-black transition-colors" />
                      <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em]">
                        {isLocked
                          ? "Elevate Clearance"
                          : item.kind === "brief"
                          ? "Enter Briefing"
                          : item.href.startsWith("/")
                          ? "Open"
                          : "Download Asset"}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredItems.length === 0 && (
            <div className="mt-16 text-center">
              <div className="inline-block p-8 border border-white/5 bg-black/60 backdrop-blur-sm rounded-2xl">
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-700">
                  No assets match the current filter.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </Layout>
  );
};

export default VaultPage;