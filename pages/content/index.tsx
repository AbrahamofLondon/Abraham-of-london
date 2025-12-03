// pages/content/index.tsx
import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Link from "next/link";

import Layout from "@/components/Layout";
import {
  getAllContent,
  CONTENT_CATEGORIES,
  LIBRARY_AESTHETICS,
  SEASONAL_CURATIONS,
  type AnyContent,
} from "@/lib/content";

type CategoryKey = keyof typeof CONTENT_CATEGORIES;

type ContentItem = AnyContent & {
  aesthetic?: (typeof CONTENT_CATEGORIES)[CategoryKey];
};

type Props = {
  items: ContentItem[];
  featuredItems: ContentItem[];
  categoryStats: Record<CategoryKey, number> & { all: number };
};

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                    */
/* -------------------------------------------------------------------------- */

function getCategoryFromItem(item: ContentItem): CategoryKey {
  // Contentlayer gives us `_type` = "Post" | "Book" | "Download" | ...
  const rawType = (item as any)._type as string | undefined;
  const fallback = (item as any).type as string | undefined;

  const kind = rawType ?? fallback;

  switch (kind) {
    case "Post":
      return "POSTS";
    case "Book":
      return "BOOKS";
    case "Event":
      return "EVENTS";
    case "Download":
      return "DOWNLOADS";
    case "Print":
      return "PRINTS";
    case "Resource":
      return "RESOURCES";
    case "Canon":
      return "CANON";
    default:
      return "POSTS";
  }
}

function getItemAesthetic(item: ContentItem) {
  const category = getCategoryFromItem(item);
  return CONTENT_CATEGORIES[category];
}

function buildHref(item: ContentItem): string {
  // Preferred: use the computed `url` field from Contentlayer
  const url = (item as any).url as string | undefined;
  if (url) return url;

  const slug = (item as any).slug as string | undefined;
  if (!slug) return "#";

  const kind = (item as any)._type as string | undefined;

  switch (kind) {
    case "Post":
      return `/${slug}`;
    case "Book":
      return `/books/${slug}`;
    case "Download":
      return `/downloads/${slug}`;
    case "Event":
      return `/events/${slug}`;
    case "Print":
      return `/prints/${slug}`;
    case "Resource":
      return `/resources/${slug}`;
    case "Canon":
      return `/canon/${slug}`;
    default:
      return `/${slug}`;
  }
}

function formatDate(date?: string | null): string | null {
  if (!date) return null;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
  });
}

function getReadTime(item: ContentItem): string {
  const explicit = (item as any).readTime ?? (item as any).readingTime;
  if (explicit) return `${explicit}`.includes("min") ? `${explicit}` : `${explicit} min`;

  const raw = (item as any).body?.raw ?? (item as any).body?.code ?? "";
  const wordCount = String(raw).split(/\s+/u).length;
  const minutes = Math.max(1, Math.floor(wordCount / 200));
  return `${minutes} min`;
}

/* -------------------------------------------------------------------------- */
/* PRESENTATION COMPONENTS                                                    */
/* -------------------------------------------------------------------------- */

interface PersianOrnamentProps {
  type: "header" | "divider";
  color?: string;
}

const PersianOrnament: React.FC<PersianOrnamentProps> = ({
  type,
  color = LIBRARY_AESTHETICS.colors.primary.saffron,
}) => {
  if (type === "header") {
    return (
      <div className="absolute inset-x-0 top-0 h-1 overflow-hidden opacity-30">
        <div
          className="h-full w-full"
          style={{
            background: `repeating-linear-gradient(90deg, transparent, transparent 10px, ${color} 10px, ${color} 20px)`,
          }}
        />
      </div>
    );
  }

  return (
    <div className="my-8 flex items-center justify-center">
      <div
        className="h-px flex-1"
        style={{ backgroundColor: `${color}30` }}
      />
      <div className="mx-4 text-xl opacity-50" style={{ color }}>
        𓆓
      </div>
      <div
        className="h-px flex-1"
        style={{ backgroundColor: `${color}30` }}
      />
    </div>
  );
};

interface CategoryPortalProps {
  category: (typeof CONTENT_CATEGORIES)[CategoryKey] | {
    id: "all";
    title: string;
    description: string;
    icon: string;
    color: string;
    signal: { subtle: string; texture: string };
  };
  count: number;
  isActive: boolean;
  onClick: () => void;
}

const CategoryPortal: React.FC<CategoryPortalProps> = ({
  category,
  count,
  isActive,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      className={`group relative overflow-hidden rounded-xl border p-5 text-left transition-all duration-300 ${
        isActive
          ? "scale-[1.02] shadow-xl"
          : "hover:scale-[1.01] hover:shadow-lg"
      }`}
      style={{
        borderColor: isActive ? category.color : `${category.color}30`,
        backgroundColor: isActive
          ? `${category.color}15`
          : `${category.color}08`,
        backgroundImage: isActive
          ? `radial-gradient(circle at 20% 80%, ${category.color}15, transparent 50%)`
          : "none",
      }}
    >
      <div
        className={`absolute inset-0 opacity-10 ${
          isActive ? "opacity-20" : "group-hover:opacity-15"
        }`}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000000' fill-opacity='0.2'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/svg%3E\")",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-3xl opacity-70 transition-opacity group-hover:opacity-100">
            {category.icon}
          </div>
          <div
            className={`rounded-full px-2 py-1 text-sm transition-all ${
              isActive ? "opacity-100" : "opacity-0 group-hover:opacity-60"
            }`}
            style={{
              backgroundColor: `${category.color}25`,
              color: category.color,
            }}
          >
            {count}
          </div>
        </div>

        <h3
          className="mb-1 text-lg font-semibold"
          style={{ color: category.color }}
        >
          {category.title}
        </h3>

        <p className="mb-3 line-clamp-2 text-sm opacity-70">
          {category.description}
        </p>

        <div
          className={`text-xs italic transition-all ${
            isActive ? "opacity-100" : "opacity-0 group-hover:opacity-60"
          }`}
          style={{ color: category.color }}
        >
          {category.signal.subtle}
        </div>

        <div
          className={`absolute -right-2 -bottom-2 h-10 w-10 rounded-full blur-md transition-all ${
            isActive ? "opacity-30" : "opacity-0 group-hover:opacity-20"
          }`}
          style={{ backgroundColor: category.color }}
        />
      </div>
    </button>
  );
};

interface ManuscriptCardProps {
  item: ContentItem;
}

const ManuscriptCard: React.FC<ManuscriptCardProps> = ({ item }) => {
  const aesthetic = item.aesthetic ?? getItemAesthetic(item);
  const href = buildHref(item);
  const dateLabel = formatDate((item as any).date);
  const readTime = getReadTime(item);

  return (
    <Link href={href}>
      <div
        className="group relative h-full overflow-hidden rounded-xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
        style={{
          borderColor: `${aesthetic.color}30`,
          backgroundColor: LIBRARY_AESTHETICS.colors.primary.parchment,
          borderLeft: `4px solid ${aesthetic.color}`,
        }}
      >
        <div
          className="absolute left-0 top-0 bottom-0 w-1"
          style={{
            background: `linear-gradient(to bottom, transparent, ${aesthetic.color}40, transparent)`,
          }}
        />

        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23000000' fill-opacity='0.05' fill-rule='evenodd'/%3E%3C/svg%3E\")",
            backgroundSize: "100px 100px",
          }}
        />

        <div className="relative p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="text-xl opacity-70">{aesthetic.icon}</div>
              <span
                className="text-xs font-medium uppercase tracking-wider"
                style={{ color: aesthetic.color }}
              >
                {aesthetic.title}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs opacity-60">
              {dateLabel && <span>{dateLabel}</span>}
              <span>•</span>
              <span>{readTime}</span>
            </div>
          </div>

          <h3
            className="mb-3 font-serif text-xl font-semibold leading-tight group-hover:underline"
            style={{ color: LIBRARY_AESTHETICS.colors.primary.lapis }}
          >
            {(item as any).title}
          </h3>

          {(item as any).excerpt || (item as any).description ? (
            <p
              className="mb-6 line-clamp-3 text-sm leading-relaxed opacity-80"
              style={{ color: LIBRARY_AESTHETICS.colors.primary.lapis }}
            >
              {(item as any).excerpt || (item as any).description}
            </p>
          ) : null}

          <div
            className="flex items-center justify-between border-t pt-4"
            style={{ borderColor: `${aesthetic.color}15` }}
          >
            <div className="flex items-center gap-2">
              {Array.isArray((item as any).tags) &&
                (item as any).tags.slice(0, 2).map((tag: string) => (
                  <span
                    key={tag}
                    className="rounded-full px-2 py-1 text-xs"
                    style={{
                      backgroundColor: `${aesthetic.color}10`,
                      color: aesthetic.color,
                    }}
                  >
                    {tag}
                  </span>
                ))}
            </div>

            <div
              className="flex items-center gap-1 text-sm font-medium transition-all group-hover:gap-2"
              style={{ color: aesthetic.color }}
            >
              <span>Enter the manuscript</span>
              <span className="transition-transform group-hover:translate-x-1">
                →
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

/* -------------------------------------------------------------------------- */
/* MAIN PAGE                                                                  */
/* -------------------------------------------------------------------------- */

const ContentLibraryPage: NextPage<Props> = ({
  items,
  featuredItems,
  categoryStats,
}) => {
  const [activeCategory, setActiveCategory] =
    React.useState<CategoryKey | "all">("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [viewMode, setViewMode] = React.useState<"grid" | "shelf">("grid");

  const filteredItems = React.useMemo(() => {
    let result =
      activeCategory === "all"
        ? items
        : items.filter(
            (item) => getCategoryFromItem(item) === activeCategory,
          );

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((item) => {
        const title = (item as any).title?.toLowerCase() ?? "";
        const description =
          (item as any).description?.toLowerCase() ?? "";
        const excerpt = (item as any).excerpt?.toLowerCase() ?? "";
        const tags = Array.isArray((item as any).tags)
          ? (item as any).tags
          : [];

        return (
          title.includes(q) ||
          description.includes(q) ||
          excerpt.includes(q) ||
          tags.some((t: string) => t.toLowerCase().includes(q))
        );
      });
    }

    return result;
  }, [items, activeCategory, searchQuery]);

  const sortedCategories = (Object.keys(
    CONTENT_CATEGORIES,
  ) as CategoryKey[])
    .filter((key) => categoryStats[key] > 0)
    .sort((a, b) => categoryStats[b] - categoryStats[a])
    .map((key) => [key, CONTENT_CATEGORIES[key]] as const);

  return (
    <Layout
      title="The Library of Applied Wisdom"
      pageTitle=""
      description="A curated collection of strategic essays, canon volumes, execution tools, live sessions, and resources — for men and builders who refuse to disappear."
    >
      <div
        className="min-h-screen"
        style={{
          background: `linear-gradient(135deg, ${LIBRARY_AESTHETICS.colors.primary.parchment} 0%, ${LIBRARY_AESTHETICS.colors.primary.parchment}99 100%)`,
          fontFamily: "Georgia, serif",
        }}
      >
        {/* HERO */}
        <section
          className="relative overflow-hidden border-b"
          style={{
            borderColor: `${LIBRARY_AESTHETICS.colors.primary.saffron}30`,
            background:
              "url(\"data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23DAA520' fill-opacity='0.03' fill-rule='evenodd'/%3E%3C/svg%3E\")",
          }}
        >
          <PersianOrnament type="header" />

          <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="text-center">
              <div
                className="mb-8 inline-flex items-center justify-center gap-3 rounded-full px-6 py-3"
                style={{
                  backgroundColor:
                    LIBRARY_AESTHETICS.colors.primary.saffron + "15",
                  border: `1px solid ${LIBRARY_AESTHETICS.colors.primary.saffron}30`,
                }}
              >
                <div className="text-2xl">𓆓</div>
                <span
                  className="text-sm font-medium"
                  style={{
                    color: LIBRARY_AESTHETICS.colors.primary.saffron,
                  }}
                >
                  {SEASONAL_CURATIONS.wisdomTheme}
                </span>
              </div>

              <h1
                className="mb-6 font-serif text-5xl font-light tracking-tight sm:text-6xl"
                style={{ color: LIBRARY_AESTHETICS.colors.primary.lapis }}
              >
                Content Library
              </h1>

              <p
                className="mx-auto mb-8 max-w-3xl text-lg leading-relaxed opacity-80"
                style={{ color: LIBRARY_AESTHETICS.colors.primary.lapis }}
              >
                Essays, canon volumes, execution tools, live sessions, and
                core resources — organised for people who are serious about
                purpose, governance, and legacy.
              </p>

              <div className="relative mx-auto mb-12 max-w-2xl">
                <div className="relative">
                  <div
                    className="pointer-events-none absolute inset-0 rounded-2xl opacity-30"
                    style={{
                      background: `radial-gradient(circle at 50% 50%, ${LIBRARY_AESTHETICS.colors.primary.saffron}30, transparent 70%)`,
                    }}
                  />
                  <div
                    className="relative flex items-center gap-4 rounded-2xl border p-4 backdrop-blur-sm"
                    style={{
                      borderColor:
                        LIBRARY_AESTHETICS.colors.primary.lapis + "30",
                      backgroundColor:
                        LIBRARY_AESTHETICS.colors.primary.parchment + "dd",
                    }}
                  >
                    <div
                      className="text-2xl opacity-50"
                      style={{
                        color: LIBRARY_AESTHETICS.colors.primary.lapis,
                      }}
                    >
                      🔍
                    </div>
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search essays, tools, sessions, and resources..."
                      className="flex-1 bg-transparent text-lg placeholder:opacity-50 focus:outline-none"
                      style={{
                        color: LIBRARY_AESTHETICS.colors.primary.lapis,
                      }}
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="text-sm opacity-50 hover:opacity-100"
                        style={{
                          color: LIBRARY_AESTHETICS.colors.primary.lapis,
                        }}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                <p
                  className="mt-4 text-center text-sm opacity-50"
                  style={{ color: LIBRARY_AESTHETICS.colors.primary.lapis }}
                >
                  Think of this as a “Harrods back-room library” — curated
                  shelves, not random posts.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CATEGORY PORTALS */}
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2
                className="mb-2 font-serif text-2xl font-semibold"
                style={{ color: LIBRARY_AESTHETICS.colors.primary.lapis }}
              >
                Knowledge Portals
              </h2>
              <p
                className="text-sm opacity-70"
                style={{ color: LIBRARY_AESTHETICS.colors.primary.lapis }}
              >
                Enter through the portal that matches your current inquiry.
              </p>
            </div>

            <div
              className="flex items-center gap-2 rounded-lg border p-1"
              style={{
                borderColor:
                  LIBRARY_AESTHETICS.colors.primary.lapis + "20",
                backgroundColor:
                  LIBRARY_AESTHETICS.colors.primary.parchment,
              }}
            >
              <button
                onClick={() => setViewMode("grid")}
                className={`rounded px-3 py-1.5 text-sm transition-all ${
                  viewMode === "grid"
                    ? "font-medium"
                    : "opacity-50 hover:opacity-80"
                }`}
                style={{
                  backgroundColor:
                    viewMode === "grid"
                      ? LIBRARY_AESTHETICS.colors.primary.lapis + "10"
                      : "transparent",
                  color:
                    viewMode === "grid"
                      ? LIBRARY_AESTHETICS.colors.primary.lapis
                      : "inherit",
                }}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode("shelf")}
                className={`rounded px-3 py-1.5 text-sm transition-all ${
                  viewMode === "shelf"
                    ? "font-medium"
                    : "opacity-50 hover:opacity-80"
                }`}
                style={{
                  backgroundColor:
                    viewMode === "shelf"
                      ? LIBRARY_AESTHETICS.colors.primary.lapis + "10"
                      : "transparent",
                  color:
                    viewMode === "shelf"
                      ? LIBRARY_AESTHETICS.colors.primary.lapis
                      : "inherit",
                }}
              >
                Shelf
              </button>
            </div>
          </div>

          <div className="mb-6">
            <CategoryPortal
              category={{
                id: "all",
                title: "All Content",
                description: "The complete collection of applied wisdom.",
                icon: "∞",
                color: LIBRARY_AESTHETICS.colors.primary.lapis,
                signal: {
                  subtle: "The entire library at your fingertips.",
                  texture: "all",
                },
              }}
              count={categoryStats.all}
              isActive={activeCategory === "all"}
              onClick={() => setActiveCategory("all")}
            />
          </div>

          <div
            className={`grid gap-6 ${
              viewMode === "grid"
                ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                : "grid-cols-1"
            }`}
          >
            {sortedCategories.map(([key, category]) => (
              <CategoryPortal
                key={key}
                category={category}
                count={categoryStats[key as CategoryKey] || 0}
                isActive={activeCategory === key}
                onClick={() => setActiveCategory(key as CategoryKey)}
              />
            ))}
          </div>
        </section>

        <PersianOrnament type="divider" />

        {/* MANUSCRIPTS */}
        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2
                className="mb-2 font-serif text-2xl font-semibold"
                style={{ color: LIBRARY_AESTHETICS.colors.primary.lapis }}
              >
                {activeCategory === "all"
                  ? "Shelf View"
                  : CONTENT_CATEGORIES[activeCategory as CategoryKey]
                      ?.title ?? "Shelf View"}
              </h2>
              <p
                className="text-sm opacity-70"
                style={{ color: LIBRARY_AESTHETICS.colors.primary.lapis }}
              >
                {filteredItems.length} item
                {filteredItems.length === 1 ? "" : "s"} in this selection.
              </p>
            </div>
          </div>

          {filteredItems.length === 0 ? (
            <div
              className="rounded-xl border p-16 text-center"
              style={{
                borderColor:
                  LIBRARY_AESTHETICS.colors.primary.saffron + "30",
                backgroundColor:
                  LIBRARY_AESTHETICS.colors.primary.parchment,
              }}
            >
              <div className="mb-6 text-6xl opacity-20">𓃲</div>
              <h3
                className="mb-4 text-xl font-medium"
                style={{ color: LIBRARY_AESTHETICS.colors.primary.lapis }}
              >
                The scribes are still at work.
              </h3>
              <p
                className="mx-auto mb-6 max-w-md text-sm opacity-70"
                style={{ color: LIBRARY_AESTHETICS.colors.primary.lapis }}
              >
                {searchQuery
                  ? `No wisdom found for “${searchQuery}”. Try another term or clear the search.`
                  : "This section awaits its manuscripts. Try another portal or return when the ink has dried."}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm"
                  style={{
                    backgroundColor:
                      LIBRARY_AESTHETICS.colors.primary.lapis + "10",
                    color: LIBRARY_AESTHETICS.colors.primary.lapis,
                  }}
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <div
              className={`grid gap-8 ${
                viewMode === "grid"
                  ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                  : "grid-cols-1"
              }`}
            >
              {filteredItems.map((item) => (
                <ManuscriptCard key={(item as any)._id} item={item} />
              ))}
            </div>
          )}
        </section>

        {/* FOOTER */}
        <footer
          className="border-t py-8"
          style={{
            borderColor:
              LIBRARY_AESTHETICS.colors.primary.saffron + "20",
            backgroundColor:
              LIBRARY_AESTHETICS.colors.primary.parchment + "dd",
          }}
        >
          <div className="mx-auto max-w-7xl px-4 text-center">
            <p
              className="mb-4 text-sm italic opacity-60"
              style={{ color: LIBRARY_AESTHETICS.colors.primary.lapis }}
            >
              A living library, continuously curated for seekers of
              substance.
            </p>
            <div
              className="flex flex-wrap justify-center gap-6 text-xs opacity-40"
              style={{ color: LIBRARY_AESTHETICS.colors.primary.lapis }}
            >
              {Object.values(SEASONAL_CURATIONS.tactileSignals).map(
                (value) => (
                  <span key={value}>{value}</span>
                ),
              )}
            </div>
          </div>
        </footer>
      </div>
    </Layout>
  );
};

/* -------------------------------------------------------------------------- */
/* STATIC PROPS                                                               */
/* -------------------------------------------------------------------------- */

export const getStaticProps: GetStaticProps<Props> = async () => {
  const rawItems = getAllContent();

  const items: ContentItem[] = rawItems.map((item) => {
    const category = getCategoryFromItem(item as ContentItem);
    return {
      ...(item as AnyContent),
      aesthetic: CONTENT_CATEGORIES[category],
    };
  });

  const categoryStats: Record<CategoryKey, number> & { all: number } = {
    all: items.length,
    POSTS: 0,
    BOOKS: 0,
    EVENTS: 0,
    DOWNLOADS: 0,
    PRINTS: 0,
    RESOURCES: 0,
    CANON: 0,
  };

  items.forEach((item) => {
    const cat = getCategoryFromItem(item);
    categoryStats[cat] += 1;
  });

  const featuredItems = items
    .filter((i) => (i as any).featured || (i as any).date)
    .sort((a, b) => {
      const da = (a as any).date
        ? new Date((a as any).date).getTime()
        : 0;
      const db = (b as any).date
        ? new Date((b as any).date).getTime()
        : 0;
      return db - da;
    })
    .slice(0, 3);

  return {
    props: {
      items,
      featuredItems,
      categoryStats,
    },
    revalidate: 60,
  };
};

export default ContentLibraryPage;