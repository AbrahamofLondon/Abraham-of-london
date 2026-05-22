/**
 * pages/enterprise-decision-authority.tsx
 *
 * Public surface: Enterprise Decision Authority
 *
 * Explains the organisational-grade pipeline without exposing internals.
 * Do NOT reference: scoring internals, endpoint names, role names, survey language,
 * AI prediction claims, fake clients, or regulatory guarantees.
 */

import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import {
  ArrowRight,
  Shield,
  Lock,
  GitBranch,
  BarChart3,
  FileText,
  Users,
  CheckCircle2,
} from "lucide-react";
import Layout from "@/components/Layout";

const GOLD = "#C9A96E";

const mono: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
};

const serif: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
  fontWeight: 300,
};

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

type CapabilityItem = {
  icon: React.ReactNode;
  label: string;
  body: string;
};

function CapabilityCard({ icon, label, body }: CapabilityItem) {
  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,0.07)",
        backgroundColor: "rgba(255,255,255,0.015)",
        padding: "1.25rem",
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span style={{ color: `${GOLD}80` }}>{icon}</span>
        <p
          style={{
            ...mono,
            fontSize: "8px",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: `${GOLD}BB`,
          }}
        >
          {label}
        </p>
      </div>
      <p style={{ fontSize: "13px", lineHeight: 1.75, color: "rgba(255,255,255,0.55)" }}>
        {body}
      </p>
    </div>
  );
}

function ProtectionBadge({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.35rem",
        border: `1px solid ${GOLD}22`,
        backgroundColor: `${GOLD}06`,
        color: `${GOLD}AA`,
        ...mono,
        fontSize: "7px",
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        padding: "0.25rem 0.55rem",
      }}
    >
      <Shield style={{ width: "9px", height: "9px" }} />
      {children}
    </span>
  );
}

export default function EnterpriseDecisionAuthorityPage() {
  return (
    <Layout
      title="Enterprise Decision Authority | Abraham of London"
      description="Enterprise Decision Authority turns organisational response patterns into governed decision evidence, protected by anonymisation, cohort safety, lineage, and escalation controls."
      canonicalUrl="/enterprise-decision-authority"
      fullWidth
      headerTransparent
    >
      <Head>
        <meta
          name="description"
          content="Enterprise Decision Authority turns organisational response patterns into governed decision evidence, protected by anonymisation, cohort safety, lineage, and escalation controls."
        />
      </Head>

      <div style={{ backgroundColor: "rgb(3,3,5)", minHeight: "100vh", color: "white" }}>

        {/* ── HEADER ─────────────────────────────────────────────────────── */}
        <section className="px-6 pb-12 pt-[128px] md:pb-16 md:pt-36">
          <div className="mx-auto max-w-[1100px]">
            <Eyebrow>Enterprise Decision Authority</Eyebrow>
            <h1
              className="mt-6"
              style={{
                ...serif,
                fontSize: "clamp(2.2rem, 5.5vw, 4.2rem)",
                lineHeight: 0.98,
                color: "#F5F5F5",
                fontStyle: "italic",
                letterSpacing: "-0.03em",
                maxWidth: "22ch",
              }}
            >
              Governed evidence at the organisational scale.
            </h1>
            <p className="mt-6 max-w-[52ch] text-[16px] leading-[1.85] text-white/58">
              Enterprise Decision Authority turns organisational response patterns
              into governed decision evidence, protected by anonymisation, cohort
              safety, lineage, and escalation controls.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ProtectionBadge>Anonymised aggregation</ProtectionBadge>
              <ProtectionBadge>Minimum cohort protection</ProtectionBadge>
              <ProtectionBadge>Chain-of-custody lineage</ProtectionBadge>
              <ProtectionBadge>Escalation-gated release</ProtectionBadge>
            </div>
          </div>
        </section>

        {/* ── POSITION IN THE LADDER ──────────────────────────────────────── */}
        <section
          className="border-t border-white/[0.05] px-6 py-10"
          style={{ backgroundColor: "rgba(255,255,255,0.01)" }}
        >
          <div className="mx-auto max-w-[1100px]">
            <p
              style={{
                ...mono,
                fontSize: "7px",
                letterSpacing: "0.24em",
                textTransform: "uppercase",
                color: `${GOLD}65`,
                marginBottom: "1rem",
              }}
            >
              Evidence path
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {[
                "Fast Diagnostic",
                "Executive Reporting",
                "Strategy Room",
                "Enterprise Decision Authority",
                "Boardroom Dossier",
              ].map((step, i, arr) => (
                <React.Fragment key={step}>
                  <span
                    style={{
                      ...mono,
                      fontSize: "8px",
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color:
                        step === "Enterprise Decision Authority"
                          ? `${GOLD}CC`
                          : "rgba(255,255,255,0.30)",
                      border:
                        step === "Enterprise Decision Authority"
                          ? `1px solid ${GOLD}30`
                          : "1px solid transparent",
                      padding:
                        step === "Enterprise Decision Authority"
                          ? "0.2rem 0.5rem"
                          : undefined,
                    }}
                  >
                    {step}
                  </span>
                  {i < arr.length - 1 && (
                    <ArrowRight
                      style={{
                        width: "10px",
                        height: "10px",
                        color: "rgba(255,255,255,0.15)",
                      }}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
            <p className="mt-4 max-w-[58ch] text-[13px] leading-[1.75] text-white/40">
              Enterprise Decision Authority is not an entry point. It is reached
              after individual evidence — diagnostic, executive, and strategic — has
              established that an organisational-level reading is warranted.
            </p>
          </div>
        </section>

        {/* ── WHAT IT DOES ────────────────────────────────────────────────── */}
        <section className="border-t border-white/[0.05] px-6 py-16">
          <div className="mx-auto max-w-[1100px]">
            <Eyebrow>What Enterprise Decision Authority does</Eyebrow>
            <p className="mt-4 max-w-[56ch] text-[14px] leading-[1.85] text-white/50">
              The pipeline moves from individual response to governed organisational
              evidence — without compressing individual signals into false consensus.
            </p>
            <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <CapabilityCard
                icon={<Users className="h-4 w-4" />}
                label="Campaign-based collection"
                body="Responses are gathered under a governed assessment campaign tied to a specific organisational context. Each campaign has a named scope, a defined cohort, and a fixed review window."
              />
              <CapabilityCard
                icon={<Shield className="h-4 w-4" />}
                label="Anonymisation and cohort safety"
                body="Individual responses are never surfaced. Results are aggregated only when the cohort meets the minimum threshold for privacy-safe reporting. Groups that fall below the floor are suppressed at both write and read time."
              />
              <CapabilityCard
                icon={<BarChart3 className="h-4 w-4" />}
                label="Contradiction and drift detection"
                body="The system identifies where team perceptions diverge from leadership positions, where stated priorities contradict execution patterns, and where institutional drift has accumulated over time."
              />
              <CapabilityCard
                icon={<FileText className="h-4 w-4" />}
                label="Enterprise report generation"
                body="Findings are compiled into a structured enterprise report with named conditions, consequence signatures, and evidence references. The report carries a version identifier and is sealed against undetected modification."
              />
              <CapabilityCard
                icon={<GitBranch className="h-4 w-4" />}
                label="Chain-of-custody lineage"
                body="Every material event — creation, viewing, export, update, escalation, revocation — is recorded in an append-only lineage ledger. No state change is untracked. The record survives report supersession."
              />
              <CapabilityCard
                icon={<Lock className="h-4 w-4" />}
                label="Escalation into Strategy Room or Boardroom"
                body="Reports meeting escalation criteria can be advanced into Strategy Room review or prepared as Boardroom Dossier material. Escalation requires a named condition, consequence evidence, and operator authority sign-off."
              />
            </div>
          </div>
        </section>

        {/* ── GOVERNANCE ARCHITECTURE ─────────────────────────────────────── */}
        <section
          className="border-t border-white/[0.05] px-6 py-16"
          style={{ backgroundColor: "rgba(255,255,255,0.01)" }}
        >
          <div className="mx-auto max-w-[1100px]">
            <Eyebrow>Governance architecture</Eyebrow>
            <p className="mt-4 max-w-[54ch] text-[14px] leading-[1.85] text-white/50">
              The pipeline is governed end-to-end — not just at the output. Each
              control layer is active during collection, processing, and release.
            </p>
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              <div>
                <p
                  style={{
                    ...mono,
                    fontSize: "7.5px",
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                    color: `${GOLD}88`,
                    marginBottom: "1rem",
                  }}
                >
                  Privacy controls
                </p>
                <div className="space-y-3">
                  {[
                    {
                      label: "Minimum cohort gate",
                      body: "Subgroup results are suppressed unless the respondent count meets the minimum threshold. The gate is enforced independently at aggregation and at read time.",
                    },
                    {
                      label: "Anonymised aggregation",
                      body: "Individual identifiers are separated from response data during processing. The enterprise view contains only aggregate patterns, never individual attribution.",
                    },
                    {
                      label: "Revocation controls",
                      body: "A report can be revoked by an authorised operator. Revocation is recorded in the lineage ledger. Downstream references to the revoked version carry a revocation marker.",
                    },
                  ].map(({ label, body }) => (
                    <div
                      key={label}
                      style={{
                        borderLeft: `2px solid ${GOLD}22`,
                        paddingLeft: "0.85rem",
                      }}
                    >
                      <p
                        style={{
                          ...mono,
                          fontSize: "8px",
                          letterSpacing: "0.14em",
                          textTransform: "uppercase",
                          color: `${GOLD}99`,
                          marginBottom: "0.3rem",
                        }}
                      >
                        {label}
                      </p>
                      <p
                        style={{
                          fontSize: "13px",
                          lineHeight: 1.7,
                          color: "rgba(255,255,255,0.50)",
                        }}
                      >
                        {body}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p
                  style={{
                    ...mono,
                    fontSize: "7.5px",
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                    color: `${GOLD}88`,
                    marginBottom: "1rem",
                  }}
                >
                  Integrity controls
                </p>
                <div className="space-y-3">
                  {[
                    {
                      label: "Lineage ledger",
                      body: "Every report event is written to an append-only ledger. The record is not editable after write. Superseded versions retain their own lineage chain.",
                    },
                    {
                      label: "Evidence hash",
                      body: "Each sealed report carries a content hash. If the underlying evidence changes after sealing, the hash no longer matches — changes become detectable on next verification.",
                    },
                    {
                      label: "Controlled publishing",
                      body: "Report release is not automatic. Escalation into Strategy Room or Boardroom requires a governed approval step. The release decision is logged with actor, timestamp, and authority.",
                    },
                  ].map(({ label, body }) => (
                    <div
                      key={label}
                      style={{
                        borderLeft: `2px solid ${GOLD}22`,
                        paddingLeft: "0.85rem",
                      }}
                    >
                      <p
                        style={{
                          ...mono,
                          fontSize: "8px",
                          letterSpacing: "0.14em",
                          textTransform: "uppercase",
                          color: `${GOLD}99`,
                          marginBottom: "0.3rem",
                        }}
                      >
                        {label}
                      </p>
                      <p
                        style={{
                          fontSize: "13px",
                          lineHeight: 1.7,
                          color: "rgba(255,255,255,0.50)",
                        }}
                      >
                        {body}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── READINESS NOTICE ────────────────────────────────────────────── */}
        <section className="border-t border-white/[0.05] px-6 py-16">
          <div className="mx-auto max-w-[1100px]">
            <div
              style={{
                border: `1px solid ${GOLD}20`,
                backgroundColor: `${GOLD}05`,
                padding: "1.5rem",
                maxWidth: "640px",
              }}
            >
              <div className="flex items-start gap-3">
                <CheckCircle2
                  className="h-4 w-4 mt-0.5 shrink-0"
                  style={{ color: `${GOLD}88` }}
                />
                <div>
                  <p
                    style={{
                      ...mono,
                      fontSize: "7.5px",
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      color: `${GOLD}AA`,
                      marginBottom: "0.5rem",
                    }}
                  >
                    Operator-ready · Gated engagement
                  </p>
                  <p style={{ fontSize: "14px", lineHeight: 1.8, color: "rgba(255,255,255,0.60)" }}>
                    Enterprise Decision Authority is available for qualified
                    organisational deployments through a gated engagement process.
                    The infrastructure is production-ready; engagement begins with a
                    scoped review of the organisational context, campaign design, and
                    governance requirements.
                  </p>
                  <p
                    style={{
                      marginTop: "0.75rem",
                      fontSize: "13px",
                      lineHeight: 1.75,
                      color: "rgba(255,255,255,0.38)",
                    }}
                  >
                    General-availability access has not yet been opened. Contact the
                    team to discuss deployment scope and readiness criteria.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA STRIP ───────────────────────────────────────────────────── */}
        <section className="border-t border-white/[0.05] px-6 py-16">
          <div className="mx-auto max-w-[1100px]">
            <p className="max-w-[52ch] text-[14px] leading-[1.85] text-white/50">
              If you have an active decision case and are assessing whether organisational
              evidence is warranted, start at the diagnostic layer. Enterprise Decision
              Authority is earned, not purchased.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/diagnostics/fast"
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
                Start with a live decision
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/diagnostics"
                className="group inline-flex min-h-[44px] items-center gap-2 border px-5 py-3 transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  borderColor: "rgba(255,255,255,0.10)",
                  backgroundColor: "rgba(255,255,255,0.02)",
                  color: "rgba(255,255,255,0.42)",
                  ...mono,
                  fontSize: "10px",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                }}
              >
                View the full evidence path
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/trust"
                className="group inline-flex min-h-[44px] items-center gap-2 border px-5 py-3 transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  borderColor: "rgba(255,255,255,0.10)",
                  backgroundColor: "rgba(255,255,255,0.02)",
                  color: "rgba(255,255,255,0.42)",
                  ...mono,
                  fontSize: "10px",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                }}
              >
                Trust and governance
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </section>

        {/* ── FOOTER NOTE ─────────────────────────────────────────────────── */}
        <div
          className="border-t px-6 py-8"
          style={{ borderColor: "rgba(255,255,255,0.04)" }}
        >
          <div className="mx-auto max-w-[1100px]">
            <p
              style={{
                ...mono,
                fontSize: "6.5px",
                lineHeight: 1.8,
                letterSpacing: "0.1em",
                color: "rgba(255,255,255,0.18)",
                maxWidth: "80ch",
              }}
            >
              Abraham of London provides governed decision instruments and structured advisory frameworks.
              Nothing on this page constitutes legal, financial, investment, tax, medical, immigration,
              accounting, or other regulated professional advice. Access is charged for methodology access,
              software-enabled records, structured outputs, and session facilitation, not for guaranteed outcomes.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
