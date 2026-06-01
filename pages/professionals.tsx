import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  ClipboardCheck,
  FileText,
  Handshake,
  Layers3,
  Lock,
  ShieldCheck,
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

type CardItem = {
  title: string;
  body: string;
};

type UseCase = {
  title: string;
  label: string;
  body: string;
  href?: string;
};

const AUDIENCES = [
  "Consultants",
  "Coaches",
  "Fractional COOs",
  "Board advisors",
  "Operating partners",
  "Transformation leads",
];

const CLIENT_USES: UseCase[] = [
  {
    title: "Use Boardroom Briefs with clients",
    label: "Entry proof",
    body: "Turn a live client decision into a structured board-facing brief before proposing a heavier engagement.",
    href: "/boardroom-brief",
  },
  {
    title: "Run Enterprise scans",
    label: "Organisational scan",
    body: "Expose evidence gaps, ownership ambiguity, authority pressure, and execution risk around a client decision.",
    href: "/enterprise-decision-scan",
  },
  {
    title: "Prepare Executive Reports",
    label: "Leadership judgement",
    body: "Carry evidence into recommendation posture, options, risk, and governance conditions when the record is strong enough.",
    href: "/diagnostics/executive-reporting",
  },
  {
    title: "Escalate to Strategy Room",
    label: "Governed intervention",
    body: "Move serious client work into a controlled execution sequence when the decision needs more than advisory commentary.",
    href: "/strategy-room",
  },
  {
    title: "Refer clients for retained review",
    label: "Selective continuation",
    body: "Introduce clients for retained review only where durable decision history and seriousness justify further consideration.",
  },
];

const FIT: CardItem[] = [
  {
    title: "Sharper evidence",
    body: "Client work often stalls because leadership conversations rely on private conviction, incomplete facts, or untested assumptions.",
  },
  {
    title: "Constructive challenge",
    body: "The surface gives advisors a disciplined way to challenge the decision record without becoming another opinion layer.",
  },
  {
    title: "Decision records",
    body: "The work creates portable evidence, rationale, and escalation memory that can survive beyond a workshop or meeting.",
  },
];

const BOUNDARIES: CardItem[] = [
  {
    title: "Selective opening",
    body: "Professional access is reviewed. It is intended for advisors with serious client work, not public affiliate volume.",
  },
  {
    title: "Revenue share is qualified",
    body: "Approved referrers may receive revenue share on qualifying client purchases. Eligibility, scope, and terms are confirmed directly.",
  },
  {
    title: "No white labelling",
    body: "The infrastructure remains Abraham of London. Client trust depends on visible evidence standards and clear authorship.",
  },
  {
    title: "No automated commission promise",
    body: "Referral participation is not a self-serve commission dashboard. Commercial treatment is selective and manually governed.",
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

export default function ProfessionalsLandingPage() {
  return (
    <Layout
      title="Professional Access | Abraham of London"
      description="Decision Infrastructure for advisors who need sharper evidence, challenge, and decision records for client work."
      canonicalUrl="/professionals"
      fullWidth
      headerTransparent
    >
      <div style={{ backgroundColor: VOID, minHeight: "100vh" }}>
        <section className="px-6 pb-14 pt-[128px] lg:px-12 lg:pb-18 lg:pt-36">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_0.78fr] lg:items-end">
            <div>
              <Eyebrow>Professional access</Eyebrow>
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
                Decision Infrastructure for advisors with serious client work.
              </h1>
              <p className="mt-7 max-w-[68ch] text-[16px] leading-[1.85] text-white/[0.60]">
                For professionals who need sharper evidence, constructive challenge, and decision records their clients can return to when consequence rises.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <PrimaryLink href="/contact?type=professional-access">Request professional access</PrimaryLink>
                <SecondaryLink href="/boardroom-brief">Generate Boardroom Brief</SecondaryLink>
              </div>
            </div>

            <div className="border border-white/[0.075] bg-white/[0.018] p-5 lg:p-6">
              <div className="flex items-center gap-3">
                <BriefcaseBusiness className="h-4 w-4" style={{ color: `${GOLD}AA` }} />
                <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.38)" }}>
                  Built for
                </p>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {AUDIENCES.map((audience) => (
                  <span
                    key={audience}
                    className="border border-white/[0.08] bg-black/20 px-3 py-2"
                    style={{ ...mono, fontSize: "8px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.58)" }}
                  >
                    {audience}
                  </span>
                ))}
              </div>
              <p className="mt-6 border-t border-white/[0.06] pt-5 text-[13px] leading-[1.75] text-white/[0.48]">
                This is not a dashboard, affiliate marketplace, or white-labelled partner suite. It is a selective route for advisors who want to use governed decision surfaces responsibly with clients.
              </p>
            </div>
          </div>
        </section>

        <section className="border-y border-white/[0.06] px-6 py-12 lg:px-12">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr]">
              <div>
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-4 w-4" style={{ color: `${GOLD}AA` }} />
                  <Eyebrow>Why professionals use it</Eyebrow>
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
                  Client work improves when the decision record improves.
                </h2>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {FIT.map((item) => (
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
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 grid gap-6 lg:grid-cols-[0.72fr_1.28fr] lg:items-end">
              <div>
                <div className="flex items-center gap-3">
                  <Layers3 className="h-4 w-4" style={{ color: `${GOLD}AA` }} />
                  <Eyebrow>Client pathway</Eyebrow>
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
                  Use the existing ladder. Escalate only when the record earns it.
                </h2>
              </div>
              <p className="max-w-[74ch] text-[15px] leading-[1.85] text-white/[0.52]">
                Professional access is referral-first. Advisors can introduce clients to proof surfaces, help prepare evidence, and escalate serious work into governed review without presenting every layer as immediately available.
              </p>
            </div>

            <div className="grid gap-3 lg:grid-cols-5">
              {CLIENT_USES.map((item, index) => (
                <article key={item.title} className="flex min-h-[330px] flex-col border border-white/[0.075] bg-white/[0.016] p-5">
                  <div className="flex items-center justify-between gap-3">
                    <span style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: `${GOLD}90` }}>
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="border border-white/[0.08] px-2.5 py-1 text-white/[0.38]" style={{ ...mono, fontSize: "7px", letterSpacing: "0.14em", textTransform: "uppercase" }}>
                      {item.label}
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
                    {item.title}
                  </h3>
                  <p className="mt-3 text-[13px] leading-[1.7] text-white/[0.52]">{item.body}</p>
                  {item.href ? (
                    <Link
                      href={item.href}
                      className="group mt-auto inline-flex items-center gap-2 pt-5 text-white/[0.42] transition-colors hover:text-white/[0.72]"
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
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <div className="flex items-center gap-3">
                <Handshake className="h-4 w-4" style={{ color: `${GOLD}AA` }} />
                <Eyebrow>Referral posture</Eyebrow>
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
                Selective opening for approved referrers.
              </h2>
              <p className="mt-5 max-w-[58ch] text-[15px] leading-[1.85] text-white/[0.52]">
                Approved referrers may receive revenue share on qualifying client purchases. The route remains premium, relationship-led, and governed by fit.
              </p>
            </div>
            <div className="grid gap-px bg-white/[0.05] md:grid-cols-2">
              {BOUNDARIES.map((item) => (
                <div key={item.title} className="bg-[#030305] p-5">
                  <div className="flex items-start gap-3">
                    <ClipboardCheck className="mt-0.5 h-4 w-4 shrink-0" style={{ color: `${GOLD}A8` }} />
                    <div>
                      <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: `${GOLD}90` }}>
                        {item.title}
                      </p>
                      <p className="mt-3 text-[13px] leading-[1.7] text-white/[0.52]">{item.body}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-14 lg:px-12">
          <div className="mx-auto grid max-w-7xl gap-6 border border-white/[0.075] bg-white/[0.018] p-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4" style={{ color: `${GOLD}AA` }} />
                <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.2em", textTransform: "uppercase", color: `${GOLD}90` }}>
                  Request access
                </p>
              </div>
              <p className="mt-3 max-w-[78ch] text-[14px] leading-[1.85] text-white/[0.52]">
                Use the request route if you advise clients through consequential decisions and want to introduce Boardroom Briefs, Enterprise scans, Executive Reports, Strategy Room, or retained review into appropriate work.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 md:justify-end">
              <PrimaryLink href="/contact?type=professional-access">Request professional access</PrimaryLink>
              <SecondaryLink href="/boardroom-brief">Generate Boardroom Brief</SecondaryLink>
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
                  Professional access does not create client entitlement, automatic commission treatment, automated tracking, or a right to resell the system. Each client route remains subject to evidence, fit, and the relevant access terms.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
