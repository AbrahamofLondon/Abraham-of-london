/**
 * pages/about.tsx — INSTITUTIONAL OVERVIEW
 *
 * Explains what Abraham of London is and routes clearly to:
 *   /method, /about/founder, /trust, /library, /diagnostics/fast
 *
 * Design: Institutional Monumentalism — matches homepage design language.
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

function Rule() {
  return (
    <div className="my-14 h-px w-full" style={{ background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 30%, rgba(255,255,255,0.06) 70%, transparent 100%)" }} />
  );
}

const trustLinks = [
  { label: "Verify credentials", href: "/verification", desc: "Legal presence, qualifications, director record" },
  { label: "See foundations", href: "/foundations", desc: "Intellectual traditions behind the system" },
  { label: "Understand trust boundaries", href: "/trust", desc: "Who this is for, what to expect" },
  { label: "See applied evidence", href: "/evidence", desc: "Anonymised outcome cases" },
  { label: "Read public playbooks", href: "/playbooks", desc: "Decision patterns exposed publicly" },
  { label: "Canon glossary", href: "/canon/glossary", desc: "40 terms, defined with precision" },
];

const platformTerms = [
  { term: "Contradiction", desc: "Identifies the gap between what is stated and what evidence shows." },
  { term: "Consequence", desc: "Prices the cost of delay using respondent-stated inputs." },
  { term: "Enforcement", desc: "Assigns ownership, sets deadlines, tracks breach patterns." },
  { term: "Verification", desc: "Checks whether action was taken and classifies impact." },
];

const AboutPage: NextPage = () => (
  <Layout
    title="About | Abraham of London"
    description="Decision authority system for founder-led and executive teams under structural ambiguity. Contradiction detection, consequence pricing, execution enforcement, verified outcomes."
    canonicalUrl="/about"
  >
    <main className="min-h-screen" style={{ backgroundColor: "rgb(3,3,5)", color: "white" }}>
      <div className="mx-auto max-w-5xl px-6 pb-16 pt-28 lg:px-12 lg:pb-20 lg:pt-36">
        <div className="max-w-3xl">

          {/* ── Header ── */}
          <Eyebrow>About · Decision Authority</Eyebrow>

          <h1
            className="mt-6"
            style={{
              ...serif,
              fontSize: "clamp(2.5rem,6vw,4rem)",
              lineHeight: 0.95,
              color: "rgba(255,255,255,0.92)",
            }}
          >
            The system.
          </h1>

          <p
            className="mt-5 max-w-[56ch]"
            style={{
              ...serif,
              fontSize: "1rem",
              fontStyle: "italic",
              lineHeight: 1.6,
              color: "rgba(255,255,255,0.48)",
            }}
          >
            Contradiction. Consequence. Enforcement. Verification.
          </p>

          <p
            className="mt-10 max-w-[65ch]"
            style={{
              ...serif,
              fontSize: "1.0625rem",
              lineHeight: 1.8,
              color: "rgba(255,255,255,0.72)",
            }}
          >
            Abraham of London is a decision authority system for founder-led and executive teams under structural ambiguity. We identify contradictions that cannot be dismissed, price what they cost to ignore, sequence the interventions that resolve them, and verify whether action worked.
          </p>

          <p
            className="mt-6 max-w-[65ch]"
            style={{
              ...serif,
              fontSize: "1.0625rem",
              lineHeight: 1.8,
              color: "rgba(255,255,255,0.52)",
            }}
          >
            The system accumulates evidence across diagnostic stages, detects where authority says one thing and evidence shows another, and enforces decisions with priced consequence. Outcomes are verified, not assumed.
          </p>

          {/* ── Routing row ── */}
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/method"
              style={{
                ...mono,
                fontSize: "7.5px",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: `${GOLD}BB`,
                border: `1px solid ${GOLD}33`,
                padding: "0.5rem 0.85rem",
                textDecoration: "none",
              }}
            >
              Understand the method →
            </Link>

            <Link
              href="/trust"
              style={{
                ...mono,
                fontSize: "7.5px",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.35)",
                border: "1px solid rgba(255,255,255,0.08)",
                padding: "0.5rem 0.85rem",
                textDecoration: "none",
              }}
            >
              Review trust posture →
            </Link>

            <Link
              href="/library"
              style={{
                ...mono,
                fontSize: "7.5px",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.35)",
                border: "1px solid rgba(255,255,255,0.08)",
                padding: "0.5rem 0.85rem",
                textDecoration: "none",
              }}
            >
              Explore the knowledge estate →
            </Link>
          </div>

          <Rule />

          {/* ── Who built this ── */}
          <div className="max-w-3xl">
            <Eyebrow>Who built this</Eyebrow>

            <p
              className="mt-4 max-w-[60ch]"
              style={{
                ...serif,
                fontSize: "0.95rem",
                lineHeight: 1.85,
                color: "rgba(255,255,255,0.50)",
              }}
            >
              Abraham Adaramola is a London-based commercial strategist with 15+ years&apos; experience across cross-border contracting, procurement governance, energy, infrastructure, and mixed public-private operating environments.
            </p>

            <Link
              href="/about/founder"
              className="mt-3 inline-flex items-center gap-2"
              style={{
                ...mono,
                fontSize: "7.5px",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: `${GOLD}AA`,
                textDecoration: "none",
                borderBottom: `1px solid ${GOLD}33`,
                paddingBottom: "1px",
              }}
            >
              Meet the founder <ArrowRight style={{ width: 10, height: 10 }} />
            </Link>
          </div>

          <Rule />

          {/* ── Why trust the system ── */}
          <div className="max-w-3xl">
            <Eyebrow>Why trust the system</Eyebrow>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {trustLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group block"
                  style={{
                    border: "1px solid rgba(255,255,255,0.06)",
                    padding: "0.75rem",
                    textDecoration: "none",
                  }}
                >
                  <span
                    style={{
                      ...mono,
                      fontSize: "7.5px",
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      color: `${GOLD}AA`,
                    }}
                  >
                    {link.label}
                  </span>

                  <p
                    className="mt-1"
                    style={{
                      ...serif,
                      fontSize: "0.82rem",
                      color: "rgba(255,255,255,0.30)",
                    }}
                  >
                    {link.desc}
                  </p>
                </Link>
              ))}
            </div>
          </div>

          <Rule />

          {/* ── What the platform does ── */}
          <div className="max-w-3xl">
            <Eyebrow>What the platform does</Eyebrow>

            <div className="mt-4 space-y-3">
              {platformTerms.map((item) => (
                <div key={item.term} style={{ padding: "0.5rem 0" }}>
                  <span
                    style={{
                      ...mono,
                      fontSize: "7.5px",
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.65)",
                    }}
                  >
                    {item.term}
                  </span>

                  <span
                    style={{
                      ...serif,
                      fontSize: "0.9rem",
                      color: "rgba(255,255,255,0.35)",
                    }}
                  >
                    {" "}— {item.desc}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <Rule />

          {/* ── Evidence Standard ── */}
          <div className="max-w-3xl">
            <Eyebrow>Evidence Standard</Eyebrow>

            <div
              className="mt-4 space-y-3"
              style={{
                ...serif,
                fontSize: "0.9rem",
                lineHeight: 1.85,
                color: "rgba(255,255,255,0.46)",
              }}
            >
              <p>
                Public proof on this platform is designed to show condition, decision relevance,
                consequence, and observed movement without exposing client identity or private operating logic.
              </p>

              <p>
                Self-declared success on its own is not treated as sufficient public proof.
                Published evidence is anonymised, bounded, and intended to withstand serious review.
              </p>

              <p>
                Source-level records, supporting documentation, and deeper substantiation remain private
                and move only through the appropriate confidential route.
              </p>
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
              Run one real decision
              <ArrowRight
                style={{ width: 11, height: 11 }}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </Link>

            <Link
              href="/method"
              style={{
                ...mono,
                fontSize: "7.5px",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.32)",
              }}
            >
              Understand the method
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
      </div>
    </main>
  </Layout>
);

export default AboutPage;
