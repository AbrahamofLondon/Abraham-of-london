import * as React from "react";
import Link from "next/link";

export interface CanonCardProps {
  title: string;
  subtitle?: string | null;
  description?: string | null;
  slug?: string;
  href?: string;
  volumeNumber?: string | number | null;
  accessLevel?: string | null;
  lockMessage?: string | null;
  tags?: string[];
  className?: string;
  [key: string]: unknown;
}

const CanonCard: React.FC<CanonCardProps> = ({
  title,
  subtitle,
  description,
  slug,
  href,
  volumeNumber,
  accessLevel,
  lockMessage,
  tags,
  className,
}) => {
  const url = href ?? (slug ? `/canon/${slug}` : "#");
  const isInnerCircle = accessLevel === "inner-circle";

  return (
    <Link
      href={url}
      className={[
        "group block rounded-3xl border border-white/10 bg-gradient-to-br",
        "from-charcoal via-charcoal/95 to-charcoal/90 p-5 sm:p-6",
        "shadow-[0_16px_50px_rgba(0,0,0,0.75)] transition-transform duration-200",
        "hover:-translate-y-1 hover:border-softGold/70 hover:shadow-softGold/30",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            {volumeNumber && (
              <span className="rounded-full border border-softGold/40 bg-softGold/10 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-softGold">
                Vol. {volumeNumber}
              </span>
            )}

            {isInnerCircle && (
              <span className="inline-flex items-center gap-1 rounded-full border border-softGold/60 bg-black/40 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-softGold">
                🔒 Inner Circle
              </span>
            )}
          </div>

          <h2 className="font-serif text-xl sm:text-2xl font-semibold text-cream">
            {title}
          </h2>

          {subtitle && (
            <p className="text-sm font-medium text-softGold/90">{subtitle}</p>
          )}

          {description && (
            <p className="text-sm leading-relaxed text-gray-200 line-clamp-3">
              {description}
            </p>
          )}

          {isInnerCircle && lockMessage && (
            <p className="mt-1 text-[0.75rem] leading-relaxed text-softGold/80">
              {lockMessage}
            </p>
          )}

          {tags && tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {tags.slice(0, 6).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-gray-700/70 bg-black/40 px-3 py-1 text-[0.7rem] uppercase tracking-[0.14em] text-gray-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="mt-1 shrink-0 text-sm text-gray-500 group-hover:text-softGold/80">
          ↗
        </div>
      </div>
    </Link>
  );
};

export default CanonCard;