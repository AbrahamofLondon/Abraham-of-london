import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import Layout from "@/components/Layout";

type Rung = {
  n: string;
  label: string;
  href: string;
  cta: string;
  duration: string;
  route: string;
  role: string;
  produces: string;
};

const GOLD = "#C9A96E";
const AMBER = "#F59E0B";
const VOID = "rgb(3 3 5)";

const RUNGS: Rung[] = [
  {
    n: "01",
    label: "Constitutional Diagnostic",
    href: "/diagnostics/constitutional-diagnostic",
    cta: "Start diagnostic",
    duration: "6 min",
    route: "STRATEGY",
    role: "Evidence layer · Public",
    produces: "Constitutional route, confidence score, posture, readiness tier, failure mode density",
  },
  {
    n: "02",
    label: "Team Assessment",
    href: "/diagnostics/team-assessment",
    cta: "Begin team assessment",
    duration: "10 min",
    route: "DIAGNOSTIC",
    role: "Evidence layer · Continuation",
    produces: "Leadership–team perception gap, fragility classification, domain-level gap severity",
  },
  {
    n: "03",
    label: "Enterprise Assessment",
    href: "/diagnostics/enterprise-assessment",
    cta: "Begin enterprise assessment",
    duration: "15 min",
    route: "DIAGNOSTIC",
    role: "Evidence layer · Institutional",
    produces: "Enterprise pressure map, governance reliability, escalation routing or WATCH classification",
  },
  {
    n: "04",
    label: "Executive Reporting",
    href: "/diagnostics/executive-reporting",
    cta: "View Executive Reporting",
    duration: "12 min",
    route: "STRATEGY",
    role: "Flagship · Consequence interpretation",
    produces: "Board-grade position, financial exposure, governed priority stack, trajectory outlook",
  },
];

const TOTAL_STAGES = RUNGS.length;
const STARTING_SIGNALS = [
  {
    label: "The direction is unclear, or the pressure is personal",
    href: "/diagnostics/purpose-alignment",
    route: "Personal diagnostic",
    detail: "Start here when leadership clarity, decision pattern, or personal mandate is the first question. Produces a dual-axis reading of alignment vs assumption.",
  },
  {
    label: "The organisation is carrying structural strain",
    href: "/diagnostics/constitutional-diagnostic",
    route: "Constitutional diagnostic",
    detail: "Use this when governance, authority, execution, or trust may be producing the pressure. Routes to STRATEGY, DIAGNOSTIC, or REJECT with constitutional confidence.",
  },
  {
    label: "Leadership perception and team experience have diverged",
    href: "/diagnostics/team-assessment",
    route: "Team assessment",
    detail: "Measures the gap between how leadership reads the team and how leadership estimates the team would read itself. Produces a structural perception gap, not a satisfaction survey.",
  },
  {
    label: "The pressure is institutional, not local",
    href: "/diagnostics/enterprise-assessment",
    route: "Enterprise assessment",
    detail: "Stress-tests leadership coherence, governance reliability, execution variance, and institutional risk posture. Routes to Executive Reporting or WATCH.",
  },
  {
    label: "Evidence is established — consequence needs pricing",
    href: "/diagnostics/executive-reporting",
    route: "Executive Reporting · Flagship",
    detail: "The governed executive brief. Translates accumulated diagnostic evidence into financial exposure, institutional constraint, and a priority stack that can be acted on.",
  },
];

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-5 w-px" style={{ backgroundColor: `${GOLD}55` }} />
      <span
        style={{
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontSize: "8px",
          letterSpacing: "0.28em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.38)",
        }}
      >
        {children}
      </span>
    </div>
  );
}

function RouteStrip() {
  const items = [
    { label: "STRATEGY", color: GOLD },
    { label: "DIAGNOSTIC", color: "rgba(255,255,255,0.48)" },
    { label: "WATCH", color: AMBER },
    { label: "REJECT", color: "rgba(255,255,255,0.24)" },
  ];

  return (
    <div className="mt-5 flex flex-wrap items-center gap-2">
      {items.map((item, index) => (
        <React.Fragment key={item.label}>
          <span
            style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "7px",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: item.color,
            }}
          >
            {item.label}
          </span>
          {index < items.length - 1 ? (
            <span
              style={{
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "7px",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.16)",
              }}
            >
              ·
            </span>
          ) : null}
        </React.Fragment>
      ))}
    </div>
  );
}

function routeColor(route: string) {
  if (route === "STRATEGY") return GOLD;
  if (route === "DIAGNOSTIC") return "rgba(255,255,255,0.48)";
  return "rgba(255,255,255,0.24)";
}

function Dot() {
  return (
    <span
      style={{
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        fontSize: "7.5px",
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: "rgba(255,255,255,0.16)",
      }}
    >
      ·
    </span>
  );
}

function RungRow({ rung }: { rung: Rung }) {
  return (
    <div className="grid gap-3 border-t border-white/[0.06] py-5 md:grid-cols-[0.8fr_1fr_auto] md:items-start">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "7.5px",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.68)",
            }}
          >
            {`STAGE ${rung.n} OF ${TOTAL_STAGES}`}
          </span>
          <Dot />
          <span
            style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "7.5px",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: routeColor(rung.route),
            }}
          >
            {rung.route}
          </span>
        </div>
        <div
          style={{
            marginTop: "0.65rem",
            fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
            fontWeight: 300,
            fontSize: "1.12rem",
            color: "rgba(255,255,255,0.78)",
          }}
        >
          {rung.label}
        </div>
      </div>
      <div>
        <div
          style={{
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontSize: "7px",
            letterSpacing: "0.20em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.32)",
          }}
        >
          {rung.role} · {rung.duration}
        </div>
        <p
          style={{
            marginTop: "0.55rem",
            fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
            fontWeight: 300,
            fontSize: "0.92rem",
            lineHeight: 1.55,
            color: "rgba(255,255,255,0.44)",
          }}
        >
          Produces: {rung.produces}.
        </p>
      </div>
      <Link
        href={rung.href}
        className="inline-flex items-center gap-2 transition-all hover:underline md:justify-self-end"
        style={{
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontSize: "7.5px",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: AMBER,
        }}
      >
        {rung.cta}
        <ArrowRight style={{ width: "10px", height: "10px" }} />
      </Link>
    </div>
  );
}

function StartingSignalCard({ signal }: { signal: (typeof STARTING_SIGNALS)[number] }) {
  return (
    <Link
      href={signal.href}
      className="group block border transition-all duration-200 hover:-translate-y-0.5"
      style={{
        borderColor: "rgba(255,255,255,0.08)",
        backgroundColor: "rgba(255,255,255,0.025)",
        padding: "1rem",
      }}
    >
      <div
        style={{
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontSize: "7.5px",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: GOLD,
        }}
      >
        {signal.route}
      </div>
      <div
        style={{
          marginTop: "0.7rem",
          fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
          fontWeight: 300,
          fontSize: "1.25rem",
          lineHeight: 1.08,
          color: "rgba(255,255,255,0.88)",
        }}
      >
        {signal.label}
      </div>
      <p
        style={{
          marginTop: "0.7rem",
          fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
          fontWeight: 300,
          fontSize: "0.95rem",
          lineHeight: 1.55,
          color: "rgba(255,255,255,0.50)",
        }}
      >
        {signal.detail}
      </p>
      <div
        className="mt-4 inline-flex items-center gap-2"
        style={{
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontSize: "7.5px",
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: AMBER,
        }}
      >
        Start here <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
}

export default function DiagnosticsIndexPage() {
  return (
    <Layout title="Governed Diagnostic System | Abraham of London">
      <Head>
        <meta
          name="description"
          content="The governed diagnostic evidence ladder. Identifies structural condition, accumulates tension, and escalates to Executive Reporting when consequence must be priced."
        />
      </Head>

      <div style={{ backgroundColor: VOID }}>
        <section>
          <div className="mx-auto max-w-6xl px-6 lg:px-12">
            <div className="py-16 lg:py-24">
              <Eyebrow>GOVERNED DIAGNOSTIC SYSTEM</Eyebrow>
              <h1
                style={{
                  marginTop: "1rem",
                  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                  fontWeight: 300,
                  fontSize: "clamp(2rem, 9vw, 4rem)",
                  lineHeight: 0.98,
                  letterSpacing: 0,
                  color: "rgba(255,255,255,0.92)",
                  maxWidth: "48ch",
                  fontStyle: "italic",
                }}
              >
                Choose your starting signal.
              </h1>
              <p
                style={{
                  marginTop: "1rem",
                  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                  fontWeight: 300,
                  fontSize: "1rem",
                  lineHeight: 1.6,
                  color: "rgba(255,255,255,0.48)",
                  maxWidth: "56ch",
                }}
              >
                A staged evidence ladder that identifies structural condition, accumulates tension across stages, and escalates only when consequence justifies it. Each stage produces evidence. Executive Reporting is where that evidence becomes a governed position.
              </p>
              <div className="mt-6 grid gap-3 md:grid-cols-2">
                {STARTING_SIGNALS.map((signal) => (
                  <StartingSignalCard key={signal.label} signal={signal} />
                ))}
              </div>
              <div
                className="mt-6"
                style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "7.5px",
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.28)",
                }}
              >
                Governed entry · staged evidence ladder · no account required for diagnostic stages
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="mx-auto max-w-6xl px-6 lg:px-12">
            <div
              className="grid gap-5 border-y py-8 md:grid-cols-[0.9fr_1.1fr_auto] md:items-center"
              style={{ borderColor: "rgba(255,255,255,0.06)" }}
            >
              <div>
                <Eyebrow>Personal diagnostic path</Eyebrow>
                <h2
                  style={{
                    marginTop: "0.9rem",
                    fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                    fontWeight: 300,
                    fontSize: "clamp(1.6rem, 3vw, 2.2rem)",
                    lineHeight: 1.05,
                    letterSpacing: "-0.02em",
                    color: "rgba(255,255,255,0.84)",
                  }}
                >
                  Start with the person.
                </h2>
              </div>
              <p
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                  fontWeight: 300,
                  fontSize: "1rem",
                  lineHeight: 1.65,
                  color: "rgba(255,255,255,0.45)",
                }}
              >
                Purpose Alignment reads the person. The Constitutional Diagnostic reads the
                organisation. Use this path when personal clarity is the first trust-building step,
                not as a replacement for the institutional ladder.
              </p>
              <Link
                href="/diagnostics/purpose-alignment"
                className="inline-flex items-center gap-2 transition-all hover:underline md:justify-self-end"
                style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "8px",
                  letterSpacing: "0.24em",
                  textTransform: "uppercase",
                  color: "rgba(110,231,183,0.76)",
                }}
              >
                Take Purpose Alignment
                <ArrowRight style={{ width: "10px", height: "10px" }} />
              </Link>
            </div>
          </div>
        </section>

        <section>
          <div className="mx-auto max-w-6xl px-6 lg:px-12">
            <div className="py-8 lg:py-10">
              <div className="space-y-1">
                {RUNGS.map((rung) => (
                  <RungRow key={rung.n} rung={rung} />
                ))}
              </div>

              <div
                className="mt-6 flex items-center gap-2"
                style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "7px",
                  letterSpacing: "0.24em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.24)",
                }}
              >
                <span style={{ display: "inline-block", width: "16px", height: "1px", backgroundColor: "rgba(255,255,255,0.12)" }} />
                WATCH = governed observation, not escalation · STRATEGY = escalation justified · Strategy Room opens only when evidence warrants intervention
              </div>
            </div>
          </div>
        </section>

        {/* Product hierarchy */}
        <section>
          <div className="mx-auto max-w-6xl px-6 lg:px-12">
            <div className="py-8 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <Eyebrow>How the system works</Eyebrow>
              <div
                className="mt-4 grid gap-x-8 gap-y-2 md:grid-cols-2"
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                  fontWeight: 300,
                  fontSize: "0.92rem",
                  lineHeight: 1.55,
                  color: "rgba(255,255,255,0.38)",
                }}
              >
                <p>Diagnostics identify condition. Team assessment strengthens evidence. Enterprise assessment stress-tests the institution.</p>
                <p>Executive Reporting states position and consequence. WATCH governs observation. Strategy Room is the escalation environment. Monitoring extends the flagship over time.</p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="mx-auto max-w-6xl px-6 lg:px-12">
            <div className="py-10">
              <Link
                href="/"
                className="inline-flex items-center gap-2 transition-all hover:underline"
                style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "7.5px",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.3)",
                }}
              >
                Back to home
              </Link>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
