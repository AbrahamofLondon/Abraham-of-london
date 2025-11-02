// pages/index.tsx (FINAL ROBUST HOME PAGE DATA FEED)
import * as React from "react";
import type { GetStaticProps, InferGetStaticPropsType } from "next";
import Head from "next/head";
// Assuming Layout, SEOHead, and your section components are imported correctly
import Layout from "@/components/Layout";
import { getAllContent } from "@/lib/mdx"; 
import type { PostMeta } from "@/types/post"; // Assuming PostMeta is the base type

// --- Dummy Components for JSX Rendering (Replace with your actual components) ---
// NOTE: Replace these with your actual imported components (e.g., DownloadsSection, EventsSection)
const DownloadsSection = ({ items }) => (
    <div className="my-10">
        <h2 className="text-2xl font-bold mb-4">Downloads ({items.length})</h2>
        <ul>{items.map(item => <li key={item.slug}>{item.title}</li>)}</ul>
    </div>
);
const EventsSection = ({ items }) => (
    <div className="my-10">
        <h2 className="text-2xl font-bold mb-4">Upcoming Events ({items.length})</h2>
        <ul>{items.map(item => <li key={item.slug}>{item.title} ({item.date})</li>)}</ul>
    </div>
);
const ResourcesSection = ({ items }) => (
    <div className="my-10">
        <h2 className="text-2xl font-bold mb-4">Resources ({items.length})</h2>
        <ul>{items.map(item => <li key={item.slug}>{item.title}</li>)}</ul>
    </div>
);
const Empty = ({ blurb }) => <div className="my-10 p-5 bg-neutral-100 rounded text-center text-neutral-600">{blurb}</div>;
// -----------------------------------------------------------------------------------


// --- Data Filtering Utility ---
function onlyUpcoming(d: string | undefined): boolean {
  if (!d) return false;
  const dt = new Date(d);
  if (Number.isNaN(+dt)) return false;
  const today = new Date();
  today.setHours(0,0,0,0);
  return dt >= today;
}

// -----------------------------------------------------------------------------------
// 1) CRITICAL FIX: getStaticProps - Overcomes Under-feeding and Over-filtering
// -----------------------------------------------------------------------------------
export const getStaticProps: GetStaticProps = async () => {
  // Downloads: Fetch up to 8 items
  const downloads = getAllContent("downloads", { includeDrafts: false }).slice(0, 8);

  // Events: Filter for upcoming, sort by date (soonest first), and limit to 6
  const eventsAll = getAllContent("events", { includeDrafts: false });
  const events = eventsAll
    .filter(e => onlyUpcoming(e.date))
    .sort((a,b) => (new Date(a.date||0).getTime() - new Date(b.date||0).getTime()))
    .slice(0, 6);

  // Resources: Fetch up to 6 resources
  const resources = getAllContent("resources", { includeDrafts: false }).slice(0, 6);

  // CRITICAL: Ensure props are JSON safe (handled by lib/mdx but added here for safety)
  const props = { downloads, events, resources };

  return { props: JSON.parse(JSON.stringify(props)), revalidate: 60 };
};

type HomeProps = InferGetStaticPropsType<typeof getStaticProps>;

// -----------------------------------------------------------------------------------
// 2) COMPONENT: Renders defensively based on fetched data
// -----------------------------------------------------------------------------------
export default function Home({ downloads, events, resources }: HomeProps) {
  const pageTitle = "Abraham of London • Home";
  const pageDesc = "Principled strategy, writing, and ventures—grounded in legacy and fatherhood.";

  const showResources = resources && resources.length > 0;

  return (
    <Layout>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDesc} />
      </Head>

      <main className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-serif font-bold mb-8">Welcome Home</h1>

        {/* Downloads Section */}
        {downloads && downloads.length > 0 ? (
          <DownloadsSection items={downloads} />
        ) : (
          <Empty blurb="Downloads coming soon." />
        )}

        {/* Events Section */}
        {events && events.length > 0 ? (
          <EventsSection items={events} />
        ) : (
          <Empty blurb="No upcoming events yet." />
        )}

        {/* Resources Section (Conditionally render based on existence) */}
        {showResources && (
            <ResourcesSection items={resources} />
        )}

        {/* Note: Links to /downloads/[slug] and /events/[slug] should now work because 
            the slug is pulled from the content, not hardcoded, and the files exist. */}
      </main>
    </Layout>
  );
}