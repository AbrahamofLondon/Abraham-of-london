/**
 * pages/return-brief/[caseId].tsx
 *
 * /return-brief/[caseId] — Client-safe Return Brief view.
 *
 * Authenticated. Fetches the stored Return Brief for the given case
 * (or generates one on demand if none exists) and renders it in a
 * client-safe format.
 *
 * The Return Brief does not expose raw evidence, respondent text,
 * operator notes, suppression details, or internal trigger mechanics.
 * The boundary note is always shown.
 */

import * as React from "react";
import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { ArrowLeft, FileText, AlertTriangle, CheckCircle2 } from "lucide-react";

import Layout from "@/components/Layout";
import type { ReturnBriefApiResponse } from "@/pages/api/cases/return-brief";
import type { ReturnBriefV1 } from "@/lib/product/return-brief-contract";

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

function BriefList({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
      {items.map((item, i) => (
        <li
          key={i}
          style={{
            display: "flex",
            gap: "10px",
            alignItems: "flex-start",
          }}
        >
          <span
            style={{
              ...mono,
              fontSize: "7px",
              color: `${GOLD}66`,
              flexShrink: 0,
              paddingTop: "4px",
            }}
          >
            ·
          </span>
          <p
            style={{
              ...serif,
              fontSize: "0.92rem",
              lineHeight: 1.65,
              color: "rgba(255,255,255,0.65)",
            }}
          >
            {item}
          </p>
        </li>
      ))}
    </ul>
  );
}

// ─── Status pill ──────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: ReturnBriefV1["status"] }) {
  const CONFIGS: Record<
    ReturnBriefV1["status"],
    { label: string; color: string; border: string }
  > = {
    ACTIVE: { label: "Active", color: "rgba(255,160,60,0.9)", border: "rgba(255,160,60,0.3)" },
    RESOLVED: { label: "Resolved", color: "rgba(110,231,183,0.8)", border: "rgba(110,231,183,0.25)" },
    INSUFFICIENT_EVIDENCE: {
      label: "Insufficient evidence",
      color: "rgba(255,255,255,0.35)",
      border: "rgba(255,255,255,0.10)",
    },
    UNKNOWN: { label: "Unknown", color: "rgba(255,255,255,0.25)", border: "rgba(255,255,255,0.08)" },
  };

  const config = CONFIGS[status];
  return (
    <span
      style={{
        ...mono,
        fontSize: "7px",
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: config.color,
        border: `1px solid ${config.border}`,
        padding: "0.15rem 0.5rem",
      }}
    >
      {config.label}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const ReturnBriefPage: NextPage = () => {
  const router = useRouter();
  const { caseId } = router.query;

  const [data, setData] = React.useState<ReturnBriefApiResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!caseId || typeof caseId !== "string") return;

    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/cases/return-brief?caseId=${encodeURIComponent(caseId as string)}`);
        if (res.status === 401) {
          void router.push(`/auth/signin?callbackUrl=${encodeURIComponent(router.asPath)}`);
          return;
        }
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          setError(body.error ?? `Server error (${res.status})`);
          return;
        }
        const json = (await res.json()) as ReturnBriefApiResponse;
        setData(json);
      } catch {
        setError("Network error — could not load Return Brief.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [caseId, router]);

  if (loading) {
    return (
      <Layout title="Return Brief | Abraham of London">
        <main className="min-h-screen px-6 py-24" style={{ backgroundColor: "rgb(3,3,5)", color: "white" }}>
          <div className="mx-auto max-w-2xl">
            <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>
              Loading Return Brief…
            </p>
          </div>
        </main>
      </Layout>
    );
  }

  if (error || !data) {
    return (
      <Layout title="Return Brief | Abraham of London">
        <main className="min-h-screen px-6 py-24" style={{ backgroundColor: "rgb(3,3,5)", color: "white" }}>
          <div className="mx-auto max-w-2xl space-y-4">
            <Link
              href="/decision-centre"
              style={{ ...mono, fontSize: "7px", letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", textDecoration: "none" }}
            >
              ← Decision Centre
            </Link>
            <p style={{ ...serif, fontSize: "1rem", color: "rgba(255,255,255,0.50)" }}>
              {error ?? "Return Brief not available."}
            </p>
          </div>
        </main>
      </Layout>
    );
  }

  const { brief } = data;
  const isInsufficient = brief.status === "INSUFFICIENT_EVIDENCE";

  return (
    <Layout
      title={`Return Brief — ${data.caseId} | Abraham of London`}
      description="Client-safe continuation of the governed case record."
    >
      <Head>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <main
        className="min-h-screen px-6 py-20"
        style={{ backgroundColor: "rgb(3,3,5)", color: "white" }}
      >
        <div className="mx-auto max-w-2xl space-y-6">

          {/* Back */}
          <Link
            href={`/decision-centre/case/${data.caseId}`}
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
            }}
          >
            <ArrowLeft className="h-3 w-3" />
            Case detail
          </Link>

          {/* Header */}
          <header
            style={{
              border: `1px solid ${GOLD}22`,
              backgroundColor: `${GOLD}04`,
              padding: "1.25rem",
            }}
          >
            <div className="flex items-center gap-2 mb-3">
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
                Return Brief
              </p>
              <StatusPill status={brief.status} />
            </div>

            <p
              style={{
                ...mono,
                fontSize: "6.5px",
                letterSpacing: "0.10em",
                color: "rgba(255,255,255,0.20)",
              }}
            >
              Case ref: {brief.caseRef} · Generated {new Date(data.generatedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
            </p>

            {brief.elapsedTimeLabel && (
              <p
                style={{
                  ...mono,
                  fontSize: "8px",
                  letterSpacing: "0.10em",
                  color: "rgba(255,255,255,0.35)",
                  marginTop: "0.5rem",
                }}
              >
                {brief.elapsedTimeLabel}
              </p>
            )}
          </header>

          {/* Insufficient evidence state */}
          {isInsufficient && (
            <section
              style={{
                border: "1px solid rgba(255,255,255,0.08)",
                backgroundColor: "rgba(255,255,255,0.02)",
                padding: "1rem",
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 shrink-0" style={{ color: "rgba(255,200,80,0.6)" }} />
                <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,200,80,0.7)" }}>
                  Insufficient evidence
                </p>
              </div>
              <p style={{ ...serif, fontSize: "0.92rem", lineHeight: 1.65, color: "rgba(255,255,255,0.50)" }}>
                {brief.whatDidNotChange[0] ?? "The governed record does not yet contain enough return-cycle evidence to reopen the condition safely."}
              </p>
              {brief.nowRequired.length > 0 && (
                <p style={{ ...serif, fontSize: "0.88rem", lineHeight: 1.6, color: "rgba(255,255,255,0.35)", marginTop: "0.5rem" }}>
                  {brief.nowRequired[0]}
                </p>
              )}
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
                    padding: "0.5rem 1rem",
                    textDecoration: "none",
                    display: "inline-block",
                  }}
                >
                  Run the next assessment
                </Link>
              </div>
            </section>
          )}

          {/* Original condition */}
          {!isInsufficient && brief.originalCondition && (
            <section>
              <SectionLabel>Original condition</SectionLabel>
              <p style={{ ...serif, fontSize: "0.95rem", lineHeight: 1.65, color: "rgba(255,255,255,0.65)", fontStyle: "italic" }}>
                &ldquo;{brief.originalCondition}&rdquo;
              </p>
            </section>
          )}

          {/* What changed */}
          {!isInsufficient && brief.whatChanged.length > 0 && (
            <section
              style={{
                border: "1px solid rgba(255,255,255,0.08)",
                backgroundColor: "rgba(255,255,255,0.015)",
                padding: "1rem",
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" style={{ color: "rgba(110,231,183,0.55)" }} />
                <SectionLabel>What changed</SectionLabel>
              </div>
              <BriefList items={brief.whatChanged} />
            </section>
          )}

          {/* What did not change */}
          {!isInsufficient && brief.whatDidNotChange.length > 0 && (
            <section
              style={{
                border: "1px solid rgba(255,200,80,0.12)",
                backgroundColor: "rgba(255,200,80,0.025)",
                padding: "1rem",
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" style={{ color: "rgba(255,200,80,0.55)" }} />
                <SectionLabel>What did not change</SectionLabel>
              </div>
              <BriefList items={brief.whatDidNotChange} />
            </section>
          )}

          {/* Now required */}
          {!isInsufficient && brief.nowRequired.length > 0 && (
            <section
              style={{
                border: `1px solid ${GOLD}22`,
                backgroundColor: `${GOLD}05`,
                padding: "1rem",
              }}
            >
              <SectionLabel>Now required</SectionLabel>
              <BriefList items={brief.nowRequired} />
            </section>
          )}

          {/* Escalation status */}
          {!isInsufficient && brief.escalationStatus && brief.escalationStatus !== "NOT_EARNED" && (
            <section style={{ border: "1px solid rgba(255,100,100,0.18)", backgroundColor: "rgba(255,100,100,0.03)", padding: "1rem" }}>
              <SectionLabel>Escalation status</SectionLabel>
              <p style={{ ...mono, fontSize: "9px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,120,120,0.75)" }}>
                {brief.escalationStatus.replace(/_/g, " ")}
              </p>
              <div style={{ marginTop: "0.75rem" }}>
                <Link
                  href="/counsel"
                  style={{
                    ...mono,
                    fontSize: "8px",
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: "rgba(255,120,120,0.75)",
                    border: "1px solid rgba(255,120,120,0.20)",
                    padding: "0.4rem 0.8rem",
                    textDecoration: "none",
                    display: "inline-block",
                  }}
                >
                  Request counsel review
                </Link>
              </div>
            </section>
          )}

          {/* Footer navigation */}
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href={`/decision-centre/case/${data.caseId}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                ...mono,
                fontSize: "7px",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.28)",
                textDecoration: "none",
                border: "1px solid rgba(255,255,255,0.06)",
                padding: "0.4rem 0.75rem",
              }}
            >
              View case detail
            </Link>
            <Link
              href="/diagnostics/fast"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                ...mono,
                fontSize: "7px",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: `${GOLD}99`,
                textDecoration: "none",
                border: `1px solid ${GOLD}25`,
                padding: "0.4rem 0.75rem",
              }}
            >
              Run new assessment
            </Link>
          </div>

          {/* Mandatory boundary note */}
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
                color: "rgba(255,255,255,0.20)",
              }}
            >
              {brief.boundaryNote}
            </p>
          </section>

        </div>
      </main>
    </Layout>
  );
};

export default ReturnBriefPage;
