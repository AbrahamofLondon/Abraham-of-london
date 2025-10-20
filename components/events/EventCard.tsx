// components/events/EventCard.tsx
"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";

type ResItem = { href: string; label: string };
type Props = {
  slug: string;
  title: string;
  date: string;
  location?: string;
  description?: string;
  tags?: string[];
  heroImage?: string;
  resources?: { downloads?: ResItem[]; reads?: ResItem[] } | null;
};
const lower = (v: unknown) => (typeof v === "string" ? v.toLowerCase() : "");

// Per-event visual overrides (aspect/fit/position)
const HERO_OVERRIDES = {
  "leadership-workshop": { heroFit: "contain", heroAspect: "3/1", heroPosition: "top" },
  "founders-salon": { heroFit: "contain", heroAspect: "16/9", heroPosition: "center" },
  // add more slugs here…
} as const;

function aspectClass(key?: string) {
  switch (key) {
    case "3/1":
      return "aspect-[3/1]";
    case "21/9":
      return "aspect-[21/9]";
    case "16/9":
      return "aspect-[16/9]";
    case "2/3":
      return "aspect-[2/3]";
    default:
      return "aspect-[16/10]";
  }
}

export default function EventCard({
  slug,
  title,
  date,
  location,
  description,
  tags,
  heroImage,
  resources,
}: Props) {
  const ov = HERO_OVERRIDES[lower(slug) as keyof typeof HERO_OVERRIDES];

  const candidates = React.useMemo(() => {
    const base = lower(slug).replace(/[^a-z0-9-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
    const list = [
      heroImage && !/^https?:\/\//i.test(heroImage) ? (heroImage.startsWith("/") ? heroImage : `/${heroImage}`) : heroImage,
      `/assets/images/events/${base}.webp`,
      `/assets/images/events/${base}.jpg`,
      `/assets/images/events/${base}.jpeg`,
      `/assets/images/events/${base}.png`,
      "/assets/images/events/default.jpg",
    ].filter(Boolean) as string[];
    return Array.from(new Set(list));
  }, [slug, heroImage]);

  const [idx, setIdx] = React.useState(0);
  const hero = candidates[idx];
  const onHeroError = React.useCallback(() => {
    setIdx((i) => (i + 1 < candidates.length ? i + 1 : i));
  }, [candidates.length]);

  const dt = date ? new Date(date) : null;
  const dateLabel =
    dt && !Number.isNaN(+dt)
      ? new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(dt)
      : date;

  const pillDownloads = resources?.downloads || [];
  const pillReads = resources?.reads || [];

  const fit = lower(ov?.heroFit) === "contain" ? "object-contain" : "object-cover";
  const pos =
    lower(ov?.heroPosition) === "top"
      ? "object-top"
      : lower(ov?.heroPosition) === "left"
      ? "object-left"
      : lower(ov?.heroPosition) === "right"
      ? "object-right"
      : "object-center";

  return (
    <article className="rounded-2xl border border-lightGrey bg-white shadow-card transition hover:shadow-cardHover">
      <Link href={`/events/${encodeURIComponent(slug)}`} prefetch={false} className="block">
        {/* hero */}
        <div className={`relative w-full overflow-hidden rounded-t-2xl ${aspectClass(ov?.heroAspect)} bg-warmWhite p-2`}>
          {hero && (
            <Image src={hero} alt="" fill sizes="(max-width: 768px) 100vw, 33vw" className={`${fit} ${pos}`} onError={onHeroError} />
          )}
        </div>

        <div className="p-5">
          <h3 className="font-serif text-xl font-semibold text-deepCharcoal">{title}</h3>
          <div className="mt-1 text-sm text-[color:var(--color-on-secondary)/0.7]">
            <span>{dateLabel}</span>
            {location && <span className="ml-2">• {location}</span>}
          </div>
          {description && <p className="mt-3 text-sm text-[color:var(--color-on-secondary)/0.85] line-clamp-3">{description}</p>}

          {/* resource pills */}
          {(pillDownloads.length || pillReads.length) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {pillDownloads.slice(0, 2).map((d) => (
                <span key={d.href} className="inline-flex rounded-full border border-lightGrey px-2 py-0.5 text-xs">
                  📄 {d.label}
                </span>
              ))}
              {pillReads.slice(0, 2).map((r) => (
                <span key={r.href} className="inline-flex rounded-full border border-lightGrey px-2 py-0.5 text-xs">
                  📚 {r.label}
                </span>
              ))}
            </div>
          )}

          {/* tags */}
          {Array.isArray(tags) && tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {tags.slice(0, 3).map((t, i) => (
                <span key={`${t}-${i}`} className="rounded border border-lightGrey bg-warmWhite px-2 py-0.5 text-xs">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      </Link>
    </article>
  );
}
