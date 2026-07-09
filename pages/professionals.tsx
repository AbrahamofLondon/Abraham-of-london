import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  ClipboardCheck,
  FileText,
  Layers3,
  Lock,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import Layout from "@/components/Layout";
import CheckoutButton from "@/components/commercial/CheckoutButton";
import { CATALOG } from "@/lib/commercial/catalog";
import { resolvePricingAction } from "@/lib/commercial/pricing-actions";

const GOLD = "#C9A96E";
const VOID = "rgb(3 3 5)";

const mono: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
};

const serif: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
  fontWeight: 300,
};

type CardItem = {
  title: string;
  body: string;
};

type UseCase = {
  title: string;
  label: string;
  body: string;
};

const AUDIENCES = [
  "Consultants",
  "Advisors",
  "Analysts",
  "Fractional COOs",
  "Operating partners",
  "Transformation leads",
];

// 2. What it is
const WHAT_IT_IS: CardItem[] = [
  {
    title: "Isolated client workspace",
    body: "Each client engagement is held in its own governed workspace. Client X evidence cannot contaminate Client Y case memory.",
  },
  {
    title: "Evidence intake",
    body: "Structure client decision evidence into a governed record with provenance, instead of relying on private conviction or untested assumptions.",
  },
  {
    title: "Advisor-mediated case memory",
    body: "Evidence you submit remains advisor-mediated until the client reviews it. Durable memory is created only where it is permitted.",
  },
  {
    title: "Review brief preparation",
    body: "Compile a structured review brief from the governed evidence — a clear, client-safe package rather than another opinion layer.",
  },
  {
    title: "Escalation request pathway",
    body: "Request enterprise escalation when the record justifies it. Escalation to an organisation requires that organisation's consent.",
  },
];

// 3. What it is not
const WHAT_IT_IS_NOT: string[] = [
  "Not delegated authority over the client",
  "Not certification of client truth",
  "Not autonomous decision-making",
  "Not enterprise ledger mutation",
];

// 4. Operating boundary
const OPERATING_BOUNDARY: CardItem[] = [
  {
    title: "Authority delta = 0",
    body: "Working in the console never grants the advisor authority. The system compounds context, not authority.",
  },
  {
    title: "Client consent required",
    body: "Durable memory promotion and enterprise escalation require explicit client or organisation consent.",
  },
  {
    title: "Cross-client isolation",
    body: "Evidence and case memory are isolated per client. No bleed between engagements.",
  },
  {
    title: "Evidence shield",
    body: "Quarantined or unknown-risk evidence cannot promote to durable memory or a trusted conclusion.",
  },
  {
    title: "Durable memory only where permitted",
    body: "Surface records default to ephemeral. Nothing becomes durable without the governed consent path.",
  },
];

// 5. Use cases
const USE_CASES: UseCase[] = [
  {
    title: "Consultant preparing a client decision review",
    label: "Decision review",
    body: "Assemble the decision record, contradiction, and consequence into a governed review your client can return to.",
  },
  {
    title: "Fractional COO mapping execution blockers",
    label: "Execution",
    body: "Expose ownership ambiguity, authority pressure, and execution risk around a live operational decision.",
  },
  {
    title: "Advisor assembling evidence for enterprise assessment",
    label: "Assessment",
    body: "Structure client evidence ahead of an enterprise assessment so the organisation enters with a governed record.",
  },
  {
    title: "Analyst preparing a structured review package",
    label: "Analysis",
    body: "Carry claims with confidence posture and evidence class into a client-safe, reviewable package.",
  },
];

// 6. Access
const ACCESS_NOTES: CardItem[] = [
  {
    title: "Controlled access",
    body: "Console access is reviewed. It is intended for advisors with serious client work, not open public activation.",
  },
  {
    title: "Professional subscription or approved advisor access",
    body: "Access is granted via the Professional subscription where cleared, or by approved advisor review.",
  },
  {
    title: "No open public activation",
    body: "Where access logic is not yet wired for a route, it remains request-only rather than a self-serve sign-up.",
  },
];

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

const SUBSCRIPTION_INCLUDES = [
  { title: "Unlimited active governed cases", detail: "Keep every active case running without expiry." },
  { title: "Return Brief generation", detail: "Structured re-engagement documents for governed cases that need continuity." },
  { title: "Advanced Benchmark Context", detail: "Multi-dimensional comparison across anonymized opted-in cohorts." },
  { title: "Client-safe evidence export", detail: "Export a client-safe version of the governed record — chain-of-custody intact." },
  { title: "Client-safe case sharing", detail: "Share governed cases with reviewers or auditors via a protected view." },
  { title: "Organisation workspace", detail: "Invite members and collaborate on governed cases." },
];

export default function ProfessionalsLandingPage() {
  const professional = CATALOG.professional;
  const annualProduct = CATALOG.professional_annual;
  // The commercial action resolver is the single authority. A subscription tier
  // is only offered as direct checkout when governance clears it; otherwise it
  // is presented as controlled, request-only access.
  const proPurchasable = professional ? resolvePricingAction(professional).purchasable : false;
  const annualPurchasable = annualProduct ? resolvePricingAction(annualProduct).purchasable : false;

  return (
    <Layout
      title="Professional Advisor Console | Abraham of London"
      description="A controlled workspace for advisors who need to structure client decision evidence without taking authority over the client."
      canonicalUrl="/professionals"
      fullWidth
      headerTransparent
    >
      <div style={{ backgroundColor: VOID, minHeight: "100vh" }}>
        {/* 1. HERO */}
        <section className="px-6 pb-14 pt-[128px] lg:px-12 lg:pb-18 lg:pt-36">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_0.78fr] lg:items-end">
            <div>
              <Eyebrow>Professional access · Phase 7</Eyebrow>
              <h1
                className="mt-6 max-w-[62rem] break-words"
                style={{
                  ...serif,
                  color: "#F5F5F5",
                  fontSize: "clamp(2.5rem, 7vw, 5.1rem)",
                  lineHeight: 0.95,
                  fontStyle: "italic",
                }}
              >
                Professional Advisor Console
              </h1>
              <p className="mt-7 max-w-[68ch] text-[16px] leading-[1.85] text-white/[0.60]">
                A controlled workspace for advisors who need to structure client decision evidence
                without taking authority over the client. A bridge into governed decision
                infrastructure — not a reseller dashboard.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <PrimaryLink href="/contact?type=professional-access">Request professional access</PrimaryLink>
                <SecondaryLink href="/diagnostics/enterprise-assessment">Start with enterprise assessment</SecondaryLink>
              </div>
            </div>

            <div className="border border-white/[0.075] bg-white/[0.018] p-5 lg:p-6">
              <div className="flex items-center gap-3">
                <BriefcaseBusiness className="h-4 w-4" style={{ color: `${GOLD}AA` }} />
                <p style={{ ...mono, fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.38)" }}>
                  Controlled access for
                </p>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {AUDIENCES.map((audience) => (
                  <span
                    key={audience}
                    className="border border-white/[0.08] bg-black/20 px-3 py-2"
                    style={{ ...mono, fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.58)" }}
                  >
                    {audience}
                  </span>
                ))}
              </div>
              <p className="mt-6 border-t border-white/[0.06] pt-5 text-[13px] leading-[1.75] text-white/[0.48]">
                Advisors can structure client evidence, compile review briefs, and request escalation.
                Advisor-mediated evidence remains advisor-mediated until client review. No raw client
                payloads are exposed.
              </p>
            </div>
          </div>
        </section>

        {/* 2. WHAT IT IS */}
        <section className="border-y border-white/[0.06] px-6 py-14 lg:px-12 lg:py-16">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 flex items-center gap-3">
              <Layers3 className="h-4 w-4" style={{ color: `${GOLD}AA` }} />
              <Eyebrow>What it is</Eyebrow>
            </div>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
              {WHAT_IT_IS.map((item, index) => (
                <article key={item.title} className="flex min-h-[260px] flex-col border border-white/[0.075] bg-white/[0.016] p-5">
                  <span style={{ ...mono, fontSize: "11px", letterSpacing: "0.18em", textTransform: "uppercase", color: `${GOLD}90` }}>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3
                    className="mt-5"
                    style={{ ...serif, color: "rgba(255,255,255,0.88)", fontSize: "1.28rem", lineHeight: 1.1, fontStyle: "italic" }}
                  >
                    {item.title}
                  </h3>
                  <p className="mt-3 text-[13px] leading-[1.7] text-white/[0.52]">{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* 3. WHAT IT IS NOT */}
        <section className="px-6 py-14 lg:px-12 lg:py-16">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <div className="flex items-center gap-3">
                <XCircle className="h-4 w-4" style={{ color: `${GOLD}AA` }} />
                <Eyebrow>What it is not</Eyebrow>
              </div>
              <h2
                className="mt-5 max-w-[32rem]"
                style={{ ...serif, color: "rgba(255,255,255,0.90)", fontSize: "clamp(1.9rem, 5vw, 3rem)", lineHeight: 1, fontStyle: "italic" }}
              >
                The console does not move authority to the advisor.
              </h2>
              <p className="mt-5 max-w-[58ch] text-[15px] leading-[1.85] text-white/[0.52]">
                Authority remains with the client. The system does not approve, command, or replace
                decision-makers, and advisor access does not change that.
              </p>
            </div>
            <div className="grid gap-px bg-white/[0.05] md:grid-cols-2">
              {WHAT_IT_IS_NOT.map((line) => (
                <div key={line} className="bg-[#030305] p-5">
                  <div className="flex items-start gap-3">
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "rgba(252,165,165,0.55)" }} />
                    <p className="text-[14px] leading-[1.7] text-white/[0.62]">{line}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4. OPERATING BOUNDARY */}
        <section className="border-y border-white/[0.06] px-6 py-14 lg:px-12 lg:py-16">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 flex items-center gap-3">
              <ShieldCheck className="h-4 w-4" style={{ color: `${GOLD}AA` }} />
              <Eyebrow>Operating boundary</Eyebrow>
            </div>
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-5">
              {OPERATING_BOUNDARY.map((item) => (
                <div key={item.title} className="border border-white/[0.07] bg-white/[0.015] p-4">
                  <p style={{ ...mono, fontSize: "8.5px", letterSpacing: "0.12em", color: `${GOLD}CC` }}>{item.title}</p>
                  <p className="mt-2 text-[12px] leading-[1.7] text-white/[0.48]">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 5. USE CASES */}
        <section className="px-6 py-14 lg:px-12 lg:py-16">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 flex items-center gap-3">
              <Layers3 className="h-4 w-4" style={{ color: `${GOLD}AA` }} />
              <Eyebrow>Use cases</Eyebrow>
            </div>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {USE_CASES.map((item, index) => (
                <article key={item.title} className="flex min-h-[240px] flex-col border border-white/[0.075] bg-white/[0.016] p-5">
                  <div className="flex items-center justify-between gap-3">
                    <span style={{ ...mono, fontSize: "11px", letterSpacing: "0.18em", textTransform: "uppercase", color: `${GOLD}90` }}>
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="border border-white/[0.08] px-2.5 py-1 text-white/[0.38]" style={{ ...mono, fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase" }}>
                      {item.label}
                    </span>
                  </div>
                  <h3
                    className="mt-5"
                    style={{ ...serif, color: "rgba(255,255,255,0.88)", fontSize: "1.2rem", lineHeight: 1.1, fontStyle: "italic" }}
                  >
                    {item.title}
                  </h3>
                  <p className="mt-3 text-[13px] leading-[1.7] text-white/[0.52]">{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* 6. ACCESS */}
        <section className="border-t border-white/[0.06] px-6 py-14 lg:px-12 lg:py-16">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <div className="flex items-center gap-3">
                <ClipboardCheck className="h-4 w-4" style={{ color: `${GOLD}AA` }} />
                <Eyebrow>Access</Eyebrow>
              </div>
              <h2
                className="mt-5 max-w-[32rem]"
                style={{ ...serif, color: "rgba(255,255,255,0.90)", fontSize: "clamp(1.9rem, 5vw, 3rem)", lineHeight: 1, fontStyle: "italic" }}
              >
                Controlled access, granted by review.
              </h2>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {ACCESS_NOTES.map((item) => (
                <article key={item.title} className="border border-white/[0.075] bg-white/[0.016] p-5">
                  <h3 style={{ ...serif, color: "rgba(255,255,255,0.86)", fontSize: "1.16rem", lineHeight: 1.1, fontStyle: "italic" }}>
                    {item.title}
                  </h3>
                  <p className="mt-3 text-[13px] leading-[1.75] text-white/[0.52]">{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* 7. CTA */}
        <section className="px-6 py-14 lg:px-12">
          <div className="mx-auto grid max-w-7xl gap-6 border border-white/[0.075] bg-white/[0.018] p-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4" style={{ color: `${GOLD}AA` }} />
                <p style={{ ...mono, fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", color: `${GOLD}90` }}>
                  Request access
                </p>
              </div>
              <p className="mt-3 max-w-[78ch] text-[14px] leading-[1.85] text-white/[0.52]">
                Request console access if you advise clients through consequential decisions and want
                to structure evidence, prepare review briefs, and request governed escalation — without
                taking authority over the client.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 md:justify-end">
              <PrimaryLink href="/contact?type=professional-access">Request professional access</PrimaryLink>
              <SecondaryLink href="/diagnostics/enterprise-assessment">Start with enterprise assessment</SecondaryLink>
            </div>
          </div>
        </section>

        {/* Professional subscription tier — resolver-gated */}
        {professional && (
          <section className="border-t border-white/[0.06] px-6 py-14 lg:px-12 lg:py-16" id="subscription">
            <div className="mx-auto max-w-7xl">
              <div className="mb-10">
                <Eyebrow>Professional subscription</Eyebrow>
                <h2
                  className="mt-5 max-w-[44rem]"
                  style={{ ...serif, color: "rgba(255,255,255,0.90)", fontSize: "clamp(1.9rem, 5vw, 3rem)", lineHeight: 1, fontStyle: "italic" }}
                >
                  The continuity layer for governed cases.
                </h2>
                <p className="mt-4 max-w-[68ch] text-[14px] leading-[1.85] text-white/[0.52]">
                  Professional unlocks unlimited active governed cases, Return Brief generation, advanced
                  benchmark context, and client-safe evidence export. It is the continuity layer — not
                  required to create a case or run a diagnostic.
                </p>
              </div>

              <div className="mb-10 grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                {SUBSCRIPTION_INCLUDES.map((item) => (
                  <div key={item.title} className="border border-white/[0.07] bg-white/[0.015] p-4">
                    <p style={{ ...mono, fontSize: "8.5px", letterSpacing: "0.14em", color: `${GOLD}CC` }}>{item.title}</p>
                    <p className="mt-2 text-[12px] leading-[1.7] text-white/[0.45]">{item.detail}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-2 sm:grid-cols-2 lg:max-w-[620px]">
                {/* Monthly */}
                <div className="border p-5" style={{ borderColor: `${GOLD}28`, background: `${GOLD}06` }}>
                  <p style={{ ...mono, fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", color: `${GOLD}88`, marginBottom: "8px" }}>Monthly</p>
                  <p style={{ ...mono, fontSize: "22px", color: "rgba(255,255,255,0.88)", marginBottom: "4px" }}>{professional.displayPrice}</p>
                  <p style={{ ...mono, fontSize: "11px", color: "rgba(255,255,255,0.28)", marginBottom: "16px" }}>controlled access · governed onboarding</p>
                  {proPurchasable ? (
                    <CheckoutButton productCode="professional" originPath="/professionals">
                      Start Professional
                    </CheckoutButton>
                  ) : (
                    // internal_only: no public checkout and no automatic public request-access
                    <span
                      style={{ ...mono, display: "inline-block", fontSize: "11px", letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,0.32)" }}
                    >
                      Not currently available
                    </span>
                  )}
                  <Link
                    href="/decision-centre"
                    style={{ ...mono, display: "block", marginTop: "10px", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.32)", textDecoration: "none" }}
                  >
                    Already subscribed → Decision Centre
                  </Link>
                </div>

                {/* Annual */}
                {annualProduct && (
                  <div className="border border-white/[0.08] bg-white/[0.015] p-5">
                    <p style={{ ...mono, fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.38)", marginBottom: "8px" }}>Annual</p>
                    <p style={{ ...mono, fontSize: "22px", color: "rgba(255,255,255,0.72)", marginBottom: "4px" }}>{annualProduct.displayPrice}</p>
                    <p style={{ ...mono, fontSize: "11px", color: "rgba(255,255,255,0.25)", marginBottom: "16px" }}>controlled access · governed onboarding</p>
                    {annualPurchasable ? (
                      <CheckoutButton productCode="professional_annual" originPath="/professionals">
                        Start Annual Professional
                      </CheckoutButton>
                    ) : (
                      <span
                        style={{ ...mono, display: "inline-block", fontSize: "11px", letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,0.32)" }}
                      >
                        Not currently available
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-8 flex gap-4 border border-white/[0.075] bg-white/[0.012] p-5">
                <Lock className="mt-1 h-4 w-4 shrink-0" style={{ color: `${GOLD}99` }} />
                <p className="max-w-[84ch] text-[13px] leading-[1.85] text-white/[0.50]">
                  Professional access does not grant authority over a client, certify client truth, or
                  permit enterprise ledger mutation. Enterprise escalation requires organisation consent,
                  and cross-client isolation is maintained throughout.
                </p>
              </div>
            </div>
          </section>
        )}
      </div>
    </Layout>
  );
}
