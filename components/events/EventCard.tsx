// components/events/EventCard.tsx
import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import type { Event } from "@/lib/events";

export interface EventResourceLink {
  label: string;
  href: string;
  kind?: "download" | "read";
}

export interface EventResourcesProps {
  downloads?: EventResourceLink[];
  reads?: EventResourceLink[];
}

export interface EventCardProps {
  event: Event;
  layout?: "list" | "grid" | "detail";
  showCta?: boolean;
  resources?: EventResourcesProps | null;
  tags?: string[] | null;
}

export function EventCard({
  event,
  layout = "list",
  showCta = true,
  resources,
  tags,
}: EventCardProps): JSX.Element {
  const href = `/events/${event.slug}`;
  const hasCover = Boolean(event.coverImage);
  const effectiveTags = tags ?? (event.tags as string[] | undefined) ?? [];

  const wrapperClasses =
    layout === "detail"
      ? "flex flex-col gap-6 rounded-2xl border border-lightGrey bg-warmWhite/60 p-6 shadow-sm"
      : "flex flex-col gap-4 rounded-2xl border border-lightGrey bg-white/80 p-4 shadow-sm hover:shadow-md transition-shadow";

  return (
    <article className={wrapperClasses}>
      {hasCover && (
        <div className="relative overflow-hidden rounded-xl">
          <Image
            src={event.coverImage as string}
            alt={event.title}
            width={1200}
            height={630}
            className="h-56 w-full object-cover"
            priority={layout === "detail"}
          />
        </div>
      )}

      <div className="flex flex-col gap-3">
        <header>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {event.category ?? "Event"}
          </p>
          <h2 className="mt-1 text-xl font-semibold text-deepCharcoal">
            <Link href={href} className="hover:underline">
              {event.title}
            </Link>
          </h2>
          {event.date && (
            <p className="mt-1 text-xs text-muted-foreground">
              {event.dateReadable ?? event.date}
            </p>
          )}
        </header>

        {event.excerpt && (
          <p className="text-sm text-muted-foreground">{event.excerpt}</p>
        )}

        {effectiveTags.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-2">
            {effectiveTags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-forest/5 px-2.5 py-0.5 text-xs text-forest"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {resources && (resources.downloads?.length || resources.reads?.length) && (
          <div className="mt-3 flex flex-wrap gap-3 text-xs">
            {resources.downloads?.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="inline-flex items-center gap-1 underline"
              >
                {item.label}
              </a>
            ))}
            {resources.reads?.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="inline-flex items-center gap-1 underline"
              >
                {item.label}
              </a>
            ))}
          </div>
        )}

        {showCta && (
          <div className="mt-4">
            <Link
              href={href}
              className="inline-flex items-center text-sm font-medium text-forest hover:underline"
            >
              View details
              <span aria-hidden="true" className="ml-1">
                →
              </span>
            </Link>
          </div>
        )}
      </div>
    </article>
  );
}

export default EventCard;