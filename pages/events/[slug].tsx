// pages/events/[slug].tsx 
import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import SafeMDXRenderer from "@/components/mdx/SafeMDXRenderer"; // ✅ Use SafeMDXRenderer
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";

import Layout from "@/components/Layout";
import AccessGate from "@/components/AccessGate";
import { useClientRouter } from "@/lib/router/useClientRouter";
import { Bookmark, BookmarkCheck, CalendarDays, ChevronLeft, Clock, MapPin, Ticket, Users } from "lucide-react";
import { getServerAllEvents, getServerEventBySlug } from "@/lib/content/server";
import { sanitizeData, normalizeSlug } from "@/lib/content/shared";
import tiers, { requiredTierFromDoc } from "@/lib/access/tiers";
import type { AccessTier } from "@/lib/access/tiers";

// Performance Optimized Components
const EventHero = dynamic(() => import("@/components/events/EventHero"), { ssr: false });
const EventSchedule = dynamic(() => import("@/components/events/EventSchedule"), { ssr: false });
const EventSpeakers = dynamic(() => import("@/components/events/EventSpeakers"), { ssr: false });
const ShareButtons = dynamic(() => import("@/components/events/ShareButtons"), { ssr: false });
const RelatedEvents = dynamic(() => import("@/components/events/RelatedEvents"), { ssr: false });

interface Props {
  event: any;
  initialBodyCode: string | null; // ✅ Pre-compiled MDX code
  requiredTier: AccessTier;
}

type ApiOk = {
  ok: true;
  tier: AccessTier;
  requiredTier: AccessTier;
  bodyCode: string; // ✅ Compiled code, not serialized source
};

type ApiFail = {
  ok: false;
  reason: string;
};

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

    // ✅ Normalize tier using SSOT
    const requiredTier = tiers.normalizeRequired(requiredTierFromDoc(eventData));
    const isPublic = requiredTier === "public";

    const event = {
      ...eventData,
      title: eventData.titleSafe,
      slug: eventData.slugSafe,
      accessLevel: requiredTier,
      eventDate: eventData.dateSafe || eventData.eventDate || null,
    };

    // ✅ Only ship pre-compiled code for public content
    const initialBodyCode = isPublic ? (eventData.body?.code || null) : null;

    return {
      props: sanitizeData({ event, initialBodyCode, requiredTier }),
      revalidate: 1800,
    };
  } catch (e) {
    return { notFound: true };
  }
};

const EventPage: NextPage<Props> = ({ event, initialBodyCode, requiredTier }) => {
  const router = useClientRouter();
  const { data: session, status } = useSession();
  const [isBookmarked, setIsBookmarked] = React.useState(false);
  const [mounted, setIsMounted] = React.useState(false);
  const [bodyCode, setBodyCode] = React.useState<string | null>(initialBodyCode);
  const [loading, setLoading] = React.useState(false);
  const [unlockError, setUnlockError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setIsMounted(true);
    const bookmarks = JSON.parse(localStorage.getItem("bookmarkedEvents") || "[]");
    setIsBookmarked(Array.isArray(bookmarks) && bookmarks.includes(event.slug));
  }, [event.slug]);

  // ✅ Normalize at render boundary
  const required = tiers.normalizeRequired(requiredTier);
  const user = tiers.normalizeUser(session?.user?.tier ?? "public");

  const needsAuth = required !== "public";
  const canAccess = tiers.hasAccess(user, required);

  // ✅ Unlock flow for restricted content
  const handleUnlock = async () => {
    setLoading(true);
    setUnlockError(null);
    
    try {
      const res = await fetch(`/api/events/${encodeURIComponent(event.slug)}`);
      const data = await res.json() as ApiOk | ApiFail;
      
      if (res.ok && data.ok && data.bodyCode) {
        setBodyCode(data.bodyCode);
      } else {
        setUnlockError((data as ApiFail).reason || "Failed to unlock content");
      }
    } catch (err) {
      setUnlockError("Network error during unlock");
    } finally {
      setLoading(false);
    }
  };

  // ✅ SSR/build shell - no loading state
  if (!router || !mounted) {
    return (
      <Layout title={event.title}>
        <div className="min-h-screen bg-zinc-50" />
      </Layout>
    );
  }

  // ✅ Only show loading for restricted content
  if (needsAuth && status === "loading") {
    return (
      <Layout title={event.title}>
        <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
          <div className="text-amber-500 font-mono text-xs animate-pulse">Verifying access...</div>
        </div>
      </Layout>
    );
  }

  // ✅ Gate for unauthorized users
  if (needsAuth && (!session?.user || !canAccess)) {
    return (
      <Layout title={event.title}>
        <div className="min-h-screen bg-zinc-50">
          <EventHero 
            title={event.title} 
            date={event.eventDate} 
            location={event.location} 
            coverImage={event.coverImage} 
          />
          <div className="max-w-7xl mx-auto px-6 py-12">
            <AccessGate
              title={event.title}
              requiredTier={required}
              message="This event briefing requires appropriate clearance."
              onUnlocked={handleUnlock}
              onGoToJoin={() => window.location.href = "/inner-circle"}
            />
          </div>
        </div>
      </Layout>
    );
  }

  const canonicalUrl = `https://www.abrahamoflondon.org/events/${event.slug}`;

  return (
    <Layout title={event.title}>
      <Head>
        <title>{event.title} | Intelligence Briefing</title>
        <link rel="canonical" href={canonicalUrl} />
        <meta name="robots" content={required === "public" ? "index, follow" : "noindex, nofollow"} />
      </Head>

      <div className="min-h-screen bg-gray-50/50">
        <EventHero 
          title={event.title} 
          date={event.eventDate} 
          location={event.location} 
          coverImage={event.coverImage} 
        />
        
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
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
                  isBookmarked ? "bg-amber-500 text-white" : "bg-gray-100 text-gray-600"
                }`}
              >
                {isBookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                {isBookmarked ? "Saved to Vault" : "Bookmark Intel"}
              </button>
              
              {required !== "public" && (
                <span className="flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500/10 text-amber-700 text-sm font-bold">
                  <Ticket className="w-4 h-4" /> {required} Access
                </span>
              )}
            </div>

            {/* Content Body */}
            <article className="prose prose-zinc prose-amber max-w-none">
              {loading && (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              
              {unlockError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                  {unlockError}
                </div>
              )}
              
              {bodyCode ? (
                <SafeMDXRenderer code={bodyCode} />
              ) : needsAuth ? (
                <AccessGate
                  title={event.title}
                  requiredTier={required}
                  message="This event briefing requires appropriate clearance."
                  onUnlocked={handleUnlock}
                  onGoToJoin={() => window.location.href = "/inner-circle"}
                />
              ) : null}
            </article>

            <div className="mt-16 pt-8 border-t border-gray-100">
              <ShareButtons url={canonicalUrl} title={event.title} />
            </div>
          </main>
          
          <aside className="lg:col-span-4 space-y-6">
            <div className="bg-zinc-900 rounded-3xl p-8 text-white">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-4">
                Sovereign Notice
              </h4>
              <p className="text-sm text-zinc-400">
                Briefings are subject to 2026 intelligence protocols.
              </p>
              {required !== "public" && (
                <div className="mt-4 pt-4 border-t border-zinc-800">
                  <p className="text-xs text-zinc-500">
                    Clearance Required: <span className="text-amber-400">{required}</span>
                  </p>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </Layout>
  );
};

export default EventPage;