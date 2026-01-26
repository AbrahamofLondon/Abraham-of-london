// components/content/CardDisplay.tsx - COMPLETE SELF-CONTAINED FIX
import * as React from "react";
import Link from "next/link";
import { safeSlice } from "@/lib/utils/safe";


// Define everything locally - NO imports from problematic modules
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

// Local type guard functions
const isPost = (doc: ContentDoc): boolean => doc.type === "Post";
const isBook = (doc: ContentDoc): boolean => doc.type === "Book";
const isCanon = (doc: ContentDoc): boolean => doc.type === "Canon";
const isDownload = (doc: ContentDoc): boolean => doc.type === "Download";
const isEvent = (doc: ContentDoc): boolean => doc.type === "Event";
const isPrint = (doc: ContentDoc): boolean => doc.type === "Print";
const isResource = (doc: ContentDoc): boolean => doc.type === "Resource";
const isStrategy = (doc: ContentDoc): boolean => doc.type === "Strategy";

// Local helper functions
const getCardPropsForDocument = (doc: ContentDoc) => ({
  title: doc.title || "Untitled",
  subtitle: doc.subtitle,
  excerpt: doc.excerpt,
  description: doc.description,
  coverImage: doc.coverImage,
  date: doc.date,
  tags: doc.tags || [],
  slug: doc.slug || "",
});

const formatCardDate = (dateString: string | null | undefined): string => {
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

const getCardImage = (coverImage: string | null | undefined, fallback: string): string => {
  return coverImage || fallback;
};

// Simple href builder
function getHref(doc: ContentDoc): string {
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
}

export default function CardDisplay({
  items,
  title,
  emptyMessage = "No items found.",
  className = "",
}: Props) {
  if (!Array.isArray(items) || items.length === 0) {
    return (
      <section className={className}>
        {title && (
          <h2 className="mb-4 font-serif text-xl font-semibold text-cream">
            {title}
          </h2>
        )}
        <div className="rounded-2xl border border-white/10 bg-black/30 p-6 text-sm text-gray-300">
          {emptyMessage}
        </div>
      </section>
    );
  }

  return (
    <section className={className}>
      {title && (
        <h2 className="mb-4 font-serif text-xl font-semibold text-cream">
          {title}
        </h2>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((doc) => {
          const card = getCardPropsForDocument(doc);
          const href = getHref(doc);
          const image = getCardImage(card.coverImage, "/assets/images/og-image.jpg");
          const date = formatCardDate(card.date);

          const docKey = doc._id || `${doc.type}-${card.slug}`;

          return (
            <Link
              key={docKey}
              href={href}
              className="group overflow-hidden rounded-2xl border border-white/10 bg-black/30 transition hover:border-white/20 hover:bg-black/40"
            >
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image}
                  alt={card.title || "Cover"}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              </div>

              <div className="space-y-2 p-4">
                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-gold/90">
                    {doc.type || "Content"}
                  </span>
                  {date && (
                    <span className="text-xs text-gray-400">{date}</span>
                  )}
                </div>

                <h3 className="line-clamp-2 font-serif text-lg font-semibold text-cream">
                  {card.title || "Untitled"}
                </h3>

                {card.subtitle && (
                  <p className="line-clamp-2 text-sm text-gold/80">
                    {card.subtitle}
                  </p>
                )}

                {(card.excerpt || card.description) && (
                  <p className="line-clamp-3 text-sm text-gray-300">
                    {card.excerpt || card.description}
                  </p>
                )}

                {Array.isArray(card.tags) && card.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {card.safeSlice(tags, 0, 3).map((t: string) => (
                      <span
                        key={t}
                        className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-gray-300"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}