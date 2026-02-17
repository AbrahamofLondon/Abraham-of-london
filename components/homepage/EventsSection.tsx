// components/homepage/EventsSection.tsx — BULLETPROOF (status derived from date, no phantom “missing”)
import * as React from "react";
import Link from "next/link";
import { ArrowRight, Calendar, MapPin, Video, Users, Clock, Shield } from "lucide-react";

export type EventItem = {
  slug: string;
  title: string;
  date: string;
  location: string;
  mode: "online" | "in-person" | "hybrid";
  excerpt: string | null;
  capacity: number | null;
  duration: string | null;
  status?: "open" | "limited" | "full" | "past" | null;
};

function isValidDate(value: string): boolean {
  const t = Date.parse(value);
  return Number.isFinite(t);
}

function deriveStatus(event: EventItem): "open" | "limited" | "full" | "past" {
  const explicit = String(event.status || "").toLowerCase();
  if (explicit === "open" || explicit === "limited" || explicit === "full" || explicit === "past") return explicit as any;

  if (!isValidDate(event.date)) return "open";

  const t = Date.parse(event.date);
  const d = new Date(t);
  const endOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

  return endOfDay.getTime() < Date.now() ? "past" : "open";
}

function formatDateGB(value: string): string {
  if (!isValidDate(value)) return "Date TBC";
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function EventsSection({ events }: { events?: EventItem[] }) {
  const safeEvents = Array.isArray(events) ? events : [];

  // Normalize status consistently (so upstream can be imperfect)
  const normalized = safeEvents
    .filter(Boolean)
    .map((e) => ({ ...e, status: deriveStatus(e) }));

  // Show next 3 upcoming only
  const upcomingEvents = normalized
    .filter((e) => e.status !== "past")
    .sort((a, b) => Date.parse(a.date) - Date.parse(b.date))
    .slice(0, 3);

  return (
    <section className="relative bg-black py-24 sm:py-28 lg:py-32 overflow-hidden">
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,black_100%)]" />
      </div>

      <div className="pointer-events-none absolute right-[-300px] top-[-300px] h-[800px] w-[800px] rounded-full bg-amber-500/8 blur-[200px]" />
      <div className="pointer-events-none absolute left-[-200px] bottom-[-200px] h-[600px] w-[600px] rounded-full bg-blue-500/5 blur-[180px]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between mb-14">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-2 w-2 rounded-full bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.4)]" />
              <span className="text-[10px] font-black uppercase tracking-[0.35em] text-amber-500/70">
                Live Engagement Protocol
              </span>
            </div>

            <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl text-white font-medium leading-[1.05] tracking-tight">
              Upcoming <span className="italic text-amber-200/80">Gatherings</span>
            </h2>

            <p className="mt-6 text-base sm:text-lg text-white/45 leading-relaxed">
              Structured sessions and strategic briefings. No theatrics—only operational intelligence for leaders who execute.
            </p>
          </div>

          <Link
            href="/events"
            className="group inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.03] px-8 py-4 text-[11px] font-black uppercase tracking-[0.25em] text-white hover:border-amber-500/30 hover:bg-amber-500/5 transition-all duration-300"
          >
            Full Calendar
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {upcomingEvents.length ? (
          <div className="grid gap-8 lg:grid-cols-3">
            {upcomingEvents.map((event) => (
              <EventCard key={event.slug} event={event} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-10 text-center">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.35em] text-amber-300/80">
              Calendar standby
            </p>
            <h3 className="mt-4 font-serif text-2xl text-white/90">No public sessions published yet.</h3>
            <p className="mt-3 text-sm text-white/55 max-w-xl mx-auto">
              When events are announced, this section will update automatically from the events registry.
            </p>
            <div className="mt-6">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-500 px-5 py-2.5 text-[11px] font-black uppercase tracking-[0.22em] text-black hover:bg-amber-400 transition"
              >
                Request a private briefing <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}

        <div className="mt-14 flex items-center justify-center gap-3 text-white/30">
          <Shield className="h-4 w-4" />
          <p className="text-xs uppercase tracking-wider">Events registry updated from institutional index</p>
        </div>
      </div>
    </section>
  );
}

function EventCard({ event }: { event: EventItem }) {
  const Icon = event.mode === "online" ? Video : event.mode === "hybrid" ? Users : MapPin;

  const statusConfig = {
    open: { label: "Open", dot: "bg-emerald-400", text: "text-emerald-300", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
    limited: { label: "Limited", dot: "bg-amber-400", text: "text-amber-300", bg: "bg-amber-500/10", border: "border-amber-500/20" },
    full: { label: "Full", dot: "bg-red-400", text: "text-red-300", bg: "bg-red-500/10", border: "border-red-500/20" },
    past: { label: "Past", dot: "bg-zinc-500", text: "text-zinc-400", bg: "bg-zinc-500/10", border: "border-zinc-500/20" },
  } as const;

  const status = statusConfig[(event.status || "open") as keyof typeof statusConfig];

  return (
    <Link
      href={`/events/${event.slug}`}
      className="group relative block h-full overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-transparent p-1 transition-all duration-500 hover:border-amber-500/30"
    >
      <div className="relative h-full bg-black/90 backdrop-blur-sm rounded-[22px] p-8 flex flex-col">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
            <Calendar className="h-3.5 w-3.5 text-amber-500/70" />
            <span className="text-[10px] font-semibold text-white/60 uppercase tracking-wider">
              {formatDateGB(event.date)}
            </span>
          </div>

          <div className={`flex items-center gap-2 rounded-full border ${status.border} ${status.bg} px-3 py-1.5`}>
            <div className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
            <span className={`text-[10px] font-bold ${status.text} uppercase tracking-wider`}>{status.label}</span>
          </div>
        </div>

        <h3 className="font-serif text-2xl text-white/90 group-hover:text-white leading-tight transition-colors mb-4">
          {event.title}
        </h3>

        {event.excerpt ? (
          <p className="text-sm text-white/45 leading-relaxed mb-6 line-clamp-2">{event.excerpt}</p>
        ) : null}

        <div className="flex-grow" />

        <div className="space-y-3 pt-6 border-t border-white/5">
          <div className="flex items-center gap-3 text-white/45">
            <Icon className="h-4 w-4 text-amber-500/50" />
            <span className="text-xs uppercase tracking-wider">
              {event.mode === "online" ? "Virtual Session" : event.mode === "hybrid" ? "Hybrid Event" : event.location}
            </span>
          </div>

          {event.duration ? (
            <div className="flex items-center gap-3 text-white/45">
              <Clock className="h-4 w-4 text-amber-500/50" />
              <span className="text-xs uppercase tracking-wider">{event.duration}</span>
            </div>
          ) : null}

          {typeof event.capacity === "number" ? (
            <div className="flex items-center gap-3 text-white/45">
              <Users className="h-4 w-4 text-amber-500/50" />
              <span className="text-xs uppercase tracking-wider">Limited to {event.capacity} participants</span>
            </div>
          ) : null}
        </div>

        <div className="mt-8 inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.25em] text-white/55 group-hover:text-amber-400 transition-colors">
          View Details
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
}