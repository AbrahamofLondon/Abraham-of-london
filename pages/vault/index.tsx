// pages/vault.tsx
/* Abraham of London — The Vault Library (V8.1)
 * Build-safe. No framer-motion dependency. Category keys aligned to registry/content.
 */

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
} from "lucide-react";

import {
  assertContentlayerHasDocs,
  getContentlayerData,
  normalizeSlug,
  getAccessLevel,
} from "@/lib/content/server";
import { getPDFRegistry, type PDFTier } from "@/lib/pdf/registry";

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
  rating?: number;
  framework?: string | null;
  purpose?: string | null;
  implementation?: string | null;
};

type FilterState = {
  search: string;
  format: string | null;
  tier: string | null;
  category: string | null; // ✅ category KEY, not title
  interactive: boolean | null;
  framework: string | null;
};

type CategoryStats = {
  key: string; // ✅ category KEY (e.g., "canon", "governance")
  title: string;
  count: number;
  icon: React.ComponentType<any>;
  description: string;
};

type PageProps = {
  items: VaultItem[];
  stats: {
    total: number;
    byFormat: Record<string, number>;
    byTier: Record<string, number>;
    byCategory: Record<string, number>;
    interactiveCount: number;
  };
  categories: CategoryStats[];
};

/* ----------------------- SERVER-SIDE DATA ------------------------ */

export const getStaticProps: GetStaticProps<PageProps> = async () => {
  try {
    const data = await getContentlayerData();
    assertContentlayerHasDocs(data);

    // Downloads live in Contentlayer + Registry
    const all = data.allDownloads ?? [];
    const registry = getPDFRegistry();

    const items: VaultItem[] = all
      .map((d: any) => {
        const slug = normalizeSlug(d.slug || d._raw?.flattenedPath || "");
        const regEntry = (registry as any)[slug];

        // Registry is source-of-truth for actual file presence
        if (!regEntry || !regEntry.exists) return null;

        const fileHref =
          d.fileUrl ||
          d.downloadUrl ||
          regEntry.publicHref ||
          regEntry.outputPath ||
          null;

        return {
          slug,
          title: d.title ?? regEntry.title ?? "Untitled",
          excerpt: d.excerpt ?? d.description ?? regEntry.description ?? null,
          coverImage: d.coverImage || d.image || regEntry.coverImage || null,
          fileHref,
          accessLevel: getAccessLevel(d),
          category: (d.category ?? regEntry.category ?? null) as string | null, // ✅ KEY expected
          size: regEntry.fileSize ? String(regEntry.fileSize) : "N/A",
          tags: Array.isArray(d.tags) ? d.tags : [],
          date: d.date ? String(d.date) : null,
          featured: Boolean(d.featured ?? regEntry.featured),
          format: regEntry.format,
          isInteractive: Boolean(regEntry.isInteractive),
          tier: regEntry.tier,
          requiresAuth: Boolean(regEntry.requiresAuth),
          // keep these deterministic if you prefer; placeholders kept harmless
          downloadCount: typeof regEntry.downloadCount === "number" ? regEntry.downloadCount : undefined,
          rating: typeof regEntry.rating === "number" ? regEntry.rating : undefined,
          framework: d.framework ?? null,
          purpose: d.purpose ?? null,
          implementation: d.implementation ?? null,
        };
      })
      .filter(Boolean) as VaultItem[];

    const stats = {
      total: items.length,
      byFormat: items.reduce(
        (acc, item) => {
          acc[item.format] = (acc[item.format] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
      byTier: items.reduce(
        (acc, item) => {
          acc[item.tier] = (acc[item.tier] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
      byCategory: items.reduce(
        (acc, item) => {
          if (!item.category) return acc;
          acc[item.category] = (acc[item.category] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
      interactiveCount: items.filter((i) => i.isInteractive).length,
    };

    // ✅ Category definitions keyed to actual category keys ("canon", "governance", etc.)
    const categoryDefinitions: Record<
      string,
      { title: string; icon: React.ComponentType<any>; description: string }
    > = {
      canon: { title: "Canon Doctrine", icon: BookOpen, description: "Core canonical volumes and teaching editions" },
      governance: { title: "Governance", icon: Building2, description: "Board-level decision frameworks" },
      family: { title: "Family & Household", icon: Home, description: "Household governance and legacy planning" },
      strategy: { title: "Strategic Frameworks", icon: Target, description: "Board-ready strategic tools" },
      formation: { title: "Formation", icon: GraduationCap, description: "Personal leadership development" },
    };

    const categories: CategoryStats[] = Object.entries(categoryDefinitions)
      .map(([key, def]) => ({
        key,
        title: def.title,
        icon: def.icon,
        description: def.description,
        count: stats.byCategory[key] || 0,
      }))
      .filter((c) => c.count > 0);

    return { props: { items, stats, categories }, revalidate: 3600 };
  } catch (error) {
    return {
      props: {
        items: [],
        stats: { total: 0, byFormat: {}, byTier: {}, byCategory: {}, interactiveCount: 0 },
        categories: [],
      },
      revalidate: 3600,
    };
  }
};

/* ---------------------------- COMPONENT --------------------------- */

const VaultPage: NextPage<InferGetStaticPropsType<typeof getStaticProps>> = ({ items, stats, categories }) => {
  const router = useRouter();

  const [filters, setFilters] = React.useState<FilterState>({
    search: "",
    format: null,
    tier: null,
    category: null,
    interactive: null,
    framework: null,
  });

  const [sortBy, setSortBy] = React.useState<"date" | "title" | "downloads" | "rating">("date");

  const filteredItems = React.useMemo(() => {
    const q = filters.search.trim().toLowerCase();

    const out = items
      .filter((item) => {
        const matchesSearch =
          !q ||
          item.title.toLowerCase().includes(q) ||
          (item.excerpt ? item.excerpt.toLowerCase().includes(q) : false) ||
          (Array.isArray(item.tags) ? item.tags.join(" ").toLowerCase().includes(q) : false);

        const matchesTier = !filters.tier || String(item.tier) === String(filters.tier);
        const matchesCategory = !filters.category || String(item.category) === String(filters.category);
        const matchesFormat = !filters.format || String(item.format) === String(filters.format);
        const matchesInteractive =
          filters.interactive === null ? true : Boolean(item.isInteractive) === Boolean(filters.interactive);

        return matchesSearch && matchesTier && matchesCategory && matchesFormat && matchesInteractive;
      })
      .sort((a, b) => {
        if (sortBy === "title") return a.title.localeCompare(b.title);
        if (sortBy === "downloads") return (b.downloadCount || 0) - (a.downloadCount || 0);
        if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);

        // date desc
        const ad = a.date ? new Date(a.date).getTime() : 0;
        const bd = b.date ? new Date(b.date).getTime() : 0;
        return bd - ad;
      });

    return out;
  }, [items, filters, sortBy]);

  const handleDownload = (item: VaultItem) => {
    if (item.requiresAuth) {
      router.push("/inner-circle");
      return;
    }
    if (item.fileHref) {
      window.open(item.fileHref, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <Layout title="The Vault" description="Complete library of strategic frameworks and canonical doctrine.">
      <Head>
        <link rel="canonical" href="https://www.abrahamoflondon.org/vault" />
      </Head>

      <main className="min-h-screen bg-black text-white">
        {/* Header */}
        <section className="relative border-b border-white/10 bg-zinc-950 py-24">
          <div className="mx-auto max-w-6xl px-4">
            <h1 className="font-serif text-5xl font-bold mb-6">The Vault</h1>
            <p className="text-gray-400 text-lg max-w-2xl">
              Complete library of strategic frameworks and canonical doctrine.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-amber-500">
                {stats.total} Strategic Assets
              </span>

              {filters.category ? (
                <button
                  onClick={() => setFilters((f) => ({ ...f, category: null }))}
                  className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white/70 hover:text-white"
                  type="button"
                >
                  Category: {filters.category} (clear)
                </button>
              ) : null}
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="bg-black py-20">
          <div className="mx-auto max-w-6xl px-4">
            <div className="grid gap-6 lg:grid-cols-4">
              {categories.map((category) => {
                const Icon = category.icon;
                const isActive = filters.category === category.key;

                return (
                  <button
                    key={category.key}
                    onClick={() =>
                      setFilters((f) => ({
                        ...f,
                        category: isActive ? null : category.key,
                      }))
                    }
                    className={`group text-left p-6 rounded-3xl border transition-all ${
                      isActive
                        ? "border-amber-500/70 bg-amber-500/10"
                        : "border-white/10 bg-white/5 hover:border-amber-500/50"
                    }`}
                    type="button"
                  >
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

        {/* Search / Controls */}
        <section className="sticky top-0 z-40 border-y border-white/5 bg-black/80 backdrop-blur-xl py-4">
          <div className="mx-auto max-w-6xl px-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <input
              type="text"
              placeholder="Search assets..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-amber-500 outline-none"
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            />

            <select
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-sm outline-none focus:border-amber-500"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="date">Sort: Newest</option>
              <option value="title">Sort: Title</option>
              <option value="downloads">Sort: Downloads</option>
              <option value="rating">Sort: Rating</option>
            </select>
          </div>
        </section>

        {/* Grid */}
        <section className="py-16">
          <div className="mx-auto max-w-6xl px-4">
            {filteredItems.length === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-10 text-white/70">
                No assets match your filters.
                <button
                  onClick={() =>
                    setFilters({
                      search: "",
                      format: null,
                      tier: null,
                      category: null,
                      interactive: null,
                      framework: null,
                    })
                  }
                  className="ml-3 underline text-amber-400 hover:text-amber-300"
                  type="button"
                >
                  Clear filters
                </button>
              </div>
            ) : null}

            <div className="grid gap-6 lg:grid-cols-3">
              {filteredItems.map((item) => (
                <div
                  key={item.slug}
                  className="group rounded-3xl border border-white/5 bg-white/[0.02] p-6 transition-all hover:border-amber-500/30"
                >
                  <div className="flex justify-between mb-6">
                    <FileText className="w-5 h-5 text-gray-400 group-hover:text-amber-500" />
                    <span className="text-[9px] uppercase font-black border border-white/20 px-2 py-1 rounded-full">
                      {item.tier}
                    </span>
                  </div>

                  <h3 className="font-serif text-xl font-bold mb-3">{item.title}</h3>
                  <p className="text-gray-500 text-sm mb-6 line-clamp-2">{item.excerpt}</p>

                  <button
                    onClick={() => handleDownload(item)}
                    className="w-full py-3 rounded-xl bg-amber-500 text-black font-bold uppercase text-[10px] tracking-widest hover:bg-amber-400 transition-all"
                    type="button"
                  >
                    {item.requiresAuth ? (
                      <>
                        <Lock className="inline w-3 h-3 mr-2" />
                        Unlock
                      </>
                    ) : (
                      <>
                        <Download className="inline w-3 h-3 mr-2" />
                        Download
                      </>
                    )}
                  </button>

                  <div className="mt-4 flex items-center justify-between text-xs text-white/40">
                    <span>{item.format}</span>
                    <span>{item.category ? item.category : "uncategorised"}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 text-center text-xs text-white/40">
              Need access to locked assets?{" "}
              <Link className="text-amber-400 hover:text-amber-300 underline" href="/inner-circle">
                Join Inner Circle
              </Link>
              .
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
};

export default VaultPage;