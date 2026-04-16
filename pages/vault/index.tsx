/* pages/vault/index.tsx — THE VAULT (Hero Restored / Journey Chamber) */
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
  Crown,
  CheckCircle2,
  Sparkles,
  ScanSearch,
  FolderLock,
  ScrollText,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import Layout from "@/components/Layout";
import { useClientRouter } from "@/lib/router/useClientRouter";
import { getAllPDFItems, type PDFItem } from "@/lib/pdf-registry";
import VaultTierCard from "@/components/vault/VaultTierCard";
import VaultValueStack from "@/components/vault/VaultValueStack";

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

const cx = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ");

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
  return s.replace(/^(content|vault|briefs|downloads|resources)\//i, "");
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

function countByCategory(items: VaultItem[], category: string): number {
  return items.filter((i) => i.category === category).length;
}

export const getStaticProps: GetStaticProps<{
  items: VaultItem[];
  categories: string[];
  totalAssets: number;
}> = async () => {
  console.log("[PAGE_DATA] pages/vault/index.tsx getStaticProps START");
  try {
  try {
    const { getAllBriefs, getAllDownloads } = await import("@/lib/content/server");
    const allBriefs = getAllBriefs() as any[];
    const allDownloads = getAllDownloads() as any[];
    const briefs = (allBriefs || [])
      .filter((b: any) => !b?.draft)
      .map((b: any): VaultItem => {
        const bare = bareFromPrefixed(b.slug || b._raw?.flattenedPath || "");
        const tier = safeStr(b.accessLevel || b.tier || "member");

        return {
          id: `brief:${bare}`,
          kind: "brief",
          slug: bare,
          href: `/vault/briefs/${bare}`,
          title: safeStr(b.title, "Untitled Brief"),
          excerpt: safeStr(
            b.excerpt || b.abstract || b.description,
            "Intelligence brief.",
          ),
          category: safeStr(b.series || b.category, "Briefs"),
          tags: Array.isArray(b.tags) ? b.tags.map(String) : [],
          format: "MDX",
          size: "—",
          tier,
          requiresAuth: tier !== "public",
          isIntelligenceBrief: true,
        };
      });

    const downloads = (allDownloads || [])
      .filter((d: any) => !d?.draft)
      .map((d: any): VaultItem => {
        const raw = normalizeSlug(d.slug || d._raw?.flattenedPath || "");
        const bare = raw.replace(/^downloads\//i, "");
        const tier = safeStr(d.accessLevel || d.tier || "member");

        return {
          id: `dl:${bare}`,
          kind: "download",
          slug: bare,
          href: `/downloads/${bare}`,
          title: safeStr(d.title, "Untitled Asset"),
          excerpt: safeStr(d.excerpt || d.description, "Vault asset."),
          category: safeStr(d.category, "Downloads"),
          tags: Array.isArray(d.tags) ? d.tags.map(String) : [],
          format: safeStr(d.format, "PDF").toUpperCase(),
          size: safeStr(d.size, "—"),
          tier,
          requiresAuth: tier !== "public",
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

    const categories = uniq(items.map((i) => i.category)).sort((a, b) =>
      a.localeCompare(b),
    );

    return {
      props: { items, categories, totalAssets: items.length },
      revalidate: 300,
    };
  } catch {
    return {
      props: { items: [], categories: [], totalAssets: 0 },
      revalidate: 3600,
    };
  }


  } finally {
    console.log("[PAGE_DATA] pages/vault/index.tsx getStaticProps END");
  }
};

function VaultHeroAtmosphere() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[#040403]" />

      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02)_0%,rgba(255,255,255,0.00)_16%,rgba(0,0,0,0.00)_46%,rgba(0,0,0,0.32)_100%)]" />

      <div className="absolute left-[-8%] top-[-18%] h-[720px] w-[1040px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.095)_0%,rgba(212,175,55,0.04)_26%,rgba(212,175,55,0.014)_48%,transparent_74%)] blur-[120px]" />
      <div className="absolute right-[-6%] top-[2%] h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.038)_0%,rgba(255,255,255,0.014)_30%,transparent_72%)] blur-[125px]" />
      <div className="absolute bottom-[-24%] left-[18%] h-[380px] w-[760px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.03)_0%,rgba(212,175,55,0.01)_38%,transparent_74%)] blur-[130px]" />

      <div className="absolute inset-y-0 left-[6%] hidden w-px bg-gradient-to-b from-transparent via-white/[0.05] to-transparent xl:block" />
      <div className="absolute inset-y-0 right-[6%] hidden w-px bg-gradient-to-b from-transparent via-white/[0.038] to-transparent xl:block" />
      <div className="absolute inset-x-0 top-[30%] h-px bg-gradient-to-r from-transparent via-white/[0.035] to-transparent" />
      <div className="absolute inset-x-0 bottom-[20%] h-px bg-gradient-to-r from-transparent via-white/[0.025] to-transparent" />

      <div className="absolute right-[8%] top-[16%] h-[360px] w-[470px] rounded-[34px] border border-white/[0.045]" />
      <div className="absolute right-[10%] top-[19%] h-[296px] w-[402px] rounded-[28px] border border-white/[0.034]" />
      <div className="absolute right-[12%] top-[22%] h-[232px] w-[334px] rounded-[22px] border border-white/[0.026]" />

      <div
        className="absolute inset-0 opacity-[0.026]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.05) 0.5px, transparent 0.5px), linear-gradient(to bottom, rgba(255,255,255,0.04) 0.5px, transparent 0.5px)",
          backgroundSize: "98px 98px",
        }}
      />

      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.32) 0.42px, transparent 0.9px)",
          backgroundSize: "26px 26px",
        }}
      />

      <div className="absolute inset-0 aol-grain opacity-[0.014]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,transparent_42%,rgba(0,0,0,0.1)_66%,rgba(0,0,0,0.28)_100%)]" />
    </div>
  );
}

function RegistryMetric({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="border-l border-white/10 pl-4">
      <div className="text-2xl font-light tracking-tight text-white">{value}</div>
      <div className="mt-1 font-mono text-[8px] uppercase tracking-[0.26em] text-white/34">
        {label}
      </div>
    </div>
  );
}

function VaultHero({
  totalAssets,
  categories,
  items,
  filters,
  setFilters,
}: {
  totalAssets: number;
  categories: string[];
  items: VaultItem[];
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
}) {
  const topCategories = categories.slice(0, 8);
  const classifiedCount = items.filter((i) => i.requiresAuth).length;
  const publicCount = items.filter((i) => !i.requiresAuth).length;
  const briefsCount = items.filter((i) => i.kind === "brief").length;

  return (
    <section className="relative overflow-hidden border-b border-white/8">
      <div className="relative min-h-[560px] md:min-h-[620px] lg:min-h-[680px]">
        <VaultHeroAtmosphere />

        <div className="relative z-10 mx-auto max-w-7xl px-6 pb-12 pt-32 md:pt-36 lg:px-12 lg:pb-16 lg:pt-40">
          <div className="grid items-end gap-10 lg:grid-cols-[1.08fr_0.92fr]">
            <motion.div
              initial={{ opacity: 0, x: -18 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-4xl"
            >
              <div className="mb-5 flex items-center gap-3">
                <span className="h-px w-12 bg-gradient-to-r from-[#D4AF37]/60 to-transparent" />
                <span className="font-mono text-[9px] uppercase tracking-[0.34em] text-amber-300/78">
                  Sovereign Archive
                </span>
              </div>

              <h1 className="font-serif text-5xl font-light leading-[0.9] tracking-[-0.06em] text-white md:text-7xl lg:text-[6.2rem]">
                The <span className="italic text-amber-100/92">Vault</span>
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/64">
                A chamber of briefings, frameworks, private assets, and operational
                material arranged for builders who prefer ordered intelligence to
                decorative noise.
              </p>

              <div className="mt-10 grid grid-cols-2 gap-7 md:grid-cols-4">
                <RegistryMetric label="Assets" value={totalAssets} />
                <RegistryMetric label="Briefs" value={briefsCount} />
                <RegistryMetric label="Public" value={publicCount} />
                <RegistryMetric label="Classified" value={classifiedCount} />
              </div>

              <div className="mt-10 flex flex-wrap gap-3">
                {topCategories.map((c) => {
                  const active = filters.category === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() =>
                        setFilters((f) => ({
                          ...f,
                          category: active ? null : c,
                        }))
                      }
                      className={cx(
                        "inline-flex items-center gap-2 rounded-full border px-4 py-2 transition-all",
                        active
                          ? "border-amber-500/34 bg-amber-500/10 text-amber-100"
                          : "border-white/10 bg-white/[0.03] text-white/54 hover:border-white/16 hover:bg-white/[0.05] hover:text-white/74",
                      )}
                    >
                      <span className="font-mono text-[9px] uppercase tracking-[0.24em]">
                        {c}
                      </span>
                      <span className="text-[10px] text-white/24">
                        {countByCategory(items, c)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.86,
                delay: 0.08,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="relative"
            >
              <div className="relative overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.035] backdrop-blur-xl">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(212,175,55,0.09),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.02),transparent_18%)]" />
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/28 to-transparent" />

                <div className="relative p-6 md:p-7">
                  <div className="mb-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/20">
                        <ScanSearch className="h-4 w-4 text-amber-300/80" />
                      </div>
                      <div>
                        <div className="font-mono text-[8px] uppercase tracking-[0.28em] text-white/34">
                          Active Registry
                        </div>
                        <div className="mt-1 text-sm text-white/72">
                          Query and route the archive
                        </div>
                      </div>
                    </div>

                    <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 font-mono text-[8px] uppercase tracking-[0.24em] text-white/34">
                      Live index
                    </div>
                  </div>

                  <div className="group relative">
                    <Search
                      className="absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 transition-colors group-focus-within:text-amber-400"
                      size={16}
                    />
                    <input
                      type="text"
                      placeholder="QUERY_REGISTRY..."
                      className="w-full border border-white/10 bg-black/20 py-5 pl-14 pr-6 font-mono text-[10px] uppercase tracking-[0.2em] text-white outline-none transition-all placeholder:text-zinc-600 focus:border-amber-500/40"
                      value={filters.search}
                      onChange={(e) =>
                        setFilters((f) => ({ ...f, search: e.target.value }))
                      }
                    />
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {items.slice(0, 10).map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl border border-white/8 bg-black/18 px-4 py-3"
                      >
                        <div className="truncate font-mono text-[9px] uppercase tracking-[0.2em] text-white/46">
                          {item.title.replace(/\s+/g, "-")}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 flex items-center gap-3 border-t border-white/8 pt-5">
                    <FolderLock className="h-4 w-4 text-amber-300/70" />
                    <p className="text-sm leading-relaxed text-white/52">
                      Briefings for direction. Assets for execution. Private material
                      for those who need more than inspiration.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

const VaultPage: NextPage<
  InferGetStaticPropsType<typeof getStaticProps>
> = ({ items, categories, totalAssets }) => {
  const router = useClientRouter();
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

    return items.filter((item) => {
      const matchesCat = !filters.category || item.category === filters.category;
      if (!q) return matchesCat;

      const haystack =
        `${item.title} ${item.excerpt} ${item.category} ${item.tags.join(" ")}`.toLowerCase();
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

  if (!router) {
    return <div className="min-h-screen bg-[#050505]" />;
  }

  return (
    <Layout
      title="The Vault | Abraham of London"
      description="Institutional archive of strategic intelligence, premium assets, and private frameworks."
      canonicalUrl="/vault"
      fullWidth
      className="bg-black text-white"
    >
      <main className="relative min-h-screen overflow-hidden bg-[#050505] pb-32">
        <VaultHero
          totalAssets={totalAssets}
          categories={categories}
          items={items}
          filters={filters}
          setFilters={setFilters}
        />

        <section className="relative mx-auto mt-20 max-w-7xl px-6 lg:px-12">
          <div className="mb-24 border border-white/10 bg-gradient-to-b from-amber-500/[0.03] to-transparent p-8 md:p-12">
            <div className="mb-12 text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/5 px-4 py-2">
                <Crown className="h-3 w-3 text-amber-500" />
                <span className="text-[8px] font-mono uppercase tracking-[0.3em] text-amber-400">
                  Institutional Access
                </span>
              </div>

              <h2 className="text-4xl font-serif text-white md:text-5xl">
                Unlock the Full Archive
              </h2>

              <p className="mx-auto mt-4 max-w-2xl text-white/50">
                Premium frameworks, intelligence briefs, and serious operating material
                for builders who want systems, not noise.
              </p>
            </div>

            <VaultValueStack />

            <div className="mt-16 grid gap-6 md:grid-cols-3">
              <VaultTierCard
                title="Vault Access"
                features={[
                  "Playbooks access",
                  "Canon essays",
                  "Core frameworks",
                  "Intelligence briefs",
                  "Public archive access",
                ]}
              />

              <VaultTierCard
                title="Vault Plus"
                emphasis
                features={[
                  "Everything in Vault",
                  "Premium reports access",
                  "Advanced frameworks",
                  "Executive briefings",
                  "Priority support",
                ]}
              />

              <VaultTierCard
                title="Private Access"
                features={[
                  "Strategy proximity",
                  "Direct escalation",
                  "Restricted entry",
                  "Private advisory",
                  "Inner Circle access",
                ]}
              />
            </div>
          </div>

          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="h-px w-12 bg-gradient-to-r from-[#D4AF37]/55 to-transparent" />
              <span className="font-mono text-[9px] uppercase tracking-[0.32em] text-white/34">
                Archive Surface
              </span>
            </div>

            <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/24">
              {filteredItems.length} visible
            </span>
          </div>

          <div className="grid grid-cols-1 gap-px border border-white/5 bg-white/5 md:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {filteredItems.map((item) => {
                const isLocked = item.requiresAuth && !hasCookie;

                return (
                  <motion.div
                    layout
                    key={item.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="group relative flex min-h-[440px] flex-col justify-between bg-[#050505] p-10 transition-colors duration-500 hover:bg-[#080808]"
                  >
                    <div className="space-y-8">
                      <div className="flex items-start justify-between">
                        <div className="flex h-12 w-12 items-center justify-center border border-white/10 transition-colors group-hover:border-amber-500/50">
                          {item.kind === "brief" ? (
                            <ShieldCheck size={20} className="text-amber-200/50" />
                          ) : item.kind === "download" ? (
                            <Download size={20} className="text-zinc-600" />
                          ) : (
                            <FileText size={20} className="text-zinc-600" />
                          )}
                        </div>

                        <span
                          className={cx(
                            "border px-3 py-1 text-[8px] font-black uppercase tracking-[0.3em]",
                            isLocked
                              ? "border-amber-900/50 bg-amber-950/20 text-amber-700"
                              : "border-emerald-900/50 bg-emerald-950/20 text-emerald-700",
                          )}
                        >
                          {isLocked ? "Classified" : item.tier}
                        </span>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-3xl font-serif leading-tight text-white transition-colors group-hover:text-amber-100">
                          {item.title}
                        </h3>
                        <p className="line-clamp-4 text-sm font-light italic leading-relaxed text-zinc-500 transition-colors group-hover:text-zinc-400">
                          {item.excerpt}
                        </p>
                      </div>
                    </div>

                    <div className="mt-12 space-y-6">
                      <div className="flex justify-between border-b border-white/5 pb-4 font-mono text-[8px] uppercase tracking-[0.4em] text-zinc-700">
                        <span>
                          {item.format} // {item.size}
                        </span>
                        <span className="text-amber-900/60">{item.category}</span>
                      </div>

                      <button
                        onClick={() => handlePrimaryAction(item)}
                        className={cx(
                          "group/btn flex w-full items-center justify-between border px-6 py-4 transition-all duration-500",
                          isLocked
                            ? "border-amber-900/30 text-amber-700 hover:border-amber-500 hover:bg-amber-600 hover:text-black"
                            : "border-white/10 text-zinc-400 hover:border-white hover:bg-white hover:text-black",
                        )}
                      >
                        <span className="font-mono text-[10px] font-black uppercase tracking-[0.3em]">
                          {isLocked
                            ? "Elevate Clearance"
                            : item.kind === "brief"
                              ? "Open Briefing"
                              : item.kind === "download"
                                ? "Open Asset"
                                : "Open File"}
                        </span>

                        {isLocked ? (
                          <Lock size={14} />
                        ) : (
                          <ArrowRight
                            size={14}
                            className="transition-transform group-hover/btn:translate-x-1"
                          />
                        )}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {filteredItems.length === 0 ? (
            <div className="py-24 text-center">
              <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-zinc-600">
                No Registry Matches Found
              </p>
            </div>
          ) : null}

          <section className="mt-24 rounded-[2rem] border border-white/10 bg-white/[0.03] p-8 md:p-10">
            <div className="flex items-start gap-4">
              <div className="mt-0.5 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 text-amber-300">
                <Sparkles className="h-5 w-5" />
              </div>

              <div>
                <h2 className="font-serif text-3xl text-white">Why the Vault exists</h2>
                <p className="mt-4 max-w-3xl text-sm leading-relaxed text-white/65">
                  Because serious builders do not need more content. They need ordered material:
                  frameworks, briefings, templates, and strategic assets that can be read, applied,
                  revisited, and governed.
                </p>

                <div className="mt-6 grid gap-3 md:grid-cols-3">
                  {[
                    "Structured access, not content sprawl",
                    "Execution assets, not decorative downloads",
                    "Clear tiering, controlled escalation, institutional logic",
                  ].map((line) => (
                    <div key={line} className="flex items-start gap-3 text-sm text-white/60">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-amber-300/85" />
                      <span>{line}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </section>
      </main>
    </Layout>
  );
};

export default VaultPage;