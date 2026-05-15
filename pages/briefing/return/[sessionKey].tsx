import type { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import * as React from "react";

import Layout from "@/components/Layout";
import { resolvePageAccess } from "@/lib/access/server";

// ─── Client-safe display type ─────────────────────────────────────────────────
// Derived from ReturnBrief (server-only) — only the fields safe to display
// in a client-facing, authenticated view. No respondent text, no operator
// notes, no internal trigger mechanics exposed.

type ReturnBriefDisplay = {
  sessionId: string;
  sessionKey: string;
  generatedAt: string;
  opening: string;
  trajectory: {
    state: string;
    reason: string;
  };
  kernel: {
    blocked: boolean;
    reason: string | null;
    activeContradictions: number;
  } | null;
  contradiction: {
    decision: string;
    constraint: string;
    status: string;
  } | null;
  delta: {
    clarity: string;
    authority: string;
    readiness: string;
  } | null;
  costOfInaction: {
    accumulatedCost: number;
    daysElapsed: number;
    basis: string;
    explanation: string;
  } | null;
  verification: {
    commitmentId: string;
    label: string;
    status: string;
    dueAt?: string;
  }[] | null;
  challenge: string;
};

type Props =
  | { state: "unauthenticated" }
  | { state: "not_found"; sessionKey: string }
  | { state: "ok"; brief: ReturnBriefDisplay; sessionKey: string };

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

const TRAJECTORY_COLOR: Record<string, string> = {
  ASCENDING:    "rgba(110,231,183,0.65)",
  STAGNANT:     "rgba(255,255,255,0.35)",
  FRAGILE:      "rgba(251,191,36,0.60)",
  DETERIORATING:"rgba(252,165,165,0.65)",
};

const VERIFICATION_COLOR: Record<string, string> = {
  VERIFIED_EXECUTED: "rgba(110,231,183,0.60)",
  NOT_DUE:           "rgba(255,255,255,0.25)",
  DUE:               `${GOLD}AA`,
  OVERDUE:           "rgba(252,165,165,0.60)",
  VERIFIED_BLOCKED:  "rgba(252,165,165,0.60)",
  UNVERIFIED:        "rgba(255,255,255,0.25)",
};

// ─── Unauthenticated ──────────────────────────────────────────────────────────

function Unauthenticated() {
  return (
    <Layout title="Return Brief | Abraham of London" fullWidth>
      <Head><meta name="robots" content="noindex,nofollow" /></Head>
      <main style={{ backgroundColor: "rgb(3,3,5)", minHeight: "100vh", color: "white", padding: "80px 24px" }}>
        <div style={{ maxWidth: "640px", margin: "0 auto" }}>
          <p style={{ ...mono, fontSize: "9px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)" }}>
            Authentication required
          </p>
          <p style={{ fontSize: "14px", lineHeight: 1.7, color: "rgba(255,255,255,0.45)", marginTop: "12px" }}>
            This Return Brief is part of a governed case record. Sign in to view it.
          </p>
          <Link
            href="/decision-centre"
            style={{ display: "inline-block", marginTop: "20px", ...mono, fontSize: "9px", letterSpacing: "0.16em", textTransform: "uppercase", color: `${GOLD}CC`, border: `1px solid ${GOLD}40`, padding: "10px 20px", textDecoration: "none" }}
          >
            Open Decision Centre
          </Link>
        </div>
      </main>
    </Layout>
  );
}

// ─── Not found ────────────────────────────────────────────────────────────────

function NotFound() {
  return (
    <Layout title="Return Brief | Abraham of London" fullWidth>
      <Head><meta name="robots" content="noindex,nofollow" /></Head>
      <main style={{ backgroundColor: "rgb(3,3,5)", minHeight: "100vh", color: "white", padding: "80px 24px" }}>
        <div style={{ maxWidth: "640px", margin: "0 auto" }}>
          <p style={{ ...mono, fontSize: "9px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)" }}>
            Brief not available
          </p>
          <p style={{ fontSize: "14px", lineHeight: 1.7, color: "rgba(255,255,255,0.45)", marginTop: "12px" }}>
            A Return Brief could not be generated for this record. Either the session does not exist,
            or the governed record does not yet contain enough return-cycle evidence to produce a brief.
          </p>
          <p style={{ fontSize: "12px", lineHeight: 1.6, color: "rgba(255,255,255,0.28)", marginTop: "8px" }}>
            Return Briefs are generated automatically when the record shows a FRAGILE or DETERIORATING
            trajectory, blocked execution, or repeated unresolved conditions.
          </p>
          <Link
            href="/decision-centre"
            style={{ display: "inline-block", marginTop: "20px", ...mono, fontSize: "9px", letterSpacing: "0.16em", textTransform: "uppercase", color: `${GOLD}CC`, border: `1px solid ${GOLD}40`, padding: "10px 20px", textDecoration: "none" }}
          >
            Return to Decision Centre
          </Link>
        </div>
      </main>
    </Layout>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const ReturnBriefPage: NextPage<Props> = (props) => {
  if (props.state === "unauthenticated") return <Unauthenticated />;
  if (props.state === "not_found") return <NotFound />;

  const { brief } = props;
  const trajectoryColor = TRAJECTORY_COLOR[brief.trajectory.state] ?? "rgba(255,255,255,0.40)";

  return (
    <Layout
      title="Return Brief | Abraham of London"
      description="Governed case continuation — the record reopened because the condition remains active."
      fullWidth
    >
      <Head><meta name="robots" content="noindex,nofollow" /></Head>
      <main style={{ backgroundColor: "rgb(3,3,5)", minHeight: "100vh", color: "white", padding: "80px 24px" }}>
        <div style={{ maxWidth: "680px", margin: "0 auto" }}>

          {/* ── Header ── */}
          <header style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.02)", padding: "1.25rem", marginBottom: "1.5rem" }}>
            <p style={{ ...mono, fontSize: "7.5px", letterSpacing: "0.26em", textTransform: "uppercase", color: `${GOLD}99` }}>
              Return Brief — governed case continuation
            </p>
            <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.20)", marginTop: "6px" }}>
              Session {brief.sessionKey} · Generated {new Date(brief.generatedAt).toLocaleString("en-GB")}
            </p>
            <p style={{ fontSize: "12px", lineHeight: 1.65, color: "rgba(255,255,255,0.30)", marginTop: "10px" }}>
              This brief was generated because the governed case contains evidence of an unresolved condition.
              It is a client-safe view of the execution record only. It does not replace operator review,
              counsel assessment, or retained oversight.
            </p>
          </header>

          {/* ── Section 1: Case status ── */}
          <section style={{ border: `1px solid ${GOLD}25`, background: `${GOLD}05`, padding: "1.25rem", marginBottom: "1rem" }}>
            <p style={{ ...mono, fontSize: "7.5px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}88`, marginBottom: "0.5rem" }}>
              Case status
            </p>
            <p style={{ ...serif, fontSize: "1.15rem", lineHeight: 1.55, color: "rgba(255,255,255,0.85)" }}>
              {brief.opening}
            </p>
          </section>

          {/* ── Section 2: Trajectory ── */}
          <section style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)", padding: "1rem", marginBottom: "1rem" }}>
            <p style={{ ...mono, fontSize: "7.5px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", marginBottom: "0.5rem" }}>
              Trajectory
            </p>
            <div style={{ display: "flex", alignItems: "baseline", gap: "12px", marginBottom: "6px" }}>
              <span style={{ ...mono, fontSize: "10px", letterSpacing: "0.16em", textTransform: "uppercase", color: trajectoryColor }}>
                {brief.trajectory.state}
              </span>
              {brief.kernel && brief.kernel.activeContradictions > 0 && (
                <span style={{ ...mono, fontSize: "7.5px", letterSpacing: "0.10em", textTransform: "uppercase", color: "rgba(252,165,165,0.50)" }}>
                  {brief.kernel.activeContradictions} active contradiction{brief.kernel.activeContradictions !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            <p style={{ fontSize: "13px", lineHeight: 1.6, color: "rgba(255,255,255,0.50)" }}>
              {brief.trajectory.reason}
            </p>
          </section>

          {/* ── Section 3: Condition still active / resolved / unknown ── */}
          {brief.contradiction ? (
            <section style={{ border: "1px solid rgba(252,165,165,0.12)", background: "rgba(252,165,165,0.025)", padding: "1rem", marginBottom: "1rem" }}>
              <p style={{ ...mono, fontSize: "7.5px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(252,165,165,0.55)", marginBottom: "0.5rem" }}>
                Condition still active
              </p>
              <p style={{ fontSize: "13px", lineHeight: 1.6, color: "rgba(255,255,255,0.62)", marginBottom: "6px" }}>
                {brief.contradiction.decision}
              </p>
              <p style={{ fontSize: "12px", lineHeight: 1.55, color: "rgba(255,255,255,0.40)" }}>
                {brief.contradiction.constraint}
              </p>
              <p style={{ ...mono, fontSize: "7.5px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(252,165,165,0.45)", marginTop: "8px" }}>
                {brief.contradiction.status}
              </p>
            </section>
          ) : (
            <section style={{ border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.01)", padding: "1rem", marginBottom: "1rem" }}>
              <p style={{ ...mono, fontSize: "7.5px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)", marginBottom: "4px" }}>
                Condition status
              </p>
              <p style={{ fontSize: "12px", lineHeight: 1.6, color: "rgba(255,255,255,0.32)" }}>
                Condition state could not be determined from the current record.
              </p>
            </section>
          )}

          {/* ── Section 4: Commitment gap ── */}
          {(brief.kernel?.blocked || (brief.verification && brief.verification.length > 0)) && (
            <section style={{ border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.015)", padding: "1rem", marginBottom: "1rem" }}>
              <p style={{ ...mono, fontSize: "7.5px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", marginBottom: "0.5rem" }}>
                Commitment gap
              </p>
              {brief.kernel?.blocked && (
                <p style={{ fontSize: "13px", lineHeight: 1.6, color: "rgba(255,255,255,0.50)", marginBottom: "6px" }}>
                  Execution has been blocked. The decision cannot proceed in its current state.
                </p>
              )}
              {brief.verification && brief.verification.length > 0 && (
                <div style={{ display: "grid", gap: "6px" }}>
                  {brief.verification.map((v) => (
                    <div key={v.commitmentId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderLeft: "2px solid rgba(255,255,255,0.08)", paddingLeft: "10px" }}>
                      <span style={{ ...mono, fontSize: "8px", letterSpacing: "0.10em", color: "rgba(255,255,255,0.38)" }}>
                        {v.label}
                      </span>
                      <span style={{ ...mono, fontSize: "7.5px", letterSpacing: "0.10em", textTransform: "uppercase", color: VERIFICATION_COLOR[v.status] ?? "rgba(255,255,255,0.28)" }}>
                        {v.status.replace(/_/g, " ")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* ── Section 5: What changed / What did not ── */}
          {brief.delta && (
            <section style={{ border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.015)", padding: "1rem", marginBottom: "1rem" }}>
              <p style={{ ...mono, fontSize: "7.5px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", marginBottom: "0.75rem" }}>
                What changed
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
                {([
                  { label: "Clarity", value: brief.delta.clarity },
                  { label: "Authority", value: brief.delta.authority },
                  { label: "Readiness", value: brief.delta.readiness },
                ] as const).map((row) => {
                  const isPositive = row.value === "+1" || row.value === "increased";
                  const isNegative = row.value === "contested" || row.value === "decreased";
                  return (
                    <div key={row.label}>
                      <p style={{ ...mono, fontSize: "6.5px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>
                        {row.label}
                      </p>
                      <p style={{ ...mono, fontSize: "9.5px", letterSpacing: "0.10em", color: isPositive ? "rgba(110,231,183,0.65)" : isNegative ? "rgba(252,165,165,0.55)" : "rgba(255,255,255,0.40)", marginTop: "3px" }}>
                        {row.value}
                      </p>
                    </div>
                  );
                })}
              </div>
              <p style={{ ...mono, fontSize: "6.5px", letterSpacing: "0.10em", textTransform: "uppercase", color: "rgba(255,255,255,0.18)", marginTop: "10px" }}>
                What did not change: conditions with no execution activity remain unresolved in the record.
              </p>
            </section>
          )}

          {/* ── Cost of inaction ── */}
          {brief.costOfInaction && brief.costOfInaction.accumulatedCost > 0 && (
            <section style={{ border: "1px solid rgba(252,165,165,0.10)", background: "rgba(252,165,165,0.02)", padding: "1rem", marginBottom: "1rem" }}>
              <p style={{ ...mono, fontSize: "7.5px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(252,165,165,0.55)", marginBottom: "0.4rem" }}>
                Cost of inaction
              </p>
              <p style={{ ...serif, fontSize: "1.4rem", color: `${GOLD}CC` }}>
                £{brief.costOfInaction.accumulatedCost.toLocaleString()}
              </p>
              <p style={{ fontSize: "11px", lineHeight: 1.55, color: "rgba(255,255,255,0.30)", marginTop: "4px" }}>
                Estimated over {brief.costOfInaction.daysElapsed} day{brief.costOfInaction.daysElapsed !== 1 ? "s" : ""} since this session was created. Delay is not neutral.
              </p>
            </section>
          )}

          {/* ── Section 6: What is now required ── */}
          <section style={{ border: `1px solid ${GOLD}22`, background: `${GOLD}04`, padding: "1.25rem", marginBottom: "1rem" }}>
            <p style={{ ...mono, fontSize: "7.5px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}88`, marginBottom: "0.5rem" }}>
              What is now required
            </p>
            <p style={{ ...serif, fontSize: "1rem", lineHeight: 1.6, color: "rgba(255,255,255,0.78)" }}>
              {brief.challenge}
            </p>
          </section>

          {/* ── Boundary note ── */}
          <section style={{ border: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.01)", padding: "1rem", marginBottom: "1.5rem" }}>
            <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.20)", marginBottom: "6px" }}>
              Boundary
            </p>
            <p style={{ fontSize: "11px", lineHeight: 1.65, color: "rgba(255,255,255,0.28)" }}>
              This Return Brief is a client-safe view of the governed case record. It does not expose respondent text,
              operator notes, or internal trigger mechanics. The governed case itself continues in the Decision Centre.
              This brief does not replace verification, counsel review, or retained oversight.
            </p>
          </section>

          {/* ── Back to Decision Centre ── */}
          <Link
            href="/decision-centre"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", ...mono, fontSize: "8px", letterSpacing: "0.16em", textTransform: "uppercase", color: `${GOLD}BB`, border: `1px solid ${GOLD}35`, padding: "10px 18px", textDecoration: "none" }}
          >
            Return to Decision Centre
          </Link>

        </div>
      </main>
    </Layout>
  );
};

// ─── Server-side data loading ─────────────────────────────────────────────────

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const sessionKey = typeof ctx.params?.sessionKey === "string" ? ctx.params.sessionKey : null;
  if (!sessionKey) return { notFound: true };

  const { session, access } = await resolvePageAccess(ctx);
  const email = typeof session?.user?.email === "string" ? session.user.email.toLowerCase() : null;

  if (!access.permissions.isAuthenticated || !email) {
    return { props: { state: "unauthenticated" } };
  }

  const { generateReturnBrief } = await import(
    "@/lib/server/strategy-room/return-brief.server"
  );

  let brief: ReturnBriefDisplay | null = null;
  try {
    const raw = await generateReturnBrief(sessionKey);
    if (raw) {
      // Shape into client-safe display type — only expose fields this page renders.
      brief = {
        sessionId: raw.sessionId,
        sessionKey: raw.sessionKey,
        generatedAt: raw.generatedAt,
        opening: raw.opening,
        trajectory: {
          state: raw.trajectory.state,
          reason: raw.trajectory.reason,
        },
        kernel: raw.kernel
          ? {
              blocked: raw.kernel.blocked,
              reason: raw.kernel.reason,
              activeContradictions: raw.kernel.activeContradictions,
            }
          : null,
        contradiction: raw.contradiction
          ? {
              decision: raw.contradiction.decision,
              constraint: raw.contradiction.constraint,
              status: raw.contradiction.status,
            }
          : null,
        delta: raw.delta
          ? {
              clarity: raw.delta.clarity,
              authority: raw.delta.authority,
              readiness: raw.delta.readiness,
            }
          : null,
        costOfInaction: raw.costOfInaction && raw.costOfInaction.basis !== "UNAVAILABLE"
          ? {
              accumulatedCost: raw.costOfInaction.accumulatedCost,
              daysElapsed: raw.costOfInaction.daysElapsed,
              basis: raw.costOfInaction.basis,
              explanation: raw.costOfInaction.explanation,
            }
          : null,
        verification: raw.verification
          ? raw.verification.map((v) => ({
              commitmentId: v.commitmentId,
              label: v.label,
              status: v.status,
              dueAt: v.dueAt,
            }))
          : null,
        challenge: raw.challenge,
      };
    }
  } catch {
    // generateReturnBrief failed — treat as not found
  }

  if (!brief) {
    return { props: { state: "not_found", sessionKey } };
  }

  return { props: { state: "ok", brief, sessionKey } };
};

export default ReturnBriefPage;
