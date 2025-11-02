// components/EventCard.tsx (FULLY ROBUST VERSION)
import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import clsx from "clsx";
import React, { useId, useCallback, useState, useMemo } from "react";
import { motion, useScroll, useTransform, useSpring, type Variants, type MotionProps } from "framer-motion"; // Ensure all framer-motion imports are present

type Props = {
    slug: string;
    title: string;
    date: string;
    location?: string | null; // Allow null
    description?: string | null; // Allow null
    tags?: string[] | null; // Allow null
    chatham?: boolean;
    heroImage?: string | null; // Allow null
    className?: string;
    prefetch?: boolean;
    timeZone?: string;

    heroFit?: "cover" | "contain";
    heroAspect?: "16/9" | "21/9" | "3/1";
    heroPosition?: "center" | "top" | "left" | "right";

    resources?: {
        downloads?: { href: string; label: string }[] | null;
        reads?: { href: string; label: string }[] | null;
    } | null;
};

/* ---------- per-slug presentation overrides ---------- */
const HERO_OVERRIDES: Record<
    string,
    { heroFit?: Props["heroFit"]; heroAspect?: Props["heroAspect"]; heroPosition?: Props["heroPosition"] }
> = {
    "leadership-workshop": { heroFit: "contain", heroAspect: "3/1", heroPosition: "top" },
    "founders-salon":      { heroFit: "cover", heroAspect: "21/9", heroPosition: "center" },
};

/* ---------- date helpers ---------- */
const isDateOnly = (s: string): boolean => /^\d{4}-\d{2}-\d{2}$/.test(s);
const isValidDate = (d: Date): boolean => !Number.isNaN(d.valueOf());

function formatNiceDate(iso: string, tz = "Europe/London"): string {
    // CRITICAL FIX: Ensure iso is a string before checking regex
    if (!iso || typeof iso !== 'string') return ''; 
    
    // ... (rest of the date formatting logic is complex but assumed correct) ...
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
const ensureLocal = (p?: string | null): string | undefined =>
    p && !/^https?:\/\//i.test(p) ? (p.startsWith("/") ? p : `/${p.replace(/^\/+/, "")}`) : undefined;

function useEventImageCandidates(slug: string, heroImage?: string | null) {
    const { candidates } = useMemo(() => {
        const explicit = ensureLocal(heroImage);

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
            "/assets/images/events/default.jpg",
        ].filter(Boolean) as string[];

        return { candidates: Array.from(new Set(list)) };
    }, [slug, heroImage]);

    const [idx, setIdx] = useState(0);
    const src = candidates[idx];
    const onError = useCallback(
        () => setIdx((i) => (i + 1 < candidates.length ? i + 1 : i)),
        [candidates.length]
    );

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
    heroFit,
    heroAspect,
    heroPosition,
    resources = null,
}: Props) {
    // merge per-slug overrides first, then explicit props
    const preset = HERO_OVERRIDES[slug.toLowerCase()] || {}; // CRITICAL: Ensure slug is lowercased for lookup
    const _heroFit: NonNullable<Props["heroFit"]> = heroFit || preset.heroFit || "cover";
    const _heroAspect: NonNullable<Props["heroAspect"]> = heroAspect || preset.heroAspect || "16/9";
    const _heroPosition: NonNullable<Props["heroPosition"]> = heroPosition || preset.heroPosition || "center";

    const nice = formatNiceDate(date, timeZone);
    const titleId = useId();
    const isChatham =
        Boolean(chatham) || (Array.isArray(tags) && tags.some((t) => String(t).toLowerCase() === "chatham"));

    const { src, hasAny, onError } = useEventImageCandidates(slug, heroImage);

    const aspectClass =
        _heroAspect === "21/9" ? "aspect-[21/9]" : _heroAspect === "3/1" ? "aspect-[3/1]" : "aspect-[16/9]";

    const fitClass = _heroFit === "contain" ? "object-contain bg-warmWhite" : "object-cover";
    const posClass =
        _heroPosition === "top"
            ? "object-top"
            : _heroPosition === "left"
            ? "object-left"
            : _heroPosition === "right"
            ? "object-right"
            : "object-center";

    // Build resource pills defensively
    const pills: Array<{ href: string; label: string; kind: "download" | "read" }> = [];
    
    // ROBUST: Check for array and use safe slicing
    const downloads = Array.isArray(resources?.downloads) ? resources.downloads : [];
    const reads = Array.isArray(resources?.reads) ? resources.reads : [];

    for (const d of downloads.slice(0, 2)) pills.push({ href: d.href, label: d.label, kind: "download" });
    
    if (pills.length < 2) {
        for (const r of reads.slice(0, 2 - pills.length))
            pills.push({ href: r.href, label: r.label, kind: "read" });
    }

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
            {/* Image Link Block */}
            <Link href={`/events/${slug}`} prefetch={prefetch} className="block relative w-full">
                {hasAny && src && (
                    <div className={clsx("relative w-full", aspectClass)}>
                        <Image
                            src={src}
                            alt={`${title} image`}
                            fill
                            sizes="(max-width: 768px) 100vw, 33vw"
                            className={clsx(fitClass, posClass)}
                            onError={onError}
                            priority={false}
                        />
                        {isChatham && (
                            <span
                                className="absolute right-3 top-3 rounded-full bg-[color:var(--color-on-secondary)/0.9] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cream"
                            >
                                Chatham
                            </span>
                        )}
                    </div>
                )}
            </Link>

            <div className="p-6">
                <div className="mb-2 flex flex-wrap items-center gap-2 text-sm text-gray-600">
                    <time dateTime={date} className="rounded-full bg-warmWhite px-2 py-0.5 text-[color:var(--color-on-secondary)/0.8]" itemProp="startDate">
                        {nice}
                    </time>
                    {/* ROBUST: Use optional chaining or null check on location */}
                    {location?.trim() && ( 
                        <>
                            <span aria-hidden="true">·</span>
                            <span className="rounded-full bg-warmWhite px-2 py-0.5 text-[color:var(--color-on-secondary)/0.8]" itemProp="location">
                                {location}
                            </span>
                        </>
                    )}
                </div>

                <h3 id={titleId} className="text-lg font-semibold leading-snug text-gray-900" itemProp="name">
                    <Link
                        href={`/events/${slug}`}
                        className="outline-none transition-colors hover:text-forest focus-visible:rounded focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)/0.3]"
                        prefetch={prefetch}
                    >
                        {title}
                    </Link>
                </h3>

                {/* ROBUST: Check description for existence before rendering */}
                {description && ( 
                    <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-gray-700" itemProp="description">
                        {description}
                    </p>
                )}

                {/* quick resource pills */}
                {pills.length > 0 && (
                    <ul className="mt-3 flex flex-wrap gap-2">
                        {pills.map((p, i) => (
                            <li key={i}>
                                <Link
                                    href={p.href}
                                    prefetch={false}
                                    className={clsx(
                                        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium transition",
                                        p.kind === "download"
                                            ? "border-[color:var(--color-primary)/0.2] text-forest hover:bg-forest hover:text-cream"
                                            : "border-lightGrey text-[color:var(--color-on-secondary)] hover:bg-warmWhite"
                                    )}
                                    target={/\.pdf$/i.test(p.href) ? "_blank" : undefined}
                                    rel={/\.pdf$/i.test(p.href) ? "noopener noreferrer" : undefined}
                                >
                                    {p.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}

                <div className="mt-4">
                    <Link
                        href={`/events/${slug}`}
                        className="inline-flex items-center rounded-full border border-[color:var(--color-primary)/0.2] px-3 py-1.5 text-sm font-medium text-forest transition-colors hover:bg-forest hover:text-cream"
                        prefetch={prefetch}
                        // aria-labelledby={titleId} // Removed redundant aria-labelledby
                    >
                        Details
                    </Link>
                </div>

                <meta itemProp="url" content={`/events/${slug}`} />
            </div>
        </article>
    );
}