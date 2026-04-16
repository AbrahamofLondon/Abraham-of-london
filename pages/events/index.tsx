import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Link from "next/link";
import Layout from "@/components/Layout";
import { getAllEvents } from "@/lib/content/server";
import { normalizeSlug, sanitizeData } from "@/lib/content/shared";
import { Shield, Clock, MapPin } from "lucide-react";

type EventItem = {
  _id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  eventDate: string | null;
  location: string | null;
  href: string;
  mode?: "online" | "in-person" | "hybrid" | null;
  capacity?: number | null;
  duration?: string | null;
};

type Props = {
  upcoming: EventItem[];
  past: EventItem[];
  tbc: EventItem[];
};

function safeParseDate(input: string | null): Date | null {
  if (!input) return null;
  const d = /^\d{4}-\d{2}-\d{2}$/.test(input) ? new Date(`${input}T00:00:00.000Z`) : new Date(input);
  return isNaN(d.getTime()) ? null : d;
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  console.log("[PAGE_DATA] pages/events/index.tsx getStaticProps START");
  try {
  try {
    const allEventDocs = getAllEvents();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    type RawEvent = {
      _id: string; slug: string; href: string; title: string;
      excerpt: string | null; eventDate: string | null; location: string | null;
      mode: string; __date: Date | null; __past: boolean;
    };

    const events: RawEvent[] = allEventDocs.map((e: any) => {
      const slug = normalizeSlug(e.slugComputed || e.slug || "").replace(/^events\//, "");
      const dateStr: string | null = e.eventDate ?? e.date ?? null;
      const parsed = safeParseDate(dateStr);

      return {
        _id: String(e._id ?? slug),
        slug,
        href: `/events/${slug}`,
        title: String(e.title ?? "Untitled"),
        excerpt: (e.excerpt ?? e.description ?? null) as string | null,
        eventDate: dateStr,
        location: (e.location ?? null) as string | null,
        mode: e.mode ?? "in-person",
        __date: parsed,
        __past: parsed ? parsed.getTime() < today : false
      };
    });

    function toEventItem(e: RawEvent): EventItem {
      return { _id: e._id, slug: e.slug, title: e.title, excerpt: e.excerpt, eventDate: e.eventDate, location: e.location, href: e.href, mode: e.mode as EventItem["mode"] };
    }

    return {
      props: sanitizeData({
        upcoming: events.filter((e: RawEvent) => e.__date && !e.__past).sort((a: RawEvent, b: RawEvent) => a.__date!.getTime() - b.__date!.getTime()).map(toEventItem),
        past: events.filter((e: RawEvent) => e.__date && e.__past).sort((a: RawEvent, b: RawEvent) => b.__date!.getTime() - a.__date!.getTime()).map(toEventItem),
        tbc: events.filter((e: RawEvent) => !e.__date).sort((a: RawEvent, b: RawEvent) => a.title.localeCompare(b.title)).map(toEventItem)
      }),
      revalidate: 1800,
    };
  } catch (error) {
    return { props: { upcoming: [], past: [], tbc: [] }, revalidate: 1800 };
  }


  } finally {
    console.log("[PAGE_DATA] pages/events/index.tsx getStaticProps END");
  }
};

const EventsRegistryPage: NextPage<Props> = ({ upcoming, past, tbc }) => {
  return (
    <Layout title="Registry | Gatherings">
      <div className="bg-black min-h-screen text-white">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <header className="mb-20 border-l border-amber-500/30 pl-8">
            <span className="text-[10px] font-mono uppercase tracking-[0.5em] text-amber-500">Institutional Registry</span>
            <h1 className="font-serif text-6xl md:text-8xl italic tracking-tighter mt-4">The <span className="text-zinc-500 not-italic">Index.</span></h1>
            <p className="mt-8 text-zinc-500 text-sm max-w-xl leading-relaxed">Verification required for attendance. Strategic briefings and leadership sessions indexed for members.</p>
          </header>

          {/* UPCOMING */}
          <section className="mb-32">
            <h2 className="font-mono text-[10px] uppercase tracking-widest text-zinc-600 mb-12 flex items-center gap-4">
              <span className="h-px w-12 bg-zinc-800" /> Scheduled Briefings
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/10 border border-white/10">
              {upcoming.concat(tbc).map(event => (
                <Link key={event._id} href={event.href} className="bg-black p-10 hover:bg-zinc-950 transition-colors min-h-[300px] flex flex-col">
                  <span className="text-[10px] font-mono text-amber-500 block mb-8">
                    {event.eventDate ? new Date(event.eventDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric'}) : "TBC"}
                  </span>
                  <h3 className="font-serif text-3xl mb-4 leading-tight">{event.title}</h3>
                  <p className="text-zinc-500 text-xs mb-auto line-clamp-2">{event.excerpt}</p>
                  <div className="mt-8 flex items-center gap-4 text-[9px] font-mono uppercase text-zinc-600">
                     <MapPin className="h-3 w-3" /> {event.location}
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* ARCHIVE */}
          {past.length > 0 && (
            <section className="opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700">
              <h2 className="font-mono text-[10px] uppercase tracking-widest text-zinc-600 mb-12 flex items-center gap-4">
                <span className="h-px w-12 bg-zinc-800" /> Concluded Sessions
              </h2>
              <div className="space-y-1">
                {past.map(event => (
                  <Link key={event._id} href={event.href} className="flex flex-col md:flex-row md:items-center justify-between p-6 border border-white/5 hover:border-white/20 transition-all group">
                    <div className="flex items-center gap-8">
                      <time className="font-mono text-[10px] text-zinc-600 w-24 shrink-0">
                        {new Date(event.eventDate!).toLocaleDateString('en-GB', { month: 'short', year: 'numeric'})}
                      </time>
                      <h4 className="font-serif text-xl text-zinc-300 group-hover:text-white transition-colors">{event.title}</h4>
                    </div>
                    <span className="text-[9px] font-mono text-zinc-700 uppercase mt-2 md:mt-0 tracking-[0.2em]">Briefing Concluded</span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default EventsRegistryPage;