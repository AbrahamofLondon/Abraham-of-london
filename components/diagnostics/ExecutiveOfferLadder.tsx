"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Crown } from "lucide-react";

type Offer = {
  title: string;
  label: string;
  price: string;
  body: string;
  bullets: string[];
  href: string;
  emphasis?: boolean;
};

export default function ExecutiveOfferLadder({
  offers,
}: {
  offers: Offer[];
}) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {offers.map((item, index) => (
        <motion.article
          key={`${item.title}-${item.href}`}
          initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: index * 0.08 }}
          className={[
            "relative overflow-hidden border p-8 transition-all duration-500",
            item.emphasis
              ? "border-amber-500/24 bg-amber-500/[0.03] hover:border-amber-500/42 hover:bg-amber-500/[0.05]"
              : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.03]",
          ].join(" ")}
        >
          {item.emphasis ? (
            <div className="absolute right-6 top-6 flex items-center gap-2 border border-amber-500/20 bg-amber-500/[0.06] px-3 py-1">
              <Crown className="h-3.5 w-3.5 text-amber-400/76" />
              <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-amber-300/76">
                Flagship
              </span>
            </div>
          ) : null}

          <div className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/36">
            {item.label}
          </div>

          <h3 className="mt-5 font-serif text-3xl text-white">{item.title}</h3>

          <div className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-amber-300/76">
            {item.price}
          </div>

          <p className="mt-5 text-sm leading-relaxed text-white/50">
            {item.body}
          </p>

          <div className="mt-7 space-y-3">
            {item.bullets.map((bullet) => (
              <div key={bullet} className="flex items-start gap-3">
                <span className="mt-[7px] h-[5px] w-[5px] rounded-full bg-amber-400/70" />
                <span className="text-sm text-white/58">{bullet}</span>
              </div>
            ))}
          </div>

          <Link
            href={item.href}
            className="group mt-8 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-amber-400/70 transition-colors hover:text-amber-300"
          >
            <span>Open pathway</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.article>
      ))}
    </div>
  );
}