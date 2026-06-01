import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Calculator,
  FileText,
  Gauge,
  Layers3,
  Lock,
  ShieldCheck,
  Users,
} from "lucide-react";

import Layout from "@/components/Layout";

const GOLD = "#C9A96E";
const VOID = "rgb(3 3 5)";

const mono: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
};

const serif: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
  fontWeight: 300,
};

type PathwayItem = {
  label: string;
  posture: string;
  description: string;
  output: string;
  href?: string;
};

const BREAK_POINTS = [
  {
    title: "Evidence is scattered",
    body: "The decision is discussed through anecdotes, partial data, and private conviction instead of a shared evidence record.",
  },
  {
    title: "Ownership is ambiguous",
    body: "Everyone can describe the pressure, but no one has enough authority, mandate, or sponsorship to move it cleanly.",
  },
  {
    title: "Authority and execution separate",
    body: "Approval exists in one part of the organisation while the people who must execute carry different constraints.",
  },
  {
    title: "Delay becomes organisational",
    body: "The issue stops being a single decision and becomes a pattern of meetings, deferrals, missed windows, and unmanaged consequence.",
  },
];

const TESTS = [
  "Decision ownership and sponsor clarity",
  "Evidence sufficiency and missing proof",
  "Authority, mandate, and escalation pressure",
  "Dependency load across functions and teams",
  "Financial, client, market, and compliance exposure",
  "Board challenge readiness and first failure point",
];

const PATHWAY: PathwayItem[] = [
  {
    label: "Enterprise Decision Scan",
    posture: "Assessment entry",
    description: "A public organisational scan for the decision under pressure.",
    output: "Identifies the primary contradiction, cost band, and recommended entry path.",
    href: "/enterprise-decision-scan",
  },
  {
    label: "Executive Reporting",
    posture: "Board-grade judgement",
    description: "Converts carried evidence into decision options, recommendation posture, and governance conditions.",
    output: "Produces leadership-ready judgement when the evidence threshold is met.",
    href: "/diagnostics/executive-reporting",
  },
  {
    label: "Boardroom Mode",
    posture: "Evidence-gated",
    description: "Prepares a record for board challenge only when the evidence justifies that posture.",
    output: "Boardroom material remains gated until the decision record supports it.",
    href: "/boardroom",
  },
  {
    label: "Strategy Room",
    posture: "Governed execution",
    description: "Turns the decision record into a controlled intervention and execution sequence.",
    output: "Defines the next governed move, owner implications, and checkpoint posture.",
    href: "/strategy-room",
  },
  {
    label: "Retainer Review",
    posture: "Readiness review",
    description: "Assesses whether durable decision history exists for continuing oversight consideration.",
    output: "Retainer Oversight is not automatically activated from this pathway.",
    href: "/engagements/retained-oversight",
  },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        ...mono,
        fontSize: "9px",
        letterSpacing: "0.24em",
        textTransform: "uppercase",
        color: `${GOLD}88`,
      }}
    >
      {children}
    </p>
  );
}

function PrimaryLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group inline-flex min-h-[48px] max-w-full items-center gap-2 border px-5 py-3 text-left leading-[1.45] transition-all duration-150 hover:-translate-y-px"
      style={{
        ...mono,
        borderColor: `${GOLD}50`,
        backgroundColor: `${GOLD}12`,
        color: "#F5F5F5",
        fontSize: "9px",
        letterSpacing: "0.16em",
        textTransform: "uppercase",
      }}
    >
      {children}
      <ArrowRight className="h-3 w-3 shrink-0 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

function SecondaryLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group inline-flex min-h-[48px] max-w-full items-center gap-2 border border-white/[0.09] px-5 py-3 text-left leading-[1.45] text-white/[0.50] transition-all duration-150 hover:-translate-y-px hover:border-white/[0.16] hover:text-white/[0.72]"
      style={{
        ...mono,
        fontSize: "9px",
        letterSpacing: "0.16em",
        textTransform: "uppercase",
      }}
    >
      {children}
      <ArrowRight className="h-3 w-3 shrink-0 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

export default function EnterpriseLandingPage() {
  const [decisionLabel, setDecisionLabel] = React.useState("");
  const [monthlyExposure, setMonthlyExposure] = React.useState("250000");
  const [deteriorationProbability, setDeteriorationProbability] = React.useState("35");
  const [delayPeriod, setDelayPeriod] = React.useState("3");

  const monthlyExposureValue = Math.max(0, Number(monthlyExposure) || 0);
  const probabilityValue = Math.min(100, Math.max(0, Number(deteriorationProbability) || 0));
  const delayPeriodValue = Math.max(0, Number(delayPeriod) || 0);
  const estimatedMonthlyDecisionExposure = monthlyExposureValue * (probabilityValue / 100);
  const totalDelayExposure = estimatedMonthlyDecisionExposure * delayPeriodValue;

  return (
    <Layout
      title="Enterprise Decision Infrastructure | Abraham of London"
      description="Decision Infrastructure for organisations under pressure. Test evidence, ownership, authority, and execution before serious decisions fail."
      canonicalUrl="/enterprise"
      fullWidth
      headerTransparent
    >
      <div style={{ backgroundColor: VOID, minHeight: "100vh" }}>
        <section className="px-6 pb-14 pt-[128px] lg:px-12 lg:pb-18 lg:pt-36">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_0.78fr] lg:items-end">
            <div>
              <Eyebrow>Enterprise</Eyebrow>
              <h1
                className="mt-6 max-w-[58rem] break-words"
                style={{
                  ...serif,
                  color: "#F5F5F5",
                  fontSize: "clamp(2.6rem, 7vw, 5.2rem)",
                  lineHeight: 0.95,
                  fontStyle: "italic",
                }}
              >
                Decision Infrastructure for organisations under pressure.
              </h1>
              <p className="mt-7 max-w-[66ch] text-[16px] leading-[1.85] text-white/[0.60]">
                For organisations where serious decisions fail because evidence, ownership, authority, and execution are misaligned.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <PrimaryLink href="/enterprise-decision-scan">Run organisational scan</PrimaryLink>
                <SecondaryLink href="/boardroom-brief">Generate Boardroom Brief</SecondaryLink>
                <SecondaryLink href="/products">View products</SecondaryLink>
              </div>
            </div>

            <div className="border border-white/[0.075] bg-white/[0.018] p-5 lg:p-6">
              <div className="flex items-center gap-3">
                <Building2 className="h-4 w-4" style={{ color: `${GOLD}AA` }} />
                <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.38)" }}>
                  Commercial posture
                </p>
              </div>
              <div className="mt-5 grid gap-px bg-white/[0.05]">
                {[
                  ["Not a consultancy pitch", "A product pathway for testing organisational decision failure."],
                  ["Not the assessment route", "/enterprise-decision-scan remains the scan route."],
                  ["Not automatic oversight", "Retainer Oversight requires readiness review and durable history."],
                ].map(([label, body]) => (
                  <div key={label} className="bg-[#030305] p-4">
                    <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: `${GOLD}90` }}>
                      {label}
                    </p>
                    <p className="mt-2 text-[13px] leading-[1.7] text-white/[0.48]">{body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-white/[0.06] px-6 py-12 lg:px-12">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr]">
              <div>
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4" style={{ color: `${GOLD}AA` }} />
                  <Eyebrow>What breaks inside organisations</Eyebrow>
                </div>
                <h2
                  className="mt-5 max-w-[30rem]"
                  style={{
                    ...serif,
                    color: "rgba(255,255,255,0.90)",
                    fontSize: "clamp(1.9rem, 5vw, 3rem)",
                    lineHeight: 1,
                    fontStyle: "italic",
                  }}
                >
                  The failure usually sits between teams, not inside one person.
                </h2>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {BREAK_POINTS.map((item) => (
                  <article key={item.title} className="border border-white/[0.075] bg-white/[0.016] p-5">
                    <h3
                      style={{
                        ...serif,
                        color: "rgba(255,255,255,0.86)",
                        fontSize: "1.28rem",
                        lineHeight: 1.1,
                        fontStyle: "italic",
                      }}
                    >
                      {item.title}
                    </h3>
                    <p className="mt-3 text-[14px] leading-[1.75] text-white/[0.52]">{item.body}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 py-14 lg:px-12 lg:py-16">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <div className="flex items-center gap-3">
                <Gauge className="h-4 w-4" style={{ color: `${GOLD}AA` }} />
                <Eyebrow>What the system tests</Eyebrow>
              </div>
              <h2
                className="mt-5 max-w-[32rem]"
                style={{
                  ...serif,
                  color: "rgba(255,255,255,0.90)",
                  fontSize: "clamp(1.9rem, 5vw, 3rem)",
                  lineHeight: 1,
                  fontStyle: "italic",
                }}
              >
                It tests the decision record before pressure turns into failure.
              </h2>
              <p className="mt-5 max-w-[58ch] text-[15px] leading-[1.85] text-white/[0.52]">
                The organisation does not need another opinion layer. It needs a disciplined way to see where a decision is unsupported, ownerless, unauthorised, or unable to survive execution.
              </p>
            </div>
            <div className="grid gap-px bg-white/[0.05] md:grid-cols-2">
              {TESTS.map((test) => (
                <div key={test} className="flex min-h-[86px] items-start gap-3 bg-[#030305] p-5">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" style={{ color: `${GOLD}A8` }} />
                  <p className="text-[14px] leading-[1.65] text-white/[0.64]">{test}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-white/[0.06] px-6 py-14 lg:px-12 lg:py-16">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 grid gap-6 lg:grid-cols-[0.72fr_1.28fr] lg:items-end">
              <div>
                <div className="flex items-center gap-3">
                  <Layers3 className="h-4 w-4" style={{ color: `${GOLD}AA` }} />
                  <Eyebrow>Product pathway</Eyebrow>
                </div>
                <h2
                  className="mt-5 max-w-[30rem]"
                  style={{
                    ...serif,
                    color: "rgba(255,255,255,0.90)",
                    fontSize: "clamp(1.9rem, 5vw, 3rem)",
                    lineHeight: 1,
                    fontStyle: "italic",
                  }}
                >
                  Progression is earned by evidence.
                </h2>
              </div>
              <p className="max-w-[72ch] text-[15px] leading-[1.85] text-white/[0.52]">
                The pathway does not sell every surface as available on demand. It starts with organisational assessment, then escalates only when the record justifies reporting, board posture, execution support, or retainer review.
              </p>
            </div>

            <div className="grid gap-3 lg:grid-cols-5">
              {PATHWAY.map((item, index) => (
                <article key={item.label} className="flex min-h-[330px] flex-col border border-white/[0.075] bg-white/[0.016] p-5">
                  <div className="flex items-center justify-between gap-3">
                    <span style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: `${GOLD}90` }}>
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="border border-white/[0.08] px-2.5 py-1 text-white/[0.38]" style={{ ...mono, fontSize: "7px", letterSpacing: "0.14em", textTransform: "uppercase" }}>
                      {item.posture}
                    </span>
                  </div>
                  <h3
                    className="mt-5"
                    style={{
                      ...serif,
                      color: "rgba(255,255,255,0.88)",
                      fontSize: "1.28rem",
                      lineHeight: 1.1,
                      fontStyle: "italic",
                    }}
                  >
                    {item.label}
                  </h3>
                  <p className="mt-3 text-[13px] leading-[1.7] text-white/[0.52]">{item.description}</p>
                  <p className="mt-4 border-t border-white/[0.06] pt-4 text-[12px] leading-[1.65] text-white/[0.40]">
                    {item.output}
                  </p>
                  {item.href ? (
                    <Link
                      href={item.href}
                      className="group mt-auto inline-flex items-center gap-2 pt-5 transition-colors text-white/[0.42] hover:text-white/[0.72]"
                      style={{ ...mono, fontSize: "8px", letterSpacing: "0.16em", textTransform: "uppercase" }}
                    >
                      View route
                      <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  ) : null}
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-white/[0.06] px-6 py-14 lg:px-12 lg:py-16">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
            <div>
              <div className="flex items-center gap-3">
                <Calculator className="h-4 w-4" style={{ color: `${GOLD}AA` }} />
                <Eyebrow>Cost of delay</Eyebrow>
              </div>
              <h2
                className="mt-5 max-w-[32rem]"
                style={{
                  ...serif,
                  color: "rgba(255,255,255,0.90)",
                  fontSize: "clamp(1.9rem, 5vw, 3rem)",
                  lineHeight: 1,
                  fontStyle: "italic",
                }}
              >
                Estimate the exposure carried while a decision waits.
              </h2>
              <p className="mt-5 max-w-[58ch] text-[15px] leading-[1.85] text-white/[0.52]">
                Use this as a directional pressure check before the organisational scan. It does not store inputs, provide financial advice, or replace the enterprise scan.
              </p>
            </div>

            <div className="grid gap-px bg-white/[0.05] lg:grid-cols-[1fr_0.86fr]">
              <div className="bg-[#030305] p-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="md:col-span-2">
                    <span style={{ ...mono, fontSize: "8px", letterSpacing: "0.16em", textTransform: "uppercase", color: `${GOLD}90` }}>
                      Decision label
                    </span>
                    <input
                      value={decisionLabel}
                      onChange={(event) => setDecisionLabel(event.target.value)}
                      placeholder="Example: delayed market launch"
                      className="mt-2 min-h-[46px] w-full border border-white/[0.09] bg-white/[0.018] px-3 text-[14px] text-white/[0.74] outline-none transition-colors placeholder:text-white/[0.26] focus:border-white/[0.18]"
                    />
                  </label>
                  <label>
                    <span style={{ ...mono, fontSize: "8px", letterSpacing: "0.16em", textTransform: "uppercase", color: `${GOLD}90` }}>
                      Monthly revenue/cost exposure
                    </span>
                    <input
                      value={monthlyExposure}
                      onChange={(event) => setMonthlyExposure(event.target.value)}
                      type="number"
                      min="0"
                      inputMode="decimal"
                      className="mt-2 min-h-[46px] w-full border border-white/[0.09] bg-white/[0.018] px-3 text-[14px] text-white/[0.74] outline-none transition-colors focus:border-white/[0.18]"
                    />
                  </label>
                  <label>
                    <span style={{ ...mono, fontSize: "8px", letterSpacing: "0.16em", textTransform: "uppercase", color: `${GOLD}90` }}>
                      Deterioration probability
                    </span>
                    <div className="mt-2 flex min-h-[46px] items-center border border-white/[0.09] bg-white/[0.018] focus-within:border-white/[0.18]">
                      <input
                        value={deteriorationProbability}
                        onChange={(event) => setDeteriorationProbability(event.target.value)}
                        type="number"
                        min="0"
                        max="100"
                        inputMode="decimal"
                        className="min-h-[44px] w-full bg-transparent px-3 text-[14px] text-white/[0.74] outline-none"
                      />
                      <span className="px-3 text-[13px] text-white/[0.38]">%</span>
                    </div>
                  </label>
                  <label className="md:col-span-2">
                    <span style={{ ...mono, fontSize: "8px", letterSpacing: "0.16em", textTransform: "uppercase", color: `${GOLD}90` }}>
                      Expected delay period
                    </span>
                    <div className="mt-2 flex min-h-[46px] items-center border border-white/[0.09] bg-white/[0.018] focus-within:border-white/[0.18]">
                      <input
                        value={delayPeriod}
                        onChange={(event) => setDelayPeriod(event.target.value)}
                        type="number"
                        min="0"
                        inputMode="decimal"
                        className="min-h-[44px] w-full bg-transparent px-3 text-[14px] text-white/[0.74] outline-none"
                      />
                      <span className="px-3 text-[13px] text-white/[0.38]">months</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="bg-[#030305] p-5">
                <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.38)" }}>
                  {decisionLabel.trim() || "Current decision"}
                </p>
                <div className="mt-5 grid gap-3">
                  <div className="border border-white/[0.075] bg-white/[0.016] p-4">
                    <p className="text-[12px] leading-[1.6] text-white/[0.42]">Estimated monthly decision exposure</p>
                    <p
                      className="mt-2 break-words"
                      style={{ ...serif, color: "rgba(255,255,255,0.90)", fontSize: "2rem", lineHeight: 1, fontStyle: "italic" }}
                    >
                      {formatCurrency(estimatedMonthlyDecisionExposure)}
                    </p>
                  </div>
                  <div className="border border-white/[0.075] bg-white/[0.016] p-4">
                    <p className="text-[12px] leading-[1.6] text-white/[0.42]">Total delay exposure</p>
                    <p
                      className="mt-2 break-words"
                      style={{ ...serif, color: `${GOLD}`, fontSize: "2rem", lineHeight: 1, fontStyle: "italic" }}
                    >
                      {formatCurrency(totalDelayExposure)}
                    </p>
                  </div>
                </div>
                <p className="mt-4 border-t border-white/[0.06] pt-4 text-[12px] leading-[1.7] text-white/[0.42]">
                  This is an estimate, not a financial forecast.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 py-14 lg:px-12">
          <div className="mx-auto grid max-w-7xl gap-6 border border-white/[0.075] bg-white/[0.018] p-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4" style={{ color: `${GOLD}AA` }} />
                <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.2em", textTransform: "uppercase", color: `${GOLD}90` }}>
                  Proof of value
                </p>
              </div>
              <p className="mt-3 max-w-[78ch] text-[14px] leading-[1.85] text-white/[0.52]">
                Start with one live organisational decision. The scan shows whether the issue is evidence, ownership, authority, or execution. The brief gives buyers a board-facing proof surface before deeper paid progression.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 md:justify-end">
              <PrimaryLink href="/enterprise-decision-scan">Run organisational scan</PrimaryLink>
              <SecondaryLink href="/boardroom-brief">Generate Boardroom Brief</SecondaryLink>
              <SecondaryLink href="/products">View products</SecondaryLink>
            </div>
          </div>
        </section>

        <section className="border-t border-white/[0.06] px-6 py-12 lg:px-12">
          <div className="mx-auto max-w-7xl">
            <div className="flex gap-4 border border-white/[0.075] bg-white/[0.012] p-5">
              <Lock className="mt-1 h-4 w-4 shrink-0" style={{ color: `${GOLD}99` }} />
              <div>
                <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.2em", textTransform: "uppercase", color: `${GOLD}90` }}>
                  Boundary
                </p>
                <p className="mt-3 max-w-[84ch] text-[14px] leading-[1.85] text-white/[0.50]">
                  Retainer Oversight requires readiness review and is not automatically activated. It depends on durable recommendation and outcome history, not a single landing-page action or one assessment submission.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
