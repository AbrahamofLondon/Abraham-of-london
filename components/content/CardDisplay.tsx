import * as React from "react";
import Link from "next/link";
import { Calendar, Tag, ChevronRight, BookOpen, Sparkles } from "lucide-react";

// =============================================================================
// TYPES – fully self-contained
// =============================================================================
type ContentDoc = {
  _id: string;
  slug: string;
  title: string;
  type: string;
  subtitle?: string;
  excerpt?: string;
  description?: string;
  coverImage?: string;
  date?: string;
  tags?: string[];
  [key: string]: any;
};

type Props = {
  items: ContentDoc[];
  title?: string;
  emptyMessage?: string;
  className?: string;
};

// =============================================================================
// TYPE GUARDS
// =============================================================================
const isPost = (doc: ContentDoc): boolean => doc.type === "Post";
const isBook = (doc: ContentDoc): boolean => doc.type === "Book";
const isCanon = (doc: ContentDoc): boolean => doc.type === "Canon";
const isDownload = (doc: ContentDoc): boolean => doc.type === "Download";
const isEvent = (doc: ContentDoc): boolean => doc.type === "Event";
const isPrint = (doc: ContentDoc): boolean => doc.type === "Print";
const isResource = (doc: ContentDoc): boolean => doc.type === "Resource";
const isStrategy = (doc: ContentDoc): boolean => doc.type === "Strategy";

// =============================================================================
// HELPERS
// =============================================================================
const getCardProps = (doc: ContentDoc) => ({
  title: doc.title || "Untitled",
  subtitle: doc.subtitle,
  excerpt: doc.excerpt,
  description: doc.description,
  coverImage: doc.coverImage,
  date: doc.date,
  tags: doc.tags || [],
  slug: doc.slug || "",
});

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return "";
  try {
    return new Date(dateString).toLocaleDateString("en-GB", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
};

const getImage = (coverImage: string | null | undefined): string => {
  return coverImage || "/assets/images/og-image.jpg";
};

const getHref = (doc: ContentDoc): string => {
  const slug = doc.slug || "";
  if (!slug) return "/";

  if (isPost(doc)) return `/blog/${slug}`;
  if (isBook(doc)) return `/books/${slug}`;
  if (isCanon(doc)) return `/canon/${slug}`;
  if (isDownload(doc)) return `/downloads/${slug}`;
  if (isEvent(doc)) return `/events/${slug}`;
  if (isPrint(doc)) return `/prints/${slug}`;
  if (isResource(doc)) return `/resources/${slug}`;
  if (isStrategy(doc)) return `/strategy/${slug}`;

  return `/content/${slug}`;
};

const getTypeLabel = (type: string): string => {
  const map: Record<string, string> = {
    Post: "Briefing",
    Book: "Volume",
    Canon: "Canon",
    Download: "Asset",
    Event: "Summit",
    Print: "Artifact",
    Resource: "Tool",
    Strategy: "Directive",
  };
  return map[type] || type;
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================
export default function CardDisplay({
  items,
  title,
  emptyMessage = "No intelligence matches your current query.",
  className = "",
}: Props) {
  if (!Array.isArray(items) || items.length === 0) {
    return (
      <section className={className}>
        {title && (
          <h2 className="mb-6 font-serif text-2xl font-semibold text-cream border-b border-white/10 pb-4">
            {title}
          </h2>
        )}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-black/60 to-zinc-950/80 p-12 text-center backdrop-blur-sm">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(245,158,11,0.08),transparent_50%)]" />
          <div className="relative">
            <BookOpen className="mx-auto h-12 w-12 text-amber-500/40" />
            <p className="mt-4 text-sm text-zinc-400">{emptyMessage}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={className}>
      {title && (
        <h2 className="mb-6 font-serif text-2xl font-semibold text-cream border-b border-white/10 pb-4 flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-amber-400" />
          {title}
        </h2>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((doc) => {
          const card = getCardProps(doc);
          const href = getHref(doc);
          const image = getImage(card.coverImage);
          const date = formatDate(card.date);
          const typeLabel = getTypeLabel(doc.type);
          const key = doc._id || `${doc.type}-${card.slug}`;

          return (
            <Link
              key={key}
              href={href}
              className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-black/60 to-zinc-950/80 transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/40 hover:shadow-2xl hover:shadow-amber-900/20"
            >
              {/* Glow overlay */}
              <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 via-transparent to-transparent" />
              </div>

              {/* Image container */}
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image}
                  alt={card.title}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                {/* Type badge – absolute positioned */}
                <span className="absolute left-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-black/60 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-400 backdrop-blur-sm">
                  {typeLabel}
                </span>
              </div>

              {/* Content */}
              <div className="flex flex-1 flex-col p-5">
                {/* Title */}
                <h3 className="mb-2 font-serif text-lg font-semibold leading-tight text-cream transition-colors group-hover:text-amber-400">
                  {card.title}
                </h3>

                {/* Subtitle / excerpt */}
                {card.subtitle && (
                  <p className="mb-2 text-sm text-amber-400/80 line-clamp-2">
                    {card.subtitle}
                  </p>
                )}
                {(card.excerpt || card.description) && (
                  <p className="mb-4 text-sm leading-relaxed text-zinc-400 line-clamp-3">
                    {card.excerpt || card.description}
                  </p>
                )}

                {/* Metadata row */}
                <div className="mt-auto flex items-center justify-between">
                  {date && (
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{date}</span>
                    </div>
                  )}

                  <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-400 transition-all group-hover:gap-2">
                    Read <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>

                {/* Tags */}
                {Array.isArray(card.tags) && card.tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-white/5 pt-4">
                    <Tag className="h-3.5 w-3.5 text-zinc-600" />
                    {card.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-zinc-400 transition-colors hover:border-amber-500/30 hover:bg-amber-500/10 hover:text-amber-300"
                      >
                        {tag}
                      </span>
                    ))}
                    {card.tags.length > 3 && (
                      <span className="text-[10px] text-zinc-600">
                        +{card.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Subtle corner accent */}
              <div className="pointer-events-none absolute bottom-0 right-0 h-12 w-12 opacity-0 transition-opacity group-hover:opacity-100">
                <div className="absolute bottom-0 right-0 h-6 w-6 border-b-2 border-r-2 border-amber-500/30 rounded-br-2xl" />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}