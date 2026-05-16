/**
 * pages/report/[reportId].tsx
 *
 * /report/[reportId] — Live executive report view.
 *
 * Authenticated. Renders the client-safe live state of a governed case
 * as an executive-level report. This is not a frozen PDF — it reflects
 * the current state of the governed record.
 *
 * The report does not expose raw evidence, respondent identifiers,
 * operator notes, suppression details, or internal system mechanics.
 * The boundary note is always shown.
 */

import * as React from "react";
import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from "lucide-react";

import Layout from "@/components/Layout";
import type { LiveReportApiResponse, LiveReportResult } from "@/pages/api/report/[reportId]";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
};
const serif: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
  fontWeight: 300,
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        ...mono,
        fontSize: "7px",
        letterSpacing: "0.22em",
        textTransform: "uppercase",
        color: "rgba(255,255,255,0.28)",
        marginBottom: "8px",
      }}
    >
      {children}
    </p>
  );
}

function GoldDivider() {
  return (
    <div
      style={{
        height: "1px",
        background: `linear-gradient(90deg, transparent 0%, ${GOLD}20 20%, ${GOLD}20 80%, transparent 100%)`,
        margin: "24px 0",
      }}
    />
  );
}

function StatusBadge({ status }: { status: LiveReportResult["status"] }) {
  const CONFIGS = {
    ACTIVE: { label: "Active", color: `${GOLD}CC`, border: `${GOLD}40` },
    COMPLETED: { label: "Completed", color: "rgba(110,231,183,0.8)", border: "rgba(110,231,183,0.25)" },
    INSUFFICIENT_EVIDENCE: { label: "Insufficient evidence", color: "rgba(255,255,255,0.35)", border: "rgba(255,255,255,0.10)" },
    UNKNOWN: { label: "Unknown", color: "rgba(255,255,255,0.25)", border: "rgba(255,255,255,0.08)" },
  } as const;

  const c = CONFIGS[status];
  return (
    <span
      style={{
        ...mono,
        fontSize: "7px",
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: c.color,
        border: `1px solid ${c.border}`,
        padding: "0.15rem 0.5rem",
      }}
    >
      {c.label}
    </span>
  );
}

function ConfidenceBar({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <div
        style={{
          flex: 1,
          height: "2px",
          backgroundColor: "rgba(255,255,255,0.08)",
          borderRadius: "1px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            backgroundColor: `${GOLD}${Math.round(pct * 0.8 + 20).toString(16).padStart(2, "0")}`,
          }}
        />
      </div>
      <span
        style={{
          ...mono,
          fontSize: "7px",
          color: "rgba(255,255,255,0.28)",
          flexShrink: 0,
        }}
      >
        {pct}%
      </span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const LiveReportPage: NextPage = () => {
  const router = useRouter();
  const { reportId } = router.query;

  const [report, setReport] = React.useState<LiveReportResult | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!reportId || typeof reportId !== "string") return;

    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/report/${encodeURIComponent(reportId as string)}`);
        if (res.status === 401) {
          void router.push(`/auth/signin?callbackUrl=${encodeURIComponent(router.asPath)}`);
          return;
        }
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          setError(body.error ?? `Server error (${res.status})`);
          return;
        }
        const json = (await res.json()) as LiveReportApiResponse;
        setReport(json.report);
      } catch {
        setError("Network error — could not load report.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [reportId, router]);

  if (loading) {
    return (
      <Layout title="Executive Report | Abraham of London">
        <main className="min-h-screen px-6 py-24" style={{ backgroundColor: "rgb(3,3,5)", color: "white" }}>
          <div className="mx-auto max-w-2xl">
            <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>
              Loading report…
            </p>
          </div>
        </main>
      </Layout>
    );
  }

  if (error || !report) {
    return (
      <Layout title="Report not found | Abraham of London">
        <main className="min-h-screen px-6 py-24" style={{ backgroundColor: "rgb(3,3,5)", color: "white" }}>
          <div className="mx-auto max-w-2xl space-y-4">
            <Link
              href="/decision-centre"
              style={{ ...mono, fontSize: "7px", letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", textDecoration: "none" }}
            >
              ← Decision Centre
            </Link>
            <p style={{ ...serif, fontSize: "1rem", color: "rgba(255,255,255,0.50)" }}>
              {error ?? "Report not available."}
            </p>
          </div>
        </main>
      </Layout>
    );
  }

  const isInsufficient = report.status === "INSUFFICIENT_EVIDENCE";

  return (
    <Layout
      title={`Executive Report — ${report.organisation ?? report.reportId} | Abraham of London`}
      description="Live governed case view — client-safe executive report."
    >
      <Head>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <main
        className="min-h-screen px-6 py-20"
        style={{ backgroundColor: "rgb(3,3,5)", color: "white" }}
      >
        <div style={{ maxWidth: "680px", margin: "0 auto" }}>

          {/* ── Back ─────────────────────────────────────────────── */}
          <Link
            href={report.decisionCentreHref}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              ...mono,
              fontSize: "7px",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.28)",
              textDecoration: "none",
              marginBottom: "2rem",
            }}
          >
            <ArrowLeft className="h-3 w-3" />
            Case detail
          </Link>

          {/* ── Report header ─────────────────────────────────────── */}
          <header
            style={{
              border: `1px solid ${GOLD}22`,
              backgroundColor: `${GOLD}04`,
              padding: "1.5rem",
              marginBottom: "2rem",
            }}
          >
            {/* Label row */}
            <div className="flex items-center gap-2 flex-wrap mb-4">
              <FileText className="h-4 w-4 shrink-0" style={{ color: `${GOLD}77` }} />
              <p
                style={{
                  ...mono,
                  fontSize: "7px",
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: `${GOLD}88`,
                }}
              >
                Executive report · Live case view
              </p>
              <StatusBadge status={report.status} />
            </div>

            {/* Organisation */}
            {report.organisation && (
              <h1
                style={{
                  ...serif,
                  fontSize: "clamp(1.3rem, 2.5vw, 1.8rem)",
                  lineHeight: 1.15,
                  color: "rgba(255,255,255,0.88)",
                  marginBottom: "0.5rem",
                }}
              >
                {report.organisation}
              </h1>
            )}

            {/* Meta row */}
            <div className="flex items-center gap-4 flex-wrap mt-2">
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.3rem",
                  ...mono,
                  fontSize: "6.5px",
                  letterSpacing: "0.10em",
                  color: "rgba(255,255,255,0.22)",
                }}
              >
                <Clock className="h-3 w-3" />
                {report.daysOpen} day{report.daysOpen === 1 ? "" : "s"} open
              </span>
              <span
                style={{
                  ...mono,
                  fontSize: "6.5px",
                  letterSpacing: "0.10em",
                  color: "rgba(255,255,255,0.18)",
                }}
              >
                Ref: {report.reportId}
              </span>
              <span
                style={{
                  ...mono,
                  fontSize: "6.5px",
                  letterSpacing: "0.10em",
                  color: "rgba(255,255,255,0.18)",
                  textTransform: "capitalize",
                }}
              >
                {report.diagnosticType.replace(/-/g, " ")}
              </span>
            </div>
          </header>

          {/* ── Insufficient evidence ──────────────────────────── */}
          {isInsufficient && (
            <section
              style={{
                border: "1px solid rgba(255,255,255,0.08)",
                backgroundColor: "rgba(255,255,255,0.015)",
                padding: "1.25rem",
                marginBottom: "2rem",
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 shrink-0" style={{ color: "rgba(255,200,80,0.65)" }} />
                <SectionLabel>Insufficient evidence</SectionLabel>
              </div>
              <p style={{ ...serif, fontSize: "0.95rem", lineHeight: 1.7, color: "rgba(255,255,255,0.50)" }}>
                The governed record does not yet contain enough evidence to produce a full executive report.
                Run the Fast Diagnostic to begin building the case record.
              </p>
              <div style={{ marginTop: "1rem" }}>
                <Link
                  href="/diagnostics/fast"
                  style={{
                    ...mono,
                    fontSize: "8px",
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: `${GOLD}CC`,
                    border: `1px solid ${GOLD}33`,
                    backgroundColor: `${GOLD}08`,
                    padding: "0.55rem 1rem",
                    textDecoration: "none",
                    display: "inline-block",
                  }}
                >
                  Run the Fast Diagnostic
                </Link>
              </div>
            </section>
          )}

          {/* ── Primary decision ───────────────────────────────── */}
          {!isInsufficient && report.primaryDecision && (
            <section style={{ marginBottom: "2rem" }}>
              <SectionLabel>Decision under governance</SectionLabel>
              <div
                style={{
                  borderLeft: `2px solid ${GOLD}40`,
                  paddingLeft: "1rem",
                }}
              >
                <p
                  style={{
                    ...serif,
                    fontSize: "1.05rem",
                    lineHeight: 1.65,
                    color: "rgba(255,255,255,0.80)",
                    fontStyle: "italic",
                  }}
                >
                  &ldquo;{report.primaryDecision}&rdquo;
                </p>
              </div>
            </section>
          )}

          {/* ── Primary constraint ────────────────────────────── */}
          {!isInsufficient && report.primaryConstraint && (
            <section
              style={{
                border: "1px solid rgba(255,200,100,0.12)",
                backgroundColor: "rgba(255,200,100,0.03)",
                padding: "1rem",
                marginBottom: "2rem",
              }}
            >
              <SectionLabel>Constraint on decision</SectionLabel>
              <p
                style={{
                  ...serif,
                  fontSize: "0.93rem",
                  lineHeight: 1.65,
                  color: "rgba(255,255,255,0.65)",
                }}
              >
                {report.primaryConstraint}
              </p>
            </section>
          )}

          {/* ── Cost of delay ─────────────────────────────────── */}
          {!isInsufficient && report.costOfDelay && (
            <section style={{ marginBottom: "2rem" }}>
              <SectionLabel>Cost of delay</SectionLabel>
              <p
                style={{
                  ...serif,
                  fontSize: "0.92rem",
                  lineHeight: 1.65,
                  color: "rgba(255,255,255,0.55)",
                }}
              >
                {report.costOfDelay}
              </p>
            </section>
          )}

          <GoldDivider />

          {/* ── Evidence record ───────────────────────────────── */}
          {!isInsufficient && report.evidence.length > 0 && (
            <section style={{ marginBottom: "2rem" }}>
              <SectionLabel>Governed evidence record ({report.evidence.length} item{report.evidence.length === 1 ? "" : "s"})</SectionLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {report.evidence.map((item, i) => (
                  <div
                    key={i}
                    style={{
                      border: "1px solid rgba(255,255,255,0.07)",
                      backgroundColor: "rgba(255,255,255,0.015)",
                      padding: "0.75rem 1rem",
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        style={{
                          ...mono,
                          fontSize: "6.5px",
                          letterSpacing: "0.12em",
                          textTransform: "uppercase",
                          color: `${GOLD}66`,
                        }}
                      >
                        {item.kind}
                      </span>
                    </div>
                    <p
                      style={{
                        ...serif,
                        fontSize: "0.9rem",
                        lineHeight: 1.6,
                        color: "rgba(255,255,255,0.60)",
                        marginBottom: "0.5rem",
                      }}
                    >
                      {item.label}
                    </p>
                    <ConfidenceBar confidence={item.confidence} />
                  </div>
                ))}
              </div>
            </section>
          )}

          <GoldDivider />

          {/* ── Next action ───────────────────────────────────── */}
          <section
            style={{
              border: `1px solid ${GOLD}22`,
              backgroundColor: `${GOLD}05`,
              padding: "1rem",
              marginBottom: "2rem",
            }}
          >
            {report.status === "COMPLETED" ? (
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: "rgba(110,231,183,0.6)" }} />
                <SectionLabel>Record complete</SectionLabel>
              </div>
            ) : (
              <SectionLabel>Next required action</SectionLabel>
            )}
            <p
              style={{
                ...serif,
                fontSize: "0.95rem",
                lineHeight: 1.65,
                color: "rgba(255,255,255,0.70)",
              }}
            >
              {report.nextAction}
            </p>
          </section>

          {/* ── Footer navigation ─────────────────────────────── */}
          <div className="flex flex-wrap gap-3 mb-8">
            <Link
              href={report.decisionCentreHref}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                ...mono,
                fontSize: "8px",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: `${GOLD}DD`,
                textDecoration: "none",
                border: `1px solid ${GOLD}40`,
                backgroundColor: `${GOLD}0A`,
                padding: "0.55rem 1rem",
              }}
            >
              Open in Decision Centre
              <ArrowRight className="h-3 w-3" />
            </Link>
            <Link
              href={`/return-brief/${report.reportId}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                ...mono,
                fontSize: "8px",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.38)",
                textDecoration: "none",
                border: "1px solid rgba(255,255,255,0.10)",
                padding: "0.55rem 1rem",
              }}
            >
              Return Brief
            </Link>
            <Link
              href="/diagnostics/fast"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                ...mono,
                fontSize: "8px",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.28)",
                textDecoration: "none",
                padding: "0.55rem 0",
              }}
            >
              New assessment
            </Link>
          </div>

          {/* ── Boundary note ─────────────────────────────────── */}
          <section
            style={{
              borderTop: "1px solid rgba(255,255,255,0.05)",
              paddingTop: "1rem",
            }}
          >
            <p
              style={{
                ...mono,
                fontSize: "6.5px",
                letterSpacing: "0.10em",
                lineHeight: 1.75,
                color: "rgba(255,255,255,0.18)",
              }}
            >
              {report.boundaryNote}
            </p>
          </section>

        </div>
      </main>
    </Layout>
  );
};

export default LiveReportPage;
