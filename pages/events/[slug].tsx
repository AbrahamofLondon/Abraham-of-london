// pages/events/[slug].tsx
import * as React from "react";
import type {
  GetStaticPaths,
  GetStaticProps,
  InferGetStaticPropsType,
} from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { getAllEvents } from "@/lib/events";
import type { Event } from "@/lib/events";
import Layout from "@/components/Layout";
import EventCard from "@/components/events/EventCard";

interface EventPageProps {
  event: Event;
}

export const getStaticPaths: GetStaticPaths = async () => {
  const events = await getAllEvents();
  const paths =
    events?.map((event) => ({
      params: { slug: String(event.slug) },
    })) ?? [];

  return {
    paths,
    fallback: "blocking",
  };
};

export const getStaticProps: GetStaticProps<EventPageProps> = async (ctx) => {
  const slug = ctx.params?.slug;
  if (!slug || Array.isArray(slug)) {
    return { notFound: true };
  }

  const events = await getAllEvents();
  const event = events.find((e) => String(e.slug) === slug);

  if (!event) {
    return { notFound: true };
  }

  return {
    props: {
      event,
    },
    revalidate: 60 * 5, // 5 minutes
  };
};

type EventPageComponentProps = InferGetStaticPropsType<typeof getStaticProps>;

function EventPage({ event }: EventPageComponentProps): JSX.Element {
  const router = useRouter();

  if (router.isFallback) {
    return (
      <Layout>
        <main className="mx-auto max-w-3xl px-4 py-16">
          <p className="text-center text-sm text-muted-foreground">
            Loading event…
          </p>
        </main>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>{event.title} | Abraham of London</title>
        {event.excerpt && <meta name="description" content={event.excerpt} />}
      </Head>
      <main className="mx-auto max-w-4xl px-4 py-12">
        <EventCard event={event} layout="detail" />
      </main>
    </Layout>
  );
}

export default EventPage;