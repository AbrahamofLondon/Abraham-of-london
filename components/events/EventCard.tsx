import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";
import React from "react";

type Props = {
  slug: string;
  title: string;
  date: string; // ISO or YYYY-MM-DD
  location?: string;
  description?: string | null;
  tags?: string[] | null;
  chatham?: boolean;
  heroImage?: string | null; // may be local OR remote
  className?: string;
  prefetch?: boolean;
  timeZone?: string;

  /** Presentation tuning (per-card overrides) */
  heroFit?: "cover" | "contain";
  heroAspect?: "16/9" | "21/9" | "3/1";
  heroPosition?: "center" | "top" | "left" | "right";

  /** Show a subtle anchor to the resources block on the detail page */
  showResourcesLink?: boolean;
};

/* ---------- date helpers ---------- */
const isDateOnly = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);
const isValidDate = (d: Date) => !Number.isNaN(d.valueOf());

function formatNiceDate(iso: string, tz = "Europe/London") {
  if (isDateOnly(iso)) {
    const [y, m, d] = iso.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    if (!isValidDate(dt)) return iso;
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: "UTC",
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(dt);
  }
  const dt = new Date(iso);
  if (!isValidDate(dt)) return iso;
  const dateStr = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(dt);
  const timeStr = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(dt);
  return /\b00:00\b/.test(timeStr) ? dateStr : `${dateStr}, ${timeStr}`;
}

/* ---------- image helpers ---------- */
const normalizeSrc = (p?: string | null) => {
  if (!p) return undefined;
  if (/^https?:\/\//i.test(p)) return p; // allow remote
  return p.startsWith("/") ? p : `/${p.replace(/^\/+/, "")}`;
};

/** Try: explicit, exact slug, normalized slug, shortened slug, then default */
function useEventImageCandidates(slug: string, heroImage?: string | null) {
  const { candidates } = React.useMemo(() => {
    const explicit = normalizeSrc(heroImage);

    const base = slug
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    const short2 = base.split("-").slice(0, 2).join("-");
    const short3 = base.split("-").slice(0, 3).join("-");

    const exts = ["webp", "jpg", "jpeg", "png"];
    const from = (name: string) => exts.map((e) => `/assets/images/events/${name}.${e}`);

    const list = [
      explicit,
      ...from(base),
      ...from(short3),
      ...from(short2),
      "/assets/images/events/default-event-cover.jpg", // ✅ correct fallback
    ].filter(Boolean) as string[];

    return { candidates: Array.from(new Set(list)) };
  }, [slug, heroImage]);

  const [idx, setIdx] = React.useState(0);
  const src = candidates[idx];
  const onError = React.useCallback(() => {
    setIdx((i) => (i + 1 < candidates.length ? i + 1 : i));
  }, [candidates.length]);

  return { src, hasAny: candidates.length > 0, onError };
}

/* ---------- component ---------- */
export default function EventCard({
  slug,
  title,
  date,
  location,
  description,
  tags = null,
  chatham,
  className,
  prefetch = false,
  timeZone = "Europe/London",
  heroImage = null,
  heroFit = "cover",
  heroAspect = "16/9",
  heroPosition = "center",
  showResourcesLink = true,
}: Props) {
  const nice = formatNiceDate(date, timeZone);
  const titleId = React.useId();
  const isChatham =
    Boolean(chatham) || (Array.isArray(tags) && tags.some((t) => String(t).toLowerCase() === "chatham"));

  const { src, hasAny, onError } = useEventImageCandidates(slug, heroImage);

  const aspectClass =
    heroAspect === "21/9" ? "aspect-[21/9]" : heroAspect === "3/1" ? "aspect-[3/1]" : "aspect-[16/9]";
  const fitClass = heroFit === "contain" ? "object-contain bg-warmWhite" : "object-cover";
  const posClass =
    heroPosition === "top"
      ? "object-top"
      : heroPosition === "left"
      ? "object-left"
      : heroPosition === "right"
      ? "object-right"
      : "object-center";

  return (
    <article
      className={clsx(
        "relative overflow-hidden rounded-2xl border border-lightGrey bg-white shadow-card transition hover:shadow-cardHover",
        className
      )}
      aria-labelledby={titleId}
      itemScope
      itemType="https://schema.org/Event"
    >
      {hasAny && src && (
        <div className={clsx("relative w-full", aspectClass)}>
          <Image
            src={src}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className={clsx(fitClass, posClass)}
            onError={onError}
            priority={false}
          />
          <meta itemProp="image" content={src} />
          {isChatham && (
            <span
              className="absolute right-3 top-3 rounded-full bg-[color:var(--color-on-secondary)/0.9] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cream"
              title="Chatham Room (off the record)"
              aria-label="Chatham Room (off the record)"
            >
              Chatham
            </span>
          )}
        </div>
      )}

      <div className="p-6">
        <div className="mb-2 flex flex-wrap items-center gap-2 text-sm text-[color:var(--color-on-secondary)/0.7]">
          <time
            dateTime={date}
            itemProp="startDate"
            className="rounded-full bg-warmWhite px-2 py-0.5 text-[color:var(--color-on-secondary)/0.85]"
          >
            {nice}
          </time>
          {location?.trim() && (
            <>
              <span aria-hidden="true">·</span>
              <span className="rounded-full bg-warmWhite px-2 py-0.5 text-[color:var(--color-on-secondary)/0.85]" itemProp="location">
                {location}
              </span>
            </>
          )}
        </div>

        <h3 id={titleId} className="text-lg font-semibold leading-snug text-deepCharcoal" itemProp="name">
          <Link
            href={`/events/${slug}`}
            className="outline-none transition-colors hover:text-forest focus-visible:rounded focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)/0.3]"
            prefetch={prefetch}
          >
            {title}
          </Link>
        </h3>

        {description && (
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[color:var(--color-on-secondary)/0.85]" itemProp="description">
            {description}
          </p>
        )}

        <div className="mt-4 flex items-center gap-2">
          <Link
            href={`/events/${slug}`}
            className="inline-flex items-center rounded-full border border-[color:var(--color-primary)/0.2] px-3 py-1.5 text-sm font-medium text-forest transition-colors hover:bg-forest hover:text-cream"
            prefetch={prefetch}
            aria-labelledby={titleId}
          >
            Details
          </Link>

          {showResourcesLink && (
            <Link
              href={`/events/${slug}#event-resources-title`}
              className="inline-flex items-center rounded-full border border-lightGrey px-3 py-1.5 text-sm font-medium text-[color:var(--color-on-secondary)/0.85] hover:text-forest"
              prefetch={prefetch}
              aria-label={`${title} — Notes & PDFs`}
            >
              Notes & PDFs
            </Link>
          )}
        </div>

        <meta itemProp="url" content={`/events/${slug}`} />
      </div>
    </article>
  );
}
