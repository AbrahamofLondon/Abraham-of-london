// components/homepage/StrategicFunnelStrip.tsx
import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Briefcase,
  CalendarDays,
  Users,
  BookOpen,
  Wrench,
  ShieldCheck,
} from "lucide-react";

type IconType = React.ComponentType<{ className?: string }>;

type CardItem = {
  href: string;
  label: string;
  kicker: string;
  description: string;
  Icon: IconType;
};

const CARDS: readonly CardItem[] = [
  {
    href: "/consulting",
    label: "Consulting & Advisory",
    kicker: "Execution with accountability",
    description:
      "Board-level strategy for founders and senior leaders — designed to survive budgets, deadlines, and real consequences.",
    Icon: Briefcase,
  },
  {
    href: "/chatham-rooms",
    label: "The Chatham Rooms",
    kicker: "Closed rooms, plain truth",
    description:
      "Off-record conversations under Chatham House Rule — a rare place to speak plainly, think clearly, and sharpen judgment.",
    Icon: Users,
  },
  {
    href: "/events",
    label: "Events & Salons",
    kicker: "Public sessions, serious work",
    description:
      "Live rooms blending Scripture, history, and hard market reality — without performance or therapy-speak.",
    Icon: CalendarDays,
  },
] as const;

const itemAnim = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, delay: i * 0.08, ease: "easeOut" },
  }),
};

function Pill({
  Icon,
  label,
}: {
  Icon: IconType;
  label: string;
}): JSX.Element {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-charcoal/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-gold/80">
      <Icon className="h-3.5 w-3.5 text-gold/80" />
      {label}
    </span>
  );
}

export default function StrategicFunnelStrip(): JSX.Element {
  return (
    <section className="bg-gradient-to-b from-charcoal to-black/95 py-14">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <header className="mb-10 max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold/70">
            The framework
          </p>

          <h2 className="mt-3 font-serif text-2xl font-semibold text-cream sm:text-3xl">
            Principles → Tools → Rooms.
          </h2>

          <p className="mt-3 text-sm leading-relaxed text-gold/70 sm:text-base">
            The Canon sets first principles. The tools translate them into habits
            and operating systems. The rooms prove them under pressure — in the
            boardroom, the household, and the real world.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <Pill Icon={BookOpen} label="Canon: principles" />
            <Pill Icon={Wrench} label="Tools: operating systems" />
            <Pill Icon={ShieldCheck} label="Rooms: proof under pressure" />
          </div>
        </header>

        <div className="grid gap-6 md:grid-cols-3">
          {CARDS.map((card, index) => (
            <motion.article
              key={card.href}
              className="group relative rounded-2xl border border-gold/20 bg-charcoal/80 p-6 backdrop-blur transition-colors hover:border-gold/50 hover:bg-charcoal"
              variants={itemAnim}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.25 }}
              custom={index}
              whileHover={{ y: -4 }}
            >
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gold/10 text-gold ring-1 ring-gold/20">
                <card.Icon className="h-6 w-6" />
              </div>

              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold/70">
                {card.kicker}
              </p>

              <h3 className="mt-2 font-serif text-xl font-semibold text-cream">
                {card.label}
              </h3>

              <p className="mt-3 text-sm leading-relaxed text-gold/70">
                {card.description}
              </p>

              <div className="mt-5 flex items-center justify-between">
                <Link
                  href={card.href}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-gold transition-colors group-hover:text-amber-200"
                  aria-label={`Enter ${card.label}`}
                >
                  Enter
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gold/10 ring-1 ring-gold/20 transition-transform group-hover:translate-x-0.5">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>

                <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold/50">
                  Door {index + 1}
                </span>
              </div>

              <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 ring-1 ring-gold/25 transition-opacity group-hover:opacity-100" />
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}