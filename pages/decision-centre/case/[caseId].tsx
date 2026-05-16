/**
 * pages/decision-centre/case/[caseId].tsx
 *
 * /decision-centre/case/[caseId] — Governed case detail page
 *
 * Authenticated. Fetches the full case from /api/decision-centre/cases
 * and renders the full cockpit view with:
 *   - Case header (ID, source, status, evidence posture)
 *   - Primary finding
 *   - Governance implication
 *   - Next earned action
 *   - Verification panel
 *   - Chain of custody timeline
 *   - Return Brief readiness
 *   - Record stack / governed memory
 *   - Export/share areas where available
 *
 * Decision Centre cards must link to this page.
 */

import * as React from "react";
import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  Shield,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Clock,
  FileText,
  Hash,
} from "lucide-react";

import Layout from "@/components/Layout";
import ChainOfCustodyTimeline, {
  buildChainOfCustodyFromCase,
} from "@/components/product/ChainOfCustodyTimeline";
import DecisionOutcomeCapture from "@/components/product/DecisionOutcomeCapture";
import CommercialExposurePanel from "@/components/diagnostics/CommercialExposurePanel";
import OutcomeContributionPanel from "@/components/product/OutcomeContributionPanel";
import type { DecisionCentreCase } from "@/lib/product/decision-centre-contract";
import type { CaseVerifyResult } from "@/pages/api/provenance/verify-case";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
};
const serif: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
  fontWeight: 300,
};

// ─── Page ───────────────────────────────────────────────────────────────────

const CaseDetailPage: NextPage = () => {
  const router = useRouter();
  const { caseId } = router.query;

  const [caseData, setCaseData] = React.useState<DecisionCentreCase | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [verifyResult, setVerifyResult] = React.useState<CaseVerifyResult | null>(null);
  const [verifying, setVerifying] = React.useState(false);
  const [verifyError, setVerifyError] = React.useState<string | null>(null);

  // Load case
  React.useEffect(() => {
    if (!caseId || typeof caseId !== "string") return;

    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/decision-centre/cases");
        if (res.status === 401) {
          void router.push(`/auth/signin?callbackUrl=${encodeURIComponent(router.asPath)}`);
          return;
        }
        if (!res.ok) {
          setError("Could not load case data.");
          return;
        }
        const json = (await res.json()) as { ok?: boolean; cases?: DecisionCentreCase[] };
        const found = json.cases?.find((c) => c.caseId === caseId) ?? null;
        if (!found) {
          setError("Case not found or access denied.");
        } else {
          setCaseData(found);
        }
      } catch {
        setError("Network error loading case.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [caseId, router]);

  async function handleVerify() {
    if (!caseId || typeof caseId !== "string") return;
    setVerifying(true);
    setVerifyError(null);
    setVerifyResult(null);

    try {
      const res = await fetch(
        `/api/provenance/verify-case?subjectType=GOVERNED_CASE&subjectId=${encodeURIComponent(caseId)}`,
      );
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setVerifyError(body.error ?? `Server error (${res.status})`);
        return;
      }
      const data: CaseVerifyResult = await res.json();
      setVerifyResult(data);
    } catch {
      setVerifyError("Network error — could not reach verification endpoint.");
    } finally {
      setVerifying(false);
    }
  }

  // ── Loading state ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Layout title="Case | Decision Centre | Abraham of London">
        <main
          className="min-h-screen px-6 py-24"
          style={{ backgroundColor: "rgb(3,3,5)", color: "white" }}
        >
          <div className="mx-auto max-w-2xl">
            <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>
              Loading case…
            </p>
          </div>
        </main>
      </Layout>
    );
  }

  // ── Error state ──────────────────────────────────────────────────────────
  if (error || !caseData) {
    return (
      <Layout title="Case not found | Decision Centre">
        <main
          className="min-h-screen px-6 py-24"
          style={{ backgroundColor: "rgb(3,3,5)", color: "white" }}
        >
          <div className="mx-auto max-w-2xl space-y-4">
            <Link
              href="/decision-centre"
              style={{ ...mono, fontSize: "7px", letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", textDecoration: "none" }}
            >
              ← Decision Centre
            </Link>
            <p style={{ ...serif, fontSize: "1.1rem", color: "rgba(255,255,255,0.55)" }}>
              {error ?? "Case not found."}
            </p>
          </div>
        </main>
      </Layout>
    );
  }

  const c = caseData;
  const timeline = buildChainOfCustodyFromCase({
    createdAt: c.lastEvidenceAt ?? c.updatedAt,
    updatedAt: c.updatedAt,
    sourceType: c.sourceType,
    primaryFinding: c.primaryFinding,
    provenanceHash: undefined, // not exposed on card
    returnBriefTriggered: c.returnBriefTriggered,
    outcomeStatus: c.outcomeStatus,
  });

  return (
    <Layout
      title={`${c.title} | Decision Centre | Abraham of London`}
      description={c.primaryFinding ?? "Governed case detail"}
    >
      <Head>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <main
        className="min-h-screen px-6 py-20"
        style={{ backgroundColor: "rgb(3,3,5)", color: "white" }}
      >
        <div className="mx-auto max-w-2xl space-y-6">

          {/* ── BACK LINK ───────────────────────────────────────────── */}
          <Link
            href="/decision-centre"
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
            Decision Centre
          </Link>

          {/* ── CASE HEADER ─────────────────────────────────────────── */}
          <header
            style={{
              border: "1px solid rgba(255,255,255,0.08)",
              backgroundColor: "rgba(255,255,255,0.02)",
              padding: "1.25rem",
            }}
          >
            {/* Status badge row */}
            <div className="flex items-center gap-2 flex-wrap mb-3">
              <span
                style={{
                  ...mono,
                  fontSize: "7px",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: `${GOLD}99`,
                  border: `1px solid ${GOLD}33`,
                  padding: "0.15rem 0.45rem",
                }}
              >
                {c.cognitiveState?.replace(/_/g, " ") ?? "ACTIVE"}
              </span>
              {c.sourceType && (
                <span
                  style={{
                    ...mono,
                    fontSize: "7px",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.3)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    padding: "0.15rem 0.45rem",
                  }}
                >
                  {c.sourceType.replace(/_/g, " ").toLowerCase()}
                </span>
              )}
              {c.evidenceTier && (
                <span
                  style={{
                    ...mono,
                    fontSize: "7px",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.22)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    padding: "0.15rem 0.45rem",
                  }}
                >
                  {c.evidenceTier}
                </span>
              )}
            </div>

            {/* Title */}
            <h1
              style={{
                ...serif,
                fontSize: "clamp(1.3rem, 2.5vw, 1.8rem)",
                lineHeight: 1.15,
                color: "rgba(255,255,255,0.90)",
                marginBottom: "0.5rem",
              }}
            >
              {c.title}
            </h1>

            {/* Case ID */}
            <p
              style={{
                ...mono,
                fontSize: "6.5px",
                letterSpacing: "0.12em",
                color: "rgba(255,255,255,0.18)",
              }}
            >
              Case ID: {c.caseId}
            </p>
          </header>

          {/* ── DECISION STATEMENT ──────────────────────────────────── */}
          {c.decisionText && (
            <section
              style={{
                borderLeft: `2px solid ${GOLD}30`,
                paddingLeft: "1rem",
                paddingTop: "0.25rem",
                paddingBottom: "0.25rem",
              }}
            >
              <p
                style={{
                  ...serif,
                  fontSize: "1rem",
                  lineHeight: 1.65,
                  color: "rgba(255,255,255,0.55)",
                  fontStyle: "italic",
                }}
              >
                &ldquo;{c.decisionText}&rdquo;
              </p>
            </section>
          )}

          {/* ── PRIMARY FINDING ─────────────────────────────────────── */}
          {c.primaryFinding && (
            <section
              style={{
                border: `1px solid ${GOLD}18`,
                backgroundColor: `${GOLD}04`,
                padding: "1rem",
              }}
            >
              <p
                style={{
                  ...mono,
                  fontSize: "7px",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: `${GOLD}77`,
                  marginBottom: "0.5rem",
                }}
              >
                Primary finding
              </p>
              <p
                style={{
                  ...serif,
                  fontSize: "0.95rem",
                  lineHeight: 1.65,
                  color: "rgba(255,255,255,0.72)",
                }}
              >
                {c.primaryFinding}
              </p>
            </section>
          )}

          {/* ── GOVERNANCE IMPLICATION ──────────────────────────────── */}
          {c.governanceImplication && (
            <section
              style={{
                border: "1px solid rgba(255,200,100,0.12)",
                backgroundColor: "rgba(255,200,100,0.03)",
                padding: "1rem",
              }}
            >
              <p
                style={{
                  ...mono,
                  fontSize: "7px",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: `${GOLD}77`,
                  marginBottom: "0.5rem",
                }}
              >
                Governance implication
              </p>
              <p
                style={{
                  ...serif,
                  fontSize: "0.92rem",
                  lineHeight: 1.65,
                  color: "rgba(255,255,255,0.62)",
                }}
              >
                {c.governanceImplication}
              </p>
            </section>
          )}

          {/* ── COMMERCIAL EXPOSURE ─────────────────────────────────── */}
          {c.commercialExposure && (
            <CommercialExposurePanel exposure={c.commercialExposure} />
          )}

          {/* ── NEXT EARNED ACTION ──────────────────────────────────── */}
          {c.nextRequiredAction && (
            <section
              style={{
                border: `1px solid ${GOLD}25`,
                backgroundColor: `${GOLD}06`,
                padding: "1rem",
              }}
            >
              <p
                style={{
                  ...mono,
                  fontSize: "7px",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: `${GOLD}88`,
                  marginBottom: "0.5rem",
                }}
              >
                Next required action
              </p>
              <p
                style={{
                  ...serif,
                  fontSize: "1rem",
                  lineHeight: 1.6,
                  color: "rgba(255,255,255,0.78)",
                  marginBottom: "0.75rem",
                }}
              >
                {c.nextRequiredAction}
              </p>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2">
                {c.admission?.executiveReporting?.status === "ADMITTED" && (
                  <Link
                    href="/diagnostics/executive-reporting"
                    style={{
                      ...mono,
                      fontSize: "8px",
                      letterSpacing: "0.16em",
                      textTransform: "uppercase",
                      color: `${GOLD}DD`,
                      border: `1px solid ${GOLD}44`,
                      backgroundColor: `${GOLD}0A`,
                      padding: "0.55rem 1rem",
                      textDecoration: "none",
                    }}
                  >
                    Executive Report
                    <ArrowRight className="inline h-3 w-3 ml-1" />
                  </Link>
                )}
                {c.admission?.strategyRoom?.status === "ADMITTED" && (
                  <Link
                    href="/strategy-room"
                    style={{
                      ...mono,
                      fontSize: "8px",
                      letterSpacing: "0.16em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.45)",
                      border: "1px solid rgba(255,255,255,0.10)",
                      padding: "0.55rem 1rem",
                      textDecoration: "none",
                    }}
                  >
                    Strategy Room
                  </Link>
                )}
              </div>
            </section>
          )}

          {/* ── VERIFICATION PANEL ──────────────────────────────────── */}
          <section
            style={{
              border: "1px solid rgba(255,255,255,0.07)",
              backgroundColor: "rgba(255,255,255,0.01)",
              padding: "1rem",
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Hash className="h-4 w-4" style={{ color: `${GOLD}66` }} />
              <p
                style={{
                  ...mono,
                  fontSize: "7px",
                  letterSpacing: "0.20em",
                  textTransform: "uppercase",
                  color: `${GOLD}77`,
                }}
              >
                Provenance verification
              </p>
            </div>

            <p
              style={{
                ...serif,
                fontSize: "0.88rem",
                lineHeight: 1.6,
                color: "rgba(255,255,255,0.42)",
                marginBottom: "0.75rem",
              }}
            >
              Recomputes the SHA-256 hash of this case record and compares it to
              the stored hash. MATCH confirms the record has not been altered.
            </p>

            <button
              type="button"
              onClick={handleVerify}
              disabled={verifying}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                ...mono,
                fontSize: "8px",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                border: `1px solid ${GOLD}33`,
                backgroundColor: `${GOLD}08`,
                color: `${GOLD}BB`,
                padding: "0.55rem 1rem",
                cursor: verifying ? "not-allowed" : "pointer",
                opacity: verifying ? 0.6 : 1,
              }}
            >
              {verifying ? (
                <>
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  Verifying…
                </>
              ) : (
                <>
                  <Shield className="h-3 w-3" />
                  Verify integrity
                </>
              )}
            </button>

            {verifyError && (
              <p
                style={{
                  marginTop: "0.75rem",
                  ...serif,
                  fontSize: "0.85rem",
                  color: "rgba(255,120,120,0.8)",
                }}
              >
                {verifyError}
              </p>
            )}

            {verifyResult && <VerifyResultPanel result={verifyResult} />}
          </section>

          {/* ── CHAIN OF CUSTODY ────────────────────────────────────── */}
          <ChainOfCustodyTimeline entries={timeline} />

          {/* ── RETURN BRIEF ────────────────────────────────────────── */}
          <section
            style={{
              border: "1px solid rgba(255,255,255,0.06)",
              padding: "1rem",
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4" style={{ color: `${GOLD}55` }} />
              <p
                style={{
                  ...mono,
                  fontSize: "7px",
                  letterSpacing: "0.20em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.28)",
                }}
              >
                Return brief readiness
              </p>
            </div>

            {c.returnBriefTriggered ? (
              <div>
                <p style={{ ...serif, fontSize: "0.9rem", lineHeight: 1.6, color: "rgba(255,255,255,0.58)" }}>
                  A Return Brief has been generated for this case.
                </p>
                {c.returnBriefs && c.returnBriefs.length > 0 && (
                  <Link
                    href={c.returnBriefs[0]?.href ?? "/return-brief"}
                    style={{
                      ...mono,
                      fontSize: "8px",
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      color: `${GOLD}AA`,
                      textDecoration: "none",
                      marginTop: "0.5rem",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.3rem",
                    }}
                  >
                    View Return Brief
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                )}
              </div>
            ) : (
              <p style={{ ...serif, fontSize: "0.88rem", lineHeight: 1.6, color: "rgba(255,255,255,0.35)" }}>
                {c.counselWarranted
                  ? "Escalation review suggested. A Return Brief may be warranted."
                  : "No Return Brief has been generated yet. Return Briefs are generated after significant inactivity or on request."}
              </p>
            )}
          </section>

          {/* ── RECORD STACK / GOVERNED MEMORY ──────────────────────── */}
          {c.governedMemory && c.governedMemory.length > 0 && (
            <section
              style={{
                border: "1px solid rgba(255,255,255,0.06)",
                padding: "1rem",
              }}
            >
              <p
                style={{
                  ...mono,
                  fontSize: "7px",
                  letterSpacing: "0.20em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.28)",
                  marginBottom: "0.75rem",
                }}
              >
                Record stack
              </p>
              <div className="space-y-3">
                {c.governedMemory.slice(0, 5).map((item, i) => (
                  <div
                    key={i}
                    style={{
                      borderLeft: "2px solid rgba(255,255,255,0.06)",
                      paddingLeft: "0.75rem",
                    }}
                  >
                    <p
                      style={{
                        ...mono,
                        fontSize: "6.5px",
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        color: `${GOLD}55`,
                        marginBottom: "0.2rem",
                      }}
                    >
                      {item.sourceSurface ?? "Evidence"}
                    </p>
                    <p
                      style={{
                        ...serif,
                        fontSize: "0.88rem",
                        lineHeight: 1.55,
                        color: "rgba(255,255,255,0.5)",
                      }}
                    >
                      {item.summary ?? item.label ?? ""}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── OUTCOME CONTRIBUTION ────────────────────────────────── */}
          <OutcomeContributionPanel caseId={c.caseId} />

          {/* ── FOOTER ACTIONS ──────────────────────────────────────── */}
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/decision-centre"
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
              <ArrowLeft className="h-3 w-3" />
              Return to Decision Centre
            </Link>

            {c.counselWarranted && (
              <Link
                href="/counsel"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  ...mono,
                  fontSize: "7px",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "rgba(255,120,120,0.6)",
                  textDecoration: "none",
                  border: "1px solid rgba(255,120,120,0.15)",
                  padding: "0.4rem 0.75rem",
                }}
              >
                Escalation review
                <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>

          {/* ── OUTCOME CAPTURE ──────────────────────────────────────────── */}
          <div style={{ marginTop: "24px" }}>
            <DecisionOutcomeCapture
              caseId={c.caseId}
              source="case_detail"
            />
          </div>

        </div>
      </main>
    </Layout>
  );
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function VerifyResultPanel({ result }: { result: CaseVerifyResult }) {
  const isMatch = result.status === "MATCH";
  const isUnavailable = result.status === "UNAVAILABLE" || result.status === "UNSUPPORTED";

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
  const textColor = isMatch
    ? "rgba(100,220,140,0.9)"
    : isUnavailable
      ? "rgba(255,210,90,0.9)"
      : "rgba(255,120,120,0.9)";

  return (
    <div
      style={{
        marginTop: "0.75rem",
        border: `1px solid ${borderColor}`,
        backgroundColor: bgColor,
        padding: "0.75rem",
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        {isMatch ? (
          <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: textColor }} />
        ) : (
          <AlertTriangle className="h-4 w-4 shrink-0" style={{ color: textColor }} />
        )}
        <p
          style={{
            ...mono,
            fontSize: "8px",
            letterSpacing: "0.20em",
            textTransform: "uppercase",
            color: textColor,
          }}
        >
          {result.status}
        </p>
      </div>
      <p style={{ ...serif, fontSize: "0.88rem", lineHeight: 1.6, color: "rgba(255,255,255,0.55)" }}>
        {result.message}
      </p>
      {result.nextAction && (
        <p style={{ ...serif, fontSize: "0.82rem", lineHeight: 1.5, color: "rgba(255,255,255,0.35)", marginTop: "0.4rem" }}>
          {result.nextAction}
        </p>
      )}
      {result.recomputedHash && (
        <p
          style={{
            ...mono,
            fontSize: "6.5px",
            letterSpacing: "0.08em",
            color: `${GOLD}55`,
            marginTop: "0.5rem",
            wordBreak: "break-all",
          }}
        >
          {result.recomputedHash}
        </p>
      )}
      <p style={{ ...mono, fontSize: "6px", letterSpacing: "0.1em", color: "rgba(255,255,255,0.18)", marginTop: "0.4rem" }}>
        Checked {result.checkedAt}
      </p>
    </div>
  );
}

export default CaseDetailPage;
