// pages/events/[slug].tsx — FINAL BUILD-PROOF (seed + proxy, Pages Router)
// ✅ Default export present
// ✅ Child components are client-only (ssr:false) to prevent SSG crashes
// ✅ MDXRemote guarded with SEEDED safe components (seed + proxy)
// ✅ mdxRaw passed from getStaticProps
// ✅ Build-safe serialization + robust frontmatter defaults
// ✅ All array operations are safe

import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";

import Layout from "@/components/Layout";

// Your MDX components map
import mdxComponents from "@/components/mdx-components";
import { createSeededSafeMdxComponents } from "@/lib/mdx/safe-components"; // CHANGED: Use seeded-safe function

// Data access
import { getServerAllEvents, getServerEventBySlug } from "@/lib/content/server";
import { sanitizeData, normalizeSlug } from "@/lib/content/shared";

import {
  Bookmark,
  BookmarkCheck,
  CalendarDays,
  ChevronLeft,
  Clock,
  MapPin,
  Ticket,
  Users,
} from "lucide-react";

// -------------------------------------------------------------------
// Client-only components to prevent SSG crashes
// -------------------------------------------------------------------
const EventHero = dynamic(() => import("@/components/events/EventHero"), {
  ssr: false,
  loading: () => <div className="h-96 bg-gray-100 animate-pulse rounded-xl" />,
});

const EventDetails = dynamic(() => import("@/components/events/EventDetails"), {
  ssr: false,
  loading: () => <div className="h-32 bg-gray-100 animate-pulse rounded-xl" />,
});

const EventContent = dynamic(() => import("@/components/events/EventContent"), {
  ssr: false,
  loading: () => <div className="h-48 bg-gray-100 animate-pulse rounded-xl" />,
});

const EventSchedule = dynamic(() => import("@/components/events/EventSchedule"), {
  ssr: false,
  loading: () => (
    <div className="h-32 rounded-lg bg-gray-50 flex items-center justify-center">
      <p className="text-sm text-gray-500">Loading schedule…</p>
    </div>
  ),
});

const EventSpeakers = dynamic(() => import("@/components/events/EventSpeakers"), {
  ssr: false,
  loading: () => (
    <div className="h-32 rounded-lg bg-gray-50 flex items-center justify-center">
      <p className="text-sm text-gray-500">Loading speakers…</p>
    </div>
  ),
});

const EventRegistration = dynamic(() => import("@/components/events/EventRegistration"), {
  ssr: false,
  loading: () => (
    <div className="h-32 rounded-lg bg-gray-50 flex items-center justify-center">
      <p className="text-sm text-gray-500">Loading registration…</p>
    </div>
  ),
});

const RelatedEvents = dynamic(() => import("@/components/events/RelatedEvents"), {
  ssr: false,
  loading: () => (
    <div className="h-32 rounded-lg bg-gray-50 flex items-center justify-center">
      <p className="text-sm text-gray-500">Loading related events…</p>
    </div>
  ),
});

const ShareButtons = dynamic(() => import("@/components/events/ShareButtons"), {
  ssr: false,
  loading: () => (
    <div className="h-12 rounded-lg bg-gray-50 flex items-center justify-center px-4">
      <p className="text-sm text-gray-500">Loading share options…</p>
    </div>
  ),
});

// -------------------------------------------------------------------
// Types
// -------------------------------------------------------------------
type Tier = "public" | "inner-circle" | "private";

function asTier(v: unknown): Tier {
  const s = String(v || "").toLowerCase().trim();
  if (s === "private") return "private";
  if (s === "inner-circle") return "inner-circle";
  return "public";
}

type EventDoc = {
  title: string;
  excerpt: string | null;
  description: string | null;
  slug: string;
  coverImage: string | null;
  tags: string[]; // always array

  accessLevel: Tier;
  lockMessage: string | null;

  eventDate: string | null;
  time: string | null;
  location: string | null;

  venue: string | null;
  price: string | null;
  endDate: string | null;
  speaker: string | null;
  category: string | null;
  capacity: number | null;

  registrationUrl: string | null;
};

type Props = {
  event: EventDoc;
  source: MDXRemoteSerializeResult | null;
  mdxRaw: string | null; // ✅ ADDED: Required for seeding
};

// -------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------
function safeSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org").replace(/\/+$/, "");
}

function cleanSlug(raw: unknown): string {
  const s = String(raw || "").trim();
  return s.replace(/^\/+|\/+$/g, "").replace(/^events\//, "").replace(/\.(md|mdx)$/i, "");
}

// Paranoid MDX extraction
function getRawBody(d: any): string {
  return (
    d?.body?.raw ||
    (typeof d?.bodyRaw === "string" ? d.bodyRaw : "") ||
    (typeof d?.content === "string" ? d.content : "") ||
    (typeof d?.body === "string" ? d.body : "") ||
    (typeof d?.mdx === "string" ? d.mdx : "") ||
    ""
  );
}

// ===================================================================
// getStaticPaths
// ===================================================================
export const getStaticPaths: GetStaticPaths = async () => {
  const all = (typeof getServerAllEvents === "function" ? getServerAllEvents() : []) as any[];
  const safeAll = Array.isArray(all) ? all : [];

  const paths = safeAll
    .map((e: any) => {
      const raw = e?.slug || e?._raw?.flattenedPath || "";
      const slug = cleanSlug(raw);
      return slug ? { params: { slug } } : null;
    })
    .filter(Boolean) as Array<{ params: { slug: string } }>;

  return { paths, fallback: "blocking" };
};

// ===================================================================
// getStaticProps
// ===================================================================
export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  try {
    const raw = params?.slug;
    const slug = Array.isArray(raw) ? raw[0] : raw;
    const s = normalizeSlug(String(slug || ""));
    if (!s) return { notFound: true };

    const eventData = typeof getServerEventBySlug === "function" ? getServerEventBySlug(String(s)) : null;
    if (!eventData) return { notFound: true };

    const event: EventDoc = {
      title: String(eventData.title || "").trim() || "Event",
      excerpt: String(eventData.excerpt || "").trim() ? String(eventData.excerpt).trim() : null,
      description: String(eventData.description || "").trim() ? String(eventData.description).trim() : null,
      slug: String(eventData.slug || s).trim() || String(s),
      coverImage: String(eventData.coverImage || "").trim() ? String(eventData.coverImage).trim() : null,
      tags: Array.isArray(eventData.tags) ? eventData.tags : [],

      accessLevel: asTier(eventData.accessLevel),
      lockMessage: String(eventData.lockMessage || "").trim() ? String(eventData.lockMessage).trim() : null,

      eventDate: String(eventData.eventDate || eventData.startDate || eventData.date || "").trim() || null,
      endDate: String(eventData.endDate || "").trim() || null,
      time: String(eventData.time || "").trim() || null,
      location: String(eventData.location || "").trim() || null,

      venue: String(eventData.venue || "").trim() || null,
      price: String(eventData.price || "").trim() || null,
      speaker: String(eventData.speaker || "").trim() || null,
      category: String(eventData.category || "").trim() || null,
      capacity: typeof eventData.capacity === "number" ? eventData.capacity : null,

      registrationUrl: String(eventData.registrationUrl || "").trim() || null,
    };

    const isPublic = event.accessLevel === "public";

    let source: MDXRemoteSerializeResult | null = null;
    let mdxRaw: string | null = null;

    if (isPublic) {
      mdxRaw = getRawBody(eventData);
      source = mdxRaw ? await serialize(mdxRaw, {
        mdxOptions: {
          remarkPlugins: [remarkGfm],
          rehypePlugins: [rehypeSlug],
        },
      }) : await serialize(" ");
    }

    return {
      props: sanitizeData({ event, source, mdxRaw }),
      revalidate: 1800,
    };
  } catch (e) {
    console.error("[events/[slug]] getStaticProps error:", e);
    return { notFound: true };
  }
};

// ===================================================================
// Page Component
// ===================================================================
const EventPage: NextPage<Props> = ({ event, source, mdxRaw }) => {
  const router = useRouter();

  // ✅ SEED (enumerable) + PROXY (read-safe) => stops ResourcesCTA/BrandFrame/Rule/etc forever
  const safeComponents = React.useMemo(
    () =>
      createSeededSafeMdxComponents(mdxComponents, mdxRaw || "", {
        warnOnFallback: process.env.NODE_ENV === "development",
      }),
    [mdxRaw]
  );

  const [isBookmarked, setIsBookmarked] = React.useState(false);
  const [isPastEvent, setIsPastEvent] = React.useState(false);
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    // ✅ Client-only guard
    if (typeof window === "undefined") return;

    setIsClient(true);

    // bookmarks
    try {
      const bookmarks = JSON.parse(localStorage.getItem("bookmarkedEvents") || "[]");
      setIsBookmarked(Array.isArray(bookmarks) && bookmarks.includes(event.slug));
    } catch (error) {
      console.error("Error parsing bookmarks:", error);
      localStorage.setItem("bookmarkedEvents", "[]");
    }

    // past/future
    const dateValue = event.eventDate || "";
    const d = dateValue ? new Date(dateValue) : null;
    const isPast = !!d && !Number.isNaN(d.getTime()) && d.getTime() < Date.now();
    setIsPastEvent(isPast);
  }, [event.slug, event.eventDate]);

  const handleBookmark = () => {
    if (!isClient) return;

    try {
      const bookmarks = JSON.parse(localStorage.getItem("bookmarkedEvents") || "[]");
      const safe = Array.isArray(bookmarks) ? bookmarks : [];

      if (isBookmarked) {
        const updated = safe.filter((s: string) => s !== event.slug);
        localStorage.setItem("bookmarkedEvents", JSON.stringify(updated));
        setIsBookmarked(false);
      } else {
        safe.push(event.slug);
        localStorage.setItem("bookmarkedEvents", JSON.stringify(safe));
        setIsBookmarked(true);
      }
    } catch (error) {
      console.error("Error updating bookmarks:", error);
    }
  };

  const metaDescription =
    (event.excerpt || "").trim() ||
    (event.description || "").trim() ||
    "An exclusive event by Abraham of London";

  const canonicalUrl = `${safeSiteUrl()}/events/${event.slug}`;
  const cover = event.coverImage || "/assets/images/events/replace.jpg";

  const formattedDate = event.eventDate
    ? (() => {
        const d = new Date(event.eventDate as string);
        if (Number.isNaN(d.getTime())) return "";
        return d.toLocaleDateString("en-GB", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      })()
    : "";

  const formattedTime = event.time || "Time TBA";
  const locationText = event.location || "Venue TBA";

  if (router.isFallback) {
    return (
      <Layout title="Loading...">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-sm text-gray-600">Loading event…</div>
        </div>
      </Layout>
    );
  }

  const isLocked = event.accessLevel !== "public";

  return (
    <Layout>
      <Head>
        <title>{event.title} | Events | Abraham of London</title>
        <meta name="description" content={metaDescription} />
        <meta property="og:title" content={event.title} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:image" content={cover} />
        <meta property="og:type" content="event" />
        <meta property="og:url" content={canonicalUrl} />
        {event.eventDate ? <meta property="event:start_time" content={event.eventDate} /> : null}
        {event.location ? <meta property="event:location" content={event.location} /> : null}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={event.title} />
        <meta name="twitter:description" content={metaDescription} />
        <link rel="canonical" href={canonicalUrl} />
      </Head>

      {/* Navigation */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors group"
            type="button"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Events
          </button>
        </div>
      </div>

      <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-100">
        {/* Client-only Hero */}
        {isClient ? (
          <EventHero
            title={event.title}
            date={formattedDate}
            location={locationText}
            coverImage={event.coverImage || undefined}
            excerpt={event.excerpt || undefined}
            isPast={isPastEvent}
          />
        ) : (
          <div className="h-96 bg-gray-100 animate-pulse rounded-xl" />
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            <main className="lg:col-span-8">
              <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 lg:p-12">
                {/* Action buttons */}
                <div className="flex flex-wrap gap-4 mb-8">
                  <button
                    onClick={handleBookmark}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      isBookmarked
                        ? "bg-amber-500/20 text-amber-600 border border-amber-500/30"
                        : "bg-gray-100 text-gray-700 border border-gray-200 hover:border-amber-500/30 hover:text-amber-600"
                    }`}
                    type="button"
                    disabled={!isClient}
                  >
                    {isBookmarked ? (
                      <>
                        <BookmarkCheck className="w-4 h-4" />
                        <span className="text-sm font-medium">Saved</span>
                      </>
                    ) : (
                      <>
                        <Bookmark className="w-4 h-4" />
                        <span className="text-sm font-medium">Save Event</span>
                      </>
                    )}
                  </button>

                  {!isPastEvent && event.registrationUrl ? (
                    <a
                      href={event.registrationUrl}
                      target={event.registrationUrl.startsWith("/") ? undefined : "_blank"}
                      rel={event.registrationUrl.startsWith("/") ? undefined : "noopener noreferrer"}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                    >
                      <Ticket className="w-4 h-4" />
                      <span className="text-sm font-medium">Register Now</span>
                    </a>
                  ) : null}
                </div>

                {/* Event metadata cards */}
                <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl">
                    <CalendarDays className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-600 font-medium">Date</p>
                      <p className="font-semibold text-gray-900 text-sm">{formattedDate || "Date TBA"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl">
                    <MapPin className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-600 font-medium">Location</p>
                      <p className="font-semibold text-gray-900 text-sm">{locationText}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-xl">
                    <Clock className="w-5 h-5 text-purple-600 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-600 font-medium">Time</p>
                      <p className="font-semibold text-gray-900 text-sm">{formattedTime}</p>
                    </div>
                  </div>

                  {typeof event.capacity === "number" ? (
                    <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl">
                      <Users className="w-5 h-5 text-amber-600 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-600 font-medium">Capacity</p>
                        <p className="font-semibold text-gray-900 text-sm">{event.capacity} seats</p>
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* Client-only Details */}
                {isClient ? (
                  <EventDetails
                    venue={event.venue || undefined}
                    price={event.price || undefined}
                    endDate={event.endDate || undefined}
                    speaker={event.speaker || undefined}
                    category={event.category || undefined}
                  />
                ) : (
                  <div className="h-32 bg-gray-100 animate-pulse rounded-xl mb-8" />
                )}

                {/* Content */}
                <div className="mt-8 prose prose-gray max-w-none">
                  {isClient ? (
                    <EventContent>
                      {isLocked ? (
                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
                          <p className="text-sm font-semibold text-gray-900">Private event</p>
                          <p className="mt-2 text-sm text-gray-700">
                            {event.lockMessage ||
                              "This event is reserved for invited guests. Request an invitation to be considered."}
                          </p>
                        </div>
                      ) : source ? (
                        // ✅ SEED + PROXY: Safe components with mdxRaw seeding
                        <MDXRemote {...source} components={safeComponents as any} />
                      ) : (
                        <div className="text-sm text-gray-600">Content is being prepared.</div>
                      )}
                    </EventContent>
                  ) : (
                    <div className="h-48 bg-gray-100 animate-pulse rounded-xl" />
                  )}
                </div>

                {/* Tags */}
                {event.tags.length > 0 ? (
                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <div className="flex flex-wrap gap-2">
                      {event.tags.map((tag, index) => (
                        <span
                          key={`${tag}-${index}`}
                          className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-full border border-gray-200 hover:bg-gray-200 transition-colors"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* Client-only components */}
                {isClient ? (
                  <>
                    {!isPastEvent ? (
                      <div className="mt-12">
                        <EventSchedule eventId={event.slug} />
                      </div>
                    ) : null}

                    <div className="mt-12">
                      <EventSpeakers eventTitle={event.title} />
                    </div>

                    <div className="mt-12">
                      <EventRegistration
                        isPast={isPastEvent}
                        registrationUrl={event.registrationUrl || undefined}
                        price={event.price || undefined}
                      />
                    </div>

                    <div className="mt-12 pt-8 border-t border-gray-200">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="text-center sm:text-left">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">Share this event</h3>
                          <p className="text-sm text-gray-600 max-w-md">
                            Spread the word with your network and help others discover this gathering
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          <ShareButtons url={canonicalUrl} title={event.title} excerpt={event.excerpt || ""} />
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="mt-12 space-y-6">
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-600">
                      Loading event details…
                    </div>
                  </div>
                )}
              </div>
            </main>

            <aside className="lg:col-span-4">
              <div className="sticky top-24 space-y-6">
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Related Events</h3>
                  {isClient ? (
                    <RelatedEvents currentEventTitle={event.title} />
                  ) : (
                    <div className="h-32 rounded-lg bg-gray-50 flex items-center justify-center">
                      <p className="text-sm text-gray-500">Loading related events…</p>
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Details</h3>
                  <div className="space-y-4">
                    {event.venue ? (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Venue</p>
                        <p className="text-gray-900 font-medium">{event.venue}</p>
                      </div>
                    ) : null}
                    {event.price ? (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Price</p>
                        <p className="text-gray-900 font-medium">{event.price}</p>
                      </div>
                    ) : null}
                    {event.speaker ? (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Featured Speaker</p>
                        <p className="text-gray-900 font-medium">{event.speaker}</p>
                      </div>
                    ) : null}
                    {event.category ? (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Category</p>
                        <p className="text-gray-900 font-medium">{event.category}</p>
                      </div>
                    ) : null}
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Access</p>
                      <p className="text-gray-900 font-medium">{event.accessLevel}</p>
                    </div>
                  </div>
                </div>

                {!isPastEvent && event.eventDate ? (
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-lg p-6 border border-blue-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Add to Calendar</h3>
                    <div className="space-y-3">
                      <button
                        type="button"
                        className="w-full px-4 py-3 bg-white text-gray-700 rounded-lg border border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-colors flex items-center justify-center gap-3"
                      >
                        <CalendarDays className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-medium">Google Calendar</span>
                      </button>
                      <button
                        type="button"
                        className="w-full px-4 py-3 bg-white text-gray-700 rounded-lg border border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-colors flex items-center justify-center gap-3"
                      >
                        <CalendarDays className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-medium">Apple Calendar</span>
                      </button>
                      <button
                        type="button"
                        className="w-full px-4 py-3 bg-white text-gray-700 rounded-lg border border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-colors flex items-center justify-center gap-3"
                      >
                        <CalendarDays className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-medium">Outlook</span>
                      </button>
                    </div>
                  </div>
                ) : null}

                <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl shadow-lg p-6 border border-amber-200">
                  <div className="text-center">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/20 mb-4">
                      <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Never Miss an Event</h3>
                    <p className="text-sm text-gray-600 mb-6">
                      Get notified about upcoming events and exclusive invitations.
                    </p>
                    <button
                      type="button"
                      onClick={() => router.push("/newsletter")}
                      className="w-full px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold rounded-lg hover:from-amber-400 hover:to-amber-500 transition-all shadow-md"
                    >
                      Subscribe to Updates
                    </button>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default EventPage;