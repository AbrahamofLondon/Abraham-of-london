// pages/events/[slug].tsx
import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import { useRouter } from "next/router";

import {
  MDXRemote,
  type MDXRemoteSerializeResult,
} from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";

import Layout from "@/components/Layout";
import mdxComponents from "@/components/mdx-components";

import { getAllEvents, getEventBySlug } from "@/lib/content";
import type { Event } from "contentlayer/generated";

type Props = {
  meta: {
    slug: string;
    title: string;
    excerpt?: string | null;
    date?: string | null;
    tags?: string[];
  };
  source: MDXRemoteSerializeResult;
};

const EventPage: NextPage<Props> = ({ meta, source }) => {
  const router = useRouter();

  if (router.isFallback) {
    return (
      <Layout title="Loading event…">
        <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16 lg:py-20">
          <p className="text-sm text-gray-300">Loading session…</p>
        </main>
      </Layout>
    );
  }

  return (
    <Layout title={meta.title} description={meta.excerpt ?? undefined}>
      <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16 lg:py-20">
        <header className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold/70">
            Live Session
          </p>
          <h1 className="font-serif text-3xl font-semibold text-cream sm:text-4xl">
            {meta.title}
          </h1>
          {meta.date && (
            <p className="text-sm text-gray-300">
              {new Date(meta.date).toLocaleString("en-GB", {
                year: "numeric",
                month: "short",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}
        </header>

        <article className="prose prose-invert prose-lg mt-8 max-w-none">
          <MDXRemote {...source} components={mdxComponents} />
        </article>
      </main>
    </Layout>
  );
};

export default EventPage;

export const getStaticPaths: GetStaticPaths = async () => {
  const events = getAllEvents();
  return {
    paths: events.map((e) => ({ params: { slug: e.slug } })),
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps<Props> = async (context) => {
  const slug = context.params?.slug as string;
  const event = getEventBySlug(slug);

  if (!event) return { notFound: true };

  const mdxSource = await serialize(event.body.raw, {
    mdxOptions: {
      remarkPlugins: [],
      rehypePlugins: [],
    },
  });

  const meta: Props["meta"] = {
    slug: event.slug,
    title: event.title,
    excerpt: event.excerpt ?? null,
    date: event.date ?? null,
    tags: event.tags ?? [],
  };

  return {
    props: {
      meta,
      source: mdxSource,
    },
    revalidate: 3600,
  };
};