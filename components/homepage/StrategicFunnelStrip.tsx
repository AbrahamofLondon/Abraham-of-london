// components/homepage/StrategicFunnelStrip.tsx
import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Briefcase, Users, CalendarDays } from "lucide-react";

interface CardItem {
  href: string;
  label: string;
  kicker: string;
  description: string;
  Icon: React.ComponentType<{ className?: string }>;
}

const cards: CardItem[] = [
  {
    href: "/consulting",
    label: "Consulting & Advisory",
    kicker: "Board-level and founder strategy",
    description:
      "Structured, accountable advisory for founders, boards, and senior leaders who still carry consequence.",
    Icon: Briefcase,
  },
  {
    href: "/chatham-rooms",
    label: "The Chatham Rooms",
    kicker: "Off-record rooms for real talk",
    description:
      "Closed-door conversations under Chatham House Rule for leaders who need one room where they can speak plainly.",
    Icon: Users,
  },
  {
    href: "/events",
    label: "Events & Salons",
    kicker: "Gatherings, salons, and sessions",
    description:
      "Live rooms, salons, and curated sessions that blend Scripture, history, and hard market reality.",
    Icon: CalendarDays,
  },
];

export default function StrategicFunnelStrip(): JSX.Element {
  return (
    <section className="bg-gradient-to-b from-charcoal to-black/95 py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <header className="mb-8 max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold/70">
            Where to start
          </p>
          <h2 className="mt-3 font-serif text-2xl font-semibold text-cream sm:text-3xl">
            Three doors into the work.
          </h2>
          <p className="mt-3 text-sm text-gold/70 sm:text-base">
            Whether you need personal advisory, a closed room, or a public
            salon, everything is built around consequence, conviction, and
            long-term legitimacy.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-3">
          {cards.map((card, index) => (
            <motion.div
              key={card.href}
              className="group rounded-2xl border border-gold/20 bg-charcoal/80 p-6 backdrop-blur transition-all hover:border-gold/50 hover:bg-charcoal"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: index * 0.08 }}
              viewport={{ once: true }}
              whileHover={{ y: -4 }}
            >
              <card.Icon className="mb-4 h-8 w-8 text-gold" />
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold/70">
                {card.kicker}
              </p>
              <h3 className="mt-2 font-serif text-xl font-semibold text-cream">
                {card.label}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-gold/70">
                {card.description}
              </p>

              <div className="mt-5">
                <Link
                  href={card.href}
                  className="inline-flex items-center text-sm font-semibold text-gold transition-all group-hover:text-amber-200"
                >
                  Enter
                  <span className="ml-1 inline-block transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}