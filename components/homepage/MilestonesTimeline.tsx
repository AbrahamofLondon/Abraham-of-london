"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";

export type Milestone = {
  year: number;
  title: string;
  detail?: string;
  href?: string; // optional "learn more" link
};

type Props = {
  items?: Milestone[];
  title?: string;
  ariaLabel?: string;
  variant?: "light" | "dark";
  className?: string;
};

const DEFAULT_ITEMS: Milestone[] = [
  { year: 2022, title: "DADx Talk", detail: "Shared ideas on fatherhood and legacy." },
  { year: 2026, title: "Best-selling Book", detail: "Broad international readership established." },
  { year: 2027, title: "Leadership Award", detail: "Recognized for strategic impact." },
];

export default function MilestonesTimeline({
  items,
  title = "Milestones",
  ariaLabel,
  variant = "light",
  className = "",
}: Props) {
  const reduce = useReducedMotion();
  const headingId = React.useId();

  // Defensive copy + ascending sort by year
  const data = React.useMemo(() => {
    const arr = (items && items.length ? items : DEFAULT_ITEMS).slice();
    arr.sort((a, b) => a.year - b.year);
    return arr;
  }, [items]);

  const surface =
    variant === "dark"
      ? "bg-white/10 text-cream border border-white/10 backdrop-blur"
      : "bg-white text-deepCharcoal ring-1 ring-black/5";

  const subText =
    variant === "dark"
      ? "text-[color:var(--color-on-primary)/0.8]"
      : "text-[color:var(--color-on-secondary)/0.8]";

  return (
    <section
      className={`px-4 py-16 ${className}`}
      aria-label={ariaLabel || title}
      aria-labelledby={headingId}
    >
      <div className="container mx-auto max-w-4xl">
        <div className={`rounded-3xl p-8 shadow-2xl md:p-12 ${surface}`}>
          <motion.h2
            id={headingId}
            className="text-center font-serif text-3xl font-bold md:text-4xl"
            initial={reduce ? undefined : { opacity: 0, y: 12 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={reduce ? undefined : { duration: 0.5 }}
          >
            {title}
          </motion.h2>

          {data.length === 0 ? (
            <p className={`mt-6 text-center ${subText}`}>No milestones to display (yet!).</p>
          ) : (
            <ol className="relative mt-10 border-l border-gray-200 pl-6 dark:border-white/15">
              {data.map((m, i) => (
                <motion.li
                  key={`${m.year}-${m.title}-${i}`}
                  className="mb-8 ml-2"
                  initial={reduce ? undefined : { opacity: 0, x: -12 }}
                  whileInView={reduce ? undefined : { opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={reduce ? undefined : { duration: 0.4, delay: i * 0.06 }}
                >
                  <span
                    aria-hidden
                    className="absolute -left-3 top-1.5 h-3 w-3 rounded-full bg-forest ring-4 ring-[color:var(--color-primary)/0.2]"
                  />
                  <div className="text-sm font-semibold text-forest">
                    <time dateTime={String(m.year)}>{m.year}</time>
                  </div>
                  <h3 className="mt-1 text-xl font-semibold">{m.title}</h3>
                  {m.detail && <p className={`mt-1 ${subText}`}>{m.detail}</p>}
                  {m.href && (
                    <a
                      href={m.href}
                      target={/^https?:\/\//i.test(m.href) ? "_blank" : undefined}
                      rel={/^https?:\/\//i.test(m.href) ? "noopener noreferrer" : undefined}
                      className="mt-3 inline-flex items-center text-sm text-forest underline underline-offset-4 hover:no-underline"
                    >
                      Learn more
                    </a>
                  )}
                </motion.li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </section>
  );
}
