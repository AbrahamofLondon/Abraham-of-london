"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";

/** Utility guards */
const s = (v: unknown) => (typeof v === "string" ? v : "");
const lower = (v: unknown) => (typeof v === "string" ? v.toLowerCase() : "");
const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
const isHttp = (u?: string | null) => !!u && /^https?:\/\//i.test(u || "");

type ResourceLink = { href: string; label: string };
type Resources = {
  downloads?: ResourceLink[];
  reads?: ResourceLink[];
} | null;

export type EventCardProps = {
  slug?: string | null;
  title?: string | null;
  date?: string | null; // ISO or YYYY-MM-DD
  location?: string | null;
  description?: string | null;
  tags?: string[] | null;
  heroImage?: string | null;
  resources?: Resources;
  className?: string;
};

/** Brand overrides to force-fit known covers */
const HERO_OVERRIDES: Record<
  string,
  { heroFit?: "cover" | "contain"; heroAspect?: `${number}/${number}` | string; heroPosition?: string }
> = {
  "leadership-workshop": { heroFit: "contain", heroAspect: "3/1", heroPosition: "top" },
  "founders-salon": { heroFit: "cover", heroAspect: "21/9", heroPosition: "center" },
  // add more here as needed
};

/** Build a robust hero image chain (explicit -> conventional -> fallback) */
function useHeroChain(slug?: string | null, heroImage?: string | null) {
  const cleanPath = (p?: string | null) =>
    p && !isHttp(p) ? (p.startsWith("/") ? p : `/${p}`) : p || undefined;

  return React.useMemo(() => {
    const safeSlug = s(slug);
    const explicit = cleanPath(heroImage);
    const base =
      safeSlug
        .toLowerCase() // guarded
        .replace(/[^a-z0-9-]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "") || "default";
    const exts = ["webp", "jpg", "jpeg", "png"];
    const candidates = [
      explicit,
      ...exts.map((e) => `/assets/images/events/${base}.${e}`),
      "/assets/images/events/default.jpg",
    ].filter(Boolean) as string[];
    return Array.from(new Set(candidates));
  }, [slug, heroImage]);
}

/** Display pill buttons for resources (defensive) */
function ResourcePills({ resources }: { resources?: Resources }) {
  const downloads = arr<ResourceLink>(resources?.downloads).filter(
    (d) => s(d?.href) && s(d?.label)
  );
  const reads = arr<ResourceLink>(resources?.reads).filter((r) => s(r?.href) && s(r?.label));

  if (!downloads.length && !reads.length) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {downloads.map((d, i) => (
        <Link
          key={`dl-${i}-${s(d.label)}`}
          href={s(d.href)}
          prefetch={false}
          className="inline-flex items-center rounded-full border border-lightGrey bg-warmWhite px-2.5 py-1 text-xs font-medium hover:bg-white"
          aria-label={`${s(d.label)} (download)`}
        >
          {s(d.label)}
        </Link>
      ))}
      {reads.map((r, i) => (
        <Link
          key={`rd-${i}-${s(r.label)}`}
          href={s(r.href)}
          prefetch={false}
          target={isHttp(r.href) ? "_blank" : undefined}
          rel={isHttp(r.href) ? "noopener noreferrer" : undefined}
          className="inline-flex items-center rounded-full border border-lightGrey bg-white px-2.5 py-1 text-xs font-medium hover:bg-warmWhite"
          aria-label={`${s(r.label)} (link)`}
        >
          {s(r.label)}
        </Link>
      ))}
    </div>
  );
}

export default function EventCard(props: EventCardProps) {
  const slug = s(props.slug);
  const title = s(props.title) || slug || "Untitled event";
  const location = s(props.location);
  const description = s(props.description);
  const tags = arr<string>(props.tags).map(s).filter(Boolean);
  const date = s(props.date);

  // hero chain + fallbacks
  const heroChain = useHeroChain(slug, props.heroImage);
  const [idx, setIdx] = React.useState(0);
  const heroSrc = heroChain[idx];
  const onHeroError = React.useCallback(() => {
    setIdx((x) => (x + 1 < heroChain.length ? x + 1 : x));
  }, [heroChain.length]);

  // brand override
  const o = HERO_OVERRIDES[slug] || {};
  const fit = o.heroFit ?? "cover";
  const aspect = o.heroAspect ?? "21/9";
  const pos = o.heroPosition ?? "center";

  // Simple date badge (keeps it robust)
  const when = React.useMemo(() => {
    if (!date) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const [y, m, d] = date.split("-").map(Number);
      const dt = new Date(Date.UTC(y, m - 1, d));
      return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(dt);
    }
    const d = new Date(date);
    if (Number.isNaN(d.valueOf())) return "";
    const dd = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "Europe/London" }).format(d);
    const tt = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Europe/London" }).format(d);
    return /\b00:00\b/.test(tt) ? dd : `${dd}, ${tt}`;
  }, [date]);

  return (
    <article
      className={clsx(
        "group flex h-full flex-col overflow-hidden rounded-2xl border border-lightGrey bg-white shadow-card transition hover:shadow-cardHover",
        props.className
      )}
    >
      {/* Media */}
      <div className={clsx("relative w-full", `aspect-[${aspect}]`, "bg-warmWhite")}>
        {heroSrc ? (
          <Image
            src={heroSrc}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className={clsx(fit === "contain" ? "object-contain" : "object-cover", `object-${pos}`)}
            onError={onHeroError}
            priority={false}
          />
        ) : null}
        {when ? (
          <div className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-1 text-[11px] font-medium shadow">
            {when}
          </div>
        ) : null}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-serif text-lg font-semibold text-deepCharcoal">
          <Link href={`/events/${encodeURIComponent(slug || "")}`} prefetch={false} className="hover:underline">
            {title}
          </Link>
        </h3>

        <div className="mt-1 text-xs text-[color:var(--color-on-secondary)/0.75]">
          {location && <span>{location}</span>}
          {location && tags.length ? <span aria-hidden> • </span> : null}
          {tags.length ? <span>{tags.slice(0, 3).join(" · ")}</span> : null}
        </div>

        {description && (
          <p className="mt-2 line-clamp-3 text-sm text-[color:var(--color-on-secondary)/0.9]">{description}</p>
        )}

        <ResourcePills resources={props.resources ?? null} />

        <div className="mt-4">
          <Link
            href={`/events/${encodeURIComponent(slug || "")}`}
            prefetch={false}
            className="inline-flex items-center gap-1 text-sm font-medium text-forest hover:underline"
            aria-label={`View event: ${title}`}
          >
            View details <span aria-hidden>↗</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
