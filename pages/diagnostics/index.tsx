import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Lock, ShieldCheck } from "lucide-react";

import Layout from "@/components/Layout";
import {
  readConstitutionalThread,
  type ConstitutionalThread,
} from "@/lib/diagnostics/session-thread";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
};
const serif: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
  fontWeight: 300,
};

type SurfaceState = "OPEN" | "AVAILABLE" | "COMPLETED" | "LOCKED";

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        ...mono,
        fontSize: "9px",
        letterSpacing: "0.2em",
        textTransform: "uppercase",
        color: `${GOLD}88`,
      }}
    >
      {children}
    </p>
  );
}

function statusColor(state: SurfaceState) {
  if (state === "OPEN") return `${GOLD}CC`;
  if (state === "AVAILABLE") return "rgba(110,231,183,0.90)";
  if (state === "COMPLETED") return "rgba(110,231,183,0.90)";
  return "rgba(255,255,255,0.38)";
}

function StatusBadge({ state }: { state: SurfaceState }) {
  const Icon = state === "COMPLETED" ? CheckCircle2 : state === "LOCKED" ? Lock : ShieldCheck;
  return (
    <span
      className="inline-flex items-center gap-2"
      style={{
        ...mono,
        fontSize: "9px",
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: statusColor(state),
      }}
    >
      <Icon className="h-3 w-3" />
      {state === "OPEN"
        ? "Open entry"
        : state === "AVAILABLE"
          ? "Available"
          : state === "COMPLETED"
            ? "Completed"
            : "Not yet earned"}
    </span>
  );
}

function SurfaceCard({
  title,
  state,
  detail,
  why,
  href,
  cta,
}: {
  title: string;
  state: SurfaceState;
  detail: string;
  why: string;
  href?: string;
  cta?: string;
}) {
  return (
    <div className="border border-white/[0.08] bg-white/[0.02] p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div
          style={{
            ...serif,
            fontSize: "1.35rem",
            lineHeight: 1.05,
            color: "rgba(255,255,255,0.88)",
            fontStyle: "italic",
          }}
        >
          {title}
        </div>
        <StatusBadge state={state} />
      </div>
      <p className="mt-4 text-[14px] leading-[1.8] text-white/60">{detail}</p>
      <p className="mt-3 text-[13px] leading-[1.75] text-white/42">{why}</p>
      {href && cta ? (
        <div className="mt-5">
          <Link
            href={href}
            className="group inline-flex min-h-[44px] items-center gap-2 border px-5 py-3 transition-all duration-200 hover:-translate-y-0.5"
            style={{
              borderColor: state === "LOCKED" ? "rgba(255,255,255,0.10)" : `${GOLD}40`,
              backgroundColor: state === "LOCKED" ? "rgba(255,255,255,0.03)" : `${GOLD}10`,
              color: state === "LOCKED" ? "rgba(255,255,255,0.42)" : "#F5F5F5",
              ...mono,
              fontSize: "10px",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              pointerEvents: state === "LOCKED" ? "none" : "auto",
            }}
            aria-disabled={state === "LOCKED"}
          >
            {cta}
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      ) : null}
    </div>
  );
}

export default function DiagnosticsIndexPage() {
  const [thread, setThread] = React.useState<ConstitutionalThread | null>(null);
  const [teamDone, setTeamDone] = React.useState(false);
  const [enterpriseDone, setEnterpriseDone] = React.useState(false);

  React.useEffect(() => {
    setThread(readConstitutionalThread());
    try {
      setTeamDone(Boolean(window.sessionStorage.getItem("team-assessment-result")));
      setEnterpriseDone(Boolean(window.sessionStorage.getItem("enterprise-assessment-result")));
    } catch {
      setTeamDone(false);
      setEnterpriseDone(false);
    }
  }, []);

  const hasConstitutionalEvidence = Boolean(thread);
  const executiveReady =
    enterpriseDone ||
    Boolean(thread?.enterpriseFindings) ||
    teamDone ||
    Boolean(thread?.teamFindings) ||
    thread?.route === "STRATEGY";

  return (
    <Layout
      title="Diagnostics | Abraham of London"
      description="Enter through evidence. Start with a live decision, then earn the next surface only if the record justifies it."
      canonicalUrl="/diagnostics"
      fullWidth
      headerTransparent
    >
      <Head>
        <meta
          name="description"
          content="The governed evidence path for Decision Infrastructure. Start with a live decision, accumulate evidence, and earn the next surface only when justified."
        />
      </Head>

      <div style={{ backgroundColor: "rgb(3,3,5)", minHeight: "100vh", color: "white" }}>
        <section className="px-6 pb-12 pt-[128px] md:pb-16 md:pt-36">
          <div className="mx-auto max-w-[1100px]">
            <Eyebrow>Diagnostics</Eyebrow>
            <h1
              className="mt-6"
              style={{
                ...serif,
                fontSize: "clamp(2.3rem, 6vw, 4.4rem)",
                lineHeight: 0.98,
                color: "#F5F5F5",
                fontStyle: "italic",
                letterSpacing: "-0.03em",
              }}
            >
              Enter through evidence.
            </h1>
            <p className="mt-6 max-w-[54ch] text-[16px] leading-[1.85] text-white/58">
              This is not a catalogue of diagnostics. Start with a real decision,
              receive a finding, and earn the next surface only if the record
              justifies it.
            </p>
          </div>
        </section>

        <section className="border-t border-white/[0.05] px-6 py-16">
          <div className="mx-auto max-w-[1100px]">
            <Eyebrow>Start here</Eyebrow>
            <p className="mt-4 max-w-[56ch] text-[14px] leading-[1.85] text-white/50">
              Start with one decision under pressure. The system will decide whether anything further is warranted.
            </p>
            <div className="mt-8 grid gap-4 lg:grid-cols-2">
              <SurfaceCard
                title="Fast Diagnostic"
                state="OPEN"
                detail="The public entry point for a live decision under pressure."
                why="Use this when the decision is real, the pressure is active, and you need the first governed reading."
                href="/diagnostics/fast"
                cta="Test a Decision"
              />
              <SurfaceCard
                title="Personal Decision Audit / Purpose Alignment"
                state="OPEN"
                detail="Use this when the issue appears personal, mandate-related, or bound up with competing obligation."
                why="This is still an entry surface, but it is for cases where the personal layer needs to be tested before the institutional one."
                href="/diagnostics/purpose-alignment"
                cta="Take Purpose Alignment"
              />
            </div>
          </div>
        </section>

        <section className="border-t border-white/[0.05] px-6 py-16">
          <div className="mx-auto max-w-[1100px]">
            <Eyebrow>Evidence gate</Eyebrow>
            <div className="mt-8">
              <SurfaceCard
                title="Constitutional Diagnostic"
                state={hasConstitutionalEvidence ? "COMPLETED" : "AVAILABLE"}
                detail="Tests whether escalation is structurally warranted."
                why="Use this when governance, authority, execution reality, or trust may be the real source of pressure."
                href="/diagnostics/constitutional-diagnostic"
                cta={hasConstitutionalEvidence ? "Re-open Constitutional Diagnostic" : "Run Constitutional Diagnostic"}
              />
            </div>
          </div>
        </section>

        <section className="border-t border-white/[0.05] px-6 py-16">
          <div className="mx-auto max-w-[1100px]">
            <Eyebrow>Organisational evidence</Eyebrow>
            <div className="mt-8 grid gap-4 lg:grid-cols-2">
              <SurfaceCard
                title="Team Assessment"
                state={teamDone || Boolean(thread?.teamFindings) ? "COMPLETED" : hasConstitutionalEvidence ? "AVAILABLE" : "LOCKED"}
                detail="Measures leadership-team divergence after a decision condition has already been named."
                why={
                  hasConstitutionalEvidence
                    ? "Prior diagnostic context is present, so this surface can sharpen the record."
                    : "Without prior diagnostic context, this should not be treated as a casual standalone quiz. Start with Fast or Constitutional first."
                }
                href={hasConstitutionalEvidence ? "/diagnostics/team-assessment" : "/diagnostics/constitutional-diagnostic"}
                cta={hasConstitutionalEvidence ? "Open Team Assessment" : "Start with Constitutional"}
              />
              <SurfaceCard
                title="Enterprise Assessment"
                state={enterpriseDone || Boolean(thread?.enterpriseFindings) ? "COMPLETED" : hasConstitutionalEvidence || teamDone ? "AVAILABLE" : "LOCKED"}
                detail="Designed for institutional evidence when the condition is bigger than one team or one perception gap."
                why={
                  hasConstitutionalEvidence || teamDone
                    ? "This surface is now qualified because earlier evidence exists."
                    : "This is strongest after prior diagnostic context or an active organisational case. It is not for casual exploration."
                }
                href={hasConstitutionalEvidence || teamDone ? "/diagnostics/enterprise-assessment" : "/diagnostics/fast"}
                cta={hasConstitutionalEvidence || teamDone ? "Open Enterprise Assessment" : "Start with Fast Diagnostic"}
              />
            </div>
          </div>
        </section>

        <section className="border-t border-white/[0.05] px-6 py-16">
          <div className="mx-auto max-w-[1100px]">
            <Eyebrow>Earned consequence layer</Eyebrow>
            <div className="mt-8 border border-white/[0.08] bg-white/[0.02] p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div
                  style={{
                    ...serif,
                    fontSize: "1.35rem",
                    lineHeight: 1.05,
                    color: "rgba(255,255,255,0.88)",
                    fontStyle: "italic",
                  }}
                >
                  Executive Reporting
                </div>
                <StatusBadge state={executiveReady ? "AVAILABLE" : "LOCKED"} />
              </div>
              <p className="mt-4 text-[14px] leading-[1.8] text-white/60">
                Executive Reporting is not a starting point. It becomes available when the evidence shows decision stakes, consequence, and sufficient seriousness.
              </p>
              <p className="mt-3 text-[13px] leading-[1.75] text-white/42">
                {executiveReady
                  ? "Eligible for Executive Reporting. Earlier evidence is present, so this gate can be reviewed responsibly."
                  : "Not yet earned. Submit evidence first through Fast Diagnostic or the Constitutional Diagnostic."}
              </p>
              {executiveReady ? (
                <div className="mt-5">
                  <Link
                    href="/diagnostics/executive-reporting"
                    className="group inline-flex min-h-[44px] items-center gap-2 border px-5 py-3 transition-all duration-200 hover:-translate-y-0.5"
                    style={{
                      borderColor: `${GOLD}40`,
                      backgroundColor: `${GOLD}10`,
                      color: "#F5F5F5",
                      ...mono,
                      fontSize: "10px",
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                    }}
                  >
                    Review Executive Reporting gate
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              ) : null}
            </div>
            <p className="mt-6 max-w-[62ch] text-[13px] leading-[1.8] text-white/40">
              Strategy Room, Return Brief, and Counsel Review are not starting
              points on this page. They appear only when the case record has
              earned them.
            </p>
          </div>
        </section>
      </div>
    </Layout>
  );
}
