/**
 * pages/provenance/demo.tsx
 *
 * Public provenance demonstration — /provenance/demo
 *
 * Shows the canonical demo record and lets visitors verify its integrity on
 * demand. Verification calls /api/provenance/demo-verify, which recomputes
 * the SHA-256 hash from the canonical object every time. Status is not hardcoded.
 *
 * No account, case, or governed record is created by visiting this page.
 * The demo record is fully static and publicly disclosed.
 */

import * as React from "react";
import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import {
  Shield,
  Hash,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  Layers,
} from "lucide-react";

import Layout from "@/components/Layout";
import SurfaceBoundaryPanel from "@/components/product/SurfaceBoundaryPanel";
import { trackLaunch } from "@/lib/analytics/client-launch-events";
import { PUBLIC_PROVENANCE_DEMO_RECORD } from "@/lib/product/public-provenance-demo-record";
import type { PublicDemoVerifyResult } from "@/lib/product/public-provenance-demo-verify";

// ─── Design tokens ──────────────────────────────────────────────────────────

const GOLD = "#C9A96E";
const mono: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
};
const serif: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
  fontWeight: 300,
};

// ─── Confidence band display ─────────────────────────────────────────────────

const BAND_LABELS: Record<string, string> = {
  userReported: "User-reported",
  systemInferred: "System-inferred",
  operatorVerified: "Operator-verified",
  thirdParty: "Third-party verified",
};

// ─── Page ───────────────────────────────────────────────────────────────────

const ProvenanceDemoPage: NextPage = () => {
  const [verifyResult, setVerifyResult] =
    React.useState<PublicDemoVerifyResult | null>(null);
  const [verifying, setVerifying] = React.useState(false);
  const [verifyError, setVerifyError] = React.useState<string | null>(null);

  async function handleVerify() {
    setVerifying(true);
    setVerifyError(null);
    setVerifyResult(null);

    try {
      const res = await fetch("/api/provenance/demo-verify");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setVerifyError(
          (body as { error?: string }).error || `Server error (${res.status})`,
        );
        return;
      }
      const data: PublicDemoVerifyResult = await res.json();
      setVerifyResult(data);
      trackLaunch("provenance_demo_verified", "provenance_demo");
    } catch {
      setVerifyError("Network error — could not reach verification endpoint.");
    } finally {
      setVerifying(false);
    }
  }

  const record = PUBLIC_PROVENANCE_DEMO_RECORD;

  return (
    <Layout
      title="Provenance Verification Demo | Abraham of London"
      description="Live integrity verification of a canonical demo provenance record — SHA-256 hash recomputed on demand, not hardcoded."
      fullWidth
    >
      <Head>
        <meta name="robots" content="index,follow" />
      </Head>

      <main
        className="min-h-screen px-6 py-24"
        style={{ backgroundColor: "rgb(3,3,5)", color: "white" }}
      >
        <div className="mx-auto max-w-3xl space-y-8">

          {/* ── HEADER ──────────────────────────────────────────────── */}
          <header
            style={{
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(255,255,255,0.02)",
              padding: "1.25rem",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                border: `1px solid ${GOLD}30`,
                backgroundColor: `${GOLD}08`,
                color: `${GOLD}BB`,
                ...mono,
                fontSize: "7px",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                padding: "0.25rem 0.55rem",
                marginBottom: "0.85rem",
              }}
            >
              Demonstration only · Not connected to any account or live case
            </div>

            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-5 w-5" style={{ color: GOLD }} />
              <p
                style={{
                  ...mono,
                  fontSize: "8px",
                  letterSpacing: "0.24em",
                  textTransform: "uppercase",
                  color: `${GOLD}BB`,
                }}
              >
                Provenance integrity demonstration
              </p>
            </div>

            <h1
              style={{
                ...serif,
                fontSize: "clamp(1.5rem, 3vw, 2.2rem)",
                lineHeight: 1.1,
                color: "rgba(255,255,255,0.92)",
              }}
            >
              Governed Provenance Verification
            </h1>

            <p
              style={{
                marginTop: "0.75rem",
                ...serif,
                fontSize: "0.95rem",
                lineHeight: 1.65,
                color: "rgba(255,255,255,0.55)",
              }}
            >
              This is a demonstration record. It uses the same client-safe
              verification model used for supported governed records. It is not
              connected to your account, your case, or any client data.
            </p>
            <p
              style={{
                marginTop: "0.4rem",
                ...serif,
                fontSize: "0.9rem",
                lineHeight: 1.6,
                color: "rgba(255,255,255,0.38)",
              }}
            >
              The canonical demo record below is hashed with SHA-256 on every
              verification request. The status is never hardcoded.
            </p>
          </header>

          {/* ── SURFACE BOUNDARY ────────────────────────────────────── */}
          <SurfaceBoundaryPanel
            surfaceType="PUBLIC_SAMPLE"
            recordCreated="No account record or governed case is created by viewing this demo."
            systemReads={[
              "Canonical demo provenance record",
              "SHA-256 hash of that record",
              "Integrity status (MATCH / MISMATCH)",
            ]}
            nextAction={{
              label: "Create a governed case",
              href: "/diagnostics/fast",
            }}
            secondaryAction={{
              label: "View client-safe provenance sample",
              href: "/provenance/sample-export",
            }}
          />

          {/* ── DEMO RECORD ─────────────────────────────────────────── */}
          <section
            style={{
              border: `1px solid ${GOLD}18`,
              backgroundColor: `${GOLD}03`,
              padding: "1.25rem",
            }}
          >
            <p
              style={{
                ...mono,
                fontSize: "7px",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: `${GOLD}88`,
                marginBottom: "1rem",
              }}
            >
              Canonical demo record
            </p>

            {/* Summary band */}
            <div className="space-y-3">
              <Row label="Demo ID" value={record.demoId} />
              <Row label="Case reference" value={record.caseReference} />
              <Row label="Generated at" value={record.generatedAt} />
              <Row label="Surface" value={record.surface} />
            </div>

            {/* Risk band */}
            <div
              style={{
                marginTop: "1rem",
                paddingTop: "1rem",
                borderTop: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <p
                style={{
                  ...mono,
                  fontSize: "7px",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: `${GOLD}66`,
                  marginBottom: "0.6rem",
                }}
              >
                Summary
              </p>
              <div className="space-y-2">
                <Row label="Band" value={record.summary.band} />
                <Row
                  label="Governance implication"
                  value={record.summary.governanceImplication}
                />
                <Row
                  label="Next earned action"
                  value={record.summary.nextEarnedAction}
                />
              </div>
            </div>

            {/* Confidence bands */}
            <div
              style={{
                marginTop: "1rem",
                paddingTop: "1rem",
                borderTop: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <p
                style={{
                  ...mono,
                  fontSize: "7px",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: `${GOLD}66`,
                  marginBottom: "0.6rem",
                }}
              >
                Confidence bands
              </p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(record.confidenceBands).map(([key, val]) => (
                  <div
                    key={key}
                    style={{
                      border: "1px solid rgba(255,255,255,0.06)",
                      padding: "0.5rem 0.75rem",
                    }}
                  >
                    <p
                      style={{
                        ...mono,
                        fontSize: "6px",
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        color: "rgba(255,255,255,0.35)",
                        marginBottom: "0.2rem",
                      }}
                    >
                      {BAND_LABELS[key] ?? key}
                    </p>
                    <p
                      style={{
                        ...mono,
                        fontSize: "1rem",
                        color: val > 0 ? `${GOLD}CC` : "rgba(255,255,255,0.25)",
                      }}
                    >
                      {val}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Boundary */}
            <div
              style={{
                marginTop: "1rem",
                paddingTop: "1rem",
                borderTop: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <p
                style={{
                  ...mono,
                  fontSize: "7px",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: `${GOLD}66`,
                  marginBottom: "0.4rem",
                }}
              >
                Governance boundary
              </p>
              <p
                style={{
                  ...serif,
                  fontSize: "0.9rem",
                  lineHeight: 1.6,
                  color: "rgba(255,255,255,0.5)",
                }}
              >
                {record.boundary}
              </p>
            </div>
          </section>

          {/* ── VERIFY INTEGRITY ────────────────────────────────────── */}
          <section
            style={{
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.015)",
              padding: "1.25rem",
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Hash className="h-4 w-4" style={{ color: `${GOLD}70` }} />
              <p
                style={{
                  ...mono,
                  fontSize: "7px",
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: `${GOLD}88`,
                }}
              >
                Integrity verification
              </p>
            </div>

            <p
              style={{
                ...serif,
                fontSize: "0.9rem",
                lineHeight: 1.6,
                color: "rgba(255,255,255,0.55)",
                marginBottom: "1rem",
              }}
            >
              The verification endpoint recomputes a SHA-256 hash of the
              canonical demo record on every request and compares it to the
              stored constant. The status depends entirely on that comparison —
              it is not hardcoded.
            </p>

            <button
              onClick={handleVerify}
              disabled={verifying}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                border: `1px solid ${GOLD}44`,
                backgroundColor: `${GOLD}0A`,
                color: `${GOLD}CC`,
                ...mono,
                fontSize: "8px",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                padding: "0.6rem 1.1rem",
                cursor: verifying ? "not-allowed" : "pointer",
                opacity: verifying ? 0.6 : 1,
              }}
            >
              {verifying ? (
                <>
                  <RefreshCw
                    className="h-3 w-3 animate-spin"
                    style={{ color: `${GOLD}99` }}
                  />
                  Verifying…
                </>
              ) : (
                <>
                  <Shield className="h-3 w-3" style={{ color: `${GOLD}99` }} />
                  Verify integrity
                </>
              )}
            </button>

            {/* Result panel */}
            {verifyError && (
              <div
                style={{
                  marginTop: "1rem",
                  border: "1px solid rgba(255,80,80,0.25)",
                  backgroundColor: "rgba(255,80,80,0.04)",
                  padding: "1rem",
                }}
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle
                    className="mt-0.5 h-4 w-4 shrink-0"
                    style={{ color: "rgba(255,120,120,0.8)" }}
                  />
                  <p
                    style={{
                      ...serif,
                      fontSize: "0.9rem",
                      lineHeight: 1.6,
                      color: "rgba(255,180,180,0.8)",
                    }}
                  >
                    {verifyError}
                  </p>
                </div>
              </div>
            )}

            {verifyResult && (
              <VerifyResultPanel result={verifyResult} />
            )}
          </section>

          {/* ── HOW IT WORKS ────────────────────────────────────────── */}
          <section
            style={{
              border: `1px solid ${GOLD}18`,
              backgroundColor: `${GOLD}03`,
              padding: "1.25rem",
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Layers className="h-4 w-4" style={{ color: `${GOLD}70` }} />
              <p
                style={{
                  ...mono,
                  fontSize: "7px",
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: `${GOLD}88`,
                }}
              >
                How governed provenance works
              </p>
            </div>

            <div className="space-y-3">
              {[
                {
                  step: "01",
                  text: "Every governed case has a canonical record capturing all decisions, evidence, and accountability assignments.",
                },
                {
                  step: "02",
                  text: "A SHA-256 hash is computed over a stable canonical serialisation of that record — keys sorted alphabetically, undefined values removed.",
                },
                {
                  step: "03",
                  text: "The hash is stored alongside the record. Any edit to the record produces a different hash — making tampering structurally detectable.",
                },
                {
                  step: "04",
                  text: "On every verification request, the hash is recomputed and compared. MATCH means the record is intact.",
                },
              ].map(({ step, text }) => (
                <div key={step} className="flex items-start gap-3">
                  <span
                    style={{
                      ...mono,
                      fontSize: "8px",
                      letterSpacing: "0.12em",
                      color: `${GOLD}55`,
                      marginTop: "0.2rem",
                      minWidth: "1.5rem",
                    }}
                  >
                    {step}
                  </span>
                  <p
                    style={{
                      ...serif,
                      fontSize: "0.9rem",
                      lineHeight: 1.6,
                      color: "rgba(255,255,255,0.62)",
                    }}
                  >
                    {text}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* ── CTA ─────────────────────────────────────────────────── */}
          <section
            style={{
              border: `1px solid ${GOLD}22`,
              backgroundColor: `${GOLD}05`,
              padding: "1.25rem",
            }}
          >
            <p
              style={{
                ...mono,
                fontSize: "7px",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: `${GOLD}88`,
                marginBottom: "0.75rem",
              }}
            >
              Create a governed record for your case
            </p>
            <p
              style={{
                ...serif,
                fontSize: "1rem",
                lineHeight: 1.65,
                color: "rgba(255,255,255,0.68)",
                marginBottom: "1.25rem",
              }}
            >
              A governed case gives your decision a verified provenance record —
              with a hash you can verify, a chain of custody your client can
              read, and accountability you can prove.
            </p>

            {/* Primary CTA */}
            <Link
              href="/diagnostics/fast"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                border: `1px solid ${GOLD}55`,
                backgroundColor: `${GOLD}12`,
                color: `${GOLD}DD`,
                ...mono,
                fontSize: "8px",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                padding: "0.7rem 1.25rem",
                textDecoration: "none",
                marginRight: "0.75rem",
                marginBottom: "0.5rem",
              }}
            >
              Run fast diagnostic
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>

            {/* Secondary CTA */}
            <Link
              href="/tools/decision-delay-exposure"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                border: "1px solid rgba(255,255,255,0.12)",
                backgroundColor: "rgba(255,255,255,0.03)",
                color: "rgba(255,255,255,0.55)",
                ...mono,
                fontSize: "8px",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                padding: "0.7rem 1.25rem",
                textDecoration: "none",
                marginBottom: "0.5rem",
              }}
            >
              Decision delay exposure
            </Link>

            {/* Trust Center link */}
            <div style={{ marginTop: "1rem" }}>
              <Link
                href="/trust"
                style={{
                  ...mono,
                  fontSize: "7px",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.28)",
                  textDecoration: "none",
                }}
              >
                Trust Center →
              </Link>
            </div>
          </section>

        </div>
      </main>
    </Layout>
  );
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex gap-3 items-baseline">
      <p
        style={{
          ...mono,
          fontSize: "6px",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.28)",
          minWidth: "9rem",
          flexShrink: 0,
        }}
      >
        {label}
      </p>
      <p
        style={{
          ...serif,
          fontSize: "0.88rem",
          lineHeight: 1.5,
          color: "rgba(255,255,255,0.68)",
          wordBreak: "break-all",
        }}
      >
        {String(value)}
      </p>
    </div>
  );
}

function VerifyResultPanel({ result }: { result: PublicDemoVerifyResult }) {
  const isMatch = result.status === "MATCH";
  const isUnavailable = result.status === "UNAVAILABLE";

  const borderColor = isMatch
    ? "rgba(80,200,120,0.25)"
    : isUnavailable
      ? "rgba(255,200,80,0.25)"
      : "rgba(255,80,80,0.25)";
  const bgColor = isMatch
    ? "rgba(80,200,120,0.04)"
    : isUnavailable
      ? "rgba(255,200,80,0.04)"
      : "rgba(255,80,80,0.04)";
  const labelColor = isMatch
    ? "rgba(100,220,140,0.9)"
    : isUnavailable
      ? "rgba(255,210,90,0.9)"
      : "rgba(255,120,120,0.9)";

  return (
    <div
      style={{
        marginTop: "1rem",
        border: `1px solid ${borderColor}`,
        backgroundColor: bgColor,
        padding: "1rem",
      }}
    >
      {/* Status badge */}
      <div className="flex items-center gap-2 mb-3">
        {isMatch ? (
          <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: labelColor }} />
        ) : (
          <AlertTriangle className="h-4 w-4 shrink-0" style={{ color: labelColor }} />
        )}
        <p
          style={{
            ...mono,
            fontSize: "8px",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: labelColor,
          }}
        >
          {result.status}
        </p>
      </div>

      {/* Message */}
      <p
        style={{
          ...serif,
          fontSize: "0.9rem",
          lineHeight: 1.6,
          color: "rgba(255,255,255,0.65)",
          marginBottom: "0.75rem",
        }}
      >
        {result.message}
      </p>

      {/* Hash rows */}
      {result.recomputedHash && (
        <div className="space-y-2">
          <HashRow label="Stored hash" value={result.storedHash} />
          <HashRow label="Recomputed hash" value={result.recomputedHash} />
        </div>
      )}

      {/* Timestamp */}
      <p
        style={{
          marginTop: "0.75rem",
          ...mono,
          fontSize: "6px",
          letterSpacing: "0.12em",
          color: "rgba(255,255,255,0.22)",
        }}
      >
        Checked at {result.checkedAt}
      </p>
    </div>
  );
}

function HashRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p
        style={{
          ...mono,
          fontSize: "6px",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.28)",
          marginBottom: "0.15rem",
        }}
      >
        {label}
      </p>
      <p
        style={{
          ...mono,
          fontSize: "9px",
          letterSpacing: "0.06em",
          color: `${GOLD}BB`,
          wordBreak: "break-all",
        }}
      >
        {value}
      </p>
    </div>
  );
}

export default ProvenanceDemoPage;
