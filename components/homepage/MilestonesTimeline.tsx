import React from "react";
import { motion, useReducedMotion } from "framer-motion";

type Milestone = { year: number; title: string; detail: string };

const data: Milestone[] = [
  { year: 2022, title: "DADx Talk", detail: "Shared ideas on fatherhood and legacy." },
  { year: 2026, title: "Best-selling Book", detail: "Broad international readership established." },
  { year: 2027, title: "Leadership Award", detail: "Recognized for strategic impact." },
];

export default function MilestonesTimeline() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="py-16 px-4" aria-label="Milestones">
      <div className="container mx-auto max-w-4xl">
        {/* white surface for readability */}
        <div className="bg-white text-deepCharcoal rounded-3xl shadow-2xl ring-1 ring-black/5 p-8 md:p-12">
          <motion.h2
            className="text-3xl md:text-4xl font-serif font-bold text-center mb-8"
            initial={prefersReducedMotion ? undefined : { opacity: 0, y: 12 }}
            whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Milestones
          </motion.h2>

          <ol className="relative border-l border-gray-200 pl-6">
            {data.map((m, i) => (
              <motion.li
                key={`${m.year}-${m.title}`}
                className="mb-8 ml-2"
                initial={prefersReducedMotion ? undefined : { opacity: 0, x: -12 }}
                whileInView={prefersReducedMotion ? undefined : { opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.4, delay: prefersReducedMotion ? 0 : i * 0.06 }}
              >
                <span className="absolute -left-3 top-1.5 h-3 w-3 rounded-full bg-forest ring-4 ring-forest/20" />
                <div className="text-forest text-sm font-semibold">{m.year}</div>
                <h3 className="text-xl font-semibold mt-1">{m.title}</h3>
                <p className="text-deepCharcoal/80 mt-1">{m.detail}</p>
              </motion.li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
