// pages/events/[slug].tsx
import * as React from "react";
import type {
  GetStaticPaths,
  GetStaticProps,
  InferGetStaticPropsType,
  NextPage,
} from "next";
import Head from "next/head";
import Layout from "@/components/Layout";

import { getAllEvents } from '@/lib/contentlayer-helper';

import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import mdxComponents from "@/components/mdx-components";

type Props = {
  event: Event;
  source: MDXRemoteSerializeResult;
};

export const getStaticPaths: GetStaticPaths = async () => {
  const paths =
    allEvents?.map((event) => ({
      params: { slug: event.slug },
    })) ?? [];

  return {
    paths,
    fallback: "blocking",
  };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = params?.slug as string;

  const event = (getallEvents as Event[]).find((e) => e.slug === slug);

  if (!event) {
    return {
      notFound: true,
    };
  }

  const mdxSource = await serialize(event.body.raw || "", {
    mdxOptions: {
      remarkPlugins: [remarkGfm],
      rehypePlugins: [
        rehypeSlug,
        [
          rehypeAutolinkHeadings,
          {
            behavior: "wrap",
          },
        ],
      ],
    },
  });

  return {
    props: {
      event,
      source: mdxSource,
    },
    revalidate: 1800, // 30 mins
  };
};

const EventPage: NextPage<
  InferGetStaticPropsType<typeof getStaticProps>
> = ({ event, source }) => {
  const title = event.title ?? "Event";
  const date = event.eventDate
    ? new Date(event.eventDate).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : undefined;

  return (
    <Layout title={title}>
      <Head>
        {event.excerpt && (
          <meta name="description" content={event.excerpt} />
        )}
      </Head>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16 lg:py-20">
        <header className="mb-8 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold/70">
            Canon · Event
          </p>
          <h1 className="font-serif text-3xl font-semibold text-cream sm:text-4xl">
            {title}
          </h1>

          <div className="flex flex-wrap gap-4 text-xs text-gray-400">
            {date && (
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1">
                {date}
              </span>
            )}
            {event.location && (
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1">
                {event.location}
              </span>
            )}
          </div>

          {event.excerpt && (
            <p className="mt-2 text-sm text-gray-300">{event.excerpt}</p>
          )}

          {event.registrationUrl && (
            <div className="mt-4">
              <a
                href={event.registrationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-full bg-gold px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-black transition hover:bg-gold/90"
              >
                Request a Seat
              </a>
            </div>
          )}
        </header>

        <article className="prose prose-invert max-w-none prose-headings:font-serif prose-headings:text-cream prose-a:text-gold">
          <MDXRemote {...source} components={mdxComponents} />
        </article>
      </main>
    </Layout>
  );
};

export default EventPage;