import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import Layout from "@/components/Layout";
import { getAllEvents } from "@/lib/events"; // Removed 'type EventItem'
import type { EventMeta } from "@/types/events";

type Props = { events: EventMeta[] };

// ---- Helpers ---------------------------------------------------
function toISO(d: string) {
  const date = new Date(d);
  return Number.isNaN(date.valueOf()) ? "" : date.toISOString();
}
function formatPretty(d: string) {
  const date = new Date(d);
  return Number.isNaN(date.valueOf())
    ? d
    : date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
function normalize(s?: string) {
  return (s || "").toLowerCase();
}
function isUpcoming(d: string) {
  const today = new Date();
  const date = new Date(d);
  // treat today as upcoming
  return date >= new Date(today.getFullYear(), today.getMonth(), today.getDate());
}

type SortKey = "soonest" | "latest";
type WhenKey = "all" | "upcoming" | "past";

// ---- Page ------------------------------------------------------
export default function EventsIndex({ events }: Props) {
  const router = useRouter();

  // URL state
  const q = typeof router.query.q === "string" ? router.query.q : "";
  const when = (router.query.when as WhenKey) || "upcoming"; // default to "upcoming"
  const sort = (router.query.sort as SortKey) || "soonest";
  const loc = typeof router.query.loc === "string" ? router.query.loc : "";

  // Derived
  const filtered = React.useMemo(() => {
    let list = events.slice();

    // when filter
    if (when === "upcoming") list = list.filter((e) => isUpcoming(e.date));
    else if (when === "past") list = list.filter((e) => !isUpcoming(e.date));

    // location filter (contains)
    if (loc.trim()) {
      const needle = normalize(loc);
      list = list.filter((e) => normalize(e.location).includes(needle));
    }

    // free-text search across title + description + location
    if (q.trim()) {
      const n = normalize(q);
      list = list.filter((e) =>
        [e.title, e.summary || "", e.location].some((f) => normalize(f).includes(n)),
      );
    }

    // sort
    list.sort((a, b) => {
      const da = new Date(a.date).valueOf();
      const db = new Date(b.date).valueOf();
      return sort === "soonest" ? da - db : db - da;
    });

    return list;
  }, [events, q, when, sort, loc]);

  // counts for the header chips (computed from *all* events)
  const totalCount = events.length;
  const upcomingCount = events.filter((e) => isUpcoming(e.date)).length;
  const pastCount = totalCount - upcomingCount;

  // Handlers -> update URL (shareable)
  function setParam(key: string, value?: string) {
    const next = new URLSearchParams(router.query as Record<string, string>);
    if (value && value.length) next.set(key, value);
    else next.delete(key);
    router.replace({ pathname: "/events", query: Object.fromEntries(next) }, undefined, {
      shallow: true,
    });
  }

  // controlled inputs backed by URL
  const [search, setSearch] = React.useState(q);
  const [locationQuery, setLocationQuery] = React.useState(loc);

  React.useEffect(() => setSearch(q), [q]);
  React.useEffect(() => setLocationQuery(loc), [loc]);

  const title = "Events | Abraham of London";

  return (
    <Layout pageTitle="Events">
      <Head>
        <title>{title}</title>
        <meta
          name="description"
          content="Talks, panels, workshops, and appearances from Abraham of London."
        />
        <link rel="canonical" href="/events" />
      </Head>

      {/* Page-header bar: breadcrumb + count */}
      <section className="border-b border-lightGrey/70 bg-warmWhite/60">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
          <nav aria-label="Breadcrumb" className="text-deepCharcoal/70">
            <ol className="flex items-center gap-2">
              <li>
                <Link href="/" className="hover:text-deepCharcoal">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-deepCharcoal/80">Events</li>
              {q ? (
                <>
                  <li aria-hidden="true">/</li>
                  <li className="text-deepCharcoal/60">“{q}”</li>
                </>
              ) : null}
            </ol>
          </nav>

          <div className="flex items-center gap-2">
            <Chip
              label={`All (${totalCount})`}
              active={when === "all"}
              onClick={() => setParam("when", "all")}
            />
            <Chip
              label={`Upcoming (${upcomingCount})`}
              active={when === "upcoming"}
              onClick={() => setParam("when", "upcoming")}
            />
            <Chip
              label={`Past (${pastCount})`}
              active={when === "past"}
              onClick={() => setParam("when", "past")}
            />
          </div>
        </div>
      </section>

      {/* Controls */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-2">
              <input
                aria-label="Search events"
                placeholder="Search title, description, location…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && setParam("q", search.trim() || undefined)}
                className="w-full md:w-80 rounded-lg border border-lightGrey px-3 py-2 text-sm"
              />
              <button
                onClick={() => setParam("q", search.trim() || undefined)}
                className="rounded-lg border border-forest/20 bg-forest px-3 py-2 text-sm font-semibold text-cream hover:bg-forest/90"
              >
                Search
              </button>
            </div>

            <div className="flex gap-2">
              <input
                aria-label="Filter by location"
                placeholder="Filter by location"
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && setParam("loc", locationQuery.trim() || undefined)
                }
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
                <button
                  onClick={() => router.replace("/events", undefined, { shallow: true })}
                  className="rounded-lg border border-lightGrey px-3 py-2 text-sm hover:bg-warmWhite"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="bg-white pb-16 pt-2">
        <div className="mx-auto max-w-7xl px-4">
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-lightGrey bg-warmWhite px-4 py-10 text-center text-deepCharcoal/70">
              No events match your filters.
            </div>
          ) : (
            <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((ev) => (
                <li key={ev.slug}>
                  <article className="group h-full overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-black/10 transition hover:shadow-lg">
                    <div className="p-5">
                      <div className="mb-2 flex flex-wrap items-center gap-2 text-sm text-gray-600">
                        <time
                          dateTime={toISO(ev.date)}
                          className="rounded-full bg-warmWhite px-2 py-0.5 text-deepCharcoal/80"
                        >
                          {formatPretty(ev.date)}
                        </time>
                        <span aria-hidden="true">·</span>
                        <span className="rounded-full bg-warmWhite px-2 py-0.5 text-deepCharcoal/80">
                          {ev.location}
                        </span>
                      </div>

                      <h3 className="text-lg font-semibold leading-snug text-gray-900">
                        <Link
                          href={`/events/${ev.slug}`}
                          className="outline-none transition-colors hover:text-forest focus-visible:rounded focus-visible:ring-2 focus-visible:ring-forest/30"
                        >
                          {ev.title}
                        </Link>
                      </h3>

                      {ev.summary && (
                        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-gray-700">
                          {ev.summary}
                        </p>
                      )}

                      <div className="mt-4">
                        <Link
                          href={`/events/${ev.slug}`}
                          className="inline-flex items-center rounded-full border border-forest/20 px-3 py-1.5 text-sm font-medium text-forest transition-colors hover:bg-forest hover:text-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/30"
                          aria-label={`Event details: ${ev.title}`}
                        >
                          Details
                          <svg
                            className="ml-2 h-4 w-4"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            aria-hidden="true"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </Layout>
  );
}

// Small presentational chip
function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-full px-3 py-1 text-sm transition",
        active
          ? "bg-forest text-cream border border-forest"
          : "bg-white text-deepCharcoal/80 border border-lightGrey hover:text-deepCharcoal",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

// SSG
export async function getStaticProps() {
  const events = getAllEvents();
  return { props: { events }, revalidate: 60 };
}