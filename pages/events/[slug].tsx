// pages/events/[slug].tsx
import * as React from "react";
import Image from "next/image";
import type { GetStaticPaths, GetStaticProps } from "next";
import Layout from "@/components/Layout";
import Button from "@/components/ui/Button";
import SectionHeading from "@/components/ui/SectionHeading";
import { OgHead, EventJsonLd } from "@/lib/seo";
import { getAllEvents } from "@/lib/server/events-data";
import type { EventMeta } from "@/lib/events";
import { formatDate } from "@/lib/date";

// ➕ simple status helper
const isPast = (iso: string) => new Date(iso).valueOf() < Date.now();

type Props = { event: EventMeta };

// … getStaticPaths / getStaticProps unchanged …

export default function EventDetail({ event }: Props) {
  const prettyDate = formatDate(event.date, {
    timeZone: "Europe/London",
    format: { weekday: "short", day: "2-digit", month: "short", year: "numeric" },
  });

  const canonicalPath = `/events/${event.slug}`;
  const past = isPast(event.endDate || event.date);

  return (
    <Layout pageTitle={event.title}>
      {/* ✅ OG + canonical; include hero as OG image; noindex past events (optional) */}
      <OgHead
        title={event.title}
        description={event.summary ?? "Private salons, talks, and workshops."}
        path={canonicalPath}
        ogImagePath={event.heroImage ?? undefined}
        noIndex={past} // flip to false if you want past events indexed
      />

      {/* ✅ JSON-LD for Events — set status based on date */}
      <EventJsonLd
        name={event.title}
        startDate={event.date}
        endDate={event.endDate ?? undefined}
        path={canonicalPath}
        image={event.heroImage ?? undefined}
        description={event.summary ?? undefined}
        location={event.location ? { name: event.location } : undefined}
        eventStatus={past ? "https://schema.org/EventCompleted" : "https://schema.org/EventScheduled"}
      />
      <article className="bg-white">
        <div className="mx-auto max-w-5xl px-4 py-10 md:py-14">
          <SectionHeading
            eyebrow="Event"
            title={event.title}
            subtitle={event.summary ?? undefined}
            align="left"
            withDivider
          />

          <div className="mt-6 flex flex-wrap items-center gap-2 text-sm text-deepCharcoal/80">
            <time
              dateTime={new Date(event.date).toISOString()}
              className="rounded-full bg-warmWhite px-2 py-0.5"
            >
              {prettyDate}
            </time>
            {event.location && (
              <>
                <span aria-hidden>·</span>
                <span className="rounded-full bg-warmWhite px-2 py-0.5">{event.location}</span>
              </>
            )}
          </div>

          {event.heroImage && (
            <div className="relative mt-6 aspect-[16/9] w-full overflow-hidden rounded-2xl border border-lightGrey">
              <Image
                src={event.heroImage}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 960px"
                priority={false}
              />
            </div>
          )}

          <div className="prose prose-lg mt-8 max-w-none text-deepCharcoal">
            {/* If you have rich content/MDX for events, render it here. For now, show summary. */}
            <p>{event.summary ?? "Details to be announced."}</p>
          </div>

          <div className="mt-10">
            <Button
              variant="primary"
              href={event.ctaHref || "/contact"}
              aria-label={event.ctaLabel || "Register interest"}
            >
              {event.ctaLabel || "Register interest"}
            </Button>
          </div>
        </div>
      </article>
    </Layout>
  );
}
