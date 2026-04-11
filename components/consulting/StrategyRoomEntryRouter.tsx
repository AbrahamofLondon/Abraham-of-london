"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, FileText, Crown, ShieldCheck } from "lucide-react";

const GOLD = "#C9A96E";
const LIFT = "rgb(10 14 20)";
const CARD = "rgb(5 5 7)";

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
    body: "For situations that still need disciplined reading before any advisory path is justified.",
    href: "/diagnostics",
    cta: "Open diagnostics",
    icon: ShieldCheck,
  },
  {
    title: "View executive reporting",
    body: "For buyers who already know the matter is serious and want a premium report before intervention.",
    href: "/diagnostics/executive-reporting",
    cta: "View flagship product",
    icon: FileText,
    emphasis: true,
  },
  {
    title: "Enter Strategy Room",
    body: "For matters where the consequence is already material and structured private intervention is warranted.",
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
            style={{
              border: item.emphasis
                ? `1px solid ${GOLD}22`
                : "1px solid rgba(255,255,255,0.08)",
              backgroundColor: item.emphasis ? `${GOLD}04` : LIFT,
              padding: "2rem",
            }}
          >
            <div className="flex items-center justify-between gap-4">
              <Icon className="h-5 w-5" style={{ color: `${GOLD}75` }} />
              {item.emphasis ? (
                <span
                  style={{
                    border: `1px solid ${GOLD}18`,
                    backgroundColor: `${GOLD}08`,
                    padding: "4px 10px",
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "8px",
                    letterSpacing: "0.20em",
                    textTransform: "uppercase",
                    color: `${GOLD}B8`,
                  }}
                >
                  Best first serious move
                </span>
              ) : null}
            </div>

            <h3
              style={{
                marginTop: "1.5rem",
                fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                fontWeight: 300,
                fontSize: "1.8rem",
                lineHeight: 1.05,
                color: "rgba(255,255,255,0.92)",
              }}
            >
              {item.title}
            </h3>

            <p
              style={{
                marginTop: "1rem",
                fontSize: "0.92rem",
                lineHeight: 1.75,
                color: "rgba(255,255,255,0.50)",
              }}
            >
              {item.body}
            </p>

            <Link
              href={item.href}
              className="group mt-8 inline-flex items-center gap-2 transition-colors"
              style={{
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "10px",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: `${GOLD}B0`,
              }}
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