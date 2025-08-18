import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import clsx from "clsx";

type EventItem = { date: string; title: string; location: string; href?: string };
type Props = { variant?: "light" | "dark" };

const events: EventItem[] = [
  { date: "2026-09-12", title: "Leadership Workshop", location: "London, UK", href: "/events/leadership-workshop" },
  { date: "2026-11-11", title: "Fathers & Futures Panel", location: "Online", href: "/events/fathers-and-futures" },
];

export default function EventsSection({ variant = "light" }: Props) {
  const hasEvents = events.length > 0;
  const headingClass = clsx(
    "text-3xl md:text-4xl font-bold text-center mb-8",
    variant === "dark" ? "text-cream" : "text-gray-900"
  );
  const cardClass = clsx(
    "rounded-2xl p-6 shadow-card",
    variant === "dark"
      ? "border border-white/10 bg-white/10 backdrop-blur text-cream"
      : "border border-black/10 bg-white text-gray-900"
  );
  const sectionClass = clsx("container px-4 py-16", variant === "dark" ? "" : "");

  return (
    <section className={sectionClass}>
      <motion.h2
        className={headingClass}
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        Upcoming Events
      </motion.h2>

      {!hasEvents ? (
        <p className={clsx("text-center", variant === "dark" ? "text-cream/80" : "text-gray-600")}>
          No upcoming events scheduled at this time. Please check back later!
        </p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {events.map((ev, i) => (
            <motion.article
              key={ev.title + ev.date}
              className={cardClass}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.45, delay: i * 0.08 }}
            >
              <div className={clsx("text-sm", variant === "dark" ? "text-cream/80" : "text-gray-600")}>
                {new Date(ev.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
              </div>
              <h3 className="text-xl font-semibold mt-1">{ev.title}</h3>
              <p className={clsx("mt-1", variant === "dark" ? "text-cream/80" : "text-gray-700")}>{ev.location}</p>
              {ev.href && (
                <Link
                  href={ev.href}
                  className={clsx(
                    "inline-flex items-center mt-4 px-4 py-2 rounded-full transition",
                    variant === "dark" ? "bg-forest text-cream hover:bg-emerald-700" : "bg-forest text-cream hover:bg-forest/90"
                  )}
                >
                  Details
                </Link>
              )}
            </motion.article>
          ))}
        </div>
      )}
    </section>
  );
}
