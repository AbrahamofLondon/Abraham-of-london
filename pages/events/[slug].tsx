'use client';

import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import dynamic from "next/dynamic";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";

import Layout from "@/components/Layout";
import mdxComponents from "@/components/mdx-components";
import { createSeededSafeMdxComponents } from "@/lib/mdx/safe-components";
import { useClientRouter } from "@/lib/router/useClientRouter";
import { Bookmark, BookmarkCheck, CalendarDays, ChevronLeft, Clock, MapPin, Ticket, Users } from "lucide-react";
import { getServerAllEvents, getServerEventBySlug } from "@/lib/content/server";
import { sanitizeData, normalizeSlug } from "@/lib/content/shared";

// Performance Optimized Components
const EventHero = dynamic(() => import("@/components/events/EventHero"), { ssr: false });
const EventSchedule = dynamic(() => import("@/components/events/EventSchedule"), { ssr: false });
const EventSpeakers = dynamic(() => import("@/components/events/EventSpeakers"), { ssr: false });
const ShareButtons = dynamic(() => import("@/components/events/ShareButtons"), { ssr: false });
const RelatedEvents = dynamic(() => import("@/components/events/RelatedEvents"), { ssr: false });

type Tier = "public" | "inner-circle" | "private";

interface Props {
  event: any;
  source: MDXRemoteSerializeResult | null;
  mdxRaw: string | null;
}

export const getStaticPaths: GetStaticPaths = async () => {
  const all = (typeof getServerAllEvents === "function" ? getServerAllEvents() : []) as any[];
  const paths = all
    .filter((e) => !e.draftSafe)
    .map((e: any) => ({
      params: { slug: e.slugSafe || normalizeSlug(e.slug) },
    }));
  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  try {
    const s = normalizeSlug(String(params?.slug || ""));
    const eventData = typeof getServerEventBySlug === "function" ? getServerEventBySlug(s) : null;
    
    if (!eventData || eventData.draftSafe) return { notFound: true };

    const event = {
      ...eventData,
      title: eventData.titleSafe,
      slug: eventData.slugSafe,
      accessLevel: (eventData.accessLevelSafe || "public") as Tier,
      eventDate: eventData.dateSafe || eventData.eventDate || null,
    };

    let source: MDXRemoteSerializeResult | null = null;
    const mdxRaw = eventData.body?.raw || eventData.content || "";

    if (event.accessLevel === "public" && mdxRaw) {
      source = await serialize(mdxRaw, {
        mdxOptions: {
          remarkPlugins: [remarkGfm],
          rehypePlugins: [rehypeSlug],
        },
      });
    }

    return {
      props: sanitizeData({ event, source, mdxRaw }),
      revalidate: 1800,
    };
  } catch (e) {
    return { notFound: true };
  }
};

const EventPage: NextPage<Props> = ({ event, source, mdxRaw }) => {
  const router = useClientRouter();
  const [isBookmarked, setIsBookmarked] = React.useState(false);
  const [isMounted, setIsMounted] = React.useState(false);

  const safeComponents = React.useMemo(
    () => createSeededSafeMdxComponents(mdxComponents, mdxRaw || ""),
    [mdxRaw]
  );

  React.useEffect(() => {
    setIsMounted(true);
    const bookmarks = JSON.parse(localStorage.getItem("bookmarkedEvents") || "[]");
    setIsBookmarked(Array.isArray(bookmarks) && bookmarks.includes(event.slug));
  }, [event.slug]);

  if (!isMounted) return <div className="min-h-screen bg-zinc-50" />;

  const canonicalUrl = `https://www.abrahamoflondon.org/events/${event.slug}`;

  return (
    <Layout title={event.title}>
      <Head>
        <title>{event.title} | Intelligence Briefing</title>
        <link rel="canonical" href={canonicalUrl} />
      </Head>

      <div className="min-h-screen bg-gray-50/50">
        <EventHero title={event.title} date={event.eventDate} location={event.location} coverImage={event.coverImage} />
        
        <div className="max-w-7xl mx-auto px-6 py-12 grid lg:grid-cols-12 gap-12">
          <main className="lg:col-span-8 bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-12">
            {/* Interaction Row */}
            <div className="flex gap-4 mb-10">
              <button 
                onClick={() => {
                  const b = JSON.parse(localStorage.getItem("bookmarkedEvents") || "[]");
                  const updated = isBookmarked ? b.filter((s: string) => s !== event.slug) : [...b, event.slug];
                  localStorage.setItem("bookmarkedEvents", JSON.stringify(updated));
                  setIsBookmarked(!isBookmarked);
                }}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${isBookmarked ? "bg-amber-500 text-white" : "bg-gray-100 text-gray-600"}`}
              >
                {isBookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                {isBookmarked ? "Saved to Vault" : "Bookmark Intel"}
              </button>
            </div>

            {/* Content Body */}
            <article className="prose prose-zinc prose-amber max-w-none">
              {source ? <MDXRemote {...source} components={safeComponents as any} /> : <p className="italic text-zinc-400">Restricted Content.</p>}
            </article>

            <div className="mt-16 pt-8 border-t border-gray-100">
                <ShareButtons url={canonicalUrl} title={event.title} />
            </div>
          </main>
          
          <aside className="lg:col-span-4 space-y-6">
             <div className="bg-zinc-900 rounded-3xl p-8 text-white">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-4">Sovereign Notice</h4>
                <p className="text-sm text-zinc-400">Briefings are subject to 2026 intelligence protocols.</p>
             </div>
          </aside>
        </div>
      </div>
    </Layout>
  );
};

export default EventPage;