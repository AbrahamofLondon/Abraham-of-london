// components/homepage/EventsSection.tsx — EMBEDDABLE + COMPACT (12/10)
// Fixes: "Expected '{', got 'ident'" (caused by incomplete/garbled file)
// Adds: embedded/compact mode so it doesn't take over the homepage.

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

export type EventsSectionProps = {
  events?: EventItem[];
  /** embedded=true: no outer background/padding/max-width wrapper */
  embedded?: boolean;
  /** max cards shown (default 3) */
  limit?: number;
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

export default function EventsSection({ events, embedded = true, limit = 3 }: EventsSectionProps) {
  const safeEvents = Array.isArray(events) ? events : [];

  const normalized = safeEvents
    .filter(Boolean)
    .map((e) => ({ ...e, status: deriveStatus(e) }));

  const upcomingEvents = normalized
    .filter((e) => e.status !== "past")
    .sort((a, b) => Date.parse(a.date) - Date.parse(b.date))
    .slice(0, Math.max(1, limit));

  const Wrap: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    if (embedded) return <>{children}</>;
    return (
      <section className="relative bg-black py-20 sm:py-24 lg:py-28 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,black_100%)]" />
        </div>
        <div className="pointer-events-none absolute right-[-300px] top-[-300px] h-[800px] w-[800px] rounded-full bg-amber-500/8 blur-[200px]" />
        <div className="pointer-events-none absolute left-[-200px] bottom-[-200px] h-[600px] w-[600px] rounded-full bg-blue-500/5 blur-[180px]" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
      </section>
    );
  };

  return (
    <Wrap>
      {/* Header (compact when embedded) */}
      <div className={["flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between", embedded ? "mb-8" : "mb-12"].join(" ")}>
        <div className="max-w-2xl">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-2 w-2 rounded-full bg-amber-500 shadow-[0_0_18px_rgba(245,158,11,0.35)]" />
            <span className="text-[10px] font-black uppercase tracking-[0.35em] text-amber-500/75">
              Live Engagement Protocol
            </span>
          </div>

          <h2 className={["font-serif text-white leading-[1.05] tracking-tight", embedded ? "text-3xl md:text-4xl" : "text-4xl sm:text-5xl md:text-6xl"].join(" ")}>
            Upcoming <span className="italic text-amber-200/85">Gatherings</span>
          </h2>

          <p className={["mt-4 leading-relaxed text-white/65", embedded ? "text-sm" : "text-base sm:text-lg"].join(" ")}>
            Structured sessions and strategic briefings. No theatrics — only operational intelligence for leaders who execute.
          </p>
        </div>

        <Link
          href="/events"
          className={["group inline-flex items-center gap-3 rounded-full border px-7 py-3.5 text-[10px] font-black uppercase tracking-[0.28em] transition-all duration-300",
            "border-white/12 bg-white/[0.04] text-white hover:border-amber-500/30 hover:bg-amber-500/6",
          ].join(" ")}
        >
          Full Calendar
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      {/* Content */}
      {upcomingEvents.length ? (
        <div className={["grid gap-5", embedded ? "lg:grid-cols-3" : "lg:grid-cols-3 gap-8"].join(" ")}>
          {upcomingEvents.map((event) => (
            <EventCard key={event.slug} event={event} compact={embedded} />
          ))}
        </div>
      ) : (
        <div className={["rounded-3xl border border-white/12 bg-white/[0.04] text-center", embedded ? "p-8" : "p-10"].join(" ")}>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.35em] text-amber-300/85">
            Calendar standby
          </p>
          <h3 className="mt-4 font-serif text-2xl text-white/90">No public sessions published yet.</h3>
          <p className="mt-3 text-sm text-white/65 max-w-xl mx-auto">
            When events are announced, this section updates automatically from the events registry.
          </p>
          <div className="mt-6">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-500 px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.22em] text-black hover:bg-amber-400 transition"
            >
              Request a private briefing <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}

      <div className={["mt-10 flex items-center justify-center gap-3 text-white/35", embedded ? "text-[11px]" : "text-xs"].join(" ")}>
        <Shield className="h-4 w-4" />
        <p className="uppercase tracking-wider">Events registry updated from institutional index</p>
      </div>
    </Wrap>
  );
}

function EventCard({ event, compact }: { event: EventItem; compact: boolean }) {
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
      className="group relative block h-full overflow-hidden rounded-3xl border border-white/12 bg-gradient-to-br from-white/[0.05] to-transparent p-1 transition-all duration-500 hover:border-amber-500/35"
    >
      <div className={["relative h-full bg-black/85 backdrop-blur-sm rounded-[22px] flex flex-col", compact ? "p-6" : "p-8"].join(" ")}>
        <div className={["flex flex-wrap items-center gap-3", compact ? "mb-5" : "mb-6"].join(" ")}>
          <div className="flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-3 py-1.5">
            <Calendar className="h-3.5 w-3.5 text-amber-500/80" />
            <span className="text-[10px] font-semibold text-white/70 uppercase tracking-wider">
              {formatDateGB(event.date)}
            </span>
          </div>

          <div className={`flex items-center gap-2 rounded-full border ${status.border} ${status.bg} px-3 py-1.5`}>
            <div className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
            <span className={`text-[10px] font-bold ${status.text} uppercase tracking-wider`}>{status.label}</span>
          </div>
        </div>

        <h3 className={["font-serif text-white/95 group-hover:text-white leading-tight transition-colors", compact ? "text-xl" : "text-2xl"].join(" ")}>
          {event.title}
        </h3>

        {event.excerpt ? (
          <p className={["text-white/65 leading-relaxed mt-3 line-clamp-2", compact ? "text-sm" : "text-sm"].join(" ")}>
            {event.excerpt}
          </p>
        ) : null}

        <div className="flex-grow" />

        <div className={["space-y-3 pt-5 border-t border-white/8", compact ? "mt-5" : "mt-6"].join(" ")}>
          <div className="flex items-center gap-3 text-white/55">
            <Icon className="h-4 w-4 text-amber-500/60" />
            <span className="text-[11px] uppercase tracking-wider">
              {event.mode === "online" ? "Virtual Session" : event.mode === "hybrid" ? "Hybrid Event" : event.location}
            </span>
          </div>

          {event.duration ? (
            <div className="flex items-center gap-3 text-white/55">
              <Clock className="h-4 w-4 text-amber-500/60" />
              <span className="text-[11px] uppercase tracking-wider">{event.duration}</span>
            </div>
          ) : null}

          {typeof event.capacity === "number" ? (
            <div className="flex items-center gap-3 text-white/55">
              <Users className="h-4 w-4 text-amber-500/60" />
              <span className="text-[11px] uppercase tracking-wider">Limited to {event.capacity} participants</span>
            </div>
          ) : null}
        </div>

        <div className={["inline-flex items-center gap-2 font-black uppercase tracking-[0.25em] text-white/65 group-hover:text-amber-300 transition-colors", compact ? "mt-6 text-[10px]" : "mt-8 text-[11px]"].join(" ")}>
          View Details
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
}