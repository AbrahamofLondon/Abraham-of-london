/* pages/founders/index.tsx — FOR FOUNDERS AND BUILDERS
 *
 * Audience-specific pathway page for founders and builders facing
 * consequential decisions under structural ambiguity.
 *
 * This is NOT the founder profile. For the founder profile see /about/founder.
 *
 * Design: Institutional Monumentalism — matches site design language.
 * Typography: JetBrains Mono labels, Cormorant Garamond body/headings.
 * Gold: #C9A96E softGold.
 */

import type { CSSProperties } from "react";
import type { NextPage } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import Layout from "@/components/Layout";

const GOLD = "#C9A96E";
const AMBER = "#F59E0B";

const mono: CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
};

const serif: CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, Cambria, 'Times New Roman', serif",
  fontWeight: 300,
};

function Rule() {
  return (
    <div className="my-14 h-px w-full" style={{ background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 30%, rgba(255,255,255,0.06) 70%, transparent 100%)" }} />
  );
}

function Eyebrow({ children, tone = "gold" }: { children: React.ReactNode; tone?: "gold" | "muted" }) {
  return (
    <p
      style={{
        ...mono,
        fontSize: "7px",
        letterSpacing: "0.32em",
        textTransform: "uppercase",
        color: tone === "gold" ? `${GOLD}80` : "rgba(255,255,255,0.28)",
      }}
    >
      {children}
    </p>
  );
}

const challenges = [
  {
    title: "Contradiction",
    desc: "Your strategy says one thing. Your metrics show another. The system names the gap.",
  },
  {
    title: "Consequence",
    desc: "Every deferred decision carries a priced cost. The system makes it visible.",
  },
  {
    title: "Enforcement",
    desc: "Ownership, deadlines, and breach patterns are tracked across stages.",
  },
  {
    title: "Verification",
    desc: "Action is checked. Outcomes are classified. The record is governed.",
  },
];

const pathway = [
  {
    step: "01",
    title: "Run the Fast Diagnostic",
    desc: "Free, anonymous, under 3 minutes. A governed finding produced immediately.",
    href: "/diagnostics/fast",
    cta: "Start free →",
  },
  {
    step: "02",
    title: "Create your governed case",
    desc: "Free account. Keep up to 3 active governed cases. Existing records remain readable.",
    href: "/decision-centre",
    cta: "Open Decision Centre →",
  },
  {
    step: "03",
    title: "Enter Professional continuity",
    desc: "Unlimited active cases, Return Brief generation, client-safe evidence export, reviewer links, and organisation workspace.",
    href: "/pricing",
    cta: "View Professional →",
  },
  {
    step: "04",
    title: "Escalate when the record earns it",
    desc: "Executive Reporting, Strategy Room, Retained Oversight — earned intervention, not default upsell.",
    href: "/method",
    cta: "Understand escalation →",
  },
];

const FoundersPage: NextPage = () => (
  <Layout
    title="For Founders | Abraham of London"
    description="Decision authority for founders and builders facing consequential decisions under structural ambiguity. Contradiction detection, consequence pricing, enforcement, verification."
    canonicalUrl="/founders"
  >
    <main className="min-h-screen" style={{ backgroundColor: "rgb(3,3,5)", color: "white" }}>
      <div className="mx-auto max-w-5xl px-6 pb-16 pt-28 lg:px-12 lg:pb-20 lg:pt-36">

        {/* ── Hero ── */}
        <div className="max-w-3xl">
          <Eyebrow>For Founders · Decision Authority</Eyebrow>

          <h1
            className="mt-6"
            style={{
              ...serif,
              fontSize: "clamp(2.2rem, 5vw, 3.5rem)",
              lineHeight: 0.98,
              color: "rgba(255,255,255,0.92)",
            }}
          >
            Decide under uncertainty.
          </h1>

          <p
            className="mt-5 max-w-[56ch]"
            style={{
              ...serif,
              fontSize: "1rem",
              lineHeight: 1.7,
              color: "rgba(255,255,255,0.52)",
            }}
          >
            For founders and builders facing non-delegable decisions under structural ambiguity.
            Identify the contradictions in your positioning. Price what they cost. Execute with verification.
          </p>

          {/* ── Primary CTAs ── */}
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/diagnostics/fast"
              className="group inline-flex items-center gap-2"
              style={{
                padding: "12px 24px",
                border: `1px solid ${GOLD}50`,
                backgroundColor: `${GOLD}0C`,
                color: `${GOLD}CC`,
                ...mono,
                fontSize: "8px",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                textDecoration: "none",
              }}
            >
              Start with the Fast Diagnostic
              <ArrowRight style={{ width: 11, height: 11 }} className="transition-transform group-hover:translate-x-0.5" />
            </Link>

            <Link
              href="/method"
              style={{
                ...mono,
                fontSize: "7.5px",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.35)",
                border: "1px solid rgba(255,255,255,0.08)",
                padding: "12px 20px",
                textDecoration: "none",
              }}
            >
              Understand the method →
            </Link>
          </div>
        </div>

        <Rule />

        {/* ── What founders face ── */}
        <div className="max-w-3xl">
          <Eyebrow>What founders face</Eyebrow>

          <div className="mt-4 space-y-4">
            {challenges.map((item) => (
              <div
                key={item.title}
                style={{
                  borderLeft: `2px solid ${GOLD}25`,
                  paddingLeft: "1rem",
                }}
              >
                <span
                  style={{
                    ...mono,
                    fontSize: "7.5px",
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: `${GOLD}99`,
                  }}
                >
                  {item.title}
                </span>

                <p
                  className="mt-1"
                  style={{
                    ...serif,
                    fontSize: "0.9rem",
                    lineHeight: 1.6,
                    color: "rgba(255,255,255,0.42)",
                  }}
                >
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        <Rule />

        {/* ── Pathway ── */}
        <div className="max-w-3xl">
          <Eyebrow>Your pathway</Eyebrow>

          <div className="mt-4 space-y-3">
            {pathway.map((item) => (
              <Link
                key={item.step}
                href={item.href}
                className="group block"
                style={{
                  border: "1px solid rgba(255,255,255,0.06)",
                  padding: "1rem",
                  textDecoration: "none",
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <span style={{ ...mono, fontSize: "9px", color: `${GOLD}77` }}>
                      {item.step}
                    </span>

                    <h2
                      className="mt-1"
                      style={{
                        ...serif,
                        fontSize: "1.05rem",
                        color: "rgba(255,255,255,0.78)",
                      }}
                    >
                      {item.title}
                    </h2>

                    <p
                      className="mt-1"
                      style={{
                        ...serif,
                        fontSize: "0.85rem",
                        lineHeight: 1.55,
                        color: "rgba(255,255,255,0.38)",
                      }}
                    >
                      {item.desc}
                    </p>
                  </div>

                  <span
                    style={{
                      ...mono,
                      fontSize: "7px",
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: `${GOLD}88`,
                      whiteSpace: "nowrap",
                      marginTop: "0.25rem",
                    }}
                  >
                    {item.cta}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <Rule />

        {/* ── Trust routing ── */}
        <div className="max-w-3xl">
          <Eyebrow tone="muted">Verify the system</Eyebrow>

          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/about/founder"
              style={{
                ...mono,
                fontSize: "7px",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: `${GOLD}B0`,
                border: `1px solid ${GOLD}28`,
                padding: "0.4rem 0.7rem",
                textDecoration: "none",
              }}
            >
              Meet the founder
            </Link>

            <Link
              href="/trust"
              style={{
                ...mono,
                fontSize: "7px",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.3)",
                border: "1px solid rgba(255,255,255,0.06)",
                padding: "0.4rem 0.7rem",
                textDecoration: "none",
              }}
            >
              Trust Center
            </Link>

            <Link
              href="/verification"
              style={{
                ...mono,
                fontSize: "7px",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.3)",
                border: "1px solid rgba(255,255,255,0.06)",
                padding: "0.4rem 0.7rem",
                textDecoration: "none",
              }}
            >
              Verify credentials
            </Link>

            <Link
              href="/evidence"
              style={{
                ...mono,
                fontSize: "7px",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.3)",
                border: "1px solid rgba(255,255,255,0.06)",
                padding: "0.4rem 0.7rem",
                textDecoration: "none",
              }}
            >
              Applied evidence
            </Link>

            <Link
              href="/library"
              style={{
                ...mono,
                fontSize: "7px",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.3)",
                border: "1px solid rgba(255,255,255,0.06)",
                padding: "0.4rem 0.7rem",
                textDecoration: "none",
              }}
            >
              Knowledge estate
            </Link>

            <Link
              href="/method"
              style={{
                ...mono,
                fontSize: "7px",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.3)",
                border: "1px solid rgba(255,255,255,0.06)",
                padding: "0.4rem 0.7rem",
                textDecoration: "none",
              }}
            >
              Method
            </Link>

            <Link
              href="/provenance/demo"
              style={{
                ...mono,
                fontSize: "7px",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.3)",
                border: "1px solid rgba(255,255,255,0.06)",
                padding: "0.4rem 0.7rem",
                textDecoration: "none",
              }}
            >
              Provenance demo
            </Link>
          </div>
        </div>

        <Rule />

        {/* ── CTA ── */}
        <div className="flex flex-wrap items-center gap-4">
          <Link
            href="/diagnostics/fast"
            className="group inline-flex items-center gap-2 transition-all duration-200"
            style={{
              padding: "10px 20px",
              border: `1px solid ${AMBER}44`,
              color: AMBER,
              ...mono,
              fontSize: "8.5px",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
            }}
          >
            Run the Fast Diagnostic
            <ArrowRight
              style={{ width: 11, height: 11 }}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </Link>

          <Link
            href="/pricing"
            style={{
              ...mono,
              fontSize: "7.5px",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.32)",
            }}
          >
            View Professional continuity
          </Link>
        </div>

        {/* ── Legal disclaimer ── */}
        <p
          className="mt-12 max-w-3xl"
          style={{
            ...mono,
            fontSize: "6.5px",
            lineHeight: 1.8,
            letterSpacing: "0.1em",
            color: "rgba(255,255,255,0.18)",
          }}
        >
          Abraham of London provides governed decision instruments and structured advisory frameworks.
          Nothing on this page constitutes legal, financial, investment, tax, medical, immigration,
          accounting, or other regulated professional advice. Access fees, where applicable, are charged
          for methodology access, software-enabled records, structured outputs, and session facilitation,
          not for guaranteed outcomes.
        </p>
      </div>
    </main>
  </Layout>
);

export default FoundersPage;