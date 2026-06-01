/**
 * pages/test-your-decision.tsx — Single public decision-entry routing layer
 *
 * This is the primary public front door for users who want to test a decision.
 * It routes users to the correct decision surface based on need, urgency, and context.
 *
 * Does not replace or delete existing canonical routes.
 * Does not expose engine internals.
 * Does not add a generic dashboard.
 * Keeps this as a routing and clarity layer only.
 */

import React from "react";
import Head from "next/head";
import Link from "next/link";
import { ArrowRight, Zap, SlidersHorizontal, ScanSearch, Building2, Route } from "lucide-react";
import Layout from "@/components/Layout";

const GOLD = "#C9A96E";

const mono: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
};

const serif: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
  fontWeight: 300,
};

interface RouteCard {
  title: string;
  description: string;
  cta: string;
  href: string;
  icon: React.ReactNode;
  timeEstimate: string;
}

const ROUTE_CARDS: RouteCard[] = [
  {
    title: "Fast pressure reading",
    description:
      "For users who want a sharp 45-second signal on a decision they are avoiding, delaying, or struggling to land.",
    cta: "Start pressure signal",
    href: "/decision-pressure",
    icon: <Zap className="h-4 w-4" />,
    timeEstimate: "45 seconds",
  },
  {
    title: "Structured decision signal",
    description:
      "For users who want a more deliberate reading across pressure, consequence, evidence, and readiness.",
    cta: "Use structured signal",
    href: "/decision-instruments/signal",
    icon: <SlidersHorizontal className="h-4 w-4" />,
    timeEstimate: "2 minutes",
  },
  {
    title: "Full diagnostic entry",
    description:
      "For users ready to begin the governed product pathway and generate a fuller decision record.",
    cta: "Run diagnostic",
    href: "/diagnostics/fast",
    icon: <ScanSearch className="h-4 w-4" />,
    timeEstimate: "5 minutes",
  },
  {
    title: "Organisational scan",
    description:
      "For leaders, teams, boards, and operators dealing with unresolved organisational decisions or execution drift.",
    cta: "Run organisational scan",
    href: "/enterprise-decision-scan",
    icon: <Building2 className="h-4 w-4" />,
    timeEstimate: "15 minutes",
  },
];

export default function TestYourDecisionPage() {
  return (
    <Layout
      title="Test Your Decision | Abraham of London"
      description="Choose the right level of scrutiny for your decision. Start with a fast pressure reading, a structured signal, a full diagnostic, or an organisational scan."
      canonicalUrl="/test-your-decision"
      fullWidth
      headerTransparent
    >
      <Head>
        <meta
          name="description"
          content="Test a decision before you act on it. Choose the right level of scrutiny — from a 45-second pressure reading to a full organisational scan."
        />
        <meta property="og:title" content="Test Your Decision — Abraham of London" />
        <meta
          property="og:description"
          content="Test the decision before you act on it. Choose the right level of scrutiny."
        />
      </Head>

      <div style={{ backgroundColor: "rgb(3,3,5)", minHeight: "100vh", color: "white" }}>
        {/* Hero */}
        <section className="px-6 pb-8 pt-[128px] md:pt-36">
          <div className="mx-auto max-w-[760px] text-center">
            <p
              style={{
                ...mono,
                fontSize: "9px",
                letterSpacing: "0.24em",
                textTransform: "uppercase",
                color: `${GOLD}88`,
              }}
            >
              Decision Infrastructure by Abraham of London
            </p>
            <h1
              className="mt-6"
              style={{
                ...serif,
                fontSize: "clamp(2rem, 5vw, 3.6rem)",
                lineHeight: 1.02,
                color: "#F5F5F5",
                fontStyle: "italic",
                letterSpacing: "-0.02em",
              }}
            >
              Test the decision before you act on it.
            </h1>
            <p
              className="mx-auto mt-4 max-w-[60ch] text-[15px] leading-[1.85]"
              style={{ color: "rgba(255,255,255,0.50)" }}
            >
              Choose the right level of scrutiny. Start with a fast pressure reading, a structured
              signal, a full diagnostic, or an organisational scan.
            </p>
          </div>
        </section>

        {/* Route cards */}
        <section className="border-t px-6 py-12" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          <div className="mx-auto max-w-[900px]">
            <div className="grid gap-4 md:grid-cols-2">
              {ROUTE_CARDS.map((card) => (
                <Link
                  key={card.href}
                  href={card.href}
                  className="group flex flex-col border p-6 transition-all duration-200 hover:-translate-y-0.5"
                  style={{
                    borderColor: `${GOLD}25`,
                    backgroundColor: "rgba(255,255,255,0.02)",
                  }}
                >
                  {/* Icon + time */}
                  <div className="flex items-center justify-between">
                    <span style={{ color: `${GOLD}99` }}>{card.icon}</span>
                    <span
                      style={{
                        ...mono,
                        fontSize: "7px",
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        color: "rgba(255,255,255,0.25)",
                      }}
                    >
                      {card.timeEstimate}
                    </span>
                  </div>

                  {/* Title */}
                  <h3
                    className="mt-4"
                    style={{
                      ...serif,
                      fontSize: "1.3rem",
                      lineHeight: 1.1,
                      color: "rgba(255,255,255,0.85)",
                      fontStyle: "italic",
                    }}
                  >
                    {card.title}
                  </h3>

                  {/* Description */}
                  <p
                    className="mt-3 text-[14px] leading-[1.75]"
                    style={{ color: "rgba(255,255,255,0.50)" }}
                  >
                    {card.description}
                  </p>

                  {/* CTA */}
                  <div className="mt-5 flex items-center gap-2">
                    <span
                      style={{
                        ...mono,
                        fontSize: "9px",
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        color: `${GOLD}CC`,
                      }}
                    >
                      {card.cta}
                    </span>
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" style={{ color: `${GOLD}AA` }} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Trust block */}
        <section
          className="border-t px-6 py-10"
          style={{ borderColor: "rgba(255,255,255,0.05)", backgroundColor: "rgba(255,255,255,0.01)" }}
        >
          <div className="mx-auto max-w-[760px]">
            <div
              className="border-l-2 p-5"
              style={{ borderColor: `${GOLD}30`, backgroundColor: "rgba(255,255,255,0.02)" }}
            >
              <p
                className="text-[14px] leading-[1.8]"
                style={{ color: "rgba(255,255,255,0.55)" }}
              >
                This system may refuse to proceed where the decision, evidence, authority, or
                consequence is too vague. That is intentional. Weak inputs create false confidence.
              </p>
            </div>
          </div>
        </section>

        {/* Pathway link */}
        <section className="border-t px-6 py-8 text-center" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          <div className="mx-auto max-w-[760px]">
            <Link
              href="/decision-pathway"
              className="group inline-flex items-center gap-2"
              style={{
                ...mono,
                fontSize: "10px",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: `${GOLD}AA`,
              }}
            >
              <Route className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
              Not sure where this leads? View the decision pathway
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </section>
      </div>
    </Layout>
  );
}
