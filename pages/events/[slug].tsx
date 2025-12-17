import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Layout from "@/components/Layout";
import { 
  getAllEvents, 
  normalizeSlug, 
  isPublished 
} from "@/lib/contentlayer-helper";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import mdxComponents from "@/components/mdx-components";
import SafeMDXRemote from "@/components/SafeMDXRemote";

type Props = {
  event: any;
  source: MDXRemoteSerializeResult;
};

export const getStaticPaths: GetStaticPaths = async () => {
  // Use the robust helper to get all published events
  const events = getAllEvents();
  
  const paths = events
    .map((event) => {
      const slug = normalizeSlug(event);
      return slug ? { params: { slug } } : null;
    })
    .filter(Boolean) as { params: { slug: string } }[];

  return {
    paths,
    fallback: "blocking",
  };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = String(params?.slug ?? "").trim().toLowerCase();
  
  if (!slug) return { notFound: true };

  const events = getAllEvents();
  // Lookup using the centralized normalization logic to ensure a match
  const event = events.find((e) => normalizeSlug(e) === slug);

  if (!event) {
    return { notFound: true };
  }

  // Ensure we have raw content for serialization
  const rawContent = event.body?.raw ?? "";
  
  let source: MDXRemoteSerializeResult;
  try {
    source = await serialize(rawContent, {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [
          rehypeSlug,
          [rehypeAutolinkHeadings, { behavior: "wrap" }],
        ],
      },
    });
  } catch (err) {
    console.error(`[Events Serialize Error] ${slug}:`, err);
    source = await serialize("Event details are being updated.");
  }

  return {
    props: {
      event,
      source,
    },
    revalidate: 1800, // 30 mins
  };
};

const EventPage: NextPage<Props> = ({ event, source }) => {
  const title = event.title ?? "Event";
  
  // Robust Date Parsing
  const formattedDate = React.useMemo(() => {
    if (!event.eventDate) return null;
    const date = new Date(event.eventDate);
    return isNaN(date.getTime()) 
      ? null 
      : date.toLocaleString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
  }, [event.eventDate]);

  return (
    <Layout title={title}>
      <Head>
        {event.excerpt && <meta name="description" content={event.excerpt} />}
        <meta property="og:title" content={`${title} | Abraham of London`} />
        <title>{title} | Events | Abraham of London</title>
      </Head>

      <main className="mx-auto max-w-3xl px-6 py-12 sm:py-16 lg:py-20">
        <header className="mb-12 space-y-4 border-b border-gold/10 pb-10">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold">
            Private Gathering
          </p>
          <h1 className="font-serif text-3xl font-semibold text-cream sm:text-4xl lg:text-5xl">
            {title}
          </h1>

          <div className="flex flex-wrap gap-3 pt-2">
            {formattedDate && (
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1 text-[11px] font-medium text-gray-300">
                {formattedDate}
              </span>
            )}
            {event.location && (
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1 text-[11px] font-medium text-gray-300">
                {event.location}
              </span>
            )}
          </div>

          {event.excerpt && (
            <p className="mt-6 text-base leading-relaxed text-gray-400">
              {event.excerpt}
            </p>
          )}

          {event.registrationUrl && (
            <div className="pt-6">
              <a
                href={event.registrationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-xl bg-gold px-8 py-3 text-sm font-bold uppercase tracking-widest text-black transition-all hover:bg-gold/80 hover:scale-[1.02]"
              >
                Request a Seat
              </a>
            </div>
          )}
        </header>

        <article className="prose prose-invert max-w-none prose-headings:font-serif prose-headings:text-cream prose-a:text-gold">
          <SafeMDXRemote source={source} components={mdxComponents} />
        </article>
      </main>
    </Layout>
  );
};

export default EventPage;