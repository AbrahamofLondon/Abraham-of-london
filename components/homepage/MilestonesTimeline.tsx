import React from "react";
import { motion } from "framer-motion";

type Milestone = { year: number; title: string; detail: string };

const data: Milestone[] = [
  {
    year: 2022,
    title: "TEDx Talk",
    detail: "Shared ideas on fatherhood and legacy.",
  },
  {
    year: 2023,
    title: "Best-selling Book",
    detail: "Broad international readership established.",
  },
  {
    year: 2024,
    title: "Leadership Award",
    detail: "Recognized for strategic impact.",
  },
];

export default function MilestonesTimeline() {
  return (
    <section className="container px-4 py-16">
      <motion.h2
        className="text-3xl md:text-4xl font-bold text-cream text-center mb-10"
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        Milestones
      </motion.h2>

      <ol className="relative border-l border-cream/20 pl-6 max-w-3xl mx-auto">
        {data.map((m, i) => (
          <motion.li
            key={m.year}
            className="mb-8 ml-2"
            initial={{ opacity: 0, x: -12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.4, delay: i * 0.06 }}
          >
            <span className="absolute -left-3 top-1.5 h-3 w-3 rounded-full bg-softGold ring-4 ring-softGold/20" />
            <div className="text-emerald-700 text-sm font-semibold">
              {m.year}
            </div>
            <h3 className="text-xl text-cream font-semibold mt-1">{m.title}</h3>
            <p className="text-cream/80 mt-1">{m.detail}</p>
          </motion.li>
        ))}
      </ol>
    </section>
  );
}







