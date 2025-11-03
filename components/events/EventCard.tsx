// components/events/EventCard.tsx (ROBUST LINK GUARD)
"use client";
import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";
import type { EventMeta, EventResources } from "@/types/event";

type Props = Partial<EventMeta>;

const DEFAULT_EVENT_IMAGE = "/assets/images/events/default.jpg";

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
  
  // ✅ FIX: Guard the href against undefined/null slugs
  const href = slug ? `/events/${slug}` : '#';
  const isLinkDisabled = !slug;

  const [currentHeroSrc, setCurrentHeroSrc] = React.useState(heroImage || DEFAULT_EVENT_IMAGE);
  
  const dt = React.useMemo(() => (date ? new Date(date) : null), [date]);
  const isValidDate = dt && !Number.isNaN(+dt);
  const dateLabel = isValidDate
    ? new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short", year: "numeric" }).format(dt!)
    : date;

  return (
    <article className="group rounded-2xl border border-lightGrey bg-white shadow-card transition hover:shadow-cardHover">
      <Link href={href} prefetch={false} className={clsx("block", isLinkDisabled && "pointer-events-none")} aria-label={`View event details for: ${title}`}>
        {/* Hero image container */}
        <div className="relative w-full overflow-hidden rounded-t-2xl aspect-[16/10] bg-warmWhite">
          <Image
            src={currentHeroSrc}
            alt={title ? `${title} event illustration` : "Event illustration"}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            onError={() => setCurrentHeroSrc(DEFAULT_EVENT_IMAGE)}
            priority={false}
          />
        </div>

        <div className="p-5">
          <h3 className="font-serif text-xl font-semibold text-deepCharcoal">{title}</h3>

          {/* Date and Location */}
          <div className="mt-1 text-sm text-[color:var(--color-on-secondary)]/[0.7]">
            <span>{dateLabel}</span>
            {location && <span className="ml-2">• {location}</span>}
          </div>

          {description && <p className="mt-3 text-sm line-clamp-3 text-[color:var(--color-on-secondary)]/[0.85]">{description}</p>}
        </div>
      </Link>
    </article>
  );
}