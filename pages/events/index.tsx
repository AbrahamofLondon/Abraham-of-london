// pages/events/index.tsx

"use client";

import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import type { GetStaticProps } from "next";

import { allEvents, type Event } from "contentlayer/generated";

// --- IMPORTS FOR CLIENT-SIDE FUNCTIONALITY (assuming these paths are correct) ---
import clsx from "clsx";
import EventCard from "@/components/events/EventCard";
import Layout from "@/components/Layout";
import SectionHeading from "@/components/ui/SectionHeading";
import Button from "@/components/ui/Button";
import { OgHead } from "@/lib/seo";
import { isUpcoming } from "@/lib/events";
import type { EventMeta } from "@/lib/events";

// -----------------------------------------------------------------------------
// TYPE DEFINITIONS
// -----------------------------------------------------------------------------
type Props = { events: EventMeta[] };

// -----------------------------------------------------------------------------
// HELPER COMPONENTS & UTILITIES
// -----------------------------------------------------------------------------

const normalize = (s = "") => s.toLowerCase();

const Chip = ({
  label,
  active,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={clsx(
      "rounded-full px-3 py-1 text-sm transition",
      active
        ? "bg-forest text-cream border border-forest"
        : "bg-white text-[color:var(--color-on-secondary)/0.8] border border-lightGrey hover:text-deepCharcoal"
    )}
  >
    {label}
  </button>
);


// -----------------------------------------------------------------------------
// MAIN COMPONENT
// -----------------------------------------------------------------------------

export default function EventsIndex({ events }: Props) {
  const router = useRouter();

  const { q = "", when = "upcoming", sort = "soonest", loc = "" } = router.query as {
    q?: string;
    when?: "all" | "upcoming" | "past";
    sort?: "soonest" | "latest";
    loc?: string;
  };

  const [localQuery, setLocalQuery] = React.useState(q);

  const updateSearchQuery = React.useCallback((value?: string) => {
    const next = new URLSearchParams(router.query as Record<string, string>);
    if (value && value.length) next.set("q", value);
    else next.delete("q");

    router.replace({ pathname: "/events", query: Object.fromEntries(next) }, undefined, {
      shallow: true,
    });
  }, [router.query, router]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (localQuery.trim() !== q.trim()) {
        updateSearchQuery(localQuery.trim() || undefined);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [localQuery, q, updateSearchQuery]);

  const filteredEvents = React.useMemo(() => {
    let list = events.slice();

    const currentQ = q;

    if (when === "upcoming") list = list.filter((e) => isUpcoming(e.date));
    else if (when === "past") list = list.filter((e) => !isUpcoming(e.date));

    if (loc.trim()) {
      const needle = normalize(loc);
      list = list.filter((e) => normalize(e.location || "").includes(needle));
    }

    if (currentQ.trim()) {
      const needle = normalize(currentQ);
      list = list.filter((e) =>
        [e.title, e.summary || "", e.location || ""].some((field) =>
          normalize(field).includes(needle)
        )
      );
    }

    list.sort((a, b) => {
      const dateA = new Date(a.date ?? "").valueOf();
      const dateB = new Date(b.date ?? "").valueOf();
      return sort === "soonest" ? dateA - dateB : dateB - dateA;
    });

    return list;
  }, [events, q, when, sort, loc]);

  const totalCount = events.length;
  const upcomingCount = events.filter((e) => isUpcoming(e.date)).length;
  const pastCount = totalCount - upcomingCount;

  const setParam = (key: string, value?: string) => {
    const next = new URLSearchParams(router.query as Record<string, string>);
    if (value && value.length) next.set(key, value);
    else next.delete(key);
    router.replace({ pathname: "/events", query: Object.fromEntries(next) }, undefined, {
      shallow: true,
    });
  };

  const handleReset = () => {
    setLocalQuery("");
    router.replace({ pathname: "/events" }, undefined, { shallow: true });
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalQuery(e.target.value);
  };

  React.useEffect(() => {
    setLocalQuery(q);
  }, [q]);


  return (
    <Layout pageTitle="Events">
      <OgHead
        title="Events ? Abraham of London"
        description="Talks, salons, and workshops. Select sessions run as Chatham Rooms (off the record)."
        path="/events"
      />

      {/* Controls bar (Tabs/Chips) */}
      <section className="border-b border-lightGrey/70 bg-warmWhite/60">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
          <nav aria-label="Breadcrumb" className="text-[color:var(--color-on-secondary)/0.7]">
            <ol className="flex items-center gap-2">
              <li>
                <Link href="/" className="hover:text-deepCharcoal" prefetch={false}>
                  Home
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-[color:var(--color-on-secondary)/0.8]">Events</li>
              {q ? (
                <>
                  <li aria-hidden="true">/</li>
                  <li className="text-[color:var(--color-on-secondary)/0.6]">?{q}?</li>
                </>
              ) : null}
            </ol>
          </nav>
          <div className="flex items-center gap-2">
            <Chip label={`All (${totalCount})`} active={when === "all"} onClick={() => setParam("when", "all")} />
            <Chip label={`Upcoming (${upcomingCount})`} active={when === "upcoming"} onClick={() => setParam("when", "upcoming")} />
            <Chip label={`Past (${pastCount})`} active={when === "past"} onClick={() => setParam("when", "past")} />
          </div>
        </div>
      </section>

      {/* Heading + filters (Search/Sort) */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <SectionHeading
            eyebrow="Calendar"
            title="Events"
            subtitle="Filter by text or location, sort by date, and explore details."
            align="left"
            withDivider
          />

          <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-2">
              <input
                aria-label="Search events"
                placeholder="Search title, description, location?"
                onChange={handleSearchChange}
                value={localQuery}
                className="w-full md:w-80 rounded-lg border border-lightGrey px-3 py-2 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <input
                aria-label="Filter by location"
                placeholder="Filter by location"
                onChange={(e) => setParam("loc", e.target.value.trim() || undefined)}
                defaultValue={loc}
                className="w-full md:w-56 rounded-lg border border-lightGrey px-3 py-2 text-sm"
              />
              <select
                aria-label="Sort"
                value={sort}
                onChange={(e) => setParam("sort", e.target.value)}
                className="rounded-lg border border-lightGrey px-3 py-2 text-sm"
              >
                <option value="soonest">Soonest first</option>
                <option value="latest">Latest first</option>
              </select>
              {(q || loc || when !== "upcoming" || sort !== "soonest") && (
                <Button variant="secondary" size="sm" onClick={handleReset}>
                  Reset
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* List */}
      <section className="bg-white pb-16 pt-2" aria-live="polite">
        <div className="mx-auto max-w-7xl px-4">
          {filteredEvents.length === 0 ? (
            <div className="rounded-2xl border border-lightGrey bg-warmWhite px-4 py-10 text-center text-[color:var(--color-on-secondary)/0.7]">
              No events match your filters.
            </div>
          ) : (
            <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredEvents.map((ev) => (
                <EventCard
                  key={ev.slug}
                  slug={ev.slug}
                  title={ev.title}
                  date={ev.date}
                  location={ev.location}
                  description={ev.summary}
                  tags={ev.tags ?? undefined}
                  heroImage={ev.heroImage ?? undefined}
                  resources={ev.resources ? { downloads: ev.resources.downloads ?? [], reads: ev.resources.reads ?? [] } : null}
                />
              ))}
            </ul>
          )}
        </div>
      </section>
    </Layout>
  );
}

// -----------------------------------------------------------------------------
// STATIC PROPS
// -----------------------------------------------------------------------------

export const getStaticProps: GetStaticProps<Props> = async () => {
  const events = allEvents
    .map((e) => ({
      slug: e.slug,
      title: e.title,
      date: e.date,
      location: (e as any).location ?? null,
      summary: (e as any).summary ?? null,
      tags: (e as any).tags ?? null,
      heroImage: (e as any).heroImage ?? null,
      resources: (e as any).resources ?? null,
    }))
    .sort((a, b) => +new Date(a.date as unknown as string) - +new Date(b.date as unknown as string));
  
  return {
    props: {
      events: events as EventMeta[],
    },
    revalidate: 60
  };
};
