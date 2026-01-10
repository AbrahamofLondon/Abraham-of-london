// components/content/CardDisplay.tsx
import * as React from "react";
import Link from "next/link";

import {
  type DocumentTypes,
  isBook,
  isCanon,
  isDownload,
  isEvent,
  isPost,
  isPrint,
  isResource,
  isStrategy,
  getCardPropsForDocument,
  formatCardDate,
  getCardImage,
} from "@/lib/contentlayer";

type Props = {
  items: DocumentTypes[];
  title?: string;
  emptyMessage?: string;
  className?: string;
};

function getHref(doc: DocumentTypes): string {
  const slug = (doc as any)?.slug || "";
  if (!slug) return "/";

  if (isPost(doc)) return `/blog/${slug}`;
  if (isBook(doc)) return `/books/${slug}`;
  if (isCanon(doc)) return `/canon/${slug}`;
  if (isDownload(doc)) return `/downloads/${slug}`;
  if (isEvent(doc)) return `/events/${slug}`;
  if (isPrint(doc)) return `/prints/${slug}`;
  if (isResource(doc)) return `/resources/${slug}`;
  if (isStrategy(doc)) return `/strategy/${slug}`;

  // fallback route if you have a unified content page
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
        {title ? (
          <h2 className="mb-4 font-serif text-xl font-semibold text-cream">
            {title}
          </h2>
        ) : null}
        <div className="rounded-2xl border border-white/10 bg-black/30 p-6 text-sm text-gray-300">
          {emptyMessage}
        </div>
      </section>
    );
  }

  return (
    <section className={className}>
      {title ? (
        <h2 className="mb-4 font-serif text-xl font-semibold text-cream">
          {title}
        </h2>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((doc) => {
          const card = getCardPropsForDocument(doc);
          const href = getHref(doc);

          const image = getCardImage(card.coverImage, "/assets/images/og-image.jpg");
          const date = formatCardDate(card.date);

          return (
            <Link
              key={(doc as any)._id ?? `${(doc as any).type}-${card.slug}`}
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
                    {(doc as any).type ?? "Content"}
                  </span>
                  {date ? (
                    <span className="text-xs text-gray-400">{date}</span>
                  ) : null}
                </div>

                <h3 className="line-clamp-2 font-serif text-lg font-semibold text-cream">
                  {card.title || "Untitled"}
                </h3>

                {card.subtitle ? (
                  <p className="line-clamp-2 text-sm text-gold/80">
                    {card.subtitle}
                  </p>
                ) : null}

                {card.excerpt || card.description ? (
                  <p className="line-clamp-3 text-sm text-gray-300">
                    {card.excerpt || card.description}
                  </p>
                ) : null}

                {Array.isArray(card.tags) && card.tags.length ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {card.tags.slice(0, 3).map((t: string) => (
                      <span
                        key={t}
                        className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-gray-300"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

