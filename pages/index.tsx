// pages/index.tsx
import * as React from "react";
import Head from "next/head";

type ResourceLink = { label: string; href: string };
type EventItem = {
  slug: string;
  title: string;
  date: string; // ISO
  location?: string | null;
  summary?: string | null;
  tags?: string[] | null;
  resources?: { downloads?: ResourceLink[]; reads?: ResourceLink[] } | null;
};

type EventsTeaser = Array<{
  slug: string;
  title: string;
  date: string;
  location: string | null;
  description: string | null;
  tags: string[] | null;
  heroImage: string;
  resources: { downloads: ResourceLink[] | null; reads: ResourceLink[] | null } | null;
}>;

const tz = "Europe/London";
const todayKey = new Intl.DateTimeFormat("en-CA", {
  timeZone: tz,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(new Date());

function isOnOrAfterToday(dateStr: string): boolean {
  // If it's already YYYY-MM-DD, compare directly
  const only = /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
  if (only) return dateStr >= todayKey;

  // Otherwise, parse and format to key
  const d = new Date(dateStr);
  if (Number.isNaN(d.valueOf())) return false;
  const key = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
  return key >= todayKey;
}

export async function getStaticProps() {
  // TODO: replace with real source of events/posts/books
  const events: EventItem[] = [];

  const upcomingSorted = events
    .filter((e) => isOnOrAfterToday(e.date))
    .sort((a, b) => +new Date(a.date) - +new Date(b.date));

  const eventsTeaser: EventsTeaser = upcomingSorted.slice(0, 3).map((e) => {
    const baseForImage = String(e.slug).replace(/[-].*$/, "");
    const heroImage = `/assets/images/events/${baseForImage}.jpg`;

    const resources = e.resources ?? null;
    const safeResources =
      resources
        ? {
            downloads: (resources.downloads || []).filter(Boolean) as ResourceLink[] | null,
            reads: (resources.reads || []).filter(Boolean) as ResourceLink[] | null,
          }
        : null;

    return {
      slug: e.slug,
      title: e.title,
      date: e.date,
      location: e.location ?? null,
      description: e.summary ?? null,
      tags: Array.isArray(e.tags) ? e.tags : null,
      heroImage,
      resources: safeResources,
    };
  });

  const safePosts: any[] = []; // stub
  const booksCount = 0; // stub

  return {
    props: {
      posts: safePosts,
      booksCount,
      eventsTeaser,
    },
    revalidate: 3600,
  };
}

export default function Home() {
  return (
    <>
      <Head>
        <title>Abraham of London</title>
      </Head>
      <main style={{ padding: "2rem", fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial" }}>
        <h1>Abraham of London</h1>
        <p>Home booted. Wire the real data when ready.</p>
      </main>
    </>
  );
}
