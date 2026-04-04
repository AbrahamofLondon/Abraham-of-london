"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Briefcase, Crown, Users, ShieldCheck } from "lucide-react";

type BuyerCard = {
  title: string;
  body: string;
  signal: string;
  icon: React.ComponentType<any>;
};

const BUYERS: BuyerCard[] = [
  {
    title: "Founder-led businesses",
    body: "Best for firms moving into complexity faster than internal clarity can support.",
    signal: "Growth pressure",
    icon: Crown,
  },
  {
    title: "Leadership teams",
    body: "Useful where trust, coordination, and execution fit are no longer clean.",
    signal: "Operational drag",
    icon: Users,
  },
  {
    title: "Boards & senior operators",
    body: "Useful when the matter needs disciplined interpretation before formal intervention.",
    signal: "Governance exposure",
    icon: ShieldCheck,
  },
];

export default function ExecutiveBuyerFitSection() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative border-t border-white/5 py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <div className="grid gap-10 lg:grid-cols-[1fr_0.9fr]">
          <motion.div
            initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65 }}
          >
            <div className="inline-flex items-center gap-3">
              <span className="h-6 w-px bg-amber-500/30" />
              <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-amber-400/62">
                Buyer fit
              </span>
            </div>

            <h2 className="mt-7 max-w-[13ch] font-serif text-4xl text-white md:text-5xl">
              Built for buyers who feel the cost of ambiguity
            </h2>

            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/48">
              This product is not for casual curiosity. It is for leaders and
              institutions where friction, drift, mistrust, and structural
              exposure already have consequences.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/diagnostics/executive-reporting"
                className="inline-flex items-center gap-2 rounded-full border border-amber-500/35 bg-amber-500/12 px-5 py-3 text-[10px] font-mono uppercase tracking-[0.30em] text-amber-300 hover:bg-amber-500/18"
              >
                Product page <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                href="/consulting/strategy-room"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-5 py-3 text-[10px] font-mono uppercase tracking-[0.30em] text-white/85 hover:bg-white/[0.08]"
              >
                Strategy Room <Briefcase className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>

          <div className="grid gap-4">
            {BUYERS.map((item, index) => {
              const Icon = item.icon;

              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: reduceMotion ? 0 : 10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.55, delay: index * 0.08 }}
                  className="border border-white/[0.08] bg-white/[0.02] p-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <Icon className="h-5 w-5 text-amber-400/65" />
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 font-mono text-[8px] uppercase tracking-[0.2em] text-white/56">
                      {item.signal}
                    </span>
                  </div>

                  <h3 className="mt-5 font-serif text-2xl text-white">
                    {item.title}
                  </h3>

                  <p className="mt-3 text-sm leading-relaxed text-white/48">
                    {item.body}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}