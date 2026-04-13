/* components/homepage/EventsSection.tsx
   Design: Institutional Monumentalism — sharp panels, softGold, correct weights

   Previous version had:
   - animate-pulse dot + "Live Engagement Protocol" — performed urgency
   - font-bold throughout — platform uses weight 300 / regular
   - italic text-zinc-500 not-italic on "Gatherings" — contradictory classes
   - hover:bg-white hover:text-black CTA — filled white, never correct
   - text-zinc-600/500 token system — wrong
   - "No Active Briefings Scheduled" — bureaucratic empty state
   - "Access Details →" opacity-0 hover reveal — decorative theatre
   - Shield icon in card footer — unexplained decoration

   Rebuilt: Events presented as what they are. Sharp card system.
   The content is the signal.
*/

import * as React from "react";
import Link from "next/link";
import { ArrowRight, MapPin, Video, Users, ChevronRight } from "lucide-react";

const GOLD = "#C9A96E";

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
  return Number.isFinite(Date.parse(value));
}

function deriveStatus(event: EventItem): "open" | "limited" | "full" | "past" {
  const explicit = String(event.status || "").toLowerCase();
  if (["open", "limited", "full", "past"].includes(explicit)) return explicit as "open" | "limited" | "full" | "past";
  if (!isValidDate(event.date)) return "open";
  const d = new Date(Date.parse(event.date));
  const endOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
  return endOfDay.getTime() < Date.now() ? "past" : "open";
}

function formatDateGB(value: string): string {
  if (!isValidDate(value)) return "Date TBC";
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function EventsSection({ events, embedded = true, limit = 3 }: EventsSectionProps) {
  const safeEvents = Array.isArray(events) ? events : [];

  const upcomingEvents = safeEvents
    .filter(Boolean)
    .map((e) => ({ ...e, status: deriveStatus(e) }))
    .filter((e) => e.status !== "past")
    .sort((a, b) => Date.parse(a.date) - Date.parse(b.date))
    .slice(0, Math.max(1, limit));

  const inner = (
    <>
      {/* Header */}
      <div className={["flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between", embedded ? "mb-8" : "mb-14"].join(" ")}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.85rem" }}>
            <span style={{ width: "1px", height: "20px", backgroundColor: `${GOLD}55` }} />
            <span style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "8.5px", letterSpacing: "0.40em", textTransform: "uppercase",
              color: `${GOLD}BF`,
            }}>
              Events
            </span>
          </div>
          <h2 style={{
            fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
            fontWeight: 300, fontSize: "clamp(1.8rem, 3vw, 2.8rem)",
            lineHeight: 1.0, letterSpacing: "-0.025em",
            color: "rgba(255,255,255,0.90)",
          }}>
            Upcoming gatherings.
          </h2>
        </div>

        <Link
          href="/events"
          className="group inline-flex items-center gap-2 transition-all duration-300"
          style={{
            padding: "11px 20px",
            border: `1px solid ${GOLD}38`,
            backgroundColor: `${GOLD}0A`,
            color: GOLD,
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontSize: "8px", letterSpacing: "0.28em", textTransform: "uppercase",
            flexShrink: 0,
          }}
          onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = `${GOLD}58`; el.style.backgroundColor = `${GOLD}12`; }}
          onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = `${GOLD}38`; el.style.backgroundColor = `${GOLD}0A`; }}
        >
          All events
          <ArrowRight style={{ width: "11px", height: "11px" }} className="transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* Cards */}
      {upcomingEvents.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
          {upcomingEvents.map((event, i) => (
            <EventCard key={event.slug} event={event} borderRight={i < upcomingEvents.length - 1} />
          ))}
        </div>
      ) : (
        <div style={{
          border: "1px solid rgba(255,255,255,0.06)",
          padding: "4rem 2rem",
          textAlign: "center",
          backgroundColor: "rgba(255,255,255,0.012)",
        }}>
          <p style={{
            fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
            fontWeight: 300, fontSize: "1.05rem",
            color: "rgba(255,255,255,0.28)",
          }}>
            No events currently scheduled.
          </p>
          <p style={{
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontSize: "7.5px", letterSpacing: "0.28em", textTransform: "uppercase",
            color: "rgba(255,255,255,0.16)", marginTop: "0.75rem",
          }}>
            Check back soon or browse past sessions.
          </p>
        </div>
      )}
    </>
  );

  if (embedded) return <div>{inner}</div>;

  return (
    <section style={{ backgroundColor: "rgb(3 3 5)", padding: "5rem 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">{inner}</div>
    </section>
  );
}

function EventCard({ event, borderRight }: { event: EventItem & { status: string }; borderRight?: boolean }) {
  const ModeIcon = event.mode === "online" ? Video : event.mode === "hybrid" ? Users : MapPin;
  const isLimited = event.status === "limited" || event.status === "full";

  return (
    <Link
      href={`/events/${event.slug}`}
      className="group block transition-colors duration-300"
      style={{ backgroundColor: "rgb(5 5 7)", borderRight: borderRight ? "1px solid rgba(255,255,255,0.07)" : "none" }}
      onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "rgb(7 7 11)"}
      onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "rgb(5 5 7)"}
    >
      {/* Gold thread on hover */}
      <div
        className="h-px opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: `linear-gradient(to right, transparent, ${GOLD}28, transparent)` }}
      />

      <div style={{ padding: "2rem", display: "flex", flexDirection: "column", minHeight: "320px" }}>

        {/* Meta row */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.75rem" }}>
          <div>
            <div style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "8px", letterSpacing: "0.28em", textTransform: "uppercase",
              color: `${GOLD}AA`, marginBottom: "0.35rem",
            }}>
              {formatDateGB(event.date)}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <ModeIcon style={{ width: "11px", height: "11px", color: "rgba(255,255,255,0.25)" }} />
              <span style={{
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "7px", letterSpacing: "0.24em", textTransform: "uppercase",
                color: "rgba(255,255,255,0.28)",
              }}>
                {event.location || event.mode}
              </span>
            </div>
          </div>

          {isLimited && (
            <div style={{
              padding: "3px 9px",
              border: "1px solid rgba(252,165,165,0.22)",
              backgroundColor: "rgba(252,165,165,0.04)",
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "6.5px", letterSpacing: "0.24em", textTransform: "uppercase",
              color: "rgba(252,165,165,0.70)",
              flexShrink: 0,
            }}>
              {event.status === "full" ? "Full" : "Limited"}
            </div>
          )}
        </div>

        {/* Title */}
        <h3
          className="transition-colors duration-300 group-hover:[color:rgba(255,255,255,1)]"
          style={{
            fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
            fontWeight: 300, fontSize: "clamp(1.2rem, 1.8vw, 1.55rem)",
            lineHeight: 1.10, letterSpacing: "-0.020em",
            color: "rgba(255,255,255,0.84)",
            marginBottom: "0.85rem",
          }}
        >
          {event.title}
        </h3>

        {/* Excerpt */}
        {event.excerpt && (
          <p style={{
            fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
            fontWeight: 300, fontSize: "0.92rem", lineHeight: 1.65,
            color: "rgba(255,255,255,0.38)",
            overflow: "hidden", display: "-webkit-box",
            WebkitLineClamp: 3, WebkitBoxOrient: "vertical" as const,
            marginBottom: "auto",
          }}>
            {event.excerpt}
          </p>
        )}

        {/* Footer CTA */}
        <div style={{
          marginTop: "1.75rem", paddingTop: "1.25rem",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          display: "flex", alignItems: "center", gap: "0.4rem",
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontSize: "7.5px", letterSpacing: "0.26em", textTransform: "uppercase",
          color: "rgba(255,255,255,0.20)",
        }}>
          <span className="transition-colors duration-300 group-hover:[color:rgba(201,169,110,0.75)]">View details</span>
          <ChevronRight style={{ width: "10px", height: "10px" }} className="transition-colors duration-300 group-hover:[color:rgba(201,169,110,0.75)]" />
        </div>
      </div>
    </Link>
  );
}