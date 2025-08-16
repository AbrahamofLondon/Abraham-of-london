import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import clsx from "clsx";

type EventItem = {
  date: string; // ISO or readable
  title: string;
  location: string;
  href?: string;
};

// Hardcoded events for demonstration. In a real app, this would be fetched.
const events: EventItem[] = [
  {
    date: "2026-09-12",
    title: "Leadership Workshop",
    location: "London, UK",
    href: "/events/leadership-workshop",
  },
  {
    date: "2026-11-11",
    title: "Fathers & Futures Panel",
    location: "Online",
    href: "/events/fathers-and-futures",
  },
];

export default function EventsSection() {
  const hasEvents = events.length > 0;

  if (!hasEvents) {
    return (
      <section className="container px-4 py-16">
        <motion.h2
          className="text-3xl md:text-4xl font-bold text-cream text-center mb-8"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          Upcoming Events
        </motion.h2>
        <p className="text-center text-cream/70">No upcoming events scheduled at this time. Please check back later!</p>
      </section>
    );
  }

  return (
    <section className="container px-4 py-16">
      <motion.h2
        className="text-3xl md:text-4xl font-bold text-cream text-center mb-8"
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        Upcoming Events
      </motion.h2>

      <div className="grid gap-6 md:grid-cols-2">
        {events.map((ev, i) => (
          <motion.article
            key={ev.title + ev.date}
            className="rounded-2xl border border-white/10 bg-white/10 backdrop-blur p-6 text-cream shadow-card"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.45, delay: i * 0.08 }}
          >
            <div className="text-sm text-cream/80">
              {new Date(ev.date).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </div>
            <h3 className="text-xl font-semibold mt-1">{ev.title}</h3>
            <p className="text-cream/80 mt-1">{ev.location}</p>
            {ev.href && (
              <Link
                href={ev.href}
                className="inline-flex items-center mt-4 px-4 py-2 rounded-full bg-forest text-cream hover:bg-emerald-700 transition"
              >
                Details
              </Link>
            )}
          </motion.article>
        ))}
      </div>
    </section>
  );
}