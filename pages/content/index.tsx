// pages/content/index.tsx
import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ChevronRight,
  Download,
  Calendar,
  FileText,
  Crown,
  BookMarked,
  Palette,
  Target,
  Zap,
  Layers,
  X,
  Sparkles,
} from "lucide-react";

import Layout from "@/components/Layout";
import {
  getPublishedDocumentsByType,
  getCardPropsForDocument,
  type ContentlayerCardProps,
  type DocKind,
} from "@/lib/contentlayer-helper";

type ContentPageProps = {
  docsByType: Record<DocKind, ContentlayerCardProps[]>;
};

const FALLBACK_IMAGE = "/assets/images/writing-desk.webp";

// -----------------------------
// Type Configuration
// -----------------------------

const TYPE_CONFIG: Record<
  DocKind,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    accent: string;
    pillBg: string;
    pillBorder: string;

    // cover strategy
    coverAspect: "wide" | "portrait";
    coverFit: "cover" | "contain";
  }
> = {
  post: {
    label: "Essays",
    icon: FileText,
    accent: "text-amber-700",
    pillBg: "bg-amber-50/80",
    pillBorder: "border-amber-200/70",
    coverAspect: "wide",
    coverFit: "cover",
  },
  canon: {
    label: "Canon",
    icon: Crown,
    accent: "text-yellow-700",
    pillBg: "bg-yellow-50/80",
    pillBorder: "border-yellow-200/70",
    coverAspect: "wide",
    coverFit: "cover",
  },
  resource: {
    label: "Resources",
    icon: Layers,
    accent: "text-emerald-700",
    pillBg: "bg-emerald-50/80",
    pillBorder: "border-emerald-200/70",
    coverAspect: "wide",
    coverFit: "cover",
  },
  download: {
    label: "Downloads",
    icon: Download,
    accent: "text-blue-700",
    pillBg: "bg-blue-50/80",
    pillBorder: "border-blue-200/70",
    coverAspect: "wide",
    coverFit: "cover",
  },
  print: {
    label: "Prints",
    icon: Palette,
    accent: "text-rose-700",
    pillBg: "bg-rose-50/80",
    pillBorder: "border-rose-200/70",
    coverAspect: "portrait",
    coverFit: "contain",
  },
  book: {
    label: "Books",
    icon: BookMarked,
    accent: "text-violet-700",
    pillBg: "bg-violet-50/80",
    pillBorder: "border-violet-200/70",
    coverAspect: "portrait",
    coverFit: "contain",
  },
  event: {
    label: "Events",
    icon: Calendar,
    accent: "text-cyan-700",
    pillBg: "bg-cyan-50/80",
    pillBorder: "border-cyan-200/70",
    coverAspect: "wide",
    coverFit: "cover",
  },
  short: {
    label: "Shorts",
    icon: Zap,
    accent: "text-orange-700",
    pillBg: "bg-orange-50/80",
    pillBorder: "border-orange-200/70",
    coverAspect: "wide",
    coverFit: "cover",
  },
  strategy: {
    label: "Strategy",
    icon: Target,
    accent: "text-teal-700",
    pillBg: "bg-teal-50/80",
    pillBorder: "border-teal-200/70",
    coverAspect: "wide",
    coverFit: "cover",
  },
};

// -----------------------------
// helpers
// -----------------------------

function fmtDate(d?: string | null) {
  if (!d) return null;
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return null;
  return dt.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function scoreDoc(doc: ContentlayerCardProps) {
  // Featured first; then newest first where date exists
  const featuredBoost = doc.featured ? 10_000_000_000 : 0;
  const dateScore = doc.date ? Date.parse(doc.date) || 0 : 0;
  return featuredBoost + dateScore;
}

// -----------------------------
// Page Component
// -----------------------------

const ContentIndexPage: NextPage<ContentPageProps> = ({ docsByType }) => {
  const [filter, setFilter] = React.useState<DocKind | "all">("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [featuredFirst, setFeaturedFirst] = React.useState(true);

  const allKinds: DocKind[] = React.useMemo(
    () => [
      "post",
      "canon",
      "resource",
      "download",
      "print",
      "book",
      "event",
      "short",
      "strategy",
    ],
    [],
  );

  const allDocs = React.useMemo(() => {
    const merged = allKinds.flatMap((k) => docsByType[k] ?? []);
    // stable sort
    return merged.slice().sort((a, b) => {
      if (!featuredFirst) return 0;
      return scoreDoc(b) - scoreDoc(a);
    });
  }, [docsByType, allKinds, featuredFirst]);

  const typeCounts = React.useMemo(() => {
    const counts: Record<string, number> = { all: allDocs.length };
    allKinds.forEach((k) => {
      counts[k] = (docsByType[k] ?? []).length;
    });
    return counts;
  }, [docsByType, allDocs, allKinds]);

  const filteredDocs = React.useMemo(() => {
    const source = filter === "all" ? allDocs : docsByType[filter] ?? [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return source;

    return source.filter((doc) => {
      const hay = [
        doc.title,
        doc.subtitle ?? "",
        doc.excerpt ?? "",
        doc.description ?? "",
        (doc.tags ?? []).join(" "),
        doc.type,
      ]
        .join(" ")
        .toLowerCase();

      return hay.includes(q);
    });
  }, [allDocs, docsByType, filter, searchQuery]);

  return (
    <Layout title="Archive">
      <main className="min-h-screen bg-white">
        {/* HERO */}
        <section className="relative border-b border-neutral-200/70 bg-white">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(212,175,55,0.06)_0%,transparent_55%)]" />
          <div className="relative mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
            <div className="max-w-3xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-neutral-200/70 bg-white/80 px-4 py-2 shadow-sm backdrop-blur">
                <Sparkles className="h-4 w-4 text-neutral-800" />
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-700">
                  The Archive
                </span>
                <span className="text-xs text-neutral-400">
                  ({typeCounts.all})
                </span>
              </div>

              <h1 className="font-serif text-4xl font-semibold tracking-tight text-neutral-900 sm:text-5xl">
                Everything. Organised.
              </h1>

              <p className="mt-4 text-base leading-relaxed text-neutral-600 sm:text-lg">
                Essays, Canon volumes, resources, downloads, prints, books,
                events, shorts, strategy — searchable and cleanly indexed.
              </p>

              {/* SEARCH */}
              <div className="mt-8">
                <div className="relative">
                  <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
                    <Search className="h-5 w-5 text-neutral-400" />
                  </div>

                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search titles, tags, descriptions…"
                    className="w-full rounded-2xl border border-neutral-300/80 bg-white py-4 pl-12 pr-12 text-sm text-neutral-900 shadow-sm outline-none transition focus:border-neutral-400 focus:ring-4 focus:ring-neutral-100"
                  />

                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 transition hover:bg-neutral-200 hover:text-neutral-800"
                      aria-label="Clear search"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Toggles */}
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => setFeaturedFirst((v) => !v)}
                    className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-semibold transition ${
                      featuredFirst
                        ? "border-neutral-300 bg-neutral-900 text-white shadow-sm"
                        : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300"
                    }`}
                  >
                    <Sparkles className="h-4 w-4" />
                    Featured first
                  </button>

                  <div className="text-xs text-neutral-500">
                    Showing{" "}
                    <span className="font-semibold text-neutral-900">
                      {filteredDocs.length}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold text-neutral-900">
                      {typeCounts.all}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FILTERS + GRID */}
        <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-14">
          {/* Filter pills */}
          <div className="mb-8 flex flex-wrap gap-2.5">
            <button
              onClick={() => setFilter("all")}
              className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
                filter === "all"
                  ? "bg-neutral-900 text-white shadow-sm"
                  : "border border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300"
              }`}
            >
              All <span className="opacity-70">({typeCounts.all})</span>
            </button>

            {allKinds.map((kind) => {
              const count = typeCounts[kind] || 0;
              if (!count) return null;

              const cfg = TYPE_CONFIG[kind];
              const Icon = cfg.icon;
              const active = filter === kind;

              return (
                <button
                  key={kind}
                  onClick={() => setFilter(kind)}
                  className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-semibold transition ${
                    active
                      ? `${cfg.pillBg} ${cfg.accent} ${cfg.pillBorder} shadow-sm`
                      : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${active ? cfg.accent : "text-neutral-500"}`} />
                  {cfg.label}
                  <span className="text-neutral-400">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Grid */}
          <AnimatePresence mode="wait">
            {filteredDocs.length ? (
              <motion.div
                key={`${filter}-${featuredFirst}-${searchQuery}`}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              >
                {filteredDocs.map((doc) => {
                  const cfg = TYPE_CONFIG[doc.type];
                  const Icon = cfg.icon;

                  const coverAspectClass =
                    cfg.coverAspect === "portrait"
                      ? "aspect-[3/4]"
                      : "aspect-[16/10]";

                  const objectClass =
                    cfg.coverFit === "contain" ? "object-contain" : "object-cover";

                  const date = fmtDate(doc.date);
                  const img = doc.image || FALLBACK_IMAGE;

                  return (
                    <motion.div
                      key={`${doc.type}-${doc.slug}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      className="h-full"
                    >
                      <Link href={doc.href} className="group block h-full">
                        <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200/70 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-lg">
                          {/* cover */}
                          <div
                            className={`relative ${coverAspectClass} w-full overflow-hidden bg-gradient-to-br from-neutral-50 to-neutral-100`}
                          >
                            <Image
                              src={img}
                              alt={doc.title}
                              fill
                              className={`${objectClass} p-0 transition duration-500 group-hover:scale-[1.02]`}
                              sizes="(min-width: 1280px) 300px, (min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                            />
                            {/* subtle overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/18 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                            {/* type pill */}
                            <div className="absolute left-3 top-3">
                              <span
                                className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-[11px] font-semibold ${cfg.pillBg} ${cfg.accent} ${cfg.pillBorder}`}
                              >
                                <Icon className="h-3.5 w-3.5" />
                                {cfg.label}
                              </span>
                            </div>
                          </div>

                          {/* body */}
                          <div className="flex flex-1 flex-col p-5">
                            <div className="flex items-start justify-between gap-3">
                              <h3 className="font-serif text-base font-semibold leading-snug text-neutral-900 transition group-hover:text-neutral-700">
                                {doc.title}
                              </h3>
                              {doc.featured && (
                                <span className="shrink-0 rounded-full border border-neutral-200 bg-white px-2 py-1 text-[10px] font-semibold text-neutral-700">
                                  Featured
                                </span>
                              )}
                            </div>

                            {(doc.subtitle || doc.excerpt || doc.description) && (
                              <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-neutral-600">
                                {doc.subtitle || doc.excerpt || doc.description}
                              </p>
                            )}

                            {/* tags */}
                            {doc.tags?.length ? (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {doc.tags.slice(0, 3).map((t) => (
                                  <span
                                    key={t}
                                    className="rounded-lg border border-neutral-200/60 bg-neutral-50 px-2.5 py-1 text-[11px] font-medium text-neutral-600"
                                  >
                                    {t}
                                  </span>
                                ))}
                                {doc.tags.length > 3 && (
                                  <span className="rounded-lg border border-neutral-200/60 bg-neutral-50 px-2.5 py-1 text-[11px] text-neutral-400">
                                    +{doc.tags.length - 3}
                                  </span>
                                )}
                              </div>
                            ) : null}

                            {/* footer */}
                            <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-4">
                              <div className="flex items-center gap-2">
                                {date ? (
                                  <span className="text-[11px] font-medium text-neutral-500">
                                    {date}
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-neutral-400">
                                    —
                                  </span>
                                )}

                                {doc.downloadUrl ? (
                                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-blue-700">
                                    <Download className="h-3.5 w-3.5" />
                                    PDF
                                  </span>
                                ) : null}
                              </div>

                              <span
                                className={`inline-flex items-center gap-1.5 text-xs font-semibold ${cfg.accent}`}
                              >
                                View <ChevronRight className="h-4 w-4" />
                              </span>
                            </div>
                          </div>
                        </article>
                      </Link>
                    </motion.div>
                  );
                })}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
                className="rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50/40 p-14"
              >
                <div className="mx-auto max-w-md text-center">
                  <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-neutral-200 bg-white shadow-sm">
                    <Search className="h-7 w-7 text-neutral-300" />
                  </div>
                  <h3 className="font-serif text-2xl font-semibold text-neutral-900">
                    No results
                  </h3>
                  <p className="mt-2 text-sm text-neutral-600">
                    Adjust your search or switch the content type filter.
                  </p>

                  <div className="mt-7 flex justify-center">
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setFilter("all");
                      }}
                      className="inline-flex items-center gap-2 rounded-xl border border-neutral-300 bg-white px-5 py-2.5 text-xs font-semibold text-neutral-700 shadow-sm transition hover:bg-neutral-50"
                    >
                      <X className="h-4 w-4" />
                      Reset
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>
    </Layout>
  );
};

// -----------------------------
// Data Fetching
// -----------------------------

export const getStaticProps: GetStaticProps<ContentPageProps> = async () => {
  const publishedBuckets = getPublishedDocumentsByType();

  // TEMP DEBUG (remove later)
  console.log("[archive] counts", Object.fromEntries(
    Object.entries(publishedBuckets).map(([k,v]) => [k, v.length])
  ));

  const docsByType: Record<DocKind, ContentlayerCardProps[]> = {
    post: [],
    canon: [],
    resource: [],
    download: [],
    print: [],
    book: [],
    event: [],
    short: [],
    strategy: [],
  };

  (Object.keys(docsByType) as DocKind[]).forEach((kind) => {
    docsByType[kind] = (publishedBuckets[kind] ?? []).map(getCardPropsForDocument);
  });

  return { props: { docsByType }, revalidate: 60 };
};

export default ContentIndexPage;