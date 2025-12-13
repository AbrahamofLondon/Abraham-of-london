// pages/content/index.tsx – THE KINGDOM VAULT
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
  Archive,
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
// Type Configuration – Palace aesthetic
// -----------------------------

const TYPE_CONFIG: Record<
  DocKind,
  {
    label: string;
    pluralLabel: string;
    icon: React.ComponentType<{ className?: string }>;
    description: string;
    gradient: string;
    accentText: string;
    accentBg: string;
    accentBorder: string;
    pillBg: string;
    coverAspect: "wide" | "portrait";
    coverFit: "cover" | "contain";
  }
> = {
  post: {
    label: "Essay",
    pluralLabel: "Essays",
    icon: FileText,
    description: "Long-form thinking on strategy, purpose, and legacy.",
    gradient: "from-amber-50 to-amber-100/50",
    accentText: "text-amber-700",
    accentBg: "bg-amber-500/10",
    accentBorder: "border-amber-400/30",
    pillBg: "bg-amber-50/90",
    coverAspect: "wide",
    coverFit: "cover",
  },
  canon: {
    label: "Canon",
    pluralLabel: "Canon Entries",
    icon: Crown,
    description: "The philosophical spine. Foundation texts on governance and civilisation.",
    gradient: "from-yellow-50 to-yellow-100/50",
    accentText: "text-yellow-800",
    accentBg: "bg-yellow-500/10",
    accentBorder: "border-yellow-400/30",
    pillBg: "bg-yellow-50/90",
    coverAspect: "wide",
    coverFit: "cover",
  },
  resource: {
    label: "Resource",
    pluralLabel: "Resources",
    icon: Layers,
    description: "Templates, frameworks, and tools for builders.",
    gradient: "from-emerald-50 to-emerald-100/50",
    accentText: "text-emerald-700",
    accentBg: "bg-emerald-500/10",
    accentBorder: "border-emerald-400/30",
    pillBg: "bg-emerald-50/90",
    coverAspect: "wide",
    coverFit: "cover",
  },
  download: {
    label: "Download",
    pluralLabel: "Downloads",
    icon: Download,
    description: "PDFs, guides, and reference materials.",
    gradient: "from-blue-50 to-blue-100/50",
    accentText: "text-blue-700",
    accentBg: "bg-blue-500/10",
    accentBorder: "border-blue-400/30",
    pillBg: "bg-blue-50/90",
    coverAspect: "wide",
    coverFit: "cover",
  },
  print: {
    label: "Print",
    pluralLabel: "Prints",
    icon: Palette,
    description: "Art, typography, and visual artifacts.",
    gradient: "from-rose-50 to-rose-100/50",
    accentText: "text-rose-700",
    accentBg: "bg-rose-500/10",
    accentBorder: "border-rose-400/30",
    pillBg: "bg-rose-50/90",
    coverAspect: "portrait",
    coverFit: "contain",
  },
  book: {
    label: "Book",
    pluralLabel: "Books",
    icon: BookMarked,
    description: "Published works and books in development.",
    gradient: "from-violet-50 to-violet-100/50",
    accentText: "text-violet-700",
    accentBg: "bg-violet-500/10",
    accentBorder: "border-violet-400/30",
    pillBg: "bg-violet-50/90",
    coverAspect: "portrait",
    coverFit: "contain",
  },
  event: {
    label: "Event",
    pluralLabel: "Events",
    icon: Calendar,
    description: "Rooms, sessions, and gatherings.",
    gradient: "from-cyan-50 to-cyan-100/50",
    accentText: "text-cyan-700",
    accentBg: "bg-cyan-500/10",
    accentBorder: "border-cyan-400/30",
    pillBg: "bg-cyan-50/90",
    coverAspect: "wide",
    coverFit: "cover",
  },
  short: {
    label: "Short",
    pluralLabel: "Shorts",
    icon: Zap,
    description: "Quick field notes for men who don't scroll all day.",
    gradient: "from-orange-50 to-orange-100/50",
    accentText: "text-orange-700",
    accentBg: "bg-orange-500/10",
    accentBorder: "border-orange-400/30",
    pillBg: "bg-orange-50/90",
    coverAspect: "wide",
    coverFit: "cover",
  },
  strategy: {
    label: "Strategy",
    pluralLabel: "Strategy",
    icon: Target,
    description: "Operating frameworks and strategic tools.",
    gradient: "from-teal-50 to-teal-100/50",
    accentText: "text-teal-700",
    accentBg: "bg-teal-500/10",
    accentBorder: "border-teal-400/30",
    pillBg: "bg-teal-50/90",
    coverAspect: "wide",
    coverFit: "cover",
  },
};

// -----------------------------
// Helper functions
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

// -----------------------------
// Section Divider
// -----------------------------

const SectionDivider: React.FC<{ accent?: string }> = ({ accent = "amber" }) => {
  const colorClass =
    accent === "amber"
      ? "bg-amber-400/40"
      : accent === "emerald"
      ? "bg-emerald-400/40"
      : "bg-neutral-400/40";

  return (
    <div className="relative h-16 overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-px w-24 bg-gradient-to-r from-transparent via-neutral-300 to-transparent" />
        <div className="mx-6 flex items-center gap-2.5">
          <div className={`h-1.5 w-1.5 rounded-full ${colorClass}`} />
          <div className="h-1 w-1 rounded-full bg-neutral-300/60" />
          <div className={`h-1.5 w-1.5 rounded-full ${colorClass}`} />
        </div>
        <div className="h-px w-24 bg-gradient-to-r from-transparent via-neutral-300 to-transparent" />
      </div>
    </div>
  );
};

// -----------------------------
// Type Section Component
// -----------------------------

interface TypeSectionProps {
  kind: DocKind;
  docs: ContentlayerCardProps[];
  config: (typeof TYPE_CONFIG)[DocKind];
}

const TypeSection: React.FC<TypeSectionProps> = ({ kind, docs, config }) => {
  const IconComponent = config.icon;

  if (docs.length === 0) return null;

  return (
    <section id={kind} className="scroll-mt-20">
      {/* Section Header */}
      <div className="mb-10">
        <div className="mb-4 flex items-center gap-3">
          <div className={`rounded-xl p-3 ${config.accentBg}`}>
            <IconComponent className={`h-6 w-6 ${config.accentText}`} />
          </div>
          <div>
            <h2 className="font-serif text-3xl font-semibold tracking-tight text-neutral-900">
              {config.pluralLabel}
            </h2>
            <p className="text-sm text-neutral-600">{docs.length} items</p>
          </div>
        </div>
        <p className="max-w-2xl text-base leading-relaxed text-neutral-700">
          {config.description}
        </p>
      </div>

      {/* Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {docs.map((doc) => {
          const coverAspectClass =
            config.coverAspect === "portrait" ? "aspect-[3/4]" : "aspect-[16/10]";

          const objectClass =
            config.coverFit === "contain" ? "object-contain" : "object-cover";

          const date = fmtDate(doc.date);
          const img = doc.image || FALLBACK_IMAGE;

          return (
            <motion.div
              key={`${doc.type}-${doc.slug}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="h-full"
            >
              <Link href={doc.href} className="group block h-full">
                <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:border-neutral-300 hover:shadow-xl">
                  {/* Cover */}
                  <div
                    className={`relative ${coverAspectClass} w-full overflow-hidden bg-gradient-to-br from-neutral-50 to-neutral-100`}
                  >
                    <Image
                      src={img}
                      alt={doc.title}
                      fill
                      className={`${objectClass} transition duration-500 group-hover:scale-[1.03]`}
                      sizes="(min-width: 1280px) 300px, (min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                    {/* Type pill */}
                    <div className="absolute left-3 top-3">
                      <span
                        className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold backdrop-blur-sm ${config.pillBg} ${config.accentText} ${config.accentBorder}`}
                      >
                        <IconComponent className="h-3.5 w-3.5" />
                        {config.label}
                      </span>
                    </div>

                    {/* Featured badge */}
                    {doc.featured && (
                      <div className="absolute right-3 top-3">
                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/60 bg-amber-500/90 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                          <Sparkles className="h-3 w-3" />
                          Featured
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="mb-2 line-clamp-2 font-serif text-lg font-semibold leading-snug text-neutral-900 transition group-hover:text-neutral-700">
                      {doc.title}
                    </h3>

                    {(doc.subtitle || doc.excerpt || doc.description) && (
                      <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-neutral-600">
                        {doc.subtitle || doc.excerpt || doc.description}
                      </p>
                    )}

                    {/* Tags */}
                    {doc.tags && doc.tags.length > 0 && (
                      <div className="mb-4 flex flex-wrap gap-2">
                        {doc.tags.slice(0, 3).map((t) => (
                          <span
                            key={t}
                            className="rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-xs font-medium text-neutral-600"
                          >
                            {t}
                          </span>
                        ))}
                        {doc.tags.length > 3 && (
                          <span className="rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-xs text-neutral-400">
                            +{doc.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="mt-auto flex items-center justify-between border-t border-neutral-100 pt-4">
                      <div className="flex items-center gap-3">
                        {date && (
                          <span className="text-xs font-medium text-neutral-500">
                            {date}
                          </span>
                        )}
                        {doc.downloadUrl && (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700">
                            <Download className="h-3.5 w-3.5" />
                            PDF
                          </span>
                        )}
                      </div>

                      <span
                        className={`inline-flex items-center gap-1 text-sm font-semibold ${config.accentText}`}
                      >
                        View
                        <ChevronRight className="h-4 w-4" />
                      </span>
                    </div>
                  </div>
                </article>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};

// -----------------------------
// Page Component
// -----------------------------

const ContentIndexPage: NextPage<ContentPageProps> = ({ docsByType }) => {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [activeType, setActiveType] = React.useState<DocKind | "all">("all");

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
    []
  );

  const allDocs = React.useMemo(() => {
    return allKinds.flatMap((k) => docsByType[k] ?? []);
  }, [docsByType, allKinds]);

  const typeCounts = React.useMemo(() => {
    const counts: Record<string, number> = { all: allDocs.length };
    allKinds.forEach((k) => {
      counts[k] = (docsByType[k] ?? []).length;
    });
    return counts;
  }, [docsByType, allDocs, allKinds]);

  const filteredTypes = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const result: Record<DocKind, ContentlayerCardProps[]> = {} as any;

    allKinds.forEach((kind) => {
      const docs = docsByType[kind] ?? [];
      if (docs.length === 0) return;

      if (!q) {
        result[kind] = docs;
        return;
      }

      const filtered = docs.filter((doc) => {
        const hay = [
          doc.title,
          doc.subtitle ?? "",
          doc.excerpt ?? "",
          doc.description ?? "",
          (doc.tags ?? []).join(" "),
        ]
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      });

      if (filtered.length > 0) {
        result[kind] = filtered;
      }
    });

    return result;
  }, [allKinds, docsByType, searchQuery]);

  const totalFiltered = React.useMemo(() => {
    return Object.values(filteredTypes).reduce((sum, docs) => sum + docs.length, 0);
  }, [filteredTypes]);

  const visibleKinds = React.useMemo(() => {
    return allKinds.filter((k) => (filteredTypes[k]?.length ?? 0) > 0);
  }, [allKinds, filteredTypes]);

  // Scroll to type section
  const scrollToType = (kind: DocKind) => {
    const element = document.getElementById(kind);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <Layout title="Archive">
      <main className="min-h-screen bg-white">
        {/* HERO */}
        <section className="relative border-b border-neutral-200 bg-gradient-to-b from-white to-neutral-50/50">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(212,175,55,0.05)_0%,transparent_60%)]" />
          
          <div className="relative mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-24">
            <div className="max-w-4xl">
              <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-neutral-200 bg-white/80 px-4 py-2.5 shadow-sm backdrop-blur-sm">
                <Archive className="h-4 w-4 text-neutral-700" />
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-700">
                  The Kingdom Vault
                </span>
                <span className="rounded-full bg-neutral-900 px-2 py-0.5 text-xs font-bold text-white">
                  {typeCounts.all}
                </span>
              </div>

              <h1 className="mb-5 font-serif text-5xl font-semibold tracking-tight text-neutral-900 sm:text-6xl">
                Everything. Organised.
              </h1>

              <p className="mb-10 text-lg leading-relaxed text-neutral-700">
                Essays, Canon volumes, resources, downloads, prints, books,
                events, shorts, strategy — each with its place, each with its
                purpose.
              </p>

              {/* SEARCH */}
              <div className="relative">
                <div className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2">
                  <Search className="h-5 w-5 text-neutral-400" />
                </div>

                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search across all collections..."
                  className="w-full rounded-2xl border border-neutral-300 bg-white py-4 pl-14 pr-14 text-base text-neutral-900 shadow-sm outline-none transition focus:border-neutral-400 focus:ring-4 focus:ring-neutral-100"
                />

                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-4 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 transition hover:bg-neutral-200 hover:text-neutral-800"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {searchQuery && (
                <div className="mt-4 text-sm text-neutral-600">
                  Showing{" "}
                  <span className="font-semibold text-neutral-900">
                    {totalFiltered}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-neutral-900">
                    {typeCounts.all}
                  </span>{" "}
                  items
                </div>
              )}
            </div>
          </div>
        </section>

        {/* QUICK NAVIGATION */}
        <section className="sticky top-0 z-10 border-b border-neutral-200 bg-white/95 backdrop-blur-md">
          <div className="mx-auto max-w-7xl px-6 py-4 lg:px-8">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {allKinds.map((kind) => {
                const count = typeCounts[kind] || 0;
                if (count === 0) return null;

                const cfg = TYPE_CONFIG[kind];
                const IconComponent = cfg.icon;
                const isVisible = visibleKinds.includes(kind);

                return (
                  <button
                    key={kind}
                    onClick={() => scrollToType(kind)}
                    disabled={!isVisible}
                    className={`inline-flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                      isVisible
                        ? `${cfg.pillBg} ${cfg.accentText} ${cfg.accentBorder} hover:shadow-sm`
                        : "border-neutral-200 bg-neutral-50 text-neutral-400"
                    }`}
                  >
                    <IconComponent className="h-4 w-4" />
                    {cfg.pluralLabel}
                    <span className="text-xs opacity-70">
                      ({isVisible ? filteredTypes[kind]?.length ?? 0 : count})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* CONTENT SECTIONS */}
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
          {visibleKinds.length > 0 ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={searchQuery}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-16"
              >
                {visibleKinds.map((kind, index) => (
                  <React.Fragment key={kind}>
                    <TypeSection
                      kind={kind}
                      docs={filteredTypes[kind] ?? []}
                      config={TYPE_CONFIG[kind]}
                    />
                    {index < visibleKinds.length - 1 && <SectionDivider />}
                  </React.Fragment>
                ))}
              </motion.div>
            </AnimatePresence>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              className="rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50/40 p-16"
            >
              <div className="mx-auto max-w-md text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-neutral-200 bg-white shadow-sm">
                  <Search className="h-8 w-8 text-neutral-300" />
                </div>
                <h3 className="mb-3 font-serif text-2xl font-semibold text-neutral-900">
                  No results found
                </h3>
                <p className="mb-8 text-neutral-600">
                  Try adjusting your search terms or browse all collections.
                </p>
                <button
                  onClick={() => setSearchQuery("")}
                  className="inline-flex items-center gap-2 rounded-xl border border-neutral-300 bg-white px-6 py-3 text-sm font-semibold text-neutral-700 shadow-sm transition hover:bg-neutral-50"
                >
                  <X className="h-4 w-4" />
                  Clear search
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </Layout>
  );
};

// -----------------------------
// Data Fetching
// -----------------------------

export const getStaticProps: GetStaticProps<ContentPageProps> = async () => {
  const publishedBuckets = getPublishedDocumentsByType();

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
    docsByType[kind] = (publishedBuckets[kind] ?? []).map(
      getCardPropsForDocument
    );
  });

  return { props: { docsByType }, revalidate: 60 };
};

export default ContentIndexPage;