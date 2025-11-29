// pages/content.tsx
import type { GetStaticProps, NextPage } from "next";
import * as React from "react";
import Head from "next/head";
import Link from "next/link";

import Layout from "@/components/Layout";

import { getAllPostsMeta } from "@/lib/server/posts-data";
import { getAllDownloadsMeta } from "@/lib/server/downloads-data";
import { getAllBooksMeta } from "@/lib/server/books-data";
import { getAllContent } from "@/lib/mdx";

// ---------------------------------------------------------------------------
// Design & Data Types
// ---------------------------------------------------------------------------

type ContentKind =
  | "blog"
  | "book"
  | "download"
  | "event"
  | "print"
  | "resource";

interface RawContentItem {
  slug?: string;
  title?: string;
  date?: string;
  excerpt?: string;
  description?: string;
  category?: string;
  tags?: (string | number)[]; // Fixed: Allow numbers in tags
  featured?: boolean;
  readTime?: string | number;
  _raw?: { flattenedPath?: string };
  eventDate?: string;
  fileSize?: string;
}

interface ContentResource {
  kind: ContentKind;
  title: string;
  slug: string;
  href: string;
  date?: string;
  excerpt?: string;
  description?: string;
  category?: string;
  tags: string[];
  featured?: boolean;
  readTime?: string | number;
}

interface ContentPageProps {
  items: ContentResource[];
  featuredItems: ContentResource[];
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

const StyledIcon: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "h-6 w-6" }) => (
  <div
    className={`transform transition-all duration-700 ease-in-out ${className}`}
  >
    {children}
  </div>
);

const BlogIcon = ({ className }: { className?: string }) => (
  <StyledIcon className={className}>
    <svg
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      className="stroke-current"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.2}
        d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9m0 0v12"
      />
    </svg>
  </StyledIcon>
);

const BookIcon = ({ className }: { className?: string }) => (
  <StyledIcon className={className}>
    <svg
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      className="stroke-current"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.2}
        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
      />
    </svg>
  </StyledIcon>
);

const DownloadIcon = ({ className }: { className?: string }) => (
  <StyledIcon className={className}>
    <svg
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      className="stroke-current"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.2}
        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
      />
    </svg>
  </StyledIcon>
);

const EventIcon = ({ className }: { className?: string }) => (
  <StyledIcon className={className}>
    <svg
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      className="stroke-current"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.2}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  </StyledIcon>
);

const PrintIcon = ({ className }: { className?: string }) => (
  <StyledIcon className={className}>
    <svg
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      className="stroke-current"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.2}
        d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
      />
    </svg>
  </StyledIcon>
);

const ResourceIcon = ({ className }: { className?: string }) => (
  <StyledIcon className={className}>
    <svg
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      className="stroke-current"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  </StyledIcon>
);

const ArrowIcon = ({ className = "ml-3 h-4 w-4" }: { className?: string }) => (
  <svg
    className={`transform transition-all duration-700 ease-out ${className}`}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M14 5l7 7m0 0l-7 7m7-7H3"
    />
  </svg>
);

const ContentIcons: Record<ContentKind, React.ReactElement> = {
  blog: <BlogIcon />,
  book: <BookIcon />,
  download: <DownloadIcon />,
  event: <EventIcon />,
  print: <PrintIcon />,
  resource: <ResourceIcon />,
};

// ---------------------------------------------------------------------------
// Aesthetic System
// ---------------------------------------------------------------------------

const kindOrder: ContentKind[] = [
  "blog",
  "book",
  "download",
  "event",
  "print",
  "resource",
];

const kindLabels: Record<ContentKind, string> = {
  blog: "Strategic Essays",
  book: "Curated Volumes",
  download: "Execution Tools",
  event: "Live Sessions",
  print: "Print Editions",
  resource: "Core Resources",
} as const;

const getKindSubtleGradient = (kind: ContentKind): string => {
  const gradients: Record<ContentKind, string> = {
    blog: "bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-cyan-500/10",
    book: "bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-fuchsia-500/10",
    download:
      "bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-red-500/10",
    event: "bg-gradient-to-br from-rose-500/10 via-pink-500/5 to-red-500/10",
    print: "bg-gradient-to-br from-indigo-500/10 via-blue-500/5 to-cyan-500/10",
    resource: "bg-gradient-to-br from-cyan-500/10 via-sky-500/5 to-blue-500/10",
  };
  return (
    gradients[kind] ??
    "bg-gradient-to-br from-gray-500/10 via-gray-400/5 to-gray-600/10"
  );
};

const getKindHighlight = (kind: ContentKind): string => {
  const highlights: Record<ContentKind, string> = {
    blog: "text-emerald-300 border-emerald-400/30 bg-emerald-500/10 shadow-emerald-500/15",
    book: "text-violet-300 border-violet-400/30 bg-violet-500/10 shadow-violet-500/15",
    download:
      "text-amber-300 border-amber-400/30 bg-amber-500/10 shadow-amber-500/15",
    event: "text-rose-300 border-rose-400/30 bg-rose-500/10 shadow-rose-500/15",
    print:
      "text-indigo-300 border-indigo-400/30 bg-indigo-500/10 shadow-indigo-500/15",
    resource:
      "text-cyan-300 border-cyan-400/30 bg-cyan-500/10 shadow-cyan-500/15",
  };
  return (
    highlights[kind] ??
    "text-gray-300 border-gray-400/30 bg-gray-500/10 shadow-gray-500/15"
  );
};

// ---------------------------------------------------------------------------
// Glassmorphic Card
// ---------------------------------------------------------------------------

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
  softGlow?: boolean;
}

const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = "",
  hoverEffect = true,
  softGlow = false,
}) => (
  <div
    className={`
      relative overflow-hidden rounded-3xl 
      bg-white/[0.04] backdrop-blur-3xl
      border border-white/10
      shadow-2xl shadow-black/40
      before:pointer-events-none before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:translate-x-[-100%]
      hover:before:translate-x-[100%] hover:before:transition-transform hover:before:duration-1000
      ${
        hoverEffect
          ? "transition-all duration-700 hover:scale-[1.02] hover:shadow-3xl hover:shadow-black/60"
          : ""
      }
      ${
        softGlow
          ? "after:pointer-events-none after:absolute after:inset-0 after:bg-gradient-to-br after:from-softGold/10 after:via-transparent after:to-softGold/5 after:opacity-0 after:transition-opacity after:duration-700 hover:after:opacity-100"
          : ""
      }
      ${className}
    `}
  >
    <div className="relative z-10 h-full">{children}</div>
  </div>
);

// ---------------------------------------------------------------------------
// Background
// ---------------------------------------------------------------------------

const CosmicBackground: React.FC = () => {
  return (
    <>
      <div className="absolute inset-0 bg-gradient-to-br from-[#050608] via-[#050814] to-[#020617]" />

      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 h-80 w-80 rounded-full bg-purple-500/8 blur-3xl" />
        <div className="absolute top-1/3 right-1/4 h-72 w-72 rounded-full bg-cyan-500/8 blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 h-64 w-64 rounded-full bg-softGold/8 blur-3xl" />
      </div>

      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]" />
    </>
  );
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const getSlug = (item: RawContentItem): string | undefined => {
  try {
    const stripCollectionPrefix = (value: string) =>
      value.replace(/^(blog|books|downloads|events|prints|resources)\//, "");

    if (item.slug && typeof item.slug === "string") {
      return stripCollectionPrefix(item.slug);
    }

    if (item._raw?.flattenedPath) {
      return stripCollectionPrefix(item._raw.flattenedPath);
    }

    if (item.title) {
      return item.title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    }

    return undefined;
  } catch (error) {
    console.error("[getSlug] Error processing slug:", error);
    return undefined;
  }
};

const getHref = (kind: ContentKind, slug: string): string => {
  if (kind === "blog") return `/${slug}`;
  return `/${kind}s/${slug}`;
};

const processContentItems = (
  items: RawContentItem[],
  kind: ContentKind,
  defaultCategory?: string
): ContentResource[] => {
  const processed: ContentResource[] = [];

  items.forEach((item) => {
    try {
      const slug = getSlug(item);
      const title = item.title || "Untitled";

      if (!slug) {
        console.warn(
          `[processContentItems] Skipping item with no slug: ${title}`
        );
        return;
      }

      // Convert all tags to strings
      const tags = Array.isArray(item.tags)
        ? item.tags.map((tag) => String(tag)) // Fixed: Convert numbers to strings
        : [];

      processed.push({
        kind,
        title,
        slug,
        href: getHref(kind, slug),
        date: item.date || item.eventDate,
        excerpt: item.excerpt,
        description: item.description,
        category: item.category || defaultCategory,
        tags, // Now this will always be string[]
        featured: Boolean(item.featured),
        readTime: item.readTime,
      });
    } catch (error) {
      console.error("[processContentItems] Error processing item:", error);
    }
  });

  return processed;
};

// ---------------------------------------------------------------------------
// Signature Cards
// ---------------------------------------------------------------------------

interface SignatureCardProps {
  item: ContentResource;
  variant?: "featured" | "elegant" | "minimal";
  index?: number;
}

const SignatureCard: React.FC<SignatureCardProps> = ({
  item,
  variant = "elegant",
  index = 0,
}) => {
  const description = item.description || item.excerpt || "";

  const ctaLabels: Record<ContentKind, string> = {
    blog: "Read the essay",
    book: "Explore the volume",
    download: "Download the toolkit",
    event: "View the session",
    print: "View the print",
    resource: "Open the resource",
  };

  const ctaLabel = ctaLabels[item.kind] ?? "Open";

  if (variant === "featured") {
    return (
      <GlassCard softGlow hoverEffect>
        <div
          className="group relative flex h-full flex-col p-8"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div
            className={`pointer-events-none absolute inset-0 rounded-3xl ${getKindSubtleGradient(
              item.kind
            )} opacity-0 transition-opacity duration-1000 group-hover:opacity-100`}
          />
          <div className="relative z-10 flex h-full flex-col">
            <div className="mb-6 flex items-start justify-between">
              <div
                className={`transform rounded-2xl border p-3 backdrop-blur-sm ${getKindHighlight(
                  item.kind
                )} transition-transform duration-500 group-hover:scale-110`}
              >
                {ContentIcons[item.kind]}
              </div>
              <div className="space-y-2 text-right">
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-semibold backdrop-blur-sm ${getKindHighlight(
                    item.kind
                  )}`}
                >
                  {kindLabels[item.kind]}
                </span>
                {item.date && (
                  <time className="block text-xs font-light text-gray-400">
                    {new Date(item.date).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </time>
                )}
              </div>
            </div>

            <h3 className="mb-4 font-serif text-2xl leading-tight text-white transition-colors duration-500 group-hover:text-softGold lg:text-3xl">
              {item.title}
            </h3>

            {description && (
              <p className="mb-6 flex-grow leading-relaxed text-gray-300 line-clamp-3">
                {description}
              </p>
            )}

            <div className="mt-auto border-t border-white/10 pt-6">
              <Link
                href={item.href}
                className="group/link inline-flex items-center text-sm font-semibold text-softGold transition-all duration-700 hover:gap-4"
              >
                <span className="bg-gradient-to-r from-softGold to-amber-200 bg-clip-text text-transparent">
                  {ctaLabel}
                </span>
                <ArrowIcon className="h-4 w-4 transform group-hover:translate-x-2 group-hover:scale-110" />
              </Link>
            </div>
          </div>
        </div>
      </GlassCard>
    );
  }

  // Elegant variant (default)
  return (
    <GlassCard hoverEffect>
      <div className="group relative flex h-full flex-col p-6">
        <div
          className={`pointer-events-none absolute inset-0 rounded-3xl ${getKindSubtleGradient(
            item.kind
          )} opacity-0 transition-opacity duration-700 group-hover:opacity-100`}
        />

        <div className="relative z-10 flex h-full flex-col">
          <div className="mb-4 flex items-start justify-between">
            <div
              className={`transform rounded-xl border p-2 backdrop-blur-sm ${getKindHighlight(
                item.kind
              )} transition-transform duration-500 group-hover:scale-110`}
            >
              {ContentIcons[item.kind]}
            </div>
            {item.date && (
              <time className="ml-2 flex-shrink-0 text-xs font-light text-gray-400">
                {new Date(item.date).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                })}
              </time>
            )}
          </div>

          <div className="mb-3">
            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold backdrop-blur-sm ${getKindHighlight(
                item.kind
              )}`}
            >
              {kindLabels[item.kind]}
            </span>
          </div>

          <h3 className="mb-3 line-clamp-2 font-serif text-xl leading-tight text-white transition-colors duration-500 group-hover:text-softGold">
            {item.title}
          </h3>

          {description && (
            <p className="mb-4 flex-grow text-sm leading-relaxed text-gray-300 line-clamp-3">
              {description}
            </p>
          )}

          <div className="mt-auto flex items-center justify-between border-t border-white/10 pt-4">
            <div className="flex items-center gap-3">
              {item.readTime && (
                <span className="text-xs font-light text-gray-400">
                  {typeof item.readTime === "number"
                    ? `${item.readTime} min`
                    : item.readTime}
                </span>
              )}
              {item.category && (
                <span className="border-l border-white/20 pl-3 text-xs font-light text-gray-400">
                  {item.category}
                </span>
              )}
            </div>
            <Link
              href={item.href}
              className="group/link inline-flex items-center text-xs font-semibold text-softGold transition-all duration-700 hover:gap-2"
            >
              {ctaLabel}
              <ArrowIcon className="h-3 w-3 transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>
    </GlassCard>
  );
};

// ---------------------------------------------------------------------------
// SSG
// ---------------------------------------------------------------------------

const safeGetData = async (
  dataFetcher: (() => RawContentItem[] | undefined) | undefined,
  dataName: string
): Promise<RawContentItem[]> => {
  try {
    if (!dataFetcher || typeof dataFetcher !== "function") {
      console.warn(`[content] ${dataName} fetcher unavailable`);
      return [];
    }
    const data = dataFetcher();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error(`[content] Error fetching ${dataName}:`, error);
    return [];
  }
};

export const getStaticProps: GetStaticProps<ContentPageProps> = async () => {
  console.log("🌌 [content] Building content library...");

  try {
    const allItems: ContentResource[] = [];

    const contentFetchers: {
      kind: ContentKind;
      data: Promise<RawContentItem[]>;
      category: string;
    }[] = [
      {
        kind: "blog",
        data: safeGetData(getAllPostsMeta, "blog posts"),
        category: "Essays",
      },
      {
        kind: "book",
        data: safeGetData(getAllBooksMeta, "books"),
        category: "Volumes",
      },
      {
        kind: "download",
        data: safeGetData(getAllDownloadsMeta, "downloads"),
        category: "Tools",
      },
      {
        kind: "event",
        data: safeGetData(() => getAllContent?.("events") ?? [], "events"),
        category: "Sessions",
      },
      {
        kind: "print",
        data: safeGetData(() => getAllContent?.("prints") ?? [], "prints"),
        category: "Prints",
      },
      {
        kind: "resource",
        data: safeGetData(
          () => getAllContent?.("resources") ?? [],
          "resources"
        ),
        category: "Resources",
      },
    ];

    await Promise.all(
      contentFetchers.map(async ({ kind, data, category }) => {
        try {
          const items = await data;
          const processed = processContentItems(items, kind, category);
          allItems.push(...processed);
          console.log(`✨ [content] Processed ${processed.length} ${kind}`);
        } catch (error) {
          console.error(`💥 [content] Failed to process ${kind}:`, error);
        }
      })
    );

    const sortedItems = allItems.sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      if (Number.isNaN(dateA) && Number.isNaN(dateB)) return 0;
      if (Number.isNaN(dateA)) return 1;
      if (Number.isNaN(dateB)) return -1;
      return dateB - dateA;
    });

    const featuredItems = sortedItems.filter((i) => i.featured).slice(0, 4);

    console.log("[content] Build completed:", {
      total: sortedItems.length,
      featured: featuredItems.length,
    });

    return {
      props: {
        items: JSON.parse(JSON.stringify(sortedItems)),
        featuredItems: JSON.parse(JSON.stringify(featuredItems)),
      },
      revalidate: 3600,
    };
  } catch (error) {
    console.error("💢 [content] Critical build error:", error);
    return {
      props: { items: [], featuredItems: [] },
      revalidate: 3600,
    };
  }
};

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

const ContentPage: NextPage<ContentPageProps> = ({ items, featuredItems }) => {
  const [activeFilter, setActiveFilter] = React.useState<ContentKind | "all">(
    "all"
  );
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const contentStats = React.useMemo(
    () => ({
      all: items.length,
      blog: items.filter((i) => i.kind === "blog").length,
      book: items.filter((i) => i.kind === "book").length,
      download: items.filter((i) => i.kind === "download").length,
      event: items.filter((i) => i.kind === "event").length,
      print: items.filter((i) => i.kind === "print").length,
      resource: items.filter((i) => i.kind === "resource").length,
    }),
    [items]
  );

  const signatureFilters = [
    {
      key: "all" as const,
      label: "All Content",
      count: contentStats.all,
      icon: "◎",
    },
    {
      key: "blog" as const,
      label: kindLabels.blog,
      count: contentStats.blog,
      icon: "✒︎",
    },
    {
      key: "book" as const,
      label: kindLabels.book,
      count: contentStats.book,
      icon: "◆",
    },
    {
      key: "download" as const,
      label: kindLabels.download,
      count: contentStats.download,
      icon: "▢",
    },
    {
      key: "event" as const,
      label: kindLabels.event,
      count: contentStats.event,
      icon: "◦",
    },
    {
      key: "print" as const,
      label: kindLabels.print,
      count: contentStats.print,
      icon: "✧",
    },
    {
      key: "resource" as const,
      label: kindLabels.resource,
      count: contentStats.resource,
      icon: "✶",
    },
  ];

  const filteredItems = React.useMemo(() => {
    return items.filter((item) => {
      const matchesFilter =
        activeFilter === "all" || item.kind === activeFilter;
      if (!matchesFilter) return false;
      if (!searchQuery.trim()) return true;

      const query = searchQuery.toLowerCase().trim();
      return (
        item.title.toLowerCase().includes(query) ||
        item.excerpt?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    });
  }, [items, activeFilter, searchQuery]);

  const groupedByKind = React.useMemo(() => {
    const initial: Record<ContentKind, ContentResource[]> = {
      blog: [],
      book: [],
      download: [],
      event: [],
      print: [],
      resource: [],
    };
    filteredItems.forEach((item) => initial[item.kind].push(item));
    return initial;
  }, [filteredItems]);

  const handleKeyDown = (
    event: React.KeyboardEvent,
    filterKey: ContentKind | "all"
  ) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setActiveFilter(filterKey);
    }
  };

  const scrollToGallery = () => {
    if (typeof window === "undefined") return;
    const target = document.getElementById("gallery");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (!mounted) {
    return (
      <Layout title="Content Library">
        <div className="flex min-h-screen items-center justify-center bg-black">
          <div className="text-lg text-softGold">Loading content…</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Content Library">
      <Head>
        <title>Content Library | Abraham of London</title>
        <meta
          name="description"
          content="A curated library of essays, volumes, tools, sessions, prints, and resources for leaders building enduring work and legacy."
        />
        <meta
          name="keywords"
          content="strategy, leadership, legacy, wisdom, resources, essays, tools, Abraham of London"
        />
      </Head>

      <div className="relative min-h-screen overflow-hidden bg-black text-white">
        <div className="fixed inset-0 -z-10">
          <CosmicBackground />
        </div>

        {/* Hero */}
        <section className="relative flex min-h-screen items-center justify-center px-4 pt-20">
          <div className="absolute inset-0 bg-gradient-to-b from-black via-black/90 to-black/85" />

          <div className="relative z-10 mx-auto max-w-6xl text-center">
            <div className="mb-10 inline-flex items-center gap-3 rounded-full border border-softGold/30 bg-softGold/10 px-8 py-3 backdrop-blur-2xl">
              <span className="relative flex h-1.5 w-1.5 items-center justify-center">
                <span className="absolute h-3 w-3 animate-ping rounded-full bg-softGold/40" />
                <span className="relative h-1.5 w-1.5 rounded-full bg-softGold" />
              </span>
              <span className="text-xs font-medium tracking-[0.25em] text-softGold">
                THE WISDOM ATELIER
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-softGold" />
            </div>

            <h1 className="mb-6 font-serif text-5xl font-light leading-tight text-white md:text-6xl lg:text-7xl">
              A Content Library
              <span className="block bg-gradient-to-r from-softGold via-yellow-200 to-amber-200 bg-clip-text text-transparent">
                Built for Serious Leaders
              </span>
            </h1>

            <p className="mx-auto mb-14 max-w-3xl text-lg font-light leading-relaxed text-gray-300 md:text-xl">
              Essays, frameworks, tools, and resources designed to help you
              think clearly, act decisively, and build work that endures.
            </p>

            <div className="mb-16 flex flex-col items-center justify-center gap-5 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={scrollToGallery}
                className="group relative overflow-hidden rounded-full bg-gradient-to-r from-softGold to-amber-500 px-12 py-4 text-base font-semibold text-black transition-all duration-700 hover:scale-[1.04] hover:shadow-2xl hover:shadow-yellow-500/30"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-softGold opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <span className="relative z-10 flex items-center gap-3">
                  Browse the Library
                  <ArrowIcon className="h-4 w-4 transform group-hover:translate-x-2 group-hover:scale-110" />
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveFilter("download");
                  scrollToGallery();
                }}
                className="group rounded-full border-2 border-softGold/50 bg-black/40 px-12 py-4 text-base font-semibold text-softGold backdrop-blur-2xl transition-all duration-700 hover:bg-softGold/10 hover:border-softGold/80 hover:scale-[1.03]"
              >
                <span className="flex items-center gap-3">
                  Jump to Tools
                  <span className="text-sm text-amber-200">for execution</span>
                </span>
              </button>
            </div>

            {/* Stats */}
            <div className="mx-auto grid max-w-3xl grid-cols-2 gap-6 md:grid-cols-4">
              {signatureFilters.slice(1, 5).map((filter) => (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => {
                    setActiveFilter(filter.key);
                    scrollToGallery();
                  }}
                  className="group rounded-3xl border border-white/10 bg-white/5 p-5 text-left backdrop-blur-2xl transition-all duration-700 hover:scale-[1.04] hover:border-softGold/40 hover:bg-white/10"
                >
                  <div className="mb-3 text-2xl text-softGold">
                    {filter.icon}
                  </div>
                  <div className="mb-1 text-2xl font-semibold text-white">
                    {filter.count}
                  </div>
                  <div className="text-xs font-light leading-snug text-gray-400">
                    {filter.label}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-16 md:bottom-10 left-1/2 -translate-x-1/2">
            <div className="flex flex-col items-center gap-2">
              <div className="text-xs font-light tracking-[0.3em] text-softGold/70">
                SCROLL
              </div>
              <div className="flex h-12 items-start justify-center">
                <div className="w-px bg-gradient-to-b from-softGold to-transparent" />
              </div>
            </div>
          </div>
        </section>

        {/* Featured */}
        {featuredItems.length > 0 && (
          <section className="relative px-4 py-24">
            <div className="mx-auto max-w-7xl">
              <div className="mb-16 text-center">
                <h2 className="mb-4 font-serif text-3xl text-white md:text-4xl">
                  Editor's <span className="text-softGold">Selection</span>
                </h2>
                <p className="mx-auto max-w-2xl text-sm font-light leading-relaxed text-gray-400 md:text-base">
                  A small set of pieces worth starting with if you are meeting
                  this library for the first time.
                </p>
              </div>

              <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-4">
                {featuredItems.map((item, index) => (
                  <div
                    key={item.slug}
                    className="transform transition-all duration-1000 hover:-translate-y-2"
                    style={{ animationDelay: `${index * 150}ms` }}
                  >
                    <SignatureCard
                      item={item}
                      variant="featured"
                      index={index}
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Main Gallery */}
        <section
          id="gallery"
          data-library-start
          className="relative px-4 py-28"
        >
          <div className="mx-auto max-w-7xl">
            <div
              className={`sticky top-24 z-40 mb-16 transition-all duration-700 ${
                isScrolled
                  ? "rounded-3xl border border-white/10 bg-black/90 p-6 shadow-3xl backdrop-blur-3xl md:p-8"
                  : ""
              }`}
            >
              <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
                <div className="max-w-lg flex-1">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search essays, tools, sessions, resources…"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-8 py-4 text-base text-white placeholder-gray-400 backdrop-blur-2xl transition-all duration-500 focus:border-softGold/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-softGold/25"
                      aria-label="Search content library"
                    />
                    <div className="pointer-events-none absolute right-6 top-1/2 -translate-y-1/2 text-gray-400">
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap justify-center gap-3 lg:justify-end">
                  {signatureFilters.map((filter) => (
                    <button
                      key={filter.key}
                      type="button"
                      onClick={() => setActiveFilter(filter.key)}
                      onKeyDown={(e) => handleKeyDown(e, filter.key)}
                      className={`flex items-center gap-3 rounded-full border-2 px-5 py-3 text-xs font-medium transition-all duration-500 focus:outline-none focus:ring-2 focus:ring-softGold focus:ring-offset-2 focus:ring-offset-black md:text-sm ${
                        activeFilter === filter.key
                          ? "border-softGold bg-softGold text-black shadow-2xl shadow-yellow-500/40 transform scale-105"
                          : "border-white/10 bg-white/5 text-gray-300 hover:border-softGold/40 hover:bg-white/10 hover:scale-[1.02]"
                      }`}
                      aria-pressed={activeFilter === filter.key}
                      aria-label={`${filter.label} (${filter.count})`}
                    >
                      <span className="text-base">{filter.icon}</span>
                      <span>{filter.label}</span>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[0.7rem] ${
                          activeFilter === filter.key
                            ? "bg-black/20 text-black"
                            : "bg-white/10 text-gray-400"
                        }`}
                      >
                        {filter.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Gallery Content */}
            {filteredItems.length === 0 ? (
              <GlassCard className="p-16 text-center" hoverEffect={false}>
                <h3 className="mb-4 font-serif text-2xl text-white md:text-3xl">
                  No results found
                </h3>
                <p className="mx-auto mb-8 max-w-md text-sm leading-relaxed text-gray-400 md:text-base">
                  {searchQuery
                    ? `Nothing matched "${searchQuery}". Try a different term or clear the filters.`
                    : `There is no content in this category yet.`}
                </p>
                {(searchQuery || activeFilter !== "all") && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setActiveFilter("all");
                    }}
                    className="rounded-full bg-softGold px-10 py-3 text-sm font-semibold text-black transition-all duration-500 hover:scale-[1.03] hover:shadow-2xl hover:shadow-yellow-500/25 md:text-base"
                  >
                    Reset filters
                  </button>
                )}
              </GlassCard>
            ) : activeFilter === "all" ? (
              <div className="space-y-20">
                {kindOrder.map((kind) => {
                  const group = groupedByKind[kind];
                  if (!group.length) return null;

                  return (
                    <div key={kind} className="space-y-10">
                      <div className="flex items-center justify-between gap-4">
                        <h3 className="flex items-center gap-4 font-serif text-2xl text-white md:text-3xl">
                          <span
                            className={`rounded-2xl border p-3 backdrop-blur-sm ${getKindHighlight(
                              kind
                            )}`}
                          >
                            {ContentIcons[kind]}
                          </span>
                          {kindLabels[kind]}
                        </h3>
                        <span className="text-sm font-light text-gray-400 md:text-base">
                          {group.length} item{group.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
                        {group.map((item) => (
                          <SignatureCard
                            key={item.slug}
                            item={item}
                            variant="elegant"
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div>
                <div className="mb-10 flex items-center justify-between gap-4">
                  <h3 className="flex items-center gap-4 font-serif text-2xl text-white md:text-3xl">
                    <span
                      className={`rounded-2xl border p-3 backdrop-blur-sm ${getKindHighlight(
                        activeFilter as ContentKind
                      )}`}
                    >
                      {ContentIcons[activeFilter as ContentKind]}
                    </span>
                    {kindLabels[activeFilter as ContentKind]}
                  </h3>
                  <span className="text-sm text-gray-400 md:text-base">
                    {filteredItems.length} item
                    {filteredItems.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
                  {filteredItems.map((item) => (
                    <SignatureCard
                      key={item.slug}
                      item={item}
                      variant="elegant"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Closing CTA */}
        <section className="relative px-4 py-32">
          <div className="mx-auto max-w-5xl text-center">
            <GlassCard
              className="px-8 py-14 md:px-16 md:py-18"
              softGlow
              hoverEffect={false}
            >
              <h2 className="mb-6 font-serif text-3xl text-white md:text-4xl">
                Turn insight into{" "}
                <span className="text-softGold">decisive action</span>
              </h2>
              <p className="mx-auto mb-10 max-w-3xl text-sm leading-relaxed text-gray-300 md:text-lg">
                If you are building something that must stand the test of time,
                this library is a starting point—not the finish line. When you
                are ready, we can work together on the specifics of your
                context, your market, and your mandate.
              </p>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:justify-center">
                <button
                  type="button"
                  className="group relative overflow-hidden rounded-full bg-gradient-to-r from-softGold to-amber-500 px-12 py-4 text-sm font-semibold text-black transition-all duration-700 hover:scale-[1.04] hover:shadow-2xl hover:shadow-yellow-500/30 md:text-base"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-softGold opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  <span className="relative z-10">Discuss a mandate</span>
                </button>
                <button
                  type="button"
                  className="group rounded-full border-2 border-softGold/60 bg-transparent px-12 py-4 text-sm font-semibold text-softGold transition-all duration-700 hover:bg-softGold/10 hover:scale-[1.03] md:text-base"
                >
                  <span className="flex items-center gap-3">
                    Request a private session
                    <ArrowIcon className="h-4 w-4 transform group-hover:translate-x-1" />
                  </span>
                </button>
              </div>
            </GlassCard>
          </div>
        </section>
      </div>

      {/* Global tweaks specific to this page */}
      <style jsx global>{`
        ::-webkit-scrollbar {
          width: 8px;
        }

        ::-webkit-scrollbar-track {
          background: #050608;
        }

        ::-webkit-scrollbar-thumb {
          background: linear-gradient(
            180deg,
            var(--aol-softGold),
            rgba(214, 178, 106, 0.6)
          );
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(
            180deg,
            rgba(214, 178, 106, 0.8),
            var(--aol-softGold)
          );
        }

        ::selection {
          background: rgba(214, 178, 106, 0.35);
          color: #050608;
        }
      `}</style>
    </Layout>
  );
};

export default ContentPage;
