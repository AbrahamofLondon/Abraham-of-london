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
  capacity?: number | null;
  duration?: string | null;
  status?: "open" | "limited" | "full" | "past" | null;
};

export type EventsSectionProps = {
  events?: EventItem[];
  embedded?: boolean;
  limit?: number;
};

function isValidDate(value: string): boolean {
  const t = Date.parse(value);
  return Number.isFinite(t);
}

function deriveStatus(event: EventItem): "open" | "limited" | "full" | "past" {
  const explicit = String(event.status || "").toLowerCase();
  if (["open", "limited", "full", "past"].includes(explicit)) return explicit as any;

  if (!isValidDate(event.date)) return "open";

  const t = Date.parse(event.date);
  const d = new Date(t);
  // Set to 23:59:59 to keep "Today's" events active
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
      <section className="relative bg-black py-20 lg:py-28 overflow-hidden border-b border-white/5">
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">{children}</div>
      </section>
    );
  };

  return (
    <Wrap>
      <div className={["flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between", embedded ? "mb-8" : "mb-16"].join(" ")}>
        <div className="max-w-2xl">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-[0.4em] text-amber-500/80">
              Live Engagement Protocol
            </span>
          </div>
          <h2 className={["font-serif text-white tracking-tight", embedded ? "text-3xl md:text-5xl" : "text-5xl md:text-7xl"].join(" ")}>
            Upcoming <span className="italic text-zinc-500 not-italic">Gatherings.</span>
          </h2>
        </div>

        <Link
          href="/events"
          className="group inline-flex items-center gap-3 border border-white/10 bg-white/5 px-8 py-4 text-[10px] font-bold font-mono uppercase tracking-[0.2em] text-white hover:bg-white hover:text-black transition-all"
        >
          Full Registry
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {upcomingEvents.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/10 border border-white/10">
          {upcomingEvents.map((event) => (
            <EventCard key={event.slug} event={event} />
          ))}
        </div>
      ) : (
        <div className="border border-dashed border-white/10 p-20 text-center">
          <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-600">No Active Briefings Scheduled</p>
        </div>
      )}
    </Wrap>
  );
}

function EventCard({ event }: { event: EventItem }) {
  const Icon = event.mode === "online" ? Video : event.mode === "hybrid" ? Users : MapPin;
  const isPrivate = event.status === "limited" || event.status === "full";

  return (
    <Link href={`/events/${event.slug}`} className="group relative bg-black p-10 flex flex-col min-h-[380px] hover:bg-zinc-950 transition-colors">
      <div className="flex justify-between items-start mb-10">
        <div className="space-y-1">
          <span className="block font-mono text-[10px] text-amber-500 font-bold uppercase tracking-tighter">
            {formatDateGB(event.date)}
          </span>
          <div className="flex items-center gap-2 text-zinc-500">
            <Icon className="h-3 w-3" />
            <span className="text-[9px] font-mono uppercase tracking-widest">{event.location || event.mode}</span>
          </div>
        </div>
        {isPrivate && (
          <div className="border border-red-500/30 px-2 py-0.5 text-[8px] font-mono text-red-500 uppercase">Limited Access</div>
        )}
      </div>

      <h3 className="font-serif text-3xl text-white group-hover:text-amber-50 leading-tight mb-6">
        {event.title}
      </h3>
      
      <p className="text-zinc-500 text-sm leading-relaxed line-clamp-3 font-light mb-auto">
        {event.excerpt}
      </p>

      <div className="mt-12 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
        <span className="text-[9px] font-mono uppercase tracking-widest text-amber-500">Access Details →</span>
        <Shield className="h-4 w-4 text-zinc-800" />
      </div>
    </Link>
  );
}