"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Briefcase, Crown, Users, ShieldCheck } from "lucide-react";

const GOLD = "#C9A96E";
const CARD = "rgb(5 5 7)";
const LIFT = "rgb(10 14 20)";

type BuyerCard = {
  title: string;
  body: string;
  signal: string;
  icon: React.ComponentType<{ style?: React.CSSProperties; className?: string }>;
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

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-5 w-px" style={{ backgroundColor: `${GOLD}55` }} />
      <span
        style={{
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontSize: "8.5px",
          letterSpacing: "0.40em",
          textTransform: "uppercase",
          color: `${GOLD}BF`,
        }}
      >
        {children}
      </span>
    </div>
  );
}

export default function ExecutiveBuyerFitSection() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_0.9fr]">
      <motion.div
        initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.65 }}
      >
        <Eyebrow>Operator fit</Eyebrow>

        <h2
          style={{
            marginTop: "1.75rem",
            maxWidth: "13ch",
            fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
            fontWeight: 300,
            fontSize: "clamp(2.2rem, 4vw, 4rem)",
            lineHeight: 0.95,
            letterSpacing: "-0.03em",
            color: "rgba(255,255,255,0.94)",
          }}
        >
          Built for operators who feel the cost of ambiguity.
        </h2>

        <p
          style={{
            marginTop: "1.25rem",
            maxWidth: "48ch",
            fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
            fontWeight: 300,
            fontSize: "1rem",
            lineHeight: 1.75,
            color: "rgba(255,255,255,0.42)",
          }}
        >
          This system is not for casual curiosity. It is for leaders and
          institutions where friction, drift, mistrust, and structural exposure
          already have consequences.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/diagnostics/executive-reporting"
            className="group inline-flex items-center gap-2 transition-all duration-300"
            style={{
              padding: "12px 22px",
              border: `1px solid ${GOLD}42`,
              backgroundColor: `${GOLD}0E`,
              color: GOLD,
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "8.5px",
              letterSpacing: "0.28em",
              textTransform: "uppercase",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.borderColor = `${GOLD}65`;
              el.style.backgroundColor = `${GOLD}16`;
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.borderColor = `${GOLD}42`;
              el.style.backgroundColor = `${GOLD}0E`;
            }}
          >
            Executive Reporting
            <ArrowRight
              style={{ width: "13px", height: "13px" }}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </Link>

          <Link
            href="/strategy-room"
            className="inline-flex items-center gap-2 transition-all duration-300"
            style={{
              padding: "12px 22px",
              border: "1px solid rgba(255,255,255,0.09)",
              backgroundColor: "rgba(255,255,255,0.02)",
              color: "rgba(255,255,255,0.50)",
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "8.5px",
              letterSpacing: "0.28em",
              textTransform: "uppercase",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.borderColor = "rgba(255,255,255,0.18)";
              el.style.color = "rgba(255,255,255,0.75)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.borderColor = "rgba(255,255,255,0.09)";
              el.style.color = "rgba(255,255,255,0.50)";
            }}
          >
            Strategy Room
            <Briefcase style={{ width: "13px", height: "13px" }} />
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
              style={{
                border: "1px solid rgba(255,255,255,0.07)",
                backgroundColor: "rgba(255,255,255,0.018)",
                padding: "1.5rem",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.borderColor = `${GOLD}18`;
                el.style.backgroundColor = "rgba(255,255,255,0.028)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.borderColor = "rgba(255,255,255,0.07)";
                el.style.backgroundColor = "rgba(255,255,255,0.018)";
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <Icon style={{ width: "18px", height: "18px", color: `${GOLD}AA` }} />

                <span
                  style={{
                    padding: "3px 10px",
                    border: "1px solid rgba(255,255,255,0.08)",
                    backgroundColor: "rgba(255,255,255,0.03)",
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "7px",
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.45)",
                    flexShrink: 0,
                  }}
                >
                  {item.signal}
                </span>
              </div>

              <h3
                style={{
                  marginTop: "1.25rem",
                  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                  fontWeight: 300,
                  fontSize: "1.35rem",
                  lineHeight: 1.1,
                  letterSpacing: "-0.018em",
                  color: "rgba(255,255,255,0.88)",
                }}
              >
                {item.title}
              </h3>

              <p
                style={{
                  marginTop: "0.65rem",
                  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                  fontWeight: 300,
                  fontSize: "0.95rem",
                  lineHeight: 1.68,
                  color: "rgba(255,255,255,0.45)",
                }}
              >
                {item.body}
              </p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
