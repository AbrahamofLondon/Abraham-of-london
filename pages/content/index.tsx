import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";

import {
  Search,
  Grid3x3,
  List,
  BookOpen,
  FileText,
  Download as DownloadIcon,
  Layers,
  Star,
} from "lucide-react";

import Layout from "@/components/Layout";
import SilentSurface from "@/components/ui/SilentSurface";

import {
  getAllContentlayerDocs,
  getCardPropsForDocument,
  type ContentlayerCardProps,
} from "@/lib/contentlayer-helper";

/* -------------------------------------------------------------------------- */
/* TYPES                                                                      */
/* -------------------------------------------------------------------------- */

type ContentKind =
  | "essay"
  | "book"
  | "download"
  | "event"
  | "print"
  | "resource"
  | "canon"
  | "strategy"
  | "short";

type FilterKey = ContentKind | "all" | "featured";
type ViewMode = "grid" | "list";

interface ContentResource extends ContentlayerCardProps {
  kind: ContentKind;
  href: string;
  year: string;
  featured: boolean;
  readTime: string | null;
  coverImage: string | null;
  author: string | null;
  category: string | null;
  tags: string[];
  date: string | null;
}

/* -------------------------------------------------------------------------- */
/* MAP CARD PROPS → CONTENT RESOURCE                                          */
/* -------------------------------------------------------------------------- */

const mapToResource = (card: ContentlayerCardProps): ContentResource => {
  let kind: ContentKind = "essay";

  if (card.type === "Book") kind = "book";
  else if (card.type === "Canon") kind = "canon";
  else if (card.type === "Download") kind = "download";
  else if (card.type === "Resource") kind = "resource";
  else if (card.type === "Print") kind = "print";
  else if (card.type === "Strategy") kind = "strategy";
  else if (card.type === "Short") kind = "short";
  else if (card.type === "Event") kind = "event";
  else if (card.tags?.some((t) => t.toLowerCase() === "essay")) kind = "essay";

  const hrefBase =
    kind === "canon"
      ? "/canon"
      : kind === "short"
      ? "/shorts"
      : `/${kind}s`;

  const href = `${hrefBase}/${card.slug}`;

  const year =
    card.date != null
      ? new Date(card.date).getFullYear().toString()
      : "Undated";

  return {
    ...card,
    kind,
    href,
    year,
    featured: card.featured ?? false,
    readTime: card.readTime ?? null,
    coverImage: card.image ?? null,
    author: card.author ?? null,
    category: card.category ?? null,
    tags: card.tags ?? [],
    date: card.date ?? null,
  };
};

/* -------------------------------------------------------------------------- */
/* GROUPING / STATS                                                           */
/* -------------------------------------------------------------------------- */

const organizeByCategories = (items: ContentResource[]) => {
  const kinds: ContentKind[] = [
    "essay",
    "book",
    "download",
    "event",
    "print",
    "resource",
    "canon",
    "strategy",
    "short",
  ];

  const byType: Record<ContentKind, ContentResource[]> = {} as any;
  kinds.forEach((k) => (byType[k] = []));

  const byYear: Record<string, ContentResource[]> = {};
  const featured: ContentResource[] = [];

  items.forEach((item) => {
    byType[item.kind].push(item);
    const year = item.year || "Undated";
    if (!byYear[year]) byYear[year] = [];
    byYear[year].push(item);
    if (item.featured) featured.push(item);
  });

  return { byType, byYear, featured };
};

/* -------------------------------------------------------------------------- */
/* STATIC PROPS                                                               */
/* -------------------------------------------------------------------------- */

export const getStaticProps: GetStaticProps = async () => {
  try {
    const docs = getAllContentlayerDocs();
    const cardProps = docs.map((d) => getCardPropsForDocument(d));
    const items = cardProps.map(mapToResource);
    const categories = organizeByCategories(items);

    const stats = {
      total: docs.length,
      essay: items.filter((i) => i.kind === "essay").length,
      book: items.filter((i) => i.kind === "book").length,
      download: items.filter((i) => i.kind === "download").length,
      event: items.filter((i) => i.kind === "event").length,
      print: items.filter((i) => i.kind === "print").length,
      resource: items.filter((i) => i.kind === "resource").length,
      canon: items.filter((i) => i.kind === "canon").length,
      strategy: items.filter((i) => i.kind === "strategy").length,
      short: items.filter((i) => i.kind === "short").length,
      featured: categories.featured.length,
      withImages: items.filter((i) => i.coverImage).length,
    };

    return {
      props: {
        items,
        contentStats: stats,
        categories: {
          type: categories.byType,
          year: categories.byYear,
          featured: categories.featured,
        },
      },
      revalidate: 3600,
    };
  } catch (e) {
    console.error("Error generating /content:", e);

    return {
      props: {
        items: [],
        contentStats: {
          total: 0,
          essay: 0,
          book: 0,
          download: 0,
          event: 0,
          print: 0,
          resource: 0,
          canon: 0,
          strategy: 0,
          short: 0,
          featured: 0,
          withImages: 0,
        },
        categories: {
          type: {
            essay: [],
            book: [],
            download: [],
            event: [],
            print: [],
            resource: [],
            canon: [],
            strategy: [],
            short: [],
          },
          year: {},
          featured: [],
        },
      },
    };
  }
};

/* -------------------------------------------------------------------------- */
/* UI COMPONENTS                                                              */
/* -------------------------------------------------------------------------- */

type StatItemProps = {
  label: string;
  value: number | string;
  helper?: string;
};

const StatItem: React.FC<StatItemProps> = ({ label, value, helper }) => (
  <div className="flex flex-col gap-1 rounded-md border border-white/10 bg-black/30 px-3 py-2 sm:px-4 sm:py-3">
    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-white/60">
      {label}
    </span>
    <span className="text-lg font-semibold text-[#F5F1E8] sm:text-2xl">
      {value}
    </span>
    {helper && (
      <span className="text-[0.7rem] text-white/50">{helper}</span>
    )}
  </div>
);

const kindLabel: Record<ContentKind, string> = {
  essay: "Essay",
  book: "Book",
  download: "Download",
  event: "Event",
  print: "Print",
  resource: "Resource",
  canon: "Canon",
  strategy: "Strategy",
  short: "Short",
};

const kindIcon: Partial<Record<ContentKind, React.ReactNode>> = {
  book: <BookOpen className="h-3 w-3" />,
  download: <DownloadIcon className="h-3 w-3" />,
  canon: <Layers className="h-3 w-3" />,
};

const ContentTypeBadge: React.FC<{ kind: ContentKind }> = ({ kind }) => {
  const base =
    "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.16em]";
  let color =
    "border-white/20 bg-white/5 text-white/70"; // default neutral

  if (kind === "canon")
    color = "border-amber-400/50 bg-amber-500/10 text-amber-300";
  else if (kind === "book")
    color = "border-amber-300/40 bg-amber-400/5 text-amber-200";
  else if (kind === "download")
    color = "border-emerald-300/40 bg-emerald-400/5 text-emerald-200";
  else if (kind === "short")
    color = "border-sky-300/40 bg-sky-400/5 text-sky-200";

  return (
    <span className={`${base} ${color}`}>
      {kindIcon[kind]}
      <span>{kindLabel[kind]}</span>
    </span>
  );
};

type UnifiedContentCardProps = {
  item: ContentResource;
  viewMode: ViewMode;
};

const UnifiedContentCard: React.FC<UnifiedContentCardProps> = ({
  item,
  viewMode,
}) => {
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <Link href={item.href} className="block h-full">
      <SilentSurface className="h-full">
        <article className="flex h-full flex-col gap-3 rounded-lg border border-white/10 bg-black/60 p-3 text-[#F5F1E8] transition hover:border-amber-400/60 hover:bg-black/80 sm:p-4">
          {children}
        </article>
      </SilentSurface>
    </Link>
  );

  if (viewMode === "list") {
    return (
      <Wrapper>
        <div className="flex gap-3 sm:gap-4">
          {item.coverImage && (
            <div className="relative h-16 w-12 flex-shrink-0 overflow-hidden rounded border border-white/10 bg-black">
              <Image
                src={item.coverImage}
                alt={item.title ?? ""}
                fill
                sizes="64px"
                className="object-cover"
              />
            </div>
          )}
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <ContentTypeBadge kind={item.kind} />
              {item.featured && (
                <span className="inline-flex items-center gap-1 text-[0.65rem] text-amber-300">
                  <Star className="h-3 w-3" />
                  Featured
                </span>
              )}
            </div>
            <h2 className="truncate font-serif text-base font-semibold">
              {item.title}
            </h2>
            {item.excerpt && (
              <p className="line-clamp-2 text-xs text-white/70">
                {item.excerpt}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2 text-[0.7rem] text-white/50">
              {item.author && <span>{item.author}</span>}
              {item.year && <span>· {item.year}</span>}
              {item.readTime && <span>· {item.readTime}</span>}
            </div>
          </div>
        </div>
      </Wrapper>
    );
  }

  // grid mode
  return (
    <Wrapper>
      {item.coverImage && (
        <div className="relative mb-2 h-36 w-full overflow-hidden rounded-md border border-white/10 bg-black">
          <Image
            src={item.coverImage}
            alt={item.title ?? ""}
            fill
            sizes="(max-width:768px) 100vw, 33vw"
            className="object-cover"
          />
        </div>
      )}
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <ContentTypeBadge kind={item.kind} />
        {item.featured && (
          <span className="inline-flex items-center gap-1 text-[0.65rem] text-amber-300">
            <Star className="h-3 w-3" />
            Featured
          </span>
        )}
      </div>
      <h2 className="mb-1 line-clamp-2 font-serif text-sm font-semibold sm:text-base">
        {item.title}
      </h2>
      {item.excerpt && (
        <p className="mb-2 line-clamp-3 text-xs text-white/70 sm:text-sm">
          {item.excerpt}
        </p>
      )}
      <div className="mt-auto flex flex-wrap items-center gap-2 text-[0.7rem] text-white/50">
        {item.author && <span>{item.author}</span>}
        {item.year && <span>· {item.year}</span>}
        {item.readTime && <span>· {item.readTime}</span>}
      </div>
    </Wrapper>
  );
};

/* -------------------------------------------------------------------------- */
/* MAIN PAGE COMPONENT                                                        */
/* -------------------------------------------------------------------------- */

const ContentPage: NextPage<any> = ({ items, contentStats }) => {
  const [viewMode, setViewMode] = React.useState<ViewMode>("grid");
  const [activeFilter, setActiveFilter] =
    React.useState<FilterKey>("all");
  const [searchQuery, setSearchQuery] = React.useState("");

  const filtered = React.useMemo(() => {
    let results = items as ContentResource[];

    if (activeFilter !== "all") {
      results =
        activeFilter === "featured"
          ? results.filter((i) => i.featured)
          : results.filter((i) => i.kind === activeFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      results = results.filter((item) => {
        const block = [
          item.title,
          item.description ?? "",
          item.excerpt ?? "",
          item.author ?? "",
          item.category ?? "",
          ...(item.tags || []),
        ]
          .join(" ")
          .toLowerCase();
        return block.includes(q);
      });
    }

    return results;
  }, [items, activeFilter, searchQuery]);

  const filterCounts: Record<FilterKey, number> = {
    all: contentStats.total,
    featured: contentStats.featured,
    essay: contentStats.essay,
    book: contentStats.book,
    download: contentStats.download,
    event: contentStats.event,
    print: contentStats.print,
    resource: contentStats.resource,
    canon: contentStats.canon,
    strategy: contentStats.strategy,
    short: contentStats.short,
  };

  return (
    <Layout
      title="Content Library"
      description="A premium collection of essays, frameworks, volumes, and tools for strategic thinkers and builders."
      className="bg-charcoal"
    >
      <Head>
        <title>Content Library | Abraham of London</title>
      </Head>

      {/* HERO */}
      <div className="relative overflow-hidden border-b border-white/10 bg-gradient-to-b from-black via-[#050608] to-black">
        <div className="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-4 font-serif text-4xl font-normal text-[#F5F1E8]">
              Content Library
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-base text-white/70">
              A well-organized collection of essays, frameworks, volumes, and
              tools for builders who think in systems, not slogans.
            </p>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="border-b border-white/10 bg-white/5">
        <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatItem
              label="Total pieces"
              value={contentStats.total}
              helper={`${contentStats.canon} canon · ${contentStats.book} books`}
            />
            <StatItem
              label="Essays & strategy"
              value={contentStats.essay + contentStats.strategy}
              helper={`${contentStats.essay} essays · ${contentStats.strategy} strategy notes`}
            />
            <StatItem
              label="Downloads & tools"
              value={contentStats.download}
              helper="PDFs, frameworks & checklists"
            />
            <StatItem
              label="With visuals"
              value={contentStats.withImages}
              helper="Cards with cover art or diagrams"
            />
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Search + View Controls */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search content..."
              className="w-full rounded-sm border border-white/15 bg-black/40 py-2 pl-10 pr-4 text-sm text-[#F5F1E8] placeholder:text-white/40"
            />
          </div>

          {/* View Toggle */}
          <div className="flex gap-2">
            <div className="flex items-center gap-1 rounded-sm border border-white/15 bg-black/40 p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`rounded-sm p-1 ${
                  viewMode === "grid"
                    ? "bg-white/20 text-[#F5F1E8]"
                    : "text-white/50"
                }`}
                aria-label="Grid view"
              >
                <Grid3x3 className="h-3 w-3" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`rounded-sm p-1 ${
                  viewMode === "list"
                    ? "bg-white/20 text-[#F5F1E8]"
                    : "text-white/50"
                }`}
                aria-label="List view"
              >
                <List className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-2 text-[0.7rem]">
          {(
            [
              "all",
              "featured",
              "canon",
              "book",
              "essay",
              "strategy",
              "short",
              "download",
              "resource",
              "print",
            ] as FilterKey[]
          ).map((key) => {
            const count = filterCounts[key] ?? 0;
            if (count === 0 && key !== "all" && key !== "featured") {
              return null;
            }

            const isActive = activeFilter === key;
            const label =
              key === "all"
                ? "All"
                : key === "featured"
                ? "Featured"
                : kindLabel[key as ContentKind];

            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveFilter(key)}
                className={`rounded-full border px-3 py-1 font-semibold uppercase tracking-[0.16em] ${
                  isActive
                    ? "border-amber-400 bg-amber-400 text-black"
                    : "border-white/20 bg-black/40 text-white/70 hover:border-amber-400 hover:text-amber-300"
                }`}
              >
                {label}
                {key !== "all" && (
                  <span className="ml-1 text-[0.65rem] opacity-80">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* RESULTS */}
        {filtered.length === 0 ? (
          <div className="rounded-lg border border-dashed border-white/20 bg-black/40 p-6 text-center text-sm text-white/60">
            No content matches this filter yet. Clear the search or choose a
            different category.
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((item: ContentResource) => (
              <UnifiedContentCard
                key={`${item.kind}:${item.slug}`}
                item={item}
                viewMode="grid"
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((item: ContentResource) => (
              <UnifiedContentCard
                key={`${item.kind}:${item.slug}`}
                item={item}
                viewMode="list"
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ContentPage;