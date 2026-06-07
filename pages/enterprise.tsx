/**
 * pages/enterprise.tsx — /enterprise
 *
 * Enterprise Decision Infrastructure — the first-class public lane.
 *
 * Section order (spec-compliant):
 *   1.  Hero — problem-first claim + buyer identification
 *   2.  Who this is for — four buyer profiles
 *   3.  What breaks — compounding sequence, not flat list
 *   4.  Infrastructure vs consulting — explicit differentiation
 *   5.  What the system tests — framed as questions, not bullets
 *   6.  The pathway — governed stages with gate conditions
 *   7.  Evidence — link to three published cases
 *   8.  ROI calculator — only shows result after interaction
 *   9.  Routing recommendation from calculator
 *   10. FAQ
 *   11. Enquiry form
 *   12. Boundary note (retainer governance, as narrative)
 *
 * Rules:
 *   - No predictive language, no live-feed language
 *   - No self-serve retainer activation claim
 *   - Minimum 12px for CTA text (accessibility)
 *   - Analytics hooks: emitJourneyEvent, trackScrollDepth, advanceConviction, trackHesitation
 */

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Calculator,
  ChevronRight,
  FileText,
  Gauge,
  Layers3,
  Lock,
  MessageSquare,
  Shield,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import Layout from "@/components/Layout";

// ─── Design tokens ────────────────────────────────────────────────────────────

const GOLD = "#C9A96E";
const VOID = "rgb(3 3 5)";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

// ─── Data ─────────────────────────────────────────────────────────────────────

const BUYERS = [
  {
    role: "Chief Executive",
    pressure: "Has committed the organisation to a direction. Needs to know whether the organisation can actually execute it — before the board meeting does.",
    signal: "Execution confidence",
  },
  {
    role: "Chief Financial Officer",
    pressure: "Is watching a capital allocation decision decay through delay. Each deferral is costing money that has not been named, measured, or reported.",
    signal: "Delay exposure",
  },
  {
    role: "Chief Operating Officer",
    pressure: "Has seen three handovers fail at the boundary between functions. The failure is not strategic disagreement — it is structural misalignment at execution.",
    signal: "Execution structure",
  },
  {
    role: "Board Chair / Non-Executive",
    pressure: "Is preparing for a board conversation where the decision has been presented but the evidence record, authority chain, and governance posture have not been tested.",
    signal: "Board readiness",
  },
];

type BreakPoint = { step: number; title: string; body: string; consequence: string; systemic: string };
const BREAK_POINTS: BreakPoint[] = [
  {
    step: 1,
    title: "Evidence is scattered",
    body: "The decision is discussed through anecdotes, partial data, and private conviction. No shared evidence record exists. Every meeting restarts from different assumptions.",
    consequence: "System tests: evidence sufficiency and missing proof",
    systemic: "Without this: every discussion is the first one.",
  },
  {
    step: 2,
    title: "Ownership is ambiguous",
    body: "Everyone can describe the pressure. No one has enough authority, mandate, or sponsorship to move it cleanly. Approval exists without accountability.",
    consequence: "System tests: decision ownership and sponsor clarity",
    systemic: "Without this: approval and accountability become separated.",
  },
  {
    step: 3,
    title: "Authority and execution separate",
    body: "The people who approved the decision carry different constraints than the people who must execute it. Each boundary becomes a failure point.",
    consequence: "System tests: authority, mandate, and escalation pressure",
    systemic: "Without this: execution collapses at the first handover.",
  },
  {
    step: 4,
    title: "Delay becomes organisational",
    body: "The issue stops being a single decision. It becomes a pattern of meetings, deferrals, missed windows, and unmanaged consequence. The cost accumulates without a name.",
    consequence: "System tests: dependency load and financial exposure",
    systemic: "Without this: the cost of delay is real but invisible.",
  },
];

type PathwayStage = {
  step: number;
  label: string;
  posture: string;
  gateLabel: string;
  gate: string;
  tests: string;
  produces: string;
  href?: string;
  cta: string;
  isGated: boolean;
};
const PATHWAY: PathwayStage[] = [
  {
    step: 1,
    label: "Enterprise Decision Scan",
    posture: "Assessment entry",
    gateLabel: "Opens when",
    gate: "Decision pressure exists but the primary failure point has not been named.",
    tests: "Whether the issue is evidence, ownership, authority, execution, or dependency.",
    produces: "Primary failure classification, cost band, and recommended entry path.",
    href: "/enterprise-decision-scan",
    cta: "Run organisational scan",
    isGated: false,
  },
  {
    step: 2,
    label: "Team Assessment",
    posture: "Alignment test",
    gateLabel: "Opens when",
    gate: "Team disagreement exists or execution is failing despite apparent consensus.",
    tests: "Whether team members describe the same decision, owner, blocker, and evidence position.",
    produces: "Divergence map, primary conflict zone, and recommended next governance move.",
    href: "/diagnostics/team-assessment",
    cta: "Assess team alignment",
    isGated: false,
  },
  {
    step: 3,
    label: "Executive Reporting",
    posture: "Evidence threshold",
    gateLabel: "Opens when",
    gate: "Sufficient evidence has been carried forward to justify board-grade judgement.",
    tests: "Whether the evidence record can produce a defensible, internally consistent recommendation.",
    produces: "Executive Report: recommendation posture, risk dimensions, board challenge readiness, PDF artifact.",
    href: "/diagnostics/executive-reporting",
    cta: "Proceed to reporting",
    isGated: true,
  },
  {
    step: 4,
    label: "Boardroom Brief",
    posture: "Board-facing dossier",
    gateLabel: "Opens when",
    gate: "Evidence justifies a governed dossier for board-level presentation.",
    tests: "Whether the decision record can survive adversarial board scrutiny.",
    produces: "Paid BoardroomDossier: structured recommendation, evidence chain, authority analysis, PDF with SHA-256 hash.",
    href: "/boardroom-brief",
    cta: "Generate Boardroom Brief",
    isGated: true,
  },
  {
    step: 5,
    label: "Strategy Room",
    posture: "Governed execution",
    gateLabel: "Opens when",
    gate: "The decision is approved and execution must be governed with checkpoints.",
    tests: "Whether the decision can be structured as governed execution with named owners.",
    produces: "StrategyCase: owner, checkpoints, blocker log, intervention history, and return brief trigger.",
    href: "/strategy-room",
    cta: "Govern execution",
    isGated: true,
  },
  {
    step: 6,
    label: "Retainer Review",
    posture: "Readiness-gated",
    gateLabel: "Opens only when",
    gate: "Durable decision history across multiple cycles and repeated high-stakes decisions have accumulated sufficient evidence for ongoing oversight consideration.",
    tests: "Whether the evidence record across runs, dossiers, outcomes, and risk triggers justifies ongoing oversight rather than periodic engagements.",
    produces: "Readiness evaluation record. Admin review required before Retainer Oversight can be offered.",
    href: "/engagements/retained-oversight",
    cta: "Request readiness review",
    isGated: true,
  },
];

const TESTS = [
  { question: "Who owns this decision — and will they still own it in 90 days?", dimension: "Ownership" },
  { question: "Does the evidence record justify the position being taken?", dimension: "Evidence" },
  { question: "Does the authority match the accountability?", dimension: "Authority" },
  { question: "How many functions must move — and in what sequence?", dimension: "Dependencies" },
  { question: "What is the financial, client, market, and compliance exposure if this fails?", dimension: "Exposure" },
  { question: "Can this recommendation survive the first board challenge?", dimension: "Board readiness" },
];

const FAQ = [
  {
    q: "Is this consulting?",
    a: "No. This is infrastructure with defined inputs, governed outputs, and an auditable evidence chain. There is no ongoing advisory relationship from a scan or brief. You do not get opinions — you get a tested, structured decision record.",
  },
  {
    q: "Who sees the outputs?",
    a: "You do. Admin has delivery visibility for quality assurance only. Outputs are not shared, licensed, or used in any other context. Every dossier and report is linked to a paid order with a cryptographic hash.",
  },
  {
    q: "How long does the pathway take?",
    a: "Enterprise Decision Scan: 20–25 minutes. Team Assessment: depends on respondent count, typically 24–48 hours. Executive Reporting: same-day delivery once evidence is submitted. Boardroom Brief: same-day. Strategy Room: structured sessions over weeks. Retainer Review: weeks of evidence accumulation before eligibility.",
  },
  {
    q: "What if we are not ready for the full pathway?",
    a: "Start with the free Enterprise Decision Scan. It identifies which stage applies to your current situation. Many organisations use only the scan and one paid stage — the full pathway is not required.",
  },
  {
    q: "What happens to our data?",
    a: "Decision data is not used for training, benchmarking, or third-party analysis without explicit consent. Evidence records are linked to your account only. You can request deletion under our data policy.",
  },
  {
    q: "Can this support board papers?",
    a: "Yes. Executive Reports and Boardroom Briefs are designed as board-facing documents with evidence chains, recommendation postures, and governance conditions that are structured for board review.",
  },
  {
    q: "When is Retainer Oversight available?",
    a: "Retainer Oversight requires readiness review and admin approval. It is not available on demand. It depends on durable decision history — typically multiple completed instrument runs, at least one verified outcome record, and repeated high-risk triggers. Even then, admin must approve before oversight is offered.",
  },
];

// ─── Utilities ────────────────────────────────────────────────────────────────

function formatGBP(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

type ExposureRoute = { label: string; route: string; href: string };
function getExposureRouting(monthlyExposure: number): ExposureRoute {
  if (monthlyExposure <= 0) return { label: "", route: "", href: "" };
  if (monthlyExposure < 50_000)
    return {
      label: "This level of exposure is appropriate for a self-serve instrument.",
      route: "Recommended: Decision Exposure Instrument or Pressure Signal.",
      href: "/pressure",
    };
  if (monthlyExposure < 250_000)
    return {
      label: "This exposure level typically justifies a structured brief or executive report.",
      route: "Recommended: Boardroom Brief or Executive Reporting.",
      href: "/boardroom-brief",
    };
  return {
    label: "At this exposure level, a structured enterprise scan and board-facing brief are the appropriate entry.",
    route: "Recommended: Enterprise Assessment + Boardroom Brief. Contact us to confirm the right pathway.",
    href: "/enterprise-decision-scan",
  };
}

// ─── Primitives ───────────────────────────────────────────────────────────────

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ ...mono, fontSize: "11px", letterSpacing: "0.24em", textTransform: "uppercase", color: `${GOLD}99` }}>
      {children}
    </p>
  );
}

function SectionHeading({ children, maxWidth = "30rem" }: { children: React.ReactNode; maxWidth?: string }) {
  return (
    <h2
      className="mt-5"
      style={{ ...serif, color: "rgba(255,255,255,0.92)", fontSize: "clamp(1.9rem, 5vw, 3rem)", lineHeight: 1, fontStyle: "italic", maxWidth }}
    >
      {children}
    </h2>
  );
}

function PrimaryLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="group inline-flex min-h-[48px] items-center gap-2 border px-5 py-3 text-left transition-all duration-150 hover:-translate-y-px focus:outline-none focus:ring-2 focus:ring-amber-400/40"
      style={{ ...mono, borderColor: `${GOLD}55`, backgroundColor: `${GOLD}14`, color: "#F0EDE8", fontSize: "12px", letterSpacing: "0.12em", textTransform: "uppercase" }}
    >
      {children}
      <ArrowRight className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden />
    </Link>
  );
}

function SecondaryLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="group inline-flex min-h-[48px] items-center gap-2 border border-white/[0.10] px-5 py-3 text-white/[0.52] transition-all duration-150 hover:-translate-y-px hover:border-white/[0.20] hover:text-white/[0.78] focus:outline-none focus:ring-2 focus:ring-white/20"
      style={{ ...mono, fontSize: "12px", letterSpacing: "0.12em", textTransform: "uppercase" }}
    >
      {children}
      <ArrowRight className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden />
    </Link>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function EnterpriseLandingPage() {
  // Calculator state
  const [decisionLabel, setDecisionLabel] = React.useState("");
  const [monthlyExposure, setMonthlyExposure] = React.useState("");
  const [deteriorationProbability, setDeteriorationProbability] = React.useState("");
  const [delayPeriod, setDelayPeriod] = React.useState("");
  const [calculatorTouched, setCalculatorTouched] = React.useState(false);

  // FAQ state
  const [openFaq, setOpenFaq] = React.useState<number | null>(null);

  // Enquiry state
  const [enquiry, setEnquiry] = React.useState({
    name: "", email: "", role: "", organisation: "",
    decisionPressure: "", deadline: "", estimatedExposure: "",
    preferredRoute: "unsure" as const, consentToContact: false,
  });
  const [enquiryStatus, setEnquiryStatus] = React.useState<"idle" | "loading" | "success" | "error">("idle");
  const [enquiryMessage, setEnquiryMessage] = React.useState("");

  // Calculator computed values
  const exposureVal = Math.max(0, Number(monthlyExposure) || 0);
  const probVal = Math.min(100, Math.max(0, Number(deteriorationProbability) || 0));
  const delayVal = Math.max(0, Number(delayPeriod) || 0);
  const monthlyDecisionExposure = exposureVal * (probVal / 100);
  const totalDelayExposure = monthlyDecisionExposure * delayVal;
  const routing = getExposureRouting(exposureVal);
  const showCalcResult = calculatorTouched && exposureVal > 0;

  // Analytics
  React.useEffect(() => {
    try {
      const { emitJourneyEvent } = require("@/lib/analytics/journey-client");
      const { trackScrollDepth, trackHesitation, advanceConviction } = require("@/lib/analytics/hesitation");
      emitJourneyEvent("enterprise_page_viewed", { entryPath: "/enterprise" });
      advanceConviction("ENTERPRISE_INTENT");
      const cleanScroll = trackScrollDepth("enterprise", [25, 50, 75, 100]);
      const cleanHesitation = trackHesitation({ page: "enterprise", idleTimeout: 8000 });
      return () => { cleanScroll(); cleanHesitation(); };
    } catch { /* analytics non-fatal */ }
  }, []);

  // Enquiry submit
  async function handleEnquirySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (enquiryStatus === "loading") return;
    setEnquiryStatus("loading");
    setEnquiryMessage("");
    try {
      const res = await fetch("/api/enterprise/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...enquiry, consentToContact: enquiry.consentToContact }),
      });
      const data = await res.json() as { ok: boolean; message?: string; error?: string };
      if (res.ok && data.ok) {
        setEnquiryStatus("success");
        setEnquiryMessage(data.message ?? "Enquiry received.");
      } else {
        throw new Error(data.error ?? "Submission failed");
      }
    } catch (err) {
      setEnquiryStatus("error");
      setEnquiryMessage(err instanceof Error ? err.message : "Submission failed. Please try again or email us directly.");
    }
  }

  return (
    <Layout
      title="Enterprise Decision Infrastructure | Abraham of London"
      description="Decision infrastructure for organisations where serious decisions fail because evidence, ownership, authority, and execution are misaligned. Test, structure, govern."
      canonicalUrl="/enterprise"
      fullWidth
      headerTransparent
    >
      <div style={{ backgroundColor: VOID, minHeight: "100vh" }}>

        {/* ── 1. HERO ────────────────────────────────────────────────────────── */}
        <section aria-label="Hero" className="px-6 pb-14 pt-[128px] lg:px-12 lg:pb-20 lg:pt-40">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_0.72fr] lg:items-end">
            <div>
              <Eyebrow>Enterprise</Eyebrow>
              <p className="mt-4" style={{ ...mono, fontSize: "13px", letterSpacing: "0.05em", color: "rgba(255,255,255,0.38)", maxWidth: "58ch", lineHeight: 1.7 }}>
                The meeting agreed. Nothing moved.
              </p>
              <h1
                className="mt-4 max-w-[22ch]"
                style={{ ...serif, color: "#F5F0EA", fontSize: "clamp(2.8rem, 7vw, 5.4rem)", lineHeight: 0.94, fontStyle: "italic" }}
              >
                Decision infrastructure for organisations that have stopped pretending alignment is enough.
              </h1>
              <p className="mt-7 max-w-[62ch] text-[16px] leading-[1.9] text-white/[0.56]">
                When serious decisions fail, the cause is almost never strategy. It is evidence that was not shared, ownership that was not clear, authority that did not match execution, and delay that was not measured.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <PrimaryLink href="/enterprise-decision-scan">Run organisational scan</PrimaryLink>
                <SecondaryLink href="/boardroom-brief">Generate Boardroom Brief</SecondaryLink>
              </div>
            </div>

            {/* Output promise panel — affirmative, not defensive */}
            <div className="border border-white/[0.07] bg-white/[0.016] p-5 lg:p-6">
              <div className="flex items-center gap-3">
                <Building2 className="h-4 w-4 shrink-0" style={{ color: `${GOLD}AA` }} aria-hidden />
                <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>
                  What you leave with
                </p>
              </div>
              <ul className="mt-5 grid gap-px bg-white/[0.04]" role="list">
                {[
                  ["A decision record", "Evidence captured, structured, and traceable."],
                  ["Evidence gaps named", "What is missing, and why it matters for the outcome."],
                  ["Authority risks surfaced", "Who owns it, who must move, what mandate requires."],
                  ["Consequence exposure", "The cost of delay, named and measured."],
                  ["Next admissible move", "One specific next governance step — not a list of options."],
                ].map(([label, body]) => (
                  <li key={label as string} className="bg-[#030305] p-4">
                    <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.18em", textTransform: "uppercase", color: `${GOLD}90` }}>
                      {label as string}
                    </p>
                    <p className="mt-1.5 text-[13px] leading-[1.65] text-white/[0.46]">{body as string}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ── 2. WHO THIS IS FOR ─────────────────────────────────────────────── */}
        <section aria-label="Who this is for" className="border-y border-white/[0.06] px-6 py-14 lg:px-12 lg:py-16">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
              <div>
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4 shrink-0" style={{ color: `${GOLD}AA` }} aria-hidden />
                  <Eyebrow>Who this is for</Eyebrow>
                </div>
                <SectionHeading>Four situations where this infrastructure becomes necessary.</SectionHeading>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {BUYERS.map((buyer) => (
                  <article
                    key={buyer.role}
                    className="border border-white/[0.07] bg-white/[0.016] p-5"
                  >
                    <div style={{ ...mono, fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: `${GOLD}80` }}>
                      {buyer.role}
                    </div>
                    <p className="mt-3 text-[14px] leading-[1.75] text-white/[0.56]">{buyer.pressure}</p>
                    <div className="mt-4 flex items-center gap-2 border-t border-white/[0.06] pt-3">
                      <div className="h-1 w-1 rounded-full" style={{ backgroundColor: `${GOLD}80` }} aria-hidden />
                      <span style={{ ...mono, fontSize: "9px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.30)" }}>
                        Signal: {buyer.signal}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── 3. WHAT BREAKS — COMPOUNDING SEQUENCE ─────────────────────────── */}
        <section aria-label="What breaks inside organisations" className="px-6 py-14 lg:px-12 lg:py-16">
          <div className="mx-auto max-w-7xl">
            <div className="mb-10 grid gap-6 lg:grid-cols-[0.72fr_1.28fr] lg:items-end">
              <div>
                <Eyebrow>What breaks inside organisations</Eyebrow>
                <SectionHeading>The failure usually compounds. Each stage makes the next worse.</SectionHeading>
              </div>
              <p className="max-w-[68ch] text-[15px] leading-[1.85] text-white/[0.50]">
                These are not independent problems. They are a sequence. Evidence scatter creates ownership ambiguity. Ownership ambiguity separates authority from execution. Separated authority and execution turn a single decision into an organisational delay pattern.
              </p>
            </div>

            {/* Compounding sequence — connected by step numbers */}
            <div className="relative grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {BREAK_POINTS.map((item, idx) => (
                <article
                  key={item.title}
                  className="flex flex-col border border-white/[0.07] bg-white/[0.014] p-5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span style={{ ...mono, fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", color: `${GOLD}70` }}>
                      {String(item.step).padStart(2, "0")}
                    </span>
                    {idx < BREAK_POINTS.length - 1 && (
                      <ChevronRight className="hidden xl:block h-3.5 w-3.5 text-white/[0.18]" aria-hidden />
                    )}
                  </div>
                  <h3
                    className="mt-4"
                    style={{ ...serif, color: "rgba(255,255,255,0.88)", fontSize: "1.25rem", lineHeight: 1.1, fontStyle: "italic" }}
                  >
                    {item.title}
                  </h3>
                  <p className="mt-3 flex-1 text-[13px] leading-[1.7] text-white/[0.50]">{item.body}</p>
                  <div className="mt-4 border-t border-white/[0.06] pt-4">
                    <p style={{ ...mono, fontSize: "9px", letterSpacing: "0.16em", textTransform: "uppercase", color: `${GOLD}70` }}>
                      {item.consequence}
                    </p>
                    <p className="mt-1.5 text-[12px] leading-[1.55] text-white/[0.30]">{item.systemic}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── 4. INFRASTRUCTURE VS CONSULTING ────────────────────────────────── */}
        <section aria-label="Infrastructure, not consulting" className="border-y border-white/[0.06] px-6 py-14 lg:px-12 lg:py-16">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
              <div>
                <Eyebrow>Infrastructure, not consulting</Eyebrow>
                <SectionHeading maxWidth="34rem">The distinction that changes what is possible.</SectionHeading>
                <p className="mt-5 max-w-[60ch] text-[15px] leading-[1.85] text-white/[0.52]">
                  Consulting provides an opinion. It is delivered by a person, shaped by their context, and leaves when the engagement ends. Infrastructure provides a governed process. It does not require a relationship, does not depend on a single perspective, and produces outputs that can be challenged, audited, and traced.
                </p>
              </div>
              <div className="grid gap-px bg-white/[0.05] sm:grid-cols-2">
                {([
                  ["Consulting", [
                    "Opinion from a practitioner",
                    "Output depends on the consultant's context",
                    "Leaves when the engagement ends",
                    "Evidence is assembled by the advisor",
                    "Accountability is advisory",
                    "Cannot be challenged by evidence",
                  ]],
                  ["This infrastructure", [
                    "Governed process with defined outputs",
                    "Output derived from your evidence record",
                    "Artifact persists after the session ends",
                    "Evidence is structured and traceable",
                    "Accountability is embedded in the record",
                    "Every output carries a cryptographic hash",
                  ]],
                ] as [string, string[]][]).map(([col, items]) => (
                  <div key={col} className="bg-[#030305] p-5">
                    <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: col === "Consulting" ? "rgba(255,255,255,0.30)" : `${GOLD}90` }}>
                      {col}
                    </p>
                    <ul className="mt-4 grid gap-2.5" role="list">
                      {items.map((item) => (
                        <li key={item} className="flex items-start gap-2.5">
                          {col === "Consulting"
                            ? <X className="mt-0.5 h-3 w-3 shrink-0 text-white/[0.22]" aria-hidden />
                            : <ShieldCheck className="mt-0.5 h-3 w-3 shrink-0" style={{ color: `${GOLD}90` }} aria-hidden />
                          }
                          <span className="text-[13px] leading-[1.6] text-white/[0.52]">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── 5. WHAT THE SYSTEM TESTS — QUESTIONS NOT BULLETS ───────────────── */}
        <section aria-label="What the system tests" className="px-6 py-14 lg:px-12 lg:py-16">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
            <div>
              <div className="flex items-center gap-3">
                <Gauge className="h-4 w-4 shrink-0" style={{ color: `${GOLD}AA` }} aria-hidden />
                <Eyebrow>What the system tests</Eyebrow>
              </div>
              <SectionHeading>Six questions. Each one tests a specific failure mode.</SectionHeading>
              <p className="mt-5 max-w-[56ch] text-[15px] leading-[1.85] text-white/[0.50]">
                These are not feature bullets. They are the questions the system actually poses to the decision record. When the answer is wrong, the system identifies why — not what you should feel about it.
              </p>
            </div>
            <div className="grid gap-px bg-white/[0.05] sm:grid-cols-2">
              {TESTS.map((t) => (
                <div key={t.dimension} className="flex min-h-[96px] flex-col justify-between bg-[#030305] p-5">
                  <p className="text-[14px] leading-[1.65] text-white/[0.70]" style={{ fontStyle: "italic", ...serif }}>
                    &ldquo;{t.question}&rdquo;
                  </p>
                  <p className="mt-3 border-t border-white/[0.06] pt-3" style={{ ...mono, fontSize: "9px", letterSpacing: "0.18em", textTransform: "uppercase", color: `${GOLD}70` }}>
                    Dimension: {t.dimension}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 6. PATHWAY — GOVERNED STAGES WITH GATES ────────────────────────── */}
        <section aria-label="Product pathway" className="border-y border-white/[0.06] px-6 py-14 lg:px-12 lg:py-16">
          <div className="mx-auto max-w-7xl">
            <div className="mb-10 grid gap-6 lg:grid-cols-[0.72fr_1.28fr] lg:items-end">
              <div>
                <div className="flex items-center gap-3">
                  <Layers3 className="h-4 w-4 shrink-0" style={{ color: `${GOLD}AA` }} aria-hidden />
                  <Eyebrow>Governed pathway</Eyebrow>
                </div>
                <SectionHeading>Progression is earned by evidence. Each stage has a gate.</SectionHeading>
              </div>
              <p className="max-w-[70ch] text-[15px] leading-[1.85] text-white/[0.50]">
                No stage is available on demand. Each opens when the prior evidence record justifies escalation. The system tells you where you are and what must be true before the next stage opens.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {PATHWAY.map((stage) => (
                <article
                  key={stage.label}
                  className="flex flex-col border p-5"
                  style={{ borderColor: stage.isGated ? "rgba(255,255,255,0.055)" : `${GOLD}30`, backgroundColor: stage.isGated ? "rgba(255,255,255,0.012)" : `${GOLD}08` }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span style={{ ...mono, fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: `${GOLD}80` }}>
                      Stage {String(stage.step).padStart(2, "0")}
                    </span>
                    <span
                      className="border px-2.5 py-1 text-[10px]"
                      style={{ ...mono, letterSpacing: "0.14em", textTransform: "uppercase", borderColor: stage.isGated ? "rgba(255,255,255,0.08)" : `${GOLD}40`, color: stage.isGated ? "rgba(255,255,255,0.34)" : `${GOLD}90` }}
                    >
                      {stage.posture}
                    </span>
                  </div>

                  <h3
                    className="mt-5"
                    style={{ ...serif, color: "rgba(255,255,255,0.90)", fontSize: "1.3rem", lineHeight: 1.1, fontStyle: "italic" }}
                  >
                    {stage.label}
                  </h3>

                  {/* Gate condition */}
                  <div className="mt-4 flex gap-2.5 rounded border border-white/[0.055] bg-white/[0.012] p-3">
                    {stage.isGated
                      ? <Lock className="mt-0.5 h-3 w-3 shrink-0 text-white/[0.30]" aria-hidden />
                      : <Shield className="mt-0.5 h-3 w-3 shrink-0" style={{ color: `${GOLD}70` }} aria-hidden />
                    }
                    <div>
                      <span style={{ ...mono, fontSize: "9px", letterSpacing: "0.16em", textTransform: "uppercase", color: stage.isGated ? "rgba(255,255,255,0.28)" : `${GOLD}80` }}>
                        {stage.gateLabel}:
                      </span>
                      <p className="mt-1 text-[12px] leading-[1.6] text-white/[0.44]">{stage.gate}</p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2">
                    <div>
                      <span style={{ ...mono, fontSize: "9px", letterSpacing: "0.16em", textTransform: "uppercase", color: `${GOLD}60` }}>Tests</span>
                      <p className="mt-1 text-[12px] leading-[1.6] text-white/[0.48]">{stage.tests}</p>
                    </div>
                    <div className="border-t border-white/[0.06] pt-2">
                      <span style={{ ...mono, fontSize: "9px", letterSpacing: "0.16em", textTransform: "uppercase", color: `${GOLD}60` }}>Produces</span>
                      <p className="mt-1 text-[12px] leading-[1.6] text-white/[0.40]">{stage.produces}</p>
                    </div>
                  </div>

                  {stage.href ? (
                    <Link
                      href={stage.href}
                      className="group mt-auto inline-flex items-center gap-2 pt-5 transition-colors text-white/[0.38] hover:text-white/[0.72] focus:outline-none focus:ring-1 focus:ring-white/20"
                      style={{ ...mono, fontSize: "10px", letterSpacing: "0.16em", textTransform: "uppercase" }}
                    >
                      {stage.cta}
                      <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" aria-hidden />
                    </Link>
                  ) : null}
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── 7. EVIDENCE ────────────────────────────────────────────────────── */}
        <section aria-label="Evidence" className="px-6 py-14 lg:px-12 lg:py-16">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-6 border border-white/[0.07] bg-white/[0.016] p-6 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 shrink-0" style={{ color: `${GOLD}AA` }} aria-hidden />
                  <Eyebrow>Evidence basis</Eyebrow>
                </div>
                <p className="mt-3 max-w-[80ch] text-[14px] leading-[1.85] text-white/[0.52]">
                  Three published evidence cases document how the system has been applied under real conditions — tariff shock and market repricing, team alignment failure under pressure, and a governed escalation refusal. All cases are anonymised. Outcome metrics are preserved and auditable. A fourth case is in preparation.
                </p>
              </div>
              <SecondaryLink href="/evidence">View evidence cases</SecondaryLink>
            </div>
          </div>
        </section>

        {/* ── 8 + 9. ROI CALCULATOR + ROUTING ────────────────────────────────── */}
        <section aria-label="Cost of delay calculator" className="border-y border-white/[0.06] px-6 py-14 lg:px-12 lg:py-16">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
            <div>
              <div className="flex items-center gap-3">
                <Calculator className="h-4 w-4 shrink-0" style={{ color: `${GOLD}AA` }} aria-hidden />
                <Eyebrow>Cost of delay</Eyebrow>
              </div>
              <SectionHeading>Estimate the exposure carried while a decision waits.</SectionHeading>
              <p className="mt-5 max-w-[56ch] text-[15px] leading-[1.85] text-white/[0.50]">
                Enter your actual values. The result is a directional pressure estimate — not a financial forecast. After you enter figures, the system will suggest an appropriate pathway.
              </p>
            </div>

            <div className="grid gap-px bg-white/[0.05] lg:grid-cols-[1fr_0.88fr]">
              {/* Inputs */}
              <div className="bg-[#030305] p-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="sm:col-span-2">
                    <span style={{ ...mono, fontSize: "10px", letterSpacing: "0.16em", textTransform: "uppercase", color: `${GOLD}80` }}>
                      Decision label (optional)
                    </span>
                    <input
                      value={decisionLabel}
                      onChange={(e) => setDecisionLabel(e.target.value)}
                      placeholder="e.g. delayed market entry"
                      className="mt-2 min-h-[48px] w-full border border-white/[0.09] bg-white/[0.018] px-3 py-2 text-[14px] text-white/[0.74] outline-none transition-colors placeholder:text-white/[0.24] focus:border-white/[0.20] focus:ring-1 focus:ring-white/10"
                    />
                  </label>
                  <label>
                    <span style={{ ...mono, fontSize: "10px", letterSpacing: "0.16em", textTransform: "uppercase", color: `${GOLD}80` }}>
                      Monthly exposure (£)
                    </span>
                    <input
                      value={monthlyExposure}
                      onChange={(e) => { setMonthlyExposure(e.target.value); setCalculatorTouched(true); }}
                      type="number"
                      min="0"
                      inputMode="decimal"
                      placeholder="250000"
                      className="mt-2 min-h-[48px] w-full border border-white/[0.09] bg-white/[0.018] px-3 py-2 text-[14px] text-white/[0.74] outline-none transition-colors placeholder:text-white/[0.24] focus:border-white/[0.20] focus:ring-1 focus:ring-white/10"
                    />
                  </label>
                  <label>
                    <span style={{ ...mono, fontSize: "10px", letterSpacing: "0.16em", textTransform: "uppercase", color: `${GOLD}80` }}>
                      Deterioration probability (%)
                    </span>
                    <div className="mt-2 flex min-h-[48px] items-center border border-white/[0.09] bg-white/[0.018] focus-within:border-white/[0.20]">
                      <input
                        value={deteriorationProbability}
                        onChange={(e) => setDeteriorationProbability(e.target.value)}
                        type="number"
                        min="0"
                        max="100"
                        inputMode="decimal"
                        placeholder="35"
                        className="min-h-[46px] w-full bg-transparent px-3 text-[14px] text-white/[0.74] outline-none placeholder:text-white/[0.24]"
                      />
                      <span className="px-3 text-[13px] text-white/[0.38]">%</span>
                    </div>
                  </label>
                  <label className="sm:col-span-2">
                    <span style={{ ...mono, fontSize: "10px", letterSpacing: "0.16em", textTransform: "uppercase", color: `${GOLD}80` }}>
                      Expected delay period
                    </span>
                    <div className="mt-2 flex min-h-[48px] items-center border border-white/[0.09] bg-white/[0.018] focus-within:border-white/[0.20]">
                      <input
                        value={delayPeriod}
                        onChange={(e) => setDelayPeriod(e.target.value)}
                        type="number"
                        min="0"
                        inputMode="decimal"
                        placeholder="3"
                        className="min-h-[46px] w-full bg-transparent px-3 text-[14px] text-white/[0.74] outline-none placeholder:text-white/[0.24]"
                      />
                      <span className="px-3 text-[13px] text-white/[0.38]">months</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Result — only shown after interaction */}
              <div className="bg-[#030305] p-5">
                <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.32)" }}>
                  {decisionLabel.trim() || "Delay exposure estimate"}
                </p>

                {!showCalcResult ? (
                  <div className="mt-5 flex min-h-[120px] items-center justify-center border border-white/[0.06] bg-white/[0.012] p-4">
                    <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)", textAlign: "center" }}>
                      Enter monthly exposure to see estimate
                    </p>
                  </div>
                ) : (
                  <div className="mt-5 grid gap-3">
                    <div className="border border-white/[0.07] bg-white/[0.014] p-4">
                      <p className="text-[12px] leading-[1.6] text-white/[0.40]">Monthly decision exposure</p>
                      <p className="mt-2 break-words" style={{ ...serif, color: "rgba(255,255,255,0.88)", fontSize: "2rem", lineHeight: 1, fontStyle: "italic" }}>
                        {formatGBP(monthlyDecisionExposure)}
                      </p>
                    </div>
                    <div className="border border-white/[0.07] bg-white/[0.014] p-4">
                      <p className="text-[12px] leading-[1.6] text-white/[0.40]">Total delay exposure</p>
                      <p className="mt-2 break-words" style={{ ...serif, color: GOLD, fontSize: "2rem", lineHeight: 1, fontStyle: "italic" }}>
                        {formatGBP(totalDelayExposure)}
                      </p>
                    </div>

                    {/* Routing recommendation */}
                    {routing.label && (
                      <div className="border border-white/[0.055] bg-white/[0.008] p-4">
                        <p style={{ ...mono, fontSize: "9px", letterSpacing: "0.16em", textTransform: "uppercase", color: `${GOLD}70` }}>
                          Recommended pathway
                        </p>
                        <p className="mt-2 text-[12px] leading-[1.6] text-white/[0.50]">{routing.label}</p>
                        <p className="mt-1.5 text-[12px] leading-[1.6] text-white/[0.40]">{routing.route}</p>
                        <Link
                          href={routing.href}
                          className="group mt-3 inline-flex items-center gap-1.5 transition-colors text-white/[0.38] hover:text-white/[0.70]"
                          style={{ ...mono, fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase" }}
                        >
                          Start here <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" aria-hidden />
                        </Link>
                      </div>
                    )}

                    <p className="mt-1 border-t border-white/[0.05] pt-3 text-[11px] leading-[1.7] text-white/[0.30]">
                      This is a directional estimate, not a financial forecast. Inputs are not stored.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── 10. FAQ ────────────────────────────────────────────────────────── */}
        <section aria-label="Frequently asked questions" className="px-6 py-14 lg:px-12 lg:py-16">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
              <div>
                <Eyebrow>Common questions</Eyebrow>
                <SectionHeading>Questions that arrive before a commitment.</SectionHeading>
              </div>
              <div className="grid gap-px bg-white/[0.04]">
                {FAQ.map((item, idx) => (
                  <div key={item.q} className="bg-[#030305]">
                    <button
                      type="button"
                      className="flex w-full items-start justify-between gap-4 p-5 text-left transition-colors hover:bg-white/[0.016] focus:outline-none focus:ring-1 focus:ring-white/10"
                      aria-expanded={openFaq === idx}
                      onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    >
                      <span className="text-[14px] leading-[1.6] text-white/[0.75]">{item.q}</span>
                      <span
                        className="mt-0.5 shrink-0 transition-transform duration-200"
                        style={{ transform: openFaq === idx ? "rotate(45deg)" : "rotate(0deg)" }}
                        aria-hidden
                      >
                        <ChevronRight className="h-3.5 w-3.5 text-white/[0.38] rotate-90" />
                      </span>
                    </button>
                    {openFaq === idx && (
                      <div className="border-t border-white/[0.06] px-5 pb-5 pt-4">
                        <p className="text-[14px] leading-[1.8] text-white/[0.50]">{item.a}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── 11. ENQUIRY FORM ────────────────────────────────────────────────── */}
        <section aria-label="Enterprise enquiry" className="border-y border-white/[0.06] px-6 py-14 lg:px-12 lg:py-16">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
              <div>
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-4 w-4 shrink-0" style={{ color: `${GOLD}AA` }} aria-hidden />
                  <Eyebrow>Enquiry</Eyebrow>
                </div>
                <SectionHeading>Describe the decision you are carrying.</SectionHeading>
                <p className="mt-5 max-w-[56ch] text-[14px] leading-[1.85] text-white/[0.48]">
                  If you are not certain which surface applies to your situation, describe the decision. We will assess the appropriate route and respond within one business day.
                </p>
                <p className="mt-4 text-[12px] leading-[1.7] text-white/[0.30]">
                  This is not a sales process. It is an intake assessment. If the situation does not match what this infrastructure does, we will say so.
                </p>
              </div>

              {enquiryStatus === "success" ? (
                <div className="flex min-h-[280px] flex-col items-start justify-center border border-white/[0.07] bg-white/[0.012] p-8">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-5 w-5" style={{ color: `${GOLD}AA` }} aria-hidden />
                    <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: `${GOLD}90` }}>
                      Enquiry received
                    </p>
                  </div>
                  <p className="mt-4 max-w-[52ch] text-[14px] leading-[1.8] text-white/[0.58]">{enquiryMessage}</p>
                </div>
              ) : (
                <form onSubmit={handleEnquirySubmit} className="grid gap-4 sm:grid-cols-2" noValidate>
                  {([
                    ["name", "Name", "text", "Your full name", false] ,
                    ["email", "Email", "email", "you@organisation.com", false],
                    ["role", "Role / Title", "text", "e.g. Chief Operating Officer", false],
                    ["organisation", "Organisation", "text", "Organisation name", false],
                  ] as [keyof typeof enquiry, string, string, string, boolean][]).map(([field, label, type, placeholder]) => (
                    <label key={field}>
                      <span style={{ ...mono, fontSize: "10px", letterSpacing: "0.16em", textTransform: "uppercase", color: `${GOLD}70` }}>
                        {label}
                      </span>
                      <input
                        type={type}
                        required
                        placeholder={placeholder}
                        value={enquiry[field] as string}
                        onChange={(e) => setEnquiry((p) => ({ ...p, [field]: e.target.value }))}
                        className="mt-2 min-h-[48px] w-full border border-white/[0.08] bg-white/[0.016] px-3 py-2 text-[14px] text-white/[0.74] outline-none transition-colors placeholder:text-white/[0.22] focus:border-white/[0.18] focus:ring-1 focus:ring-white/10"
                      />
                    </label>
                  ))}

                  <label className="sm:col-span-2">
                    <span style={{ ...mono, fontSize: "10px", letterSpacing: "0.16em", textTransform: "uppercase", color: `${GOLD}70` }}>
                      Decision pressure (describe the situation)
                    </span>
                    <textarea
                      required
                      rows={4}
                      placeholder="Describe the decision, the pressure, and what has prevented resolution so far."
                      value={enquiry.decisionPressure}
                      onChange={(e) => setEnquiry((p) => ({ ...p, decisionPressure: e.target.value }))}
                      className="mt-2 w-full border border-white/[0.08] bg-white/[0.016] px-3 py-2 text-[14px] text-white/[0.74] outline-none transition-colors placeholder:text-white/[0.22] focus:border-white/[0.18] focus:ring-1 focus:ring-white/10"
                    />
                  </label>

                  <label>
                    <span style={{ ...mono, fontSize: "10px", letterSpacing: "0.16em", textTransform: "uppercase", color: `${GOLD}70` }}>
                      Decision deadline (if any)
                    </span>
                    <input
                      type="text"
                      placeholder="e.g. Board meeting 15 August"
                      value={enquiry.deadline}
                      onChange={(e) => setEnquiry((p) => ({ ...p, deadline: e.target.value }))}
                      className="mt-2 min-h-[48px] w-full border border-white/[0.08] bg-white/[0.016] px-3 py-2 text-[14px] text-white/[0.74] outline-none transition-colors placeholder:text-white/[0.22] focus:border-white/[0.18] focus:ring-1 focus:ring-white/10"
                    />
                  </label>

                  <label>
                    <span style={{ ...mono, fontSize: "10px", letterSpacing: "0.16em", textTransform: "uppercase", color: `${GOLD}70` }}>
                      Estimated monthly exposure (optional)
                    </span>
                    <input
                      type="text"
                      placeholder="e.g. £250k–£500k"
                      value={enquiry.estimatedExposure}
                      onChange={(e) => setEnquiry((p) => ({ ...p, estimatedExposure: e.target.value }))}
                      className="mt-2 min-h-[48px] w-full border border-white/[0.08] bg-white/[0.016] px-3 py-2 text-[14px] text-white/[0.74] outline-none transition-colors placeholder:text-white/[0.22] focus:border-white/[0.18] focus:ring-1 focus:ring-white/10"
                    />
                  </label>

                  <div className="sm:col-span-2">
                    <span style={{ ...mono, fontSize: "10px", letterSpacing: "0.16em", textTransform: "uppercase", color: `${GOLD}70` }}>
                      Preferred pathway (if known)
                    </span>
                    <select
                      value={enquiry.preferredRoute}
                      onChange={(e) => setEnquiry((p) => ({ ...p, preferredRoute: e.target.value as typeof enquiry.preferredRoute }))}
                      className="mt-2 min-h-[48px] w-full border border-white/[0.08] bg-[#030305] px-3 py-2 text-[14px] text-white/[0.74] outline-none transition-colors focus:border-white/[0.18]"
                    >
                      <option value="unsure">Not sure — help me find the right route</option>
                      <option value="enterprise_decision_scan">Enterprise Decision Scan</option>
                      <option value="boardroom_brief">Boardroom Brief</option>
                      <option value="executive_reporting">Executive Reporting</option>
                      <option value="strategy_room">Strategy Room</option>
                      <option value="team_assessment">Team Assessment</option>
                      <option value="retainer_review">Retainer Review (enquiry only)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        required
                        checked={enquiry.consentToContact}
                        onChange={(e) => setEnquiry((p) => ({ ...p, consentToContact: e.target.checked }))}
                        className="mt-0.5 h-4 w-4 shrink-0 border border-white/[0.20] bg-white/[0.018] accent-amber-500"
                      />
                      <span className="text-[13px] leading-[1.65] text-white/[0.44]">
                        I consent to Abraham of London contacting me about this enquiry. I understand this is not a sales commitment and that my information will not be shared with third parties.
                      </span>
                    </label>
                  </div>

                  {enquiryStatus === "error" && (
                    <p className="sm:col-span-2 text-[13px] text-red-400 leading-[1.6]" role="alert">{enquiryMessage}</p>
                  )}

                  <div className="sm:col-span-2">
                    <button
                      type="submit"
                      disabled={enquiryStatus === "loading" || !enquiry.consentToContact}
                      className="inline-flex min-h-[50px] items-center gap-2 border px-6 py-3 transition-all duration-150 hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
                      style={{ ...mono, borderColor: `${GOLD}55`, backgroundColor: `${GOLD}14`, color: "#F0EDE8", fontSize: "12px", letterSpacing: "0.12em", textTransform: "uppercase" }}
                    >
                      {enquiryStatus === "loading" ? "Submitting…" : "Submit enquiry"}
                      {enquiryStatus !== "loading" && <ArrowRight className="h-3.5 w-3.5" aria-hidden />}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </section>

        {/* ── 12. BOUNDARY NOTE — narrative, not disclaimer ───────────────────── */}
        <section aria-label="Governance boundary" className="px-6 py-14 lg:px-12 lg:py-16">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-6 border border-white/[0.07] bg-white/[0.012] p-6 md:grid-cols-[auto_1fr] md:items-start">
              <Lock className="mt-1 h-5 w-5 shrink-0" style={{ color: `${GOLD}80` }} aria-hidden />
              <div>
                <Eyebrow>Governance boundary</Eyebrow>
                <p className="mt-3 max-w-[88ch] text-[14px] leading-[1.85] text-white/[0.50]">
                  Retainer Oversight is the system at its deepest engagement. It exists for organisations that have accumulated durable decision history, verified outcomes, and a pattern of recurring high-stakes decisions across multiple cycles. It is not a product you choose — it is a posture you earn through evidence. Even when readiness criteria are met, admin approval is always required before oversight is extended. This is by design. The infrastructure does not auto-activate at any price point.
                </p>
                <p className="mt-4 text-[13px] leading-[1.75] text-white/[0.34]">
                  If you believe you are approaching readiness, submit an enquiry above. We will review the evidence record and respond.
                </p>
              </div>
            </div>
          </div>
        </section>

      </div>
    </Layout>
  );
}
