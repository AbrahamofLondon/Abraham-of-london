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
    downloads?: ResourceChip[];   // e.g. one-pager, playbook, cue-card
    reads?: ResourceChip[];       // optional
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
  resources = null,                              // ← NEW
}: Props) {
  // ... existing code ...

  return (
    <article /* ... */>
      {/* image block unchanged */}

      <div className="p-6">
        {/* meta + title unchanged */}

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
          <Link /* ... */>Details</Link>
        </div>
        <meta itemProp="url" content={`/events/${slug}`} />
      </div>
    </article>
  );
}
