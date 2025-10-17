// components/events/EventCard.tsx
import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";
import React from "react";

type ResourceChip = { href: string; label: string };

type Props = {
  slug: string;
  title: string;
  date: string;
  location?: string;
  description?: string | null;
  tags?: string[] | null;
  chatham?: boolean;
  heroImage?: string | null;
  className?: string;
  prefetch?: boolean;
  timeZone?: string;

  /** NEW: compact summary for pills */
  resources?: {
    downloads?: ResourceChip[];    // e.g. one-pager, playbook, cue-card
    reads?: ResourceChip[];        // optional
  } | null;

  /** presentation */
  heroFit?: "cover" | "contain";
  heroAspect?: "16/9" | "21/9" | "3/1";
  heroPosition?: "center" | "top" | "left" | "right";
};

// ... keep your helpers here ...

export default function EventCard({
  slug, title, date, location, description, tags = null, chatham,
  className, prefetch = false, timeZone = "Europe/London",
  heroImage = null, heroFit = "cover", heroAspect = "16/9",
  heroPosition = "center",
  resources = null,                       // ← NEW
}: Props) {
  // ... existing code (assuming this part is mostly unchanged) ...

  return (
    <article 
        className={clsx(
            "group flex flex-col overflow-hidden rounded-xl border border-lightGrey bg-white shadow-xl transition-shadow hover:shadow-2xl",
            className
        )}
        itemScope 
        itemType="http://schema.org/Event"
    >
      {/* Assuming image block is here */}
      {heroImage && (
        <div className={clsx("relative w-full overflow-hidden", `aspect-[${heroAspect}]`)}>
          <Image
            src={heroImage}
            alt={`Hero image for ${title}`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className={clsx("object-cover", `object-${heroPosition}`, heroFit === 'contain' && "p-4")}
          />
        </div>
      )}


      <div className="p-6">
        {/* meta + title unchanged */}
        <div className="flex items-center space-x-2 text-xs font-semibold uppercase text-forest/70">
            <time itemProp="startDate" dateTime={date}>{date}</time>
            {location && <span className="truncate" itemProp="location">{location}</span>}
        </div>
        <h3 className="mt-1 font-serif text-xl font-bold text-deepCharcoal" itemProp="name">{title}</h3>

        {description && (
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-gray-700" itemProp="description">
            {description}
          </p>
        )}

        {/* NEW: brand-aligned resource pills */}
        {!!(resources?.downloads?.length || resources?.reads?.length) && (
          <ul className="mt-3 flex flex-wrap gap-2" aria-label="Resources">
            {(resources?.downloads || []).slice(0, 3).map((r) => (
              <li key={r.href}>
                <a
                  href={r.href}
                  className="inline-flex items-center rounded-full border border-lightGrey bg-warmWhite/80 px-2.5 py-1 text-xs font-medium text-deepCharcoal hover:bg-warmWhite"
                  onClick={(e)=>e.stopPropagation()}
                >
                  {r.label}
                </a>
              </li>
            ))}
            {(resources?.reads || []).slice(0, 2).map((r) => (
              <li key={r.href}>
                <a
                  href={r.href}
                  className="inline-flex items-center rounded-full border border-lightGrey bg-white px-2.5 py-1 text-xs font-medium text-forest/90 hover:bg-forest hover:text-cream"
                  onClick={(e)=>e.stopPropagation()}
                >
                  {r.label}
                </a>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4">
          {/* FIXED ERROR: Added required 'href' prop
          */}
          <Link href={`/events/${slug}`}>Details</Link>
        </div>
        <meta itemProp="url" content={`/events/${slug}`} />
      </div>
    </article>
  );
}