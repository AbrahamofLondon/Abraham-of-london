// pages/canon/index.tsx
import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, Star, Search, ChevronRight } from "lucide-react";

import Layout from "@/components/Layout";
import CanonCard from "@/components/CanonCard";
import { getPublicCanon, resolveCanonSlug, type Canon } from "@/lib/canon";

type DeviceType = "mobile" | "tablet" | "desktop";
type ViewMode = "grid" | "list";

type CanonIndexItem = {
  slug: string;
  title: string;
  subtitle?: string | null;
  excerpt?: string | null;
  description?: string | null;
  coverImage?: string | null;
  volumeNumber?: number | null;
  date?: string | null;
  tags?: string[];
  featured?: boolean;
  accessLevel?: string | null;
  lockMessage?: string | null;
};

type PageProps = {
  items: CanonIndexItem[];
  maxVolume: number;
};

// -----------------------------
// Helpers
// -----------------------------

function toNumberOrNull(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value.trim());
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function useDeviceType(): DeviceType {
  const [deviceType, setDeviceType] = React.useState<DeviceType>("desktop");

  React.useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      if (w < 768) setDeviceType("mobile");
      else if (w < 1024) setDeviceType("tablet");
      else setDeviceType("desktop");
    };

    check();
    window.addEventListener("resize", check, { passive: true });
    return () => window.removeEventListener("resize", check);
  }, []);

  return deviceType;
}

function useReducedMotion(): boolean {
  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(Boolean(mq.matches));
    onChange();
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);
  return reduced;
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: (reduced: boolean) => ({
    opacity: 1,
    transition: reduced
      ? { duration: 0.01 }
      : { staggerChildren: 0.08, delayChildren: 0.12 },
  }),
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: (reduced: boolean) => ({
    opacity: 1,
    y: 0,
    transition: reduced ? { duration: 0.01 } : { duration: 0.45, ease: "easeOut" },
  }),
};

const CanonIndexPage: NextPage<PageProps> = ({ items, maxVolume }) => {
  const deviceType = useDeviceType();
  const reducedMotion = useReducedMotion();

  const [searchQuery, setSearchQuery] = React.useState("");
  const [showFeaturedOnly, setShowFeaturedOnly] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<ViewMode>("grid");

  // set viewMode based on device after mount (SSR-safe)
  React.useEffect(() => {
    setViewMode(deviceType === "mobile" ? "list" : "grid");
  }, [deviceType]);

  const filteredItems = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return items.filter((item) => {
      const matchesFeatured = !showFeaturedOnly || Boolean(item.featured);

      if (!q) return matchesFeatured;

      const hay = [
        item.title,
        item.subtitle ?? "",
        item.excerpt ?? "",
        item.description ?? "",
        (item.tags ?? []).join(" "),
        item.accessLevel ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return matchesFeatured && hay.includes(q);
    });
  }, [items, searchQuery, showFeaturedOnly]);

  const hasItems = filteredItems.length > 0;

  const totalSegments = 5;
  const activeSegments = Math.max(
    0,
    Math.min(totalSegments, maxVolume || filteredItems.length || 0),
  );
  const segments = React.useMemo(
    () => Array.from({ length: totalSegments }, (_, i) => i + 1),
    [],
  );

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org";

  return (
    <Layout
      title="The Canon"
      description="A curated canon of strategic, theological, and civilisational volumes - catalogued for serious builders and fathers who think in generations, not news cycles."
    >
      <Head>
        <title>The Canon | Abraham of London</title>
        <meta
          name="description"
          content="A curated canon of strategic, theological, and civilisational volumes - catalogued for serious builders and fathers who think in generations, not news cycles."
        />
        <link rel="canonical" href={`${siteUrl}/canon`} />
        <meta property="og:title" content="The Canon | Abraham of London" />
        <meta
          property="og:description"
          content="Harrods-library atmosphere. Ancient Near Eastern gravitas. Modern strategic intelligence. A living canon for men who build."
        />
        <meta property="og:url" content={`${siteUrl}/canon`} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={`${siteUrl}/api/og/canon?title=The%20Canon`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="The Canon | Abraham of London" />
        <meta
          name="twitter:description"
          content="A living library for men who build, father, and lead with purpose."
        />
      </Head>

      <main className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-gray-950">
        {/* HERO */}
        <section className="relative overflow-hidden border-b border-gray-800">
          <div className="absolute inset-0">
            <div className="absolute inset-x-0 -top-32 h-64 bg-[radial-gradient(circle_at_top,rgba(226,197,120,0.15),transparent_65%)]" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/85" />
            <div
              className="absolute inset-0 opacity-[0.06]"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)
                `,
                backgroundSize: "44px 44px",
              }}
            />
          </div>

          <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
            <motion.div
  variants={containerVariants}
  initial="hidden"
  animate="visible"
  custom={reducedMotion}
  className={
    viewMode === "grid"
      ? "grid gap-6 md:grid-cols-2 lg:grid-cols-3"
      : "space-y-4"
  }
>
  {filteredItems.map((item) => (
    <motion.div
      key={item.slug}
      variants={itemVariants}
      custom={reducedMotion}
      className={viewMode === "list" ? "max-w-3xl" : ""}
    >
      <CanonCard canon={item} />
    </motion.div>
  ))}
</motion.div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-4 lg:col-span-2">
                  <p className="text-lg leading-relaxed text-gray-300">
                    This is not a blog roll. It is a living library - volumes that sit at the
                    intersection of{" "}
                    <span className="font-medium text-amber-400">
                      theology, strategy, civilisation, and human destiny
                    </span>
                    . Each entry is catalogued, not casually posted.
                  </p>

                  <p className="text-sm leading-relaxed text-gray-400">
                    Think <strong className="text-white">Harrods Library</strong> meets{" "}
                    <strong className="text-white">Ancient Near Eastern gravitas</strong>, wrapped in{" "}
                    <strong className="text-white">modern strategic intelligence</strong>. Built for men
                    who lead, fathers who refuse to disappear, and builders who understand that
                    ideas outlive news cycles.
                  </p>
                </div>

                <motion.div
                  initial={reducedMotion ? false : { opacity: 0, x: 18 }}
                  animate={reducedMotion ? {} : { opacity: 1, x: 0 }}
                  transition={reducedMotion ? { duration: 0.01 } : { delay: 0.25 }}
                  className="rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900/80 to-black/80 p-6 backdrop-blur-sm"
                >
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                        Catalogued Volumes
                      </p>
                      <p className="mt-2 text-3xl font-bold text-white">
                        {String(items.length).padStart(2, "0")}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5">
                        {segments.map((seg) => {
                          const active = seg <= activeSegments;
                          return (
                            <div
                              key={seg}
                              className={`h-2 flex-1 rounded-full transition-all duration-200 ${
                                active
                                  ? "bg-gradient-to-r from-amber-500 to-amber-600"
                                  : "bg-gray-800"
                              }`}
                            />
                          );
                        })}
                      </div>
                      <p className="text-xs text-gray-400">
                        <span className="text-amber-400">Foundational pillars</span> in progress
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* CONTROLS */}
        <section
          className={[
            "z-10 border-b border-gray-800 bg-black/95 backdrop-blur-sm py-4",
            deviceType === "mobile" ? "relative" : "sticky top-0",
          ].join(" ")}
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="relative w-full max-w-md flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  placeholder="Search volumes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-gray-700 bg-gray-900/50 py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  aria-label="Search Canon volumes"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setShowFeaturedOnly((s) => !s)}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                    showFeaturedOnly
                      ? "border-amber-500/30 bg-amber-500/20 text-amber-400"
                      : "border-gray-700 text-gray-400 hover:bg-gray-800/50 hover:text-gray-300"
                  }`}
                  aria-pressed={showFeaturedOnly}
                >
                  <Star className="h-4 w-4" />
                  <span>Featured</span>
                </button>

                {deviceType !== "mobile" && (
                  <div className="flex rounded-lg border border-gray-700 bg-gray-900/50 p-1">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`rounded-md p-2 transition-colors ${
                        viewMode === "grid" ? "bg-amber-500 text-white" : "text-gray-400 hover:text-gray-300"
                      }`}
                      aria-label="Grid view"
                      aria-pressed={viewMode === "grid"}
                    >
                      <div className="grid h-4 w-4 grid-cols-2 gap-0.5">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="rounded-sm bg-current" />
                        ))}
                      </div>
                    </button>

                    <button
                      onClick={() => setViewMode("list")}
                      className={`rounded-md p-2 transition-colors ${
                        viewMode === "list" ? "bg-amber-500 text-white" : "text-gray-400 hover:text-gray-300"
                      }`}
                      aria-label="List view"
                      aria-pressed={viewMode === "list"}
                    >
                      <div className="flex h-4 w-4 flex-col justify-between">
                        <div className="h-0.5 w-full rounded bg-current" />
                        <div className="h-0.5 w-full rounded bg-current" />
                        <div className="h-0.5 w-full rounded bg-current" />
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* CONTENT */}
        <section className="py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {!hasItems ? (
              <motion.div
                initial={reducedMotion ? false : { opacity: 0 }}
                animate={reducedMotion ? {} : { opacity: 1 }}
                className="rounded-2xl border border-dashed border-gray-700 bg-gray-900/30 p-8 text-center"
              >
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-800">
                  <Search className="h-6 w-6 text-gray-400" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-white">No volumes found</h3>
                <p className="text-gray-400">
                  {searchQuery || showFeaturedOnly
                    ? "Try adjusting your search or filter criteria."
                    : "The catalogue is being prepared. Check back soon - or join the Inner Circle for early access."}
                </p>
                {(searchQuery || showFeaturedOnly) && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setShowFeaturedOnly(false);
                    }}
                    className="mt-4 text-sm font-medium text-amber-400 hover:text-amber-300"
                  >
                    Clear all filters
                  </button>
                )}
              </motion.div>
            ) : (
              <>
                <div className="mb-8 flex items-center justify-between">
                  <div>
                    <h2 className="font-serif text-2xl font-semibold text-white sm:text-3xl">
                      Catalogued Volumes
                    </h2>
                    <p className="mt-1 text-sm text-gray-400">
                      Showing{" "}
                      <span className="font-semibold text-white">{filteredItems.length}</span> of{" "}
                      <span className="font-semibold text-white">{items.length}</span> volumes
                    </p>
                  </div>
                  {filteredItems.length < items.length && (
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setShowFeaturedOnly(false);
                      }}
                      className="text-sm font-medium text-amber-400 hover:text-amber-300"
                    >
                      Clear filters
                    </button>
                  )}
                </div>

                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  custom={reducedMotion}
                  className={
                    viewMode === "grid"
                      ? "grid gap-6 md:grid-cols-2 lg:grid-cols-3"
                      : "space-y-4"
                  }
                >
                  {filteredItems.map((item) => (
                    <motion.div
                      key={item.slug}
                      variants={itemVariants}
                      custom={reducedMotion}
                      className={viewMode === "list" ? "max-w-3xl" : ""}
                    >
                      <CanonCard canon={item} variant={viewMode} />
                    </motion.div>
                  ))}
                </motion.div>
              </>
            )}

            {hasItems && (
              <motion.div
                initial={reducedMotion ? false : { opacity: 0, y: 14 }}
                animate={reducedMotion ? {} : { opacity: 1, y: 0 }}
                transition={reducedMotion ? { duration: 0.01 } : { delay: 0.25 }}
                className="mt-16 rounded-2xl border border-gray-800 bg-gradient-to-r from-gray-900 to-black p-8"
              >
                <div className="grid gap-6 md:grid-cols-2 md:items-center">
                  <div>
                    <h3 className="mb-3 font-serif text-2xl font-semibold text-white">
                      Want deeper access?
                    </h3>
                    <p className="text-gray-300">
                      Some volumes are reserved for the Inner Circle - early drafts, advanced
                      frameworks, and direct dialogue with Abraham.
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Link
                      href="/inner-circle"
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-amber-600"
                    >
                      Join Inner Circle
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                    <Link
                      href="/books/the-architecture-of-human-purpose"
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-amber-500/30 bg-transparent px-6 py-3 text-sm font-semibold text-amber-400 transition-colors hover:bg-amber-500/10"
                    >
                      Read Public Prelude
                      <BookOpen className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </section>
      </main>
    </Layout>
  );
};

export default CanonIndexPage;

export const getStaticProps: GetStaticProps<PageProps> = async () => {
  try {
    const docs: Canon[] = getPublicCanon();

    const items: CanonIndexItem[] = docs.map((doc) => {
      const vol = toNumberOrNull((doc as any).volumeNumber);

      return {
        slug: resolveCanonSlug(doc),
        title: doc.title ?? "Untitled Canon Volume",
        subtitle: (doc as any).subtitle ?? null,
        excerpt: (doc as any).excerpt ?? null,
        description: (doc as any).description ?? null,
        coverImage: (doc as any).coverImage ?? null,
        volumeNumber: vol,
        date: (doc as any).date ?? null,
        tags: Array.isArray((doc as any).tags) ? (doc as any).tags : [],
        featured: Boolean((doc as any).featured),
        accessLevel: (doc as any).accessLevel ?? null,
        lockMessage: (doc as any).lockMessage ?? null,
      };
    });

    items.sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;

      const volA = a.volumeNumber ?? Infinity;
      const volB = b.volumeNumber ?? Infinity;
      if (volA !== volB) return volA - volB;

      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });

    const volumeNumbers = items
      .map((it) => it.volumeNumber)
      .filter((v): v is number => typeof v === "number" && Number.isFinite(v));

    const maxVolume = volumeNumbers.length ? Math.max(...volumeNumbers) : 0;

    return { props: { items, maxVolume }, revalidate: 3600 };
  } catch (err) {
    console.error("Error in getStaticProps for /canon:", err);
    return { props: { items: [], maxVolume: 0 }, revalidate: 600 };
  }
};