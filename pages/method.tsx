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
    <div className="my-8 h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent lg:my-10" />
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

const MethodPage: NextPage = () => {
  const escalation = [
    {
      stage: "Personal",
      signal: "Personal contradiction",
      consequence: "Operational strain",
    },
    {
      stage: "Constitutional",
      signal: "Structural weakness",
      consequence: "Coordination failure",
    },
    {
      stage: "Team",
      signal: "Perception divergence",
      consequence: "Execution cost",
    },
    {
      stage: "Enterprise",
      signal: "Institutional drag",
      consequence: "Financial exposure",
    },
    {
      stage: "Executive Report",
      signal: "Accumulated evidence",
      consequence: "Decision pressure",
      highlight: true,
    },
    {
      stage: "Strategy Room",
      signal: "Decision confirmed",
      consequence: "Execution sequenced",
      highlight: true,
    },
  ];

  const contrasts = [
    {
      label: "A survey",
      ordinary: "records preference or sentiment",
      method: "tests whether the stated position survives evidence, authority, and consequence.",
    },
    {
      label: "A coaching tool",
      ordinary: "supports reflection",
      method: "turns reflection into a named condition, a record, and an earned next action.",
    },
    {
      label: "An AI prompt",
      ordinary: "generates plausible language",
      method: "uses structured inputs, governed result shapes, and explicit evidence boundaries.",
    },
    {
      label: "A consulting report",
      ordinary: "summarises an adviser’s view",
      method: "shows what the submitted record supports, what it does not support, and what remains unresolved.",
    },
  ];

  const authorityPanels = [
    {
      n: "01",
      title: "Detects contradiction",
      desc:
        "The system examines supplied inputs for structural tension: unclear authority, inconsistent priorities, weak evidence, unresolved ownership, and repeated patterns.",
      color: "rgba(252,165,165,0.62)",
    },
    {
      n: "02",
      title: "Prices consequence",
      desc:
        "Where a user provides a financial or timing basis, the system connects delay to visible exposure. Where no basis exists, it says so and keeps the finding structural.",
      color: `${GOLD}88`,
    },
    {
      n: "03",
      title: "Preserves continuity",
      desc:
        "A result should not vanish when the page closes. Governed cases preserve posture, next action, evidence status, and later review points where supported.",
      color: `${AMBER}88`,
    },
  ];

  const mechanisms = [
    {
      label: "Structured inputs",
      detail: "The system depends on what the user provides and marks the evidence posture accordingly.",
    },
    {
      label: "Pattern recognition",
      detail: "Named conditions are derived from repeated structural signals, not decorative categories.",
    },
    {
      label: "Case continuity",
      detail: "Saved cases carry the record forward into Decision Centre and later review paths.",
    },
    {
      label: "Provenance boundary",
      detail: "Supported records can be checked against client-safe integrity evidence.",
    },
    {
      label: "Escalation discipline",
      detail: "The next action is earned by condition, not selected as a menu of equal options.",
    },
  ];

  const outputs = [
    "A named condition rather than a vague score.",
    "An evidence posture showing what the result is based on.",
    "A governance implication tied to authority, accountability, or execution.",
    "A consequence timeline where the inputs support one.",
    "A next earned action that explains why the matter should move, wait, or escalate.",
  ];

  return (
    <Layout
      title="Method | Abraham of London"
      description="How Abraham of London reads decision pressure: contradiction, consequence, evidence posture, continuity, and governed next action."
      canonicalUrl="/method"
      fullWidth
      headerTransparent
    >
      <main className="min-h-screen bg-[rgb(3,3,5)] text-white">
        <div className="mx-auto max-w-5xl px-6 pb-16 pt-28 lg:px-12 lg:pb-20 lg:pt-36">
          <section className="max-w-3xl">
            <Eyebrow>Method</Eyebrow>

            <h1
              className="mt-4"
              style={{
                ...serif,
                fontSize: "clamp(2.15rem, 5vw, 3.65rem)",
                lineHeight: 0.98,
                color: "rgba(255,255,255,0.94)",
              }}
            >
              The system reads the decision before it becomes theatre.
            </h1>

            <p
              className="mt-5"
              style={{
                ...serif,
                fontSize: "1.12rem",
                lineHeight: 1.55,
                color: "rgba(255,255,255,0.52)",
                maxWidth: "48rem",
              }}
            >
              Abraham of London is built to identify contradiction, make consequence visible, preserve the
              record, and route the user toward the next action the condition has earned.
            </p>

            <p
              className="mt-4"
              style={{
                ...serif,
                fontSize: "0.98rem",
                lineHeight: 1.65,
                color: "rgba(252,165,165,0.55)",
                fontStyle: "italic",
                maxWidth: "44rem",
              }}
            >
              It does not promise certainty. It disciplines the evidence, exposes the unresolved condition,
              and prevents decision pressure from disappearing between sessions.
            </p>
          </section>

          <Rule />

          <section>
            <Eyebrow>Escalation of consequence</Eyebrow>

            <div className="mt-4 space-y-0">
              {escalation.map((item) => (
                <div
                  key={item.stage}
                  className="grid grid-cols-[5.75rem_1fr_1rem_1fr] items-center gap-2 py-2.5"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.045)" }}
                >
                  <span
                    style={{
                      ...mono,
                      fontSize: "7px",
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: item.highlight ? `${GOLD}88` : "rgba(255,255,255,0.28)",
                    }}
                  >
                    {item.stage}
                  </span>

                  <span
                    style={{
                      ...serif,
                      fontSize: "0.86rem",
                      color: "rgba(255,255,255,0.38)",
                    }}
                  >
                    {item.signal}
                  </span>

                  <span
                    style={{
                      ...mono,
                      fontSize: "7px",
                      color: "rgba(255,255,255,0.16)",
                    }}
                  >
                    &rarr;
                  </span>

                  <span
                    style={{
                      ...serif,
                      fontSize: "0.88rem",
                      color: item.highlight ? "rgba(255,255,255,0.68)" : "rgba(255,255,255,0.46)",
                    }}
                  >
                    {item.consequence}
                  </span>
                </div>
              ))}
            </div>

            <p
              className="mt-4"
              style={{
                ...serif,
                fontSize: "0.82rem",
                color: "rgba(255,255,255,0.24)",
                fontStyle: "italic",
              }}
            >
              The ladder is not decorative. Each stage increases the burden of evidence, continuity, and
              accountability.
            </p>
          </section>

          <Rule />

          <section className="max-w-3xl">
            <Eyebrow tone="muted">What this is not</Eyebrow>

            <div className="mt-4 space-y-4">
              {contrasts.map((item) => (
                <div
                  key={item.label}
                  style={{
                    borderLeft: "2px solid rgba(255,255,255,0.06)",
                    paddingLeft: "0.95rem",
                  }}
                >
                  <span
                    style={{
                      ...mono,
                      fontSize: "6.5px",
                      letterSpacing: "0.22em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.24)",
                    }}
                  >
                    {item.label} usually {item.ordinary}
                  </span>

                  <p
                    className="mt-1"
                    style={{
                      ...serif,
                      fontSize: "0.9rem",
                      lineHeight: 1.58,
                      color: "rgba(255,255,255,0.52)",
                    }}
                  >
                    This method {item.method}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <Rule />

          <section>
            <div className="grid gap-3 md:grid-cols-3">
              {authorityPanels.map((panel) => (
                <div
                  key={panel.n}
                  style={{
                    border: `1px solid ${panel.color}28`,
                    backgroundColor: `${panel.color}07`,
                    padding: "1.25rem",
                  }}
                >
                  <span style={{ ...mono, fontSize: "9px", color: panel.color }}>{panel.n}</span>

                  <h2
                    className="mt-2"
                    style={{
                      ...mono,
                      fontSize: "8px",
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      color: panel.color,
                    }}
                  >
                    {panel.title}
                  </h2>

                  <p
                    className="mt-3"
                    style={{
                      ...serif,
                      fontSize: "0.86rem",
                      lineHeight: 1.58,
                      color: "rgba(255,255,255,0.42)",
                    }}
                  >
                    {panel.desc}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-2 md:grid-cols-5">
              {mechanisms.map((item) => (
                <div
                  key={item.label}
                  style={{
                    border: "1px solid rgba(255,255,255,0.05)",
                    backgroundColor: "rgba(255,255,255,0.012)",
                    padding: "0.75rem",
                  }}
                >
                  <span
                    style={{
                      ...mono,
                      fontSize: "6px",
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.25)",
                    }}
                  >
                    {item.label}
                  </span>

                  <p
                    className="mt-2"
                    style={{
                      ...serif,
                      fontSize: "0.76rem",
                      lineHeight: 1.45,
                      color: "rgba(255,255,255,0.31)",
                    }}
                  >
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <Rule />

          <section className="max-w-3xl">
            <Eyebrow>What the system produces</Eyebrow>

            <div className="mt-4 space-y-2">
              {outputs.map((line) => (
                <p
                  key={line}
                  style={{
                    ...serif,
                    fontSize: "0.92rem",
                    lineHeight: 1.58,
                    color: "rgba(255,255,255,0.48)",
                  }}
                >
                  {line}
                </p>
              ))}
            </div>

            <div
              className="mt-7"
              style={{
                border: `1px solid ${GOLD}26`,
                backgroundColor: "rgba(0,0,0,0.44)",
                padding: "1.25rem",
              }}
            >
              <p
                style={{
                  ...mono,
                  fontSize: "6.5px",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: `${GOLD}70`,
                  marginBottom: "0.7rem",
                }}
              >
                Illustrative output — anonymised format
              </p>

              <h2
                style={{
                  ...serif,
                  fontSize: "1.08rem",
                  lineHeight: 1.3,
                  color: "rgba(255,255,255,0.84)",
                }}
              >
                Execution coherence weakening under governance drift
              </h2>

              <div className="mt-3 flex flex-wrap gap-3">
                <span
                  style={{
                    ...mono,
                    fontSize: "7px",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: "rgba(252,165,165,0.7)",
                  }}
                >
                  Trajectory: deteriorating
                </span>

                <span
                  style={{
                    ...mono,
                    fontSize: "7px",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.58)",
                  }}
                >
                  Exposure: user-supplied basis required
                </span>
              </div>

              <p
                className="mt-3"
                style={{
                  ...serif,
                  fontSize: "0.86rem",
                  lineHeight: 1.58,
                  color: "rgba(255,255,255,0.42)",
                }}
              >
                The record indicates conflicting ownership, weak mandate clarity, and a decision that now
                requires named accountability before execution can be treated as credible.
              </p>

              <p
                className="mt-3"
                style={{
                  ...mono,
                  fontSize: "6px",
                  letterSpacing: "0.12em",
                  color: "rgba(255,255,255,0.18)",
                }}
              >
                Illustrative only. Live outputs depend on user-submitted evidence and supported system records.
              </p>
            </div>
          </section>

          <Rule />

          <section
            style={{
              border: `1px solid ${GOLD}18`,
              backgroundColor: `${GOLD}05`,
              padding: "1.25rem",
            }}
          >
            <Eyebrow>Evidence boundary</Eyebrow>

            <p
              className="mt-3"
              style={{
                ...serif,
                fontSize: "0.94rem",
                lineHeight: 1.68,
                color: "rgba(255,255,255,0.48)",
              }}
            >
              Where supported, Abraham of London records source labels, evidence posture, provenance status,
              and case continuity. The platform does not claim independent audit of user-submitted evidence
              unless that has been separately performed and stated.
            </p>

            <p
              className="mt-3"
              style={{
                ...serif,
                fontSize: "0.88rem",
                lineHeight: 1.62,
                color: "rgba(255,255,255,0.34)",
              }}
            >
              The method is intentionally public at the boundary and private at the engine. Users should
              understand the operating logic without receiving proprietary scoring mechanics, protected
              prompts, internal thresholds, or implementation details.
            </p>

            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/provenance/demo"
                style={{
                  ...mono,
                  fontSize: "7px",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: `${GOLD}B0`,
                }}
              >
                View provenance demo
              </Link>

              <Link
                href="/trust"
                style={{
                  ...mono,
                  fontSize: "7px",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.3)",
                }}
              >
                Review trust posture
              </Link>

              <Link
                href="/library"
                style={{
                  ...mono,
                  fontSize: "7px",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.3)",
                }}
              >
                Explore the library
              </Link>
            </div>
          </section>

          <Rule />

          <section className="flex flex-col gap-5">
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
                href="/tools/decision-delay-exposure"
                style={{
                  ...mono,
                  fontSize: "7.5px",
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.32)",
                }}
              >
                Estimate decision delay exposure
              </Link>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/about"
                style={{
                  ...mono,
                  fontSize: "7px",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.22)",
                }}
              >
                About
              </Link>

              <Link
                href="/about/founder"
                style={{
                  ...mono,
                  fontSize: "7px",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.22)",
                }}
              >
                Founder
              </Link>

              <Link
                href="/trust"
                style={{
                  ...mono,
                  fontSize: "7px",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.22)",
                }}
              >
                Trust Center
              </Link>

              <Link
                href="/provenance/demo"
                style={{
                  ...mono,
                  fontSize: "7px",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.22)",
                }}
              >
                Provenance Demo
              </Link>

              <Link
                href="/briefs"
                style={{
                  ...mono,
                  fontSize: "7px",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.22)",
                }}
              >
                Briefs
              </Link>
            </div>
          </section>

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
};

export default MethodPage;