import * as React from "react";
import type { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { X } from "lucide-react";

import Layout from "@/components/Layout";
import CounselMemorySummary from "@/components/counsel/CounselMemorySummary";
import CounselCaseTimeline from "@/components/counsel/CounselCaseTimeline";
import { resolvePageAccess } from "@/lib/access/server";
import { loadCounselCaseForUser, loadCounselCasesForUser } from "@/lib/product/counsel-case-service";
import type { CounselCase } from "@/lib/product/counsel-room-contract";

type InstitutionalCaseSummary = {
  caseId: string;
  qualificationState: string;
  evidencePosture: string;
  admitted: string[];
  notYetAdmitted: string[];
  counselWarranted: boolean;
  boardroomEarned: boolean;
  oversightStatus: string;
};

type StakeholderPressureView = {
  decisionOwner: string | null;
  affectedGroups: string[];
  unresolvedAuthorityTension: string | null;
  potentialBlockers: string[];
  thinState: boolean;
};

type Props = {
  authenticated: boolean;
  counselCase: CounselCase | null;
  counselCaseCount: number;
  institutionalCase: InstitutionalCaseSummary | null;
  stakeholderPressure: StakeholderPressureView | null;
};

const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

const CounselStatusPage: NextPage<Props> = ({ authenticated, counselCase, counselCaseCount, institutionalCase, stakeholderPressure }) => {
  const router = useRouter();
  const justSubmitted = router.query.submitted === "true";
  const queryCaseId = typeof router.query.caseId === "string" ? router.query.caseId : null;
  const [bannerDismissed, setBannerDismissed] = React.useState(false);

  return (
    <Layout title="Counsel Status" description="Track counsel case state." fullWidth>
      <Head><meta name="robots" content="noindex,nofollow" /></Head>
      <main className="min-h-screen px-6 py-20" style={{ backgroundColor: "rgb(3,3,5)", color: "white" }}>
        <div className="mx-auto max-w-5xl space-y-6">
          <header style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.02)", padding: "1.25rem" }}>
            <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.24em", textTransform: "uppercase", color: "rgba(201,169,110,0.82)" }}>
              Counsel Status
            </p>
            <h1 className="mt-3 text-3xl text-white">Governed counsel lifecycle</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-white/60">
              This is a status surface, not a sales funnel. It shows what happened, what the system is waiting for, and what each side can do next.
            </p>
          </header>

          {justSubmitted && !bannerDismissed ? (
            <section
              style={{
                border: "1px solid rgba(16,185,129,0.30)",
                backgroundColor: "rgba(16,185,129,0.06)",
                padding: "1rem",
                position: "relative",
              }}
            >
              <button
                onClick={() => setBannerDismissed(true)}
                aria-label="Dismiss confirmation"
                style={{
                  position: "absolute",
                  top: "0.75rem",
                  right: "0.75rem",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "rgba(16,185,129,0.60)",
                  padding: "2px",
                }}
              >
                <X style={{ width: 14, height: 14 }} />
              </button>
              <p style={{ ...serif, fontSize: "1.05rem", lineHeight: 1.6, color: "rgba(255,255,255,0.88)" }}>
                Counsel request received. Your case has entered evidence review.
              </p>
              {queryCaseId ? (
                <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.14em", color: "rgba(16,185,129,0.70)", marginTop: "0.5rem" }}>
                  Case reference: {queryCaseId}
                </p>
              ) : null}
            </section>
          ) : null}

          {!authenticated ? (
            <section style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.02)", padding: "1rem" }}>
              <p className="text-white/65">Sign in to view counsel case status.</p>
            </section>
          ) : null}

          {authenticated && !counselCase ? (
            <section style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.02)", padding: "1rem" }}>
              <p className="text-white/65">No counsel cases are currently recorded for this account.</p>
            </section>
          ) : null}

          {authenticated && institutionalCase ? (
            <section style={{ border: "1px solid rgba(201,169,110,0.18)", background: "rgba(201,169,110,0.03)", padding: "1rem" }}>
              <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.24em", textTransform: "uppercase", color: "rgba(201,169,110,0.72)" }}>
                Institutional case reference
              </p>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <div>
                  <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)" }}>Qualification</p>
                  <p className="mt-1 text-sm text-white/60">{institutionalCase.qualificationState.replace(/_/g, " ").toLowerCase()}</p>
                </div>
                <div>
                  <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)" }}>Evidence posture</p>
                  <p className="mt-1 text-sm text-white/60">{institutionalCase.evidencePosture.replace(/_/g, " ").toLowerCase()}</p>
                </div>
                <div>
                  <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)" }}>Corridor state</p>
                  <p className="mt-1 text-sm text-white/60">{institutionalCase.admitted.join(" · ") || "No surfaces admitted"}</p>
                </div>
              </div>
            </section>
          ) : null}

          {authenticated && stakeholderPressure && !stakeholderPressure.thinState && (
            <section style={{ border: "1px solid rgba(201,169,110,0.12)", background: "rgba(201,169,110,0.02)", padding: "1rem" }}>
              <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.24em", textTransform: "uppercase", color: "rgba(201,169,110,0.72)" }}>
                Stakeholder pressure summary
              </p>
              <div className="mt-3 space-y-2 text-sm text-white/60">
                {stakeholderPressure.decisionOwner && (
                  <p>Stated decision owner: {stakeholderPressure.decisionOwner}</p>
                )}
                {stakeholderPressure.potentialBlockers.length > 0 && (
                  <p>Who may block execution: {stakeholderPressure.potentialBlockers.join(", ")}</p>
                )}
                {stakeholderPressure.affectedGroups.length > 0 && (
                  <p>Affected groups: {stakeholderPressure.affectedGroups.join("; ")}</p>
                )}
                {stakeholderPressure.unresolvedAuthorityTension && (
                  <p className="text-white/45">{stakeholderPressure.unresolvedAuthorityTension}</p>
                )}
              </div>
              <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.14em", color: "rgba(255,255,255,0.22)", marginTop: "0.75rem" }}>
                Source: user-provided evidence. Not independently verified.
              </p>
            </section>
          )}

          {authenticated && counselCase ? (
            <>
              <section className="grid gap-4 md:grid-cols-3">
                <article style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)", padding: "1rem" }}>
                  <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.42)" }}>
                    Current status
                  </p>
                  <p className="mt-3 text-xl text-white">{counselCase.status}</p>
                </article>
                <article style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)", padding: "1rem" }}>
                  <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.42)" }}>
                    Created
                  </p>
                  <p className="mt-3 text-xl text-white">{new Date(counselCase.createdAt).toLocaleDateString("en-GB")}</p>
                </article>
                <article style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)", padding: "1rem" }}>
                  <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.42)" }}>
                    Updated
                  </p>
                  <p className="mt-3 text-xl text-white">{new Date(counselCase.updatedAt).toLocaleDateString("en-GB")}</p>
                </article>
              </section>

              <CounselCaseTimeline counselCase={counselCase} />

              <CounselMemorySummary counselCase={counselCase} caseCount={counselCaseCount} />

              <section style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.02)", padding: "1rem" }}>
                <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(201,169,110,0.82)" }}>
                  Current case summary
                </p>
                <p className="mt-3 text-sm leading-7 text-white/65">{counselCase.userSummary}</p>
                {counselCase.counselResponse ? (
                  <div className="mt-5">
                    <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.42)" }}>
                      Counsel response
                    </p>
                    <p className="mt-2 text-sm leading-7 text-white/60">{counselCase.counselResponse}</p>
                  </div>
                ) : null}
              </section>
            </>
          ) : null}
        </div>
      </main>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const { requireRole } = await import("@/lib/access/require-role.server");
  const roleCheck = await requireRole(ctx, "COUNSEL_VIEW");
  if ("redirect" in roleCheck) return { redirect: roleCheck.redirect };

  const { session, access } = await resolvePageAccess(ctx);
  const email = typeof session?.user?.email === "string" ? session.user.email.toLowerCase() : null;
  const userId = typeof session?.user?.id === "string" ? session.user.id : null;

  if (!access.permissions.isAuthenticated || !email) {
    return {
      props: {
        authenticated: false,
        counselCase: null,
        counselCaseCount: 0,
        institutionalCase: null,
        stakeholderPressure: null,
      },
    };
  }

  const counselCases = await loadCounselCasesForUser({ email, userId: userId ?? undefined });
  const counselCase = counselCases[0] ?? await loadCounselCaseForUser({ email, userId: userId ?? undefined });

  let institutionalCase: InstitutionalCaseSummary | null = null;
  try {
    const { resolveInstitutionalCase } = await import("@/lib/product/institutional-case-resolver");
    const { buildPublicSummary } = await import("@/lib/product/institutional-case-contract");
    const ic = await resolveInstitutionalCase(email);
    if (ic) institutionalCase = buildPublicSummary(ic) as InstitutionalCaseSummary;
  } catch { /* best-effort */ }

  let stakeholderPressure: StakeholderPressureView | null = null;
  try {
    const { getDiagnosticJourney } = await import("@/lib/diagnostics/journey-store");
    const journey = await getDiagnosticJourney({ email });
    const caseObj = journey.decisionObjects?.slice(-1)?.[0];
    if (caseObj) {
      const { buildStakeholderMapFromCase } = await import("@/lib/decision/stakeholder-map");
      const { buildStakeholderPressureSummary } = await import("@/lib/product/institutional-case-summary");
      const map = buildStakeholderMapFromCase(caseObj as any);
      const summary = buildStakeholderPressureSummary(map);
      stakeholderPressure = {
        decisionOwner: summary.decisionOwner,
        affectedGroups: summary.affectedGroups,
        unresolvedAuthorityTension: summary.unresolvedAuthorityTension,
        potentialBlockers: summary.potentialBlockers,
        thinState: summary.thinState,
      };
    }
  } catch { /* degrade gracefully */ }

  return {
    props: {
      authenticated: true,
      counselCase,
      counselCaseCount: counselCases.length || (counselCase ? 1 : 0),
      institutionalCase,
      stakeholderPressure,
    },
  };
};

export default CounselStatusPage;
