// pages/events.tsx
import { GetStaticProps, InferGetStaticPropsType } from "next";
import Head from "next/head";
import Layout from "@/components/Layout";
import EventCard from "@/components/events/EventCard";
import { getAllContent } from "@/lib/mdx";
import type { PostMeta } from "@/types/post";

type EventsProps = InferGetStaticPropsType<typeof getStaticProps>;

export const getStaticProps: GetStaticProps = async () => {
  const allEvents = getAllContent('events');
  const events = allEvents.map(event => JSON.parse(JSON.stringify(event)));

  return {
    props: { events },
    revalidate: 60, // Revalidate events page every minute
  };
};

export default function Events({ events }: EventsProps) {
  const todayKey = new Date().toISOString().split('T')[0];

  const upcomingEvents = events
    .filter((e) => e.date && e.date.split('T')[0] >= todayKey)
    .sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime());

  const pastEvents = events
    .filter((e) => e.date && e.date.split('T')[0] < todayKey)
    .sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime());

  return (
    <Layout pageTitle="Events">
      <Head>
        <title>Events | Abraham of London</title>
        <meta name="description" content="Upcoming and past events, workshops, and salons." />
      </Head>
      <main className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-serif font-bold text-center mb-10">
          Events
        </h1>
        
        <section>
          <h2 className="text-3xl font-serif font-semibold mb-6">Upcoming Events</h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {upcomingEvents.length > 0 ? (
              upcomingEvents.map((event) => (
                <EventCard
                  key={event.slug}
                  {...event}
                  description={event.summary}
                />
              ))
            ) : (
              <p>No upcoming events scheduled. Check back soon.</p>
            )}
          </div>
        </section>

        <section className="mt-16 pt-12 border-t">
          <h2 className="text-3xl font-serif font-semibold mb-6">Past Events</h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {pastEvents.length > 0 ? (
              pastEvents.map((event) => (
                <EventCard
                  key={event.slug}
                  {...event}
                  description={event.summary}
                />
              ))
            ) : (
              <p>No past events found.</p>
            )}
          </div>
        </section>
      </main>
    </Layout>
  );
}