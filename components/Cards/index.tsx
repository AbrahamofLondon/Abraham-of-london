import * as React from "react";
import Link from "next/link";
import {
  CONTENT_CATEGORIES,
  LIBRARY_AESTHETICS,
  type AnyContent,
} from "@/lib/content";

type CategoryKey = keyof typeof CONTENT_CATEGORIES;

/* -------------------------------------------------------------------------- */
/* HELPER FUNCTIONS                                                           */
/* -------------------------------------------------------------------------- */

function getCategoryFromItem(item: AnyContent): CategoryKey {
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

function buildHref(item: AnyContent): string {
  const url = (item as any).url as string | undefined;
  if (url) return url;

  const slug = (item as any).slug as string | undefined;
  if (!slug) return "#";

  const kind = (item as any)._type as string | undefined;

  switch (kind) {
    case "Post":
      return `/blog/${slug}`;
    case "Book":
      return `/library/${slug}`;
    case "Download":
      return `/tools/${slug}`;
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

function getReadTime(item: AnyContent): string {
  const explicit = (item as any).readTime ?? (item as any).readingTime;
  if (explicit)
    return `${explicit}`.includes("min") ? `${explicit}` : `${explicit} min`;

  const raw = (item as any).body?.raw ?? (item as any).body?.code ?? "";
  const wordCount = String(raw).split(/\s+/u).length;
  const minutes = Math.max(1, Math.floor(wordCount / 200));
  return `${minutes} min`;
}

/* -------------------------------------------------------------------------- */
/* BASE CARD COMPONENT                                                        */
/* -------------------------------------------------------------------------- */

interface BaseCardProps {
  item: AnyContent;
  children: React.ReactNode;
  aesthetic: (typeof CONTENT_CATEGORIES)[CategoryKey];
  className?: string;
}

const BaseCard: React.FC<BaseCardProps> = ({
  item,
  children,
  aesthetic,
  className = "",
}) => {
  const href = buildHref(item);
  const title = (item as any).title || "Untitled";

  return (
    <Link href={href} className="block h-full">
      <div
        className={`group relative h-full overflow-hidden rounded-2xl border transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl ${className}`}
        style={{
          borderColor: `${aesthetic.color}25`,
          backgroundColor: `${LIBRARY_AESTHETICS.colors.primary.parchment}05`,
          backgroundImage: `
            linear-gradient(135deg, ${aesthetic.color}05 0%, transparent 40%),
            radial-gradient(circle at 20% 80%, ${aesthetic.color}08 0%, transparent 70%)
          `,
          backdropFilter: "blur(20px)",
        }}
      >
        {/* Decorative glow effect */}
        <div
          className="absolute -right-4 -top-4 h-24 w-24 rounded-full opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-30"
          style={{ backgroundColor: aesthetic.color }}
        />

        {/* Gold foil accent */}
        <div
          className="absolute left-0 top-0 h-full w-1"
          style={{
            background: `linear-gradient(to bottom, 
              ${aesthetic.color}00 0%, 
              ${aesthetic.color} 30%, 
              ${aesthetic.color}80 70%, 
              ${aesthetic.color}00 100%)`,
          }}
        />

        {/* Subtle texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative h-full p-8">{children}</div>

        {/* Signature flourish */}
        <div className="absolute bottom-4 right-6 text-2xl opacity-10 transition-opacity group-hover:opacity-30">
          𓆓
        </div>
      </div>
    </Link>
  );
};

/* -------------------------------------------------------------------------- */
/* BLOG POST CARD - Scholarly Elegance                                        */
/* -------------------------------------------------------------------------- */

interface BlogPostCardProps {
  item: AnyContent;
}

export const BlogPostCard: React.FC<BlogPostCardProps> = ({ item }) => {
  const aesthetic = CONTENT_CATEGORIES.POSTS;
  const title = (item as any).title;
  const excerpt = (item as any).excerpt;
  const date = formatDate((item as any).date);
  const readTime = getReadTime(item);
  const tags = (item as any).tags || [];

  return (
    <BaseCard item={item} aesthetic={aesthetic}>
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="mb-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="rounded-lg p-2"
                style={{ backgroundColor: `${aesthetic.color}15` }}
              >
                <div className="text-xl" style={{ color: aesthetic.color }}>
                  ✍
                </div>
              </div>
              <span
                className="text-sm font-medium uppercase tracking-widest"
                style={{ color: aesthetic.color }}
              >
                Applied Wisdom
              </span>
            </div>
            <div
              className="rounded-full px-3 py-1 text-xs"
              style={{
                backgroundColor: `${aesthetic.color}15`,
                color: aesthetic.color,
              }}
            >
              {readTime}
            </div>
          </div>

          <h3
            className="mb-3 font-serif text-2xl font-medium leading-tight"
            style={{ color: LIBRARY_AESTHETICS.colors.primary.lapis }}
          >
            {title}
          </h3>

          {excerpt && (
            <p
              className="mb-4 line-clamp-2 text-sm leading-relaxed opacity-80"
              style={{ color: LIBRARY_AESTHETICS.colors.primary.parchment }}
            >
              {excerpt}
            </p>
          )}
        </div>

        {/* Metadata */}
        <div className="mt-auto">
          <div className="mb-4 flex flex-wrap gap-2">
            {tags.slice(0, 3).map((tag: string) => (
              <span
                key={tag}
                className="rounded-full px-3 py-1 text-xs"
                style={{
                  backgroundColor: `${aesthetic.color}10`,
                  color: aesthetic.color,
                  border: `1px solid ${aesthetic.color}20`,
                }}
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="flex items-center justify-between border-t pt-4">
            <span
              className="text-sm italic"
              style={{ color: `${aesthetic.color}70` }}
            >
              {date || "Timeless"}
            </span>
            <div
              className="flex items-center gap-2 text-sm font-medium transition-all group-hover:gap-3"
              style={{ color: aesthetic.color }}
            >
              <span>Read Essay</span>
              <span className="transition-transform group-hover:translate-x-1">
                →
              </span>
            </div>
          </div>
        </div>
      </div>
    </BaseCard>
  );
};

/* -------------------------------------------------------------------------- */
/* BOOK CARD - Library Volume Luxury                                          */
/* -------------------------------------------------------------------------- */

interface BookCardProps {
  item: AnyContent;
}

export const BookCard: React.FC<BookCardProps> = ({ item }) => {
  const aesthetic = CONTENT_CATEGORIES.BOOKS;
  const title = (item as any).title;
  const author = (item as any).author || "The Archivist";
  const edition = (item as any).edition || "First Edition";
  const pages = (item as any).pages;
  const description = (item as any).description;

  return (
    <BaseCard item={item} aesthetic={aesthetic} className="relative">
      {/* Spine simulation */}
      <div
        className="absolute left-0 top-1/2 h-24 w-1 -translate-y-1/2 rounded-r"
        style={{
          background: `linear-gradient(to bottom, 
            ${aesthetic.color} 0%, 
            ${aesthetic.color}80 30%, 
            ${aesthetic.color} 70%, 
            ${aesthetic.color}80 100%)`,
        }}
      />

      <div className="flex h-full flex-col pl-4">
        {/* Gold foil emblem */}
        <div className="mb-6 flex items-center gap-4">
          <div
            className="rounded-xl p-3"
            style={{
              backgroundColor: `${aesthetic.color}15`,
              border: `1px solid ${aesthetic.color}30`,
            }}
          >
            <div className="text-2xl" style={{ color: aesthetic.color }}>
              📜
            </div>
          </div>
          <span
            className="text-sm font-medium uppercase tracking-widest"
            style={{ color: aesthetic.color }}
          >
            Canon Volume
          </span>
        </div>

        {/* Title with decorative underline */}
        <div className="mb-4">
          <h3
            className="mb-3 font-serif text-2xl font-medium"
            style={{ color: LIBRARY_AESTHETICS.colors.primary.lapis }}
          >
            {title}
          </h3>
          <div
            className="h-px w-12"
            style={{ backgroundColor: `${aesthetic.color}50` }}
          />
        </div>

        {description && (
          <p
            className="mb-6 line-clamp-3 text-sm italic leading-relaxed"
            style={{ color: `${LIBRARY_AESTHETICS.colors.primary.parchment}80` }}
          >
            "{description}"
          </p>
        )}

        {/* Book details */}
        <div className="mt-auto space-y-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div
                className="text-xs opacity-70"
                style={{ color: aesthetic.color }}
              >
                ✒
              </div>
              <span
                className="text-sm"
                style={{ color: LIBRARY_AESTHETICS.colors.primary.parchment }}
              >
                {author}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="text-xs opacity-70"
                style={{ color: aesthetic.color }}
              >
                📖
              </div>
              <span
                className="text-sm"
                style={{ color: LIBRARY_AESTHETICS.colors.primary.parchment }}
              >
                {edition}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between border-t pt-4">
            <div
              className="rounded-full px-3 py-1 text-xs"
              style={{
                backgroundColor: `${aesthetic.color}10`,
                color: aesthetic.color,
                border: `1px solid ${aesthetic.color}20`,
              }}
            >
              {pages ? `${pages} pages` : "Complete Edition"}
            </div>
            <div
              className="flex items-center gap-2 text-sm font-medium"
              style={{ color: aesthetic.color }}
            >
              <span>Study Volume</span>
              <span className="transition-transform group-hover:translate-x-1">
                →
              </span>
            </div>
          </div>
        </div>
      </div>
    </BaseCard>
  );
};

/* -------------------------------------------------------------------------- */
/* CANON CARD - Timeless Authority                                            */
/* -------------------------------------------------------------------------- */

interface CanonCardProps {
  item: AnyContent;
}

export const CanonCard: React.FC<CanonCardProps> = ({ item }) => {
  const aesthetic = CONTENT_CATEGORIES.CANON;
  const title = (item as any).title;
  const principles = (item as any).principles || 7;
  const level = (item as any).level || "Master";
  const summary = (item as any).summary;

  return (
    <BaseCard item={item} aesthetic={aesthetic}>
      {/* Seal of authority */}
      <div
        className="absolute right-6 top-6 h-12 w-12 rounded-full border-2 opacity-30"
        style={{
          borderColor: aesthetic.color,
          background: `radial-gradient(circle at 30% 30%, ${aesthetic.color}20, transparent 70%)`,
        }}
      >
        <div className="flex h-full items-center justify-center">
          <span style={{ color: aesthetic.color }}>⚖</span>
        </div>
      </div>

      <div className="flex h-full flex-col">
        <div className="mb-6">
          <div className="mb-4 flex items-center gap-3">
            <div
              className="rounded-full p-2"
              style={{ backgroundColor: `${aesthetic.color}15` }}
            >
              <div className="text-xl" style={{ color: aesthetic.color }}>
                ⚔
              </div>
            </div>
            <div>
              <span
                className="block text-sm font-medium uppercase tracking-widest"
                style={{ color: aesthetic.color }}
              >
                Foundational Law
              </span>
              <span
                className="text-xs opacity-70"
                style={{ color: aesthetic.color }}
              >
                {level} Level
              </span>
            </div>
          </div>

          <h3
            className="mb-4 font-serif text-2xl font-medium"
            style={{ color: LIBRARY_AESTHETICS.colors.primary.lapis }}
          >
            {title}
          </h3>

          {summary && (
            <p
              className="mb-6 line-clamp-3 text-sm leading-relaxed"
              style={{ color: `${LIBRARY_AESTHETICS.colors.primary.parchment}80` }}
            >
              {summary}
            </p>
          )}
        </div>

        <div className="mt-auto">
          {/* Principle count */}
          <div className="mb-6">
            <div className="mb-2 flex items-center justify-between">
              <span
                className="text-sm"
                style={{ color: LIBRARY_AESTHETICS.colors.primary.parchment }}
              >
                Core Principles
              </span>
              <span
                className="text-sm font-medium"
                style={{ color: aesthetic.color }}
              >
                {principles}
              </span>
            </div>
            <div
              className="h-1 rounded-full"
              style={{ backgroundColor: `${aesthetic.color}30` }}
            >
              <div
                className="h-full rounded-full transition-all duration-500 group-hover:w-full"
                style={{
                  width: `${Math.min(100, (principles / 12) * 100)}%`,
                  backgroundColor: aesthetic.color,
                }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between border-t pt-4">
            <div className="flex items-center gap-2">
              <div
                className="rounded-full p-1"
                style={{ backgroundColor: `${aesthetic.color}15` }}
              >
                <div className="text-xs" style={{ color: aesthetic.color }}>
                  🔒
                </div>
              </div>
              <span
                className="text-xs"
                style={{ color: `${aesthetic.color}70` }}
              >
                Timeless Doctrine
              </span>
            </div>
            <div
              className="flex items-center gap-2 text-sm font-medium"
              style={{ color: aesthetic.color }}
            >
              <span>Enter Doctrine</span>
              <span className="transition-transform group-hover:translate-x-1">
                ↗
              </span>
            </div>
          </div>
        </div>
      </div>
    </BaseCard>
  );
};

/* -------------------------------------------------------------------------- */
/* RESOURCE CARD - Strategic Tool                                             */
/* -------------------------------------------------------------------------- */

interface ResourceCardProps {
  item: AnyContent;
}

export const ResourceCard: React.FC<ResourceCardProps> = ({ item }) => {
  const aesthetic = CONTENT_CATEGORIES.RESOURCES;
  const title = (item as any).title;
  const type = (item as any).resourceType || "Framework";
  const format = (item as any).format || "PDF";
  const applications = (item as any).applications || ["Strategy", "Execution"];

  return (
    <BaseCard item={item} aesthetic={aesthetic}>
      <div className="flex h-full flex-col">
        {/* Tool type indicator */}
        <div className="mb-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="rounded-lg p-2"
                style={{
                  backgroundColor: `${aesthetic.color}15`,
                  border: `1px solid ${aesthetic.color}30`,
                }}
              >
                <div className="text-xl" style={{ color: aesthetic.color }}>
                  ⚙
                </div>
              </div>
              <div>
                <span
                  className="block text-sm font-medium uppercase tracking-widest"
                  style={{ color: aesthetic.color }}
                >
                  {type}
                </span>
                <span
                  className="text-xs"
                  style={{ color: `${aesthetic.color}70` }}
                >
                  {format} Format
                </span>
              </div>
            </div>
            <div
              className="rounded-lg px-3 py-1 text-xs"
              style={{
                backgroundColor: `${aesthetic.color}10`,
                color: aesthetic.color,
              }}
            >
              Tool
            </div>
          </div>

          <h3
            className="mb-4 font-serif text-2xl font-medium"
            style={{ color: LIBRARY_AESTHETICS.colors.primary.lapis }}
          >
            {title}
          </h3>
        </div>

        {/* Applications */}
        <div className="mb-6">
          <span
            className="mb-3 block text-sm font-medium"
            style={{ color: LIBRARY_AESTHETICS.colors.primary.parchment }}
          >
            Primary Applications:
          </span>
          <div className="flex flex-wrap gap-2">
            {applications.map((app: string, index: number) => (
              <div
                key={app}
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5"
                style={{
                  backgroundColor: `${aesthetic.color}10`,
                  border: `1px solid ${aesthetic.color}20`,
                }}
              >
                <div
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: aesthetic.color }}
                />
                <span
                  className="text-xs"
                  style={{ color: LIBRARY_AESTHETICS.colors.primary.parchment }}
                >
                  {app}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-auto">
          <div className="flex items-center justify-between border-t pt-4">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-6 w-6 rounded-full border-2"
                    style={{
                      backgroundColor: `${aesthetic.color}${15 + i * 5}`,
                      borderColor: LIBRARY_AESTHETICS.colors.primary.lapis,
                    }}
                  />
                ))}
              </div>
              <span
                className="text-xs"
                style={{ color: `${aesthetic.color}70` }}
              >
                Used by elite practitioners
              </span>
            </div>
            <div
              className="flex items-center gap-2 text-sm font-medium"
              style={{ color: aesthetic.color }}
            >
              <span>Deploy Tool</span>
              <span className="transition-transform group-hover:translate-x-1">
                ⚡
              </span>
            </div>
          </div>
        </div>
      </div>
    </BaseCard>
  );
};

/* -------------------------------------------------------------------------- */
/* DOWNLOAD CARD - Executive Asset                                            */
/* -------------------------------------------------------------------------- */

interface DownloadCardProps {
  item: AnyContent;
}

export const DownloadCard: React.FC<DownloadCardProps> = ({ item }) => {
  const aesthetic = CONTENT_CATEGORIES.DOWNLOADS;
  const title = (item as any).title;
  const fileType = (item as any).fileType || "Digital Asset";
  const size = (item as any).size || "Premium";
  const version = (item as any).version || "v1.0";

  return (
    <BaseCard item={item} aesthetic={aesthetic}>
      <div className="flex h-full flex-col">
        {/* Asset header */}
        <div className="mb-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="rounded-xl p-3"
                style={{
                  background: `linear-gradient(135deg, ${aesthetic.color}20, ${aesthetic.color}05)`,
                  border: `1px solid ${aesthetic.color}30`,
                }}
              >
                <div className="text-2xl" style={{ color: aesthetic.color }}>
                  📥
                </div>
              </div>
              <div>
                <span
                  className="block text-sm font-medium uppercase tracking-widest"
                  style={{ color: aesthetic.color }}
                >
                  Executive Asset
                </span>
                <span
                  className="text-xs"
                  style={{ color: `${aesthetic.color}70` }}
                >
                  {fileType}
                </span>
              </div>
            </div>
            <div
              className="rounded-lg px-3 py-1 text-xs"
              style={{
                backgroundColor: `${aesthetic.color}10`,
                color: aesthetic.color,
                border: `1px solid ${aesthetic.color}20`,
              }}
            >
              {size}
            </div>
          </div>

          <h3
            className="mb-4 font-serif text-2xl font-medium"
            style={{ color: LIBRARY_AESTHETICS.colors.primary.lapis }}
          >
            {title}
          </h3>
        </div>

        {/* Version and details */}
        <div className="mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div
              className="rounded-lg p-3"
              style={{
                backgroundColor: `${aesthetic.color}08`,
                border: `1px solid ${aesthetic.color}20`,
              }}
            >
              <span
                className="mb-1 block text-xs"
                style={{ color: `${aesthetic.color}70` }}
              >
                Version
              </span>
              <span
                className="font-medium"
                style={{ color: LIBRARY_AESTHETICS.colors.primary.parchment }}
              >
                {version}
              </span>
            </div>
            <div
              className="rounded-lg p-3"
              style={{
                backgroundColor: `${aesthetic.color}08`,
                border: `1px solid ${aesthetic.color}20`,
              }}
            >
              <span
                className="mb-1 block text-xs"
                style={{ color: `${aesthetic.color}70` }}
              >
                Format
              </span>
              <span
                className="font-medium"
                style={{ color: LIBRARY_AESTHETICS.colors.primary.parchment }}
              >
                Digital
              </span>
            </div>
          </div>
        </div>

        <div className="mt-auto">
          <div className="flex items-center justify-between border-t pt-4">
            <div className="flex items-center gap-2">
              <div
                className="h-2 w-2 animate-pulse rounded-full"
                style={{ backgroundColor: aesthetic.color }}
              />
              <span
                className="text-xs"
                style={{ color: `${aesthetic.color}70` }}
              >
                Ready for download
              </span>
            </div>
            <div
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all hover:gap-3"
              style={{
                backgroundColor: `${aesthetic.color}15`,
                color: aesthetic.color,
              }}
            >
              <span>Acquire Asset</span>
              <span className="transition-transform group-hover:translate-x-1">
                ↓
              </span>
            </div>
          </div>
        </div>
      </div>
    </BaseCard>
  );
};

/* -------------------------------------------------------------------------- */
/* EVENT CARD - Exclusive Gathering                                           */
/* -------------------------------------------------------------------------- */

interface EventCardProps {
  item: AnyContent;
}

export const EventCard: React.FC<EventCardProps> = ({ item }) => {
  const aesthetic = CONTENT_CATEGORIES.EVENTS;
  const title = (item as any).title;
  const date = (item as any).date;
  const format = (item as any).format || "Private Session";
  const status = (item as any).status || "Upcoming";
  const location = (item as any).location || "The Archive";

  const eventDate = date ? new Date(date) : null;
  const formattedDate = eventDate
    ? eventDate.toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Date TBD";

  const isUpcoming = status === "Upcoming";

  return (
    <BaseCard item={item} aesthetic={aesthetic}>
      <div className="flex h-full flex-col">
        {/* Status badge */}
        <div className="mb-6">
          <div className="mb-4 flex items-center justify-between">
            <div
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                isUpcoming ? "animate-pulse" : ""
              }`}
              style={{
                backgroundColor: isUpcoming
                  ? `${aesthetic.color}20`
                  : `${aesthetic.color}10`,
                color: aesthetic.color,
                border: `1px solid ${aesthetic.color}30`,
              }}
            >
              {isUpcoming ? "⏳ " : "✓ "}
              {status}
            </div>
            <div className="text-2xl" style={{ color: aesthetic.color }}>
              🕯
            </div>
          </div>

          <h3
            className="mb-3 font-serif text-2xl font-medium"
            style={{ color: LIBRARY_AESTHETICS.colors.primary.lapis }}
          >
            {title}
          </h3>
          <span
            className="block text-sm"
            style={{ color: `${LIBRARY_AESTHETICS.colors.primary.parchment}70` }}
          >
            {format}
          </span>
        </div>

        {/* Event details */}
        <div className="mb-6 space-y-4">
          <div className="flex items-center gap-3">
            <div
              className="rounded-lg p-2"
              style={{ backgroundColor: `${aesthetic.color}10` }}
            >
              <div className="text-sm" style={{ color: aesthetic.color }}>
                📅
              </div>
            </div>
            <div>
              <span
                className="block text-sm font-medium"
                style={{ color: LIBRARY_AESTHETICS.colors.primary.parchment }}
              >
                {formattedDate}
              </span>
              <span
                className="text-xs"
                style={{ color: `${aesthetic.color}70` }}
              >
                {eventDate
                  ? eventDate.toLocaleTimeString("en-GB", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "Time TBD"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div
              className="rounded-lg p-2"
              style={{ backgroundColor: `${aesthetic.color}10` }}
            >
              <div className="text-sm" style={{ color: aesthetic.color }}>
                📍
              </div>
            </div>
            <span
              className="text-sm"
              style={{ color: LIBRARY_AESTHETICS.colors.primary.parchment }}
            >
              {location}
            </span>
          </div>
        </div>

        <div className="mt-auto">
          <div className="flex items-center justify-between border-t pt-4">
            <div className="flex items-center gap-2">
              <div
                className="h-6 w-6 rounded-full"
                style={{
                  background: `conic-gradient(${aesthetic.color} 0%, ${aesthetic.color} 75%, transparent 75%, transparent 100%)`,
                }}
              />
              <span
                className="text-xs"
                style={{ color: `${aesthetic.color}70` }}
              >
                {isUpcoming ? "Limited seats" : "Archived"}
              </span>
            </div>
            <div
              className="flex items-center gap-2 text-sm font-medium"
              style={{ color: aesthetic.color }}
            >
              <span>{isUpcoming ? "Secure Seat" : "Review Archive"}</span>
              <span className="transition-transform group-hover:translate-x-1">
                {isUpcoming ? "→" : "↗"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </BaseCard>
  );
};

/* -------------------------------------------------------------------------- */
/* PRINT CARD - Artisan Edition                                               */
/* -------------------------------------------------------------------------- */

interface PrintCardProps {
  item: AnyContent;
}

export const PrintCard: React.FC<PrintCardProps> = ({ item }) => {
  const aesthetic = CONTENT_CATEGORIES.PRINTS;
  const title = (item as any).title;
  const edition = (item as any).edition || "Limited Edition";
  const medium = (item as any).medium || "Archival Print";
  const dimensions = (item as any).dimensions || "Custom";
  const availability = (item as any).availability || "Available";

  return (
    <BaseCard item={item} aesthetic={aesthetic}>
      {/* Artisan stamp */}
      <div
        className="absolute right-6 top-6 rotate-12 opacity-10 group-hover:opacity-20"
        style={{ color: aesthetic.color }}
      >
        <div className="text-4xl">𓃭</div>
      </div>

      <div className="flex h-full flex-col">
        <div className="mb-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="rounded-xl p-3"
                style={{
                  background: `linear-gradient(135deg, ${aesthetic.color}15, ${aesthetic.color}05)`,
                  border: `1px solid ${aesthetic.color}30`,
                }}
              >
                <div className="text-2xl" style={{ color: aesthetic.color }}>
                  🖼
                </div>
              </div>
              <div>
                <span
                  className="block text-sm font-medium uppercase tracking-widest"
                  style={{ color: aesthetic.color }}
                >
                  {edition}
                </span>
                <span
                  className="text-xs"
                  style={{ color: `${aesthetic.color}70` }}
                >
                  {medium}
                </span>
              </div>
            </div>
            <div
              className={`rounded-lg px-3 py-1 text-xs font-medium ${
                availability === "Available" ? "animate-pulse" : ""
              }`}
              style={{
                backgroundColor:
                  availability === "Available"
                    ? `${aesthetic.color}20`
                    : `${aesthetic.color}10`,
                color: aesthetic.color,
              }}
            >
              {availability}
            </div>
          </div>

          <h3
            className="mb-4 font-serif text-2xl font-medium"
            style={{ color: LIBRARY_AESTHETICS.colors.primary.lapis }}
          >
            {title}
          </h3>
        </div>

        {/* Print details */}
        <div className="mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div
              className="rounded-lg p-3"
              style={{
                backgroundColor: `${aesthetic.color}08`,
                border: `1px solid ${aesthetic.color}20`,
              }}
            >
              <span
                className="mb-1 block text-xs"
                style={{ color: `${aesthetic.color}70` }}
              >
                Medium
              </span>
              <span
                className="font-medium"
                style={{ color: LIBRARY_AESTHETICS.colors.primary.parchment }}
              >
                {medium}
              </span>
            </div>
            <div
              className="rounded-lg p-3"
              style={{
                backgroundColor: `${aesthetic.color}08`,
                border: `1px solid ${aesthetic.color}20`,
              }}
            >
              <span
                className="mb-1 block text-xs"
                style={{ color: `${aesthetic.color}70` }}
              >
                Dimensions
              </span>
              <span
                className="font-medium"
                style={{ color: LIBRARY_AESTHETICS.colors.primary.parchment }}
              >
                {dimensions}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-auto">
          <div className="flex items-center justify-between border-t pt-4">
            <div className="flex items-center gap-2">
              <div className="relative">
                <div
                  className="h-5 w-5 rounded-full border"
                  style={{
                    backgroundColor: aesthetic.color,
                    borderColor: `${aesthetic.color}50`,
                  }}
                />
                <div
                  className="absolute inset-0 animate-ping rounded-full"
                  style={{ backgroundColor: `${aesthetic.color}30` }}
                />
              </div>
              <span
                className="text-xs"
                style={{ color: `${aesthetic.color}70` }}
              >
                Handcrafted & numbered
              </span>
            </div>
            <div
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium"
              style={{
                backgroundColor: `${aesthetic.color}15`,
                color: aesthetic.color,
              }}
            >
              <span>View Edition</span>
              <span className="transition-transform group-hover:translate-x-1">
                🎨
              </span>
            </div>
          </div>
        </div>
      </div>
    </BaseCard>
  );
};

/* -------------------------------------------------------------------------- */
/* UNIVERSAL CONTENT CARD                                                     */
/* -------------------------------------------------------------------------- */

interface ContentCardProps {
  item: AnyContent;
}

export const ContentCard: React.FC<ContentCardProps> = ({ item }) => {
  const category = getCategoryFromItem(item);

  switch (category) {
    case "POSTS":
      return <BlogPostCard item={item} />;
    case "BOOKS":
      return <BookCard item={item} />;
    case "CANON":
      return <CanonCard item={item} />;
    case "RESOURCES":
      return <ResourceCard item={item} />;
    case "DOWNLOADS":
      return <DownloadCard item={item} />;
    case "EVENTS":
      return <EventCard item={item} />;
    case "PRINTS":
      return <PrintCard item={item} />;
    default:
      return <BlogPostCard item={item} />;
  }
};

/* -------------------------------------------------------------------------- */
/* EXPORT ALL CARDS                                                           */
/* -------------------------------------------------------------------------- */

export {
  BlogPostCard,
  BookCard,
  CanonCard,
  ResourceCard,
  DownloadCard,
  EventCard,
  PrintCard,
  ContentCard as default,
};