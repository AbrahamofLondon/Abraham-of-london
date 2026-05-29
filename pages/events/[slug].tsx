/* pages/events/[slug].tsx */

import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";

import Layout from "@/components/Layout";
import AccessGate from "@/components/AccessGate";
const ClientOnlyMDXRenderer = dynamic(() => import("@/components/mdx/ClientOnlyMDXRenderer"), { ssr: false });
import EventHero from "@/components/events/EventHero";
import { useClientRouter } from "@/lib/router/useClientRouter";
import { Bookmark, BookmarkCheck, Shield, Lock, CornerRightDown } from "lucide-react";

import { getServerAllEvents, getServerEventBySlug } from "@/lib/content/server";
import { sanitizeData, normalizeSlug } from "@/lib/content/shared";
import { getRenderableBody } from "@/lib/content/render-body";
import { decodeBodyCodePayload } from "@/lib/content/client-codec";

import tiers, { requiredTierFromDoc } from "@/lib/access/tiers";
import type { AccessTier } from "@/lib/access/tiers";

const EventSchedule = dynamic(() => import("@/components/events/EventSchedule"), { ssr: false });
const EventSpeakers = dynamic(() => import("@/components/events/EventSpeakers"), { ssr: false });
const EventRegistration = dynamic(() => import("@/components/events/EventRegistration"), { ssr: false });
const ShareButtons = dynamic(() => import("@/components/events/ShareButtons"), { ssr: false });
const RelatedEvents = dynamic(() => import("@/components/events/RelatedEvents"), { ssr: false });

interface Props {
  event: any;
  initialBodyCode: string | null;
  requiredTier: AccessTier;
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
    const eventData = getServerEventBySlug(s);
    if (!eventData || eventData.draftSafe) return { notFound: true };

    const requiredTier = tiers.normalizeRequired(requiredTierFromDoc(eventData));
    const isPublic = requiredTier === "public";

    const renderBody = getRenderableBody(eventData);
    const initialBodyCode = isPublic ? renderBody.code : null;

    // Strip body before spreading — body.raw/code must not ride in __NEXT_DATA__
    // for locked events (initialBodyCode=null keeps render correct).
    const { body: _body, ...safeEventData } = eventData as any;

    const event = {
      ...safeEventData,
      title: eventData.titleSafe,
      slug: eventData.slugSafe,
      accessLevel: requiredTier,
      eventDate: eventData.dateSafe || eventData.eventDate || null,
      tickets: eventData.tickets || [],
      capacity: eventData.capacity || 100,
      remaining: eventData.remaining || 100,
    };

    return {
      props: sanitizeData({ event, initialBodyCode, requiredTier }),
      revalidate: 1800,
    };
  } catch {
    return { notFound: true };
  }


};

const EventPage: NextPage<Props> = ({ event, initialBodyCode, requiredTier }) => {
  const router = useClientRouter();
  const { data: session } = useSession();
  const [isBookmarked, setIsBookmarked] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [bodyCode, setBodyCode] = React.useState<string | null>(initialBodyCode);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    try {
      const bookmarks = JSON.parse(localStorage.getItem("bookmarkedEvents") || "[]");
      setIsBookmarked(Array.isArray(bookmarks) && bookmarks.includes(event.slug));
    } catch {
      setIsBookmarked(false);
    }
  }, [event.slug]);

  const required = tiers.normalizeRequired(requiredTier);
  const needsAuth = required !== "public";

  const handleUnlock = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${encodeURIComponent(event.slug)}`);
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        const decoded = decodeBodyCodePayload(data);
        if (decoded.trim()) setBodyCode(decoded);
      }
    } catch (err) {
      console.error("Unlock failed", err);
    } finally {
      setLoading(false);
    }
  };

  if (!router || !mounted) {
    return (
      <Layout title={event.title}>
        <div className="min-h-screen bg-zinc-950" />
      </Layout>
    );
  }

  return (
    <Layout title={event.title}>
      <Head>
        <title>{event.title} | London Registry</title>
        <meta name="robots" content={needsAuth ? "noindex, nofollow" : "index, follow"} />
      </Head>

      <EventHero
        title={event.title}
        date={event.eventDate}
        location={event.location || "London Headquarters"}
        coverImage={event.coverImage}
        excerpt={event.excerpt}
        isPast={new Date(event.eventDate) < new Date()}
      />

      <div className="bg-white min-h-screen">
        <div className="max-w-7xl mx-auto px-6 py-20 grid lg:grid-cols-12 gap-20">
          <main className="lg:col-span-8 space-y-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-zinc-100 pb-12">
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => {
                    const b = JSON.parse(localStorage.getItem("bookmarkedEvents") || "[]");
                    const updated = isBookmarked ? b.filter((s: string) => s !== event.slug) : [...b, event.slug];
                    localStorage.setItem("bookmarkedEvents", JSON.stringify(updated));
                    setIsBookmarked(!isBookmarked);
                  }}
                  className={`flex items-center gap-2 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                    isBookmarked ? "bg-amber-500 text-white" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                  }`}
                >
                  {isBookmarked ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                  {isBookmarked ? "Intel Saved" : "Bookmark Briefing"}
                </button>

                {needsAuth && (
                  <div className="flex items-center gap-2 px-6 py-3 rounded-full bg-zinc-950 text-white text-[10px] font-black uppercase tracking-widest">
                    <Shield className="w-3.5 h-3.5 text-amber-500" /> {required} Clearance
                  </div>
                )}
              </div>

              <ShareButtons url={`https://abrahamoflondon.org/events/${event.slug}`} title={event.title} />
            </div>

            <article className="prose prose-zinc prose-amber max-w-none">
              {bodyCode ? (
                <div className="animate-in fade-in duration-1000">
                  <ClientOnlyMDXRenderer code={bodyCode} />
                </div>
              ) : needsAuth ? (
                <AccessGate title={event.title} requiredTier={required} isAuthenticated={!!session?.user} onUnlocked={handleUnlock} />
              ) : (
                <div className="py-20 text-center font-mono text-[10px] uppercase tracking-[0.5em] text-zinc-300">
                  No event content available
                </div>
              )}
            </article>

            {event.schedule && <EventSchedule schedule={event.schedule} />}
            {event.speakers && <EventSpeakers speakers={event.speakers} />}
          </main>

          <aside className="lg:col-span-4 space-y-12">
            <EventRegistration event={event} user={session?.user} />

            <div className="p-10 bg-zinc-950 rounded-[2.5rem] text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                <Lock className="w-24 h-24" />
              </div>
              <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-500 mb-6 flex items-center gap-2">
                Sovereign Protocol <CornerRightDown className="w-3 h-3" />
              </h4>
              <p className="text-sm text-zinc-400 leading-relaxed font-light italic">
                "All intelligence gathered during this briefing is restricted to the London Registry. Unauthorized distribution triggers immediate clearance revocation."
              </p>
              <div className="mt-8 pt-8 border-t border-white/10 flex justify-between items-center font-mono text-[9px]">
                <span className="text-white/20 uppercase tracking-tighter">Node: {event.slug.toUpperCase()}</span>
                <span className="text-amber-500/40">2026.SECURITY.v4</span>
              </div>
            </div>

            <RelatedEvents events={[]} currentEventId={event.slug} />
          </aside>
        </div>
      </div>
    </Layout>
  );
};

export default EventPage;