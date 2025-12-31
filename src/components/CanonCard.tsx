// src/components/CanonCard.tsx
import * as React from "react";
import Link from "next/link";

export interface CanonCardProps {
  slug?: string;
  href?: string;
  title?: string;
  subtitle?: string | null;
  description?: string | null;
  excerpt?: string | null;
  accessLevel?: string | null;
  volumeNumber?: string | null;
  order?: number | null;
  tags?: string[] | null;
  lockMessage?: string | null;
  [key: string]: unknown; // tolerate extra fields from Contentlayer
}

/**
 * Card used on the Canon index to present a volume / resource.
 */
export default function CanonCard(props: CanonCardProps): JSX.Element {
  const {
    slug,
    href,
    title,
    subtitle,
    description,
    excerpt,
    accessLevel,
    volumeNumber,
    order,
    tags,
  } = props;

  const url = href ?? (slug ? `/canon/${slug}` : "#");
  const text = description || excerpt || subtitle || "";
  const isLocked = accessLevel === "inner-circle";

  return (
    <Link
      href={url}
      className="group block rounded-3xl border border-white/5 bg-gradient-to-br from-black/70 via-charcoal/90 to-black/80 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.9)] transition-transform duration-300 hover:-translate-y-1 hover:border-softGold/70 hover:shadow-softGold/20"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-softGold/80">
            {volumeNumber && (
              <span className="rounded-full border border-softGold/60 px-3 py-1">
                Volume {volumeNumber}
              </span>
            )}
            {typeof order === "number" && (
              <span className="rounded-full border border-softGold/30 px-3 py-1 text-softGold/70">
                Order {order}
              </span>
            )}
            {isLocked && (
              <span className="inline-flex items-center gap-1 rounded-full border border-softGold/70 bg-softGold/10 px-3 py-1 text-softGold">
                <span className="text-xs">🔒</span>
                Inner Circle
              </span>
            )}
          </div>

          {title && (
            <h2 className="font-serif text-xl font-semibold text-cream sm:text-2xl">
              {title}
            </h2>
          )}

          {subtitle && (
            <p className="text-sm text-gold/80 sm:text-[0.95rem]">
              {subtitle}
            </p>
          )}

          {text && (
            <p className="text-sm leading-relaxed text-gray-200 sm:text-[0.95rem]">
              {text}
            </p>
          )}
        </div>

        <div className="mt-1 hidden text-softGold/80 group-hover:text-softGold sm:block">
          ➜
        </div>
      </div>

      {tags && tags.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          {tags.slice(0, 6).map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-gray-700/70 bg-gray-900/60 px-3 py-1 text-[0.7rem] uppercase tracking-[0.14em] text-gray-300"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
