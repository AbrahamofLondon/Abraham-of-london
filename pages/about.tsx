import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { ArrowRight, ExternalLink, Shield } from "lucide-react";

const GOLD = "#C9A96E";
const mono = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" } as const;

const AboutPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>About | Abraham of London</title>
        <meta name="description" content="Decision authority system for founder-led and executive teams under structural ambiguity. Contradiction detection, consequence pricing, execution enforcement, verified outcomes." />
        <meta property="og:type" content="website" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://www.abrahamoflondon.org/about" />
      </Head>

      <main className="min-h-screen bg-[rgb(3,3,5)] text-white">
        <section className="mx-auto max-w-5xl px-6 pb-16 pt-28 lg:px-12 lg:pb-20 lg:pt-36">
          <div className="max-w-3xl">
            <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(255,255,255,0.38)" }}>
              About · Decision Authority
            </p>

            <h1 className="mt-6 font-serif text-[clamp(2.5rem,6vw,4rem)] font-light italic leading-[0.95] text-white/92">
              The system.
            </h1>

            <p className="mt-5 max-w-[56ch] text-base italic leading-[1.6] text-white/48">
              Contradiction. Consequence. Enforcement. Verification.
            </p>

            <p className="mt-10 max-w-[65ch] text-[1.0625rem] leading-[1.8] text-white/72">
              Abraham of London is a decision authority system for founder-led and executive teams under structural ambiguity. We identify contradictions that cannot be dismissed, price what they cost to ignore, sequence the interventions that resolve them, and verify whether action worked.
            </p>

            <p className="mt-6 max-w-[65ch] text-[1.0625rem] leading-[1.8] text-white/52">
              The system accumulates evidence across diagnostic stages, detects where authority says one thing and evidence shows another, and enforces decisions with priced consequence. Outcomes are verified, not assumed.
            </p>

            {/* Who built this */}
            <div className="mt-12 pt-8" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <h2 className="font-serif text-xl font-light text-white/80">Who built this</h2>
              <p className="mt-3 max-w-[60ch] text-sm leading-7 text-white/50">
                Abraham Adaramola is a London-based commercial strategist with 15+ years&apos; experience across cross-border contracting, procurement governance, energy, infrastructure, and public–private advisory environments.
              </p>
              <Link href="/founders" className="mt-3 inline-flex items-center gap-2 text-sm" style={{ color: `${GOLD}AA` }}>
                Meet the founder <ArrowRight style={{ width: 10, height: 10 }} />
              </Link>
            </div>

            {/* Why trust the system */}
            <div className="mt-10 pt-8" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <h2 className="font-serif text-xl font-light text-white/80">Why trust the system</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {[
                  { label: "Verify credentials", href: "/verification", desc: "Legal presence, qualifications, director record" },
                  { label: "See foundations", href: "/foundations", desc: "Intellectual traditions behind the system" },
                  { label: "Understand trust boundaries", href: "/trust", desc: "Who this is for, what to expect" },
                  { label: "See applied evidence", href: "/evidence", desc: "Anonymised outcome cases" },
                  { label: "Read public playbooks", href: "/playbooks", desc: "Decision patterns exposed publicly" },
                  { label: "Canon glossary", href: "/canon/glossary", desc: "40 terms, defined with precision" },
                ].map((link) => (
                  <Link key={link.href} href={link.href} className="group block" style={{ border: "1px solid rgba(255,255,255,0.06)", padding: "0.75rem" }}>
                    <span className="text-sm" style={{ color: `${GOLD}AA` }}>{link.label}</span>
                    <p className="mt-1 text-xs" style={{ color: "rgba(255,255,255,0.30)" }}>{link.desc}</p>
                  </Link>
                ))}
              </div>
            </div>

            {/* What the platform does */}
            <div className="mt-10 pt-8" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <h2 className="font-serif text-xl font-light text-white/80">What the platform does</h2>
              <div className="mt-4 space-y-3">
                {[
                  { term: "Contradiction", desc: "Identifies the gap between what is stated and what evidence shows." },
                  { term: "Consequence", desc: "Prices the cost of delay using respondent-stated inputs." },
                  { term: "Enforcement", desc: "Assigns ownership, sets deadlines, tracks breach patterns." },
                  { term: "Verification", desc: "Checks whether action was taken and classifies impact." },
                ].map((item) => (
                  <div key={item.term} style={{ padding: "0.5rem 0" }}>
                    <span className="text-sm font-medium text-white/65">{item.term}</span>
                    <span className="text-sm text-white/35"> — {item.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-10 pt-8" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <h2 className="font-serif text-xl font-light text-white/80">Evidence Standard</h2>
              <div className="mt-4 space-y-3 text-sm leading-7 text-white/46">
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

            <div className="mt-10">
              <Link href="/diagnostics/fast" className="inline-flex items-center gap-3" style={{ padding: "14px 28px", border: `1px solid ${GOLD}50`, backgroundColor: `${GOLD}08`, color: `${GOLD}CC`, ...mono, fontSize: "9px", letterSpacing: "0.22em", textTransform: "uppercase" }}>
                Start with the stuck decision <ArrowRight style={{ width: 11, height: 11 }} />
              </Link>
            </div>

            <p className="mt-10" style={{ ...mono, fontSize: "6px", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.10)" }}>
              Developed by Abraham Adaramola · Founder, Abraham of London
            </p>
          </div>
        </section>
      </main>
    </>
  );
};

export default AboutPage;
