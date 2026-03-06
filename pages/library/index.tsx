/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/library/index.tsx — LIBRARY INDEX (PDF REGISTRY, SSOT, build-safe, design-preserving)

import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Link from "next/link";
import Head from "next/head";
import { motion } from "framer-motion";
import {
  Search,
  ArrowRight,
  Box,
  Terminal,
  X,
  Calendar,
  Clock,
  Filter,
  FileText,
  Lock,
  Tag,
} from "lucide-react";

import Layout from "@/components/Layout";
import tiers, { type AccessTier } from "@/lib/access/tiers";

/* ---------------------------------------------
   TYPES
---------------------------------------------- */

type PdfAsset = {
  slug: string; // registry slug (may include folders)
  routeSlug: string; // last segment for /library/[slug]
  title: string;
  description?: string | null;
  category?: string | null;
  tags?: string[] | null;
  updated?: string | null;
  date?: string | null;

  // access controls
  requiredTier: AccessTier; // normalized
  isPublic: boolean;

  // for UI only (we never expose restricted direct URLs here)
  displayPath?: string | null;
};

type Props = {
  items: PdfAsset[];
  counts: {
    total: number;
    public: number;
    restricted: number;
  };
};

/* ---------------------------------------------
   SERVER-SAFE HELPERS
---------------------------------------------- */

function safeStr(v: any): string {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function normalizeSlug(input: string) {
  return (input || "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/\/{2,}/g, "/");
}

function toRouteSlug(registrySlug: string): string {
  const n = normalizeSlug(registrySlug);
  const parts = n.split("/").filter(Boolean);
  return parts.length ? parts[parts.length - 1] : "";
}

function toIsoDate(input: any): string | null {
  const s = safeStr(input);
  if (!s) return null;
  const t = Date.parse(s);
  if (Number.isNaN(t)) return null;
  return new Date(t).toISOString();
}

function jsonSafe<T>(v: T): T {
  return JSON.parse(JSON.stringify(v, (_k, val) => (val === undefined ? null : val)));
}

function coerceTags(v: any): string[] | null {
  if (!Array.isArray(v)) return null;
  const out = v.map((x) => safeStr(x)).filter(Boolean);
  return out.length ? out : null;
}

function inferIsPublic(x: any): boolean {
  return (
    x?.public === true ||
    x?.isPublic === true ||
    String(x?.accessLevel || "").toLowerCase() === "public" ||
    String(x?.tier || "").toLowerCase() === "public" ||
    String(x?.visibility || "").toLowerCase() === "public" ||
    String(x?.access || "").toLowerCase() === "public" ||
    x?.locked === false
  );
}

function inferRequiredTier(x: any, isPublic: boolean): AccessTier {
  const raw = safeStr(x?.accessLevel || x?.tier || (isPublic ? "public" : "member"));
  return tiers.normalizeRequired(raw as any);
}

function inferDisplayPath(x: any): string | null {
  // purely informational; do NOT use this as a direct link for restricted assets
  const href = safeStr(x?.href || "");
  const url = safeStr(x?.url || x?.publicUrl || "");
  const path = safeStr(x?.path || x?.filePath || x?.file || "");

  // Prefer a nice short internal path if present
  if (href && href.startsWith("/")) return href;
  if (path) {
    const p = normalizeSlug(path);
    if (p.startsWith("assets/") || p.startsWith("pdfs/")) return `/${p}`;
    if (p.startsWith("public/")) return `/${p.replace(/^public\//, "")}`;
    if (p.startsWith("http://") || p.startsWith("https://")) return p;
  }
  if (url) return url;
  return null;
}

async function loadPdfAssets(): Promise<PdfAsset[]> {
  try {
    const mod: any = await import("@/scripts/pdf/pdf-registry.source");
    const list = mod?.ALL_SOURCE_PDFS || mod?.PDF_REGISTRY || mod?.ALL_PDFS || mod?.default;
    const arr: any[] = Array.isArray(list) ? list : Array.isArray(list?.items) ? list.items : [];

    const out = arr
      .map((x: any) => {
        const rawSlug = safeStr(x?.slug || x?.id || x?.key || x?.name || x?.file || x?.pdf || "");
        const slug = normalizeSlug(rawSlug);
        if (!slug) return null;

        const routeSlug = toRouteSlug(slug);
        if (!routeSlug) return null;

        const title = safeStr(x?.title || x?.name || x?.label || routeSlug || "Untitled");
        const desc = safeStr(x?.description || x?.excerpt || x?.summary || "") || null;

        const isPublic = inferIsPublic(x);
        const requiredTier = inferRequiredTier(x, isPublic);

        const updated = safeStr(x?.updated || x?.updatedAt || x?.modified || x?.lastModified || x?.date || "") || null;
        const date = safeStr(x?.date || x?.publishedAt || "") || null;

        return {
          slug,
          routeSlug,
          title,
          description: desc,
          category: safeStr(x?.category || x?.collection || x?.kind || "Library") || "Library",
          tags: coerceTags(x?.tags),
          updated,
          date,
          requiredTier,
          isPublic: requiredTier === "public",
          displayPath: inferDisplayPath(x),
        } as PdfAsset;
      })
      .filter(Boolean) as PdfAsset[];

    // Deduplicate by routeSlug (last segment)
    const seen = new Set<string>();
    const deduped: PdfAsset[] = [];
    for (const it of out) {
      const k = it.routeSlug.toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k);
      deduped.push(it);
    }

    // Sort newest first (updated/date fallback)
    deduped.sort((a, b) => {
      const aIso = toIsoDate(a.updated || a.date || "") || "";
      const bIso = toIsoDate(b.updated || b.date || "") || "";
      return bIso.localeCompare(aIso);
    });

    return deduped;
  } catch {
    return [];
  }
}

/* ---------------------------------------------
   SSG
---------------------------------------------- */

export const getStaticProps: GetStaticProps<Props> = async () => {
  const items = await loadPdfAssets();

  const counts = items.reduce(
    (acc, it) => {
      acc.total++;
      if (it.isPublic) acc.public++;
      else acc.restricted++;
      return acc;
    },
    { total: 0, public: 0, restricted: 0 }
  );

  return {
    props: jsonSafe({ items, counts }),
    revalidate: 900,
  };
};

/* ---------------------------------------------
   PAGE
---------------------------------------------- */

const LibraryIndexPage: NextPage<Props> = ({ items, counts }) => {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedTier, setSelectedTier] = React.useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);
  const [showFilters, setShowFilters] = React.useState(false);

  const tiersAvailable = React.useMemo(() => {
    const s = new Set<string>();
    items.forEach((i) => s.add(String(i.requiredTier || "public")));
    return Array.from(s).sort();
  }, [items]);

  const categoriesAvailable = React.useMemo(() => {
    const s = new Set<string>();
    items.forEach((i) => {
      if (i.category) s.add(String(i.category));
    });
    return Array.from(s).sort();
  }, [items]);

  const filtered = React.useMemo(() => {
    let list = items;

    const q = searchTerm.trim().toLowerCase();
    if (q) {
      list = list.filter((it) => {
        const inTitle = it.title.toLowerCase().includes(q);
        const inDesc = (it.description || "").toLowerCase().includes(q);
        const inSlug = it.slug.toLowerCase().includes(q);
        const inTags = (it.tags || []).some((t) => t.toLowerCase().includes(q));
        const inCat = (it.category || "").toLowerCase().includes(q);
        return inTitle || inDesc || inSlug || inTags || inCat;
      });
    }

    if (selectedTier) list = list.filter((it) => String(it.requiredTier) === selectedTier);
    if (selectedCategory) list = list.filter((it) => String(it.category || "") === selectedCategory);

    return list;
  }, [items, searchTerm, selectedTier, selectedCategory]);

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedTier(null);
    setSelectedCategory(null);
  };

  const latestYear = React.useMemo(() => {
    if (!items.length) return new Date().getFullYear();
    const ms = Math.max(
      ...items.map((i) => {
        const iso = toIsoDate(i.updated || i.date || "");
        return iso ? Date.parse(iso) : 0;
      })
    );
    return ms > 0 ? new Date(ms).getFullYear() : new Date().getFullYear();
  }, [items]);

  return (
    <Layout
      title="Library"
      description="Verified PDF library assets — controlled distribution, audit-friendly URLs."
      fullWidth
      className="bg-black text-white"
      headerTransparent={false}
    >
      <Head>
        <title>Library // Abraham of London</title>
      </Head>

      <main className="min-h-screen bg-gradient-to-b from-black via-zinc-950 to-black text-gray-300">
        <section className="relative overflow-hidden border-b border-white/5 pb-16 pt-24 lg:pt-32">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_#d4af37_1px,_transparent_1px)] bg-[length:32px_32px]" />
          <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2">
              <Terminal size={14} className="text-amber-500" />
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-amber-500">
                System: Central Vault
              </span>
              <span className="h-1 w-1 rounded-full bg-amber-500/40" />
              <span className="text-xs font-mono uppercase tracking-widest text-amber-200/70">
                {counts.total} assets
              </span>
            </div>

            <h1 className="mb-6 font-serif text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl">
              Everything. <span className="italic text-amber-400">Organised.</span>
            </h1>

            <p className="mb-12 max-w-3xl text-lg text-gray-400">
              This index lists PDF assets from the registry. Public assets open instantly. Restricted assets require clearance.
            </p>

            <div className="max-w-3xl space-y-4">
              <div className="group relative">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 transition-colors group-focus-within:text-amber-500"
                  size={20}
                />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search titles, tags, categories, slugs..."
                  className="w-full rounded-2xl border border-white/10 bg-white/5 py-4 pl-12 pr-10 text-base text-white placeholder:text-gray-500 transition-all focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/10"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-gray-500 transition-colors hover:text-amber-500"
                    aria-label="Clear search"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setShowFilters((v) => !v)}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 transition-colors hover:border-amber-500/30 hover:text-amber-400"
                >
                  <Filter className="h-4 w-4" />
                  <span className="text-sm font-medium">Filters</span>
                </button>

                {(selectedTier || selectedCategory) && (
                  <button
                    onClick={clearFilters}
                    className="inline-flex items-center gap-2 rounded-xl bg-amber-500/10 px-4 py-2 text-sm text-amber-400 transition-colors hover:bg-amber-500/20"
                  >
                    Clear filters
                  </button>
                )}

                <div className="ml-auto flex items-center gap-3 text-[10px] font-mono uppercase tracking-widest text-white/35">
                  <span>Public: {counts.public}</span>
                  <span className="text-white/15">•</span>
                  <span>Restricted: {counts.restricted}</span>
                </div>
              </div>

              {showFilters && (
                <div className="space-y-4 rounded-2xl border border-white/10 bg-black/50 p-6 backdrop-blur-sm">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <h3 className="mb-2 text-sm font-semibold text-gray-300 flex items-center gap-2">
                        <Lock className="h-4 w-4 text-amber-400" /> Clearance
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {tiersAvailable.map((t) => (
                          <button
                            key={t}
                            onClick={() => setSelectedTier((v) => (v === t ? null : t))}
                            className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                              selectedTier === t
                                ? "bg-amber-500 text-black"
                                : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-300"
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="mb-2 text-sm font-semibold text-gray-300 flex items-center gap-2">
                        <Tag className="h-4 w-4 text-amber-400" /> Categories
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {categoriesAvailable.map((c) => (
                          <button
                            key={c}
                            onClick={() => setSelectedCategory((v) => (v === c ? null : c))}
                            className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                              selectedCategory === c
                                ? "bg-blue-500 text-white"
                                : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-300"
                            }`}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="text-sm text-gray-400">
                    Showing {filtered.length} of {items.length} assets
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-20 lg:px-8">
          {filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-3xl border border-dashed border-white/10 py-24 text-center"
            >
              <Box className="mx-auto mb-4 text-gray-700" size={48} />
              <p className="mb-6 font-serif text-xl italic text-gray-500">No assets matching current filters.</p>
              <button
                onClick={clearFilters}
                className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
              >
                Clear all filters
              </button>
            </motion.div>
          ) : (
            <div className="space-y-10">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-white/5 p-2">
                  <FileText className="h-4 w-4 text-amber-400" />
                </div>
                <h2 className="font-serif text-2xl font-bold text-white md:text-3xl">Library Assets</h2>
                <div className="h-px flex-1 bg-gradient-to-r from-amber-500/20 to-transparent" />
                <span className="font-mono text-xs uppercase tracking-widest text-gray-500">
                  {filtered.length} listed
                </span>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filtered.map((item) => {
                  const iso = toIsoDate(item.updated || item.date || "");
                  const dateLabel = iso
                    ? new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
                    : null;

                  return (
                    <motion.div
                      key={item.slug}
                      whileHover={{ y: -4 }}
                      className="group relative flex flex-col justify-between rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-black/50 p-6 transition-all hover:border-amber-500/30 hover:shadow-2xl hover:shadow-amber-500/10"
                    >
                      <Link href={`/library/${encodeURIComponent(item.routeSlug)}`} className="flex h-full flex-col">
                        <div className="flex items-center justify-between gap-3">
                          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
                            <FileText className="h-4 w-4 text-amber-400" />
                            <span className="text-[10px] font-mono uppercase tracking-[0.35em] text-white/55">
                              {item.category || "Library"}
                            </span>
                            {!item.isPublic ? (
                              <>
                                <span className="h-1 w-1 rounded-full bg-white/20" />
                                <span className="text-[10px] font-mono uppercase tracking-[0.35em] text-amber-400">
                                  <Lock className="h-3 w-3 inline mr-1" />
                                  {item.requiredTier}
                                </span>
                              </>
                            ) : null}
                          </div>

                          <ArrowRight
                            size={14}
                            className="flex-shrink-0 -translate-x-2 text-amber-500 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100"
                          />
                        </div>

                        <h3 className="mt-4 mb-3 line-clamp-2 font-serif text-xl font-semibold leading-tight text-white transition-colors group-hover:text-amber-400">
                          {item.title}
                        </h3>

                        {item.description ? (
                          <p className="mb-6 line-clamp-2 text-sm leading-relaxed text-gray-400">{item.description}</p>
                        ) : null}

                        <div className="mt-auto space-y-3 border-t border-white/5 pt-4">
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <div className="flex items-center gap-2">
                              {dateLabel ? (
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>{dateLabel}</span>
                                </div>
                              ) : null}

                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>{item.isPublic ? "Public" : "Restricted"}</span>
                              </div>
                            </div>

                            <span className="rounded bg-white/5 px-2 py-0.5 text-[10px]">
                              {item.routeSlug}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="max-w-[70%] truncate font-mono text-[10px] uppercase tracking-widest text-gray-600 transition-colors group-hover:text-amber-500/50">
                              {item.slug.replace(/\//g, " · ")}
                            </span>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-16 border-t border-white/10 pt-8">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="rounded-xl bg-white/5 p-4 text-center">
                <div className="mb-1 text-2xl font-bold text-white">{items.length}</div>
                <div className="text-sm text-gray-400">Total Assets</div>
              </div>
              <div className="rounded-xl bg-white/5 p-4 text-center">
                <div className="mb-1 text-2xl font-bold text-white">{counts.public}</div>
                <div className="text-sm text-gray-400">Public</div>
              </div>
              <div className="rounded-xl bg-white/5 p-4 text-center">
                <div className="mb-1 text-2xl font-bold text-white">{counts.restricted}</div>
                <div className="text-sm text-gray-400">Restricted</div>
              </div>
              <div className="rounded-xl bg-white/5 p-4 text-center">
                <div className="mb-1 text-2xl font-bold text-white">{latestYear}</div>
                <div className="text-sm text-gray-400">Latest Update</div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
};

export default LibraryIndexPage;