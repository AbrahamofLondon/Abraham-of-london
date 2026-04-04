"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, FileText, Crown, ShieldCheck } from "lucide-react";

type RouteCard = {
  title: string;
  body: string;
  href: string;
  cta: string;
  icon: React.ComponentType<any>;
  emphasis?: boolean;
};

const ROUTES: RouteCard[] = [
  {
    title: "Start with diagnostics",
    body:
      "For situations that still need disciplined reading before any advisory path is justified.",
    href: "/diagnostics",
    cta: "Open diagnostics",
    icon: ShieldCheck,
  },
  {
    title: "View executive reporting",
    body:
      "For buyers who already know the matter is serious and want a premium report before intervention.",
    href: "/diagnostics/executive-reporting",
    cta: "View flagship product",
    icon: FileText,
    emphasis: true,
  },
  {
    title: "Enter Strategy Room",
    body:
      "For matters where the consequence is already material and structured private intervention is warranted.",
    href: "/consulting/strategy-room",
    cta: "Request mandate review",
    icon: Crown,
  },
];

export default function StrategyRoomEntryRouter() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {ROUTES.map((item, index) => {
        const Icon = item.icon;

        return (
          <motion.article
            key={item.title}
            initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: index * 0.08 }}
            className={[
              "border p-8 transition-colors duration-500",
              item.emphasis
                ? "border-amber-500/24 bg-amber-500/[0.03]"
                : "border-white/[0.08] bg-white/[0.02]",
            ].join(" ")}
          >
            <div className="flex items-center justify-between gap-4">
              <Icon className="h-5 w-5 text-amber-400/68" />
              {item.emphasis ? (
                <span className="rounded-full border border-amber-500/20 bg-amber-500/[0.06] px-3 py-1 font-mono text-[8px] uppercase tracking-[0.2em] text-amber-300/74">
                  Best first serious move
                </span>
              ) : null}
            </div>

            <h3 className="mt-6 font-serif text-2xl text-white">
              {item.title}
            </h3>

            <p className="mt-4 text-sm leading-relaxed text-white/50">
              {item.body}
            </p>

            <Link
              href={item.href}
              className="group mt-8 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-amber-400/70 transition-colors hover:text-amber-300"
            >
              <span>{item.cta}</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.article>
        );
      })}
    </div>
  );
}