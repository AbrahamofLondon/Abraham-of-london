// pages/counsel/intake.tsx
// Structured counsel intake — prefills from evidence package, asks only what the system cannot know.

import * as React from "react";
import type { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { ArrowLeft, ArrowRight, ShieldCheck, AlertTriangle } from "lucide-react";
import { trackLaunch } from "@/lib/analytics/client-launch-events";

import Layout from "@/components/Layout";
import { resolvePageAccess } from "@/lib/access/server";
import { resolveCounselRoomState } from "@/lib/product/counsel-room-resolver";
import type { CounselRoomState } from "@/lib/product/counsel-room-contract";

const GOLD = "#C9A96E";
const BASE = "rgb(6 6 9)";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

type IntakeForm = {
  whatDecisionRequiresCounsel: string;
  userSummary: string;
  whatWouldMakeSuccessful: string;
  whatConstraintMustCounselRespect: string;
  whatAttemptedOutsideSystem: string;
  whoHasAuthorityToAct: string;
  whatMustNotBeExposed: string;
  deadlineOrConsequenceWindow: string;
  whatChangedSinceSystemAssessment: string;
  whatHumanCounselMustConsider: string;
  counselType: string;
  urgency: string;
  permissionToUseEvidencePackage: boolean;
};

const INITIAL_FORM: IntakeForm = {
  whatDecisionRequiresCounsel: "",
  userSummary: "",
  whatWouldMakeSuccessful: "",
  whatConstraintMustCounselRespect: "",
  whatAttemptedOutsideSystem: "",
  whoHasAuthorityToAct: "",
  whatMustNotBeExposed: "",
  deadlineOrConsequenceWindow: "",
  whatChangedSinceSystemAssessment: "",
  whatHumanCounselMustConsider: "",
  counselType: "DECISION_CLARIFICATION",
  urgency: "NORMAL",
  permissionToUseEvidencePackage: true,
};

type IntakePageProps = {
  counselState: CounselRoomState | null;
};

const CounselIntakePage: NextPage<IntakePageProps> = ({ counselState }) => {
  const router = useRouter();
  const [form, setForm] = React.useState<IntakeForm>(INITIAL_FORM);
  const [submitting, setSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    trackLaunch("counsel_intake_started", "counsel_intake");
  }, []);

  const canSubmit = form.whatDecisionRequiresCounsel.trim().length >= 20
    && form.userSummary.trim().length >= 20
    && form.whatHumanCounselMustConsider.trim().length >= 20;

  if (!counselState?.canSubmitStructuredIntake && !counselState?.canRequestCounsel) {
    return (
      <Layout title="Counsel Intake | Abraham of London" fullWidth headerTransparent>
        <Head><meta name="robots" content="noindex,nofollow" /></Head>
        <main style={{ backgroundColor: BASE, minHeight: "100vh", color: "white" }}>
          <div className="mx-auto max-w-3xl px-6 py-32">
            <p style={{ ...serif, fontSize: "1.1rem", lineHeight: 1.7, color: "rgba(255,255,255,0.45)" }}>
              Counsel is not yet warranted by the evidence available. Complete additional diagnostic stages first.
            </p>
            <Link href="/counsel" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", marginTop: "1.5rem", padding: "12px 24px", border: `1px solid ${GOLD}42`, color: `${GOLD}CC`, ...mono, fontSize: "9px", letterSpacing: "0.18em", textTransform: "uppercase", textDecoration: "none" }}>
              Return to Counsel Review <ArrowRight style={{ width: 10, height: 10 }} />
            </Link>
          </div>
        </main>
      </Layout>
    );
  }

  if (submitted) {
    return (
      <Layout title="Intake Submitted | Abraham of London" fullWidth headerTransparent>
        <Head><meta name="robots" content="noindex,nofollow" /></Head>
        <main style={{ backgroundColor: BASE, minHeight: "100vh", color: "white" }}>
          <div className="mx-auto max-w-3xl px-6 py-32 text-center">
            <ShieldCheck style={{ width: "40px", height: "40px", color: `${GOLD}60`, margin: "0 auto 1.5rem" }} />
            <h1 style={{ ...serif, fontSize: "2rem", color: "rgba(255,255,255,0.92)" }}>Intake submitted</h1>
            <p style={{ marginTop: "1rem", ...serif, fontSize: "1rem", lineHeight: 1.7, color: "rgba(255,255,255,0.45)", maxWidth: "40ch", margin: "1rem auto 0" }}>
              Your counsel case has been created and queued for review. You will be notified when a counsel response is ready.
            </p>
            <Link href="/counsel" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", marginTop: "2rem", padding: "12px 24px", backgroundColor: "rgba(255,255,255,0.96)", color: "rgb(3 3 5)", ...mono, fontSize: "9px", letterSpacing: "0.18em", textTransform: "uppercase", textDecoration: "none" }}>
              Return to Counsel Review <ArrowRight style={{ width: 10, height: 10 }} />
            </Link>
          </div>
        </main>
      </Layout>
    );
  }

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/counsel/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          urgency: form.urgency,
          counselType: form.counselType,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || data.message || "Submission failed.");
      }
      setSubmitted(true);
      trackLaunch("counsel_intake_submitted", "counsel_intake");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Layout title="Counsel Intake | Abraham of London" fullWidth headerTransparent>
      <Head><meta name="robots" content="noindex,nofollow" /></Head>
      <main style={{ backgroundColor: BASE, minHeight: "100vh", color: "white" }}>
        <div className="mx-auto max-w-3xl px-6 py-20 lg:px-12">
          <Link href="/counsel" style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", ...mono, fontSize: "8px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", textDecoration: "none", marginBottom: "2.5rem" }}>
            <ArrowLeft style={{ width: 10, height: 10 }} /> Counsel Review
          </Link>

          <h1 style={{ ...serif, fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)", lineHeight: 1.05, color: "rgba(255,255,255,0.92)" }}>
            Counsel Intake
          </h1>
          <p style={{ marginTop: "0.75rem", ...serif, fontSize: "1rem", lineHeight: 1.7, color: "rgba(255,255,255,0.40)", maxWidth: "48ch" }}>
            The system has prefilled your evidence package. These questions ask what only you know.
          </p>

          <div className="mt-10 space-y-8">
            {/* Counsel type */}
            <div>
              <label style={{ ...mono, fontSize: "8px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}90`, display: "block", marginBottom: "0.5rem" }}>
                Type of counsel requested
              </label>
              <select value={form.counselType} onChange={(e) => setForm((f) => ({ ...f, counselType: e.target.value }))}
                style={{ width: "100%", padding: "12px 16px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.80)", ...mono, fontSize: "11px" }}>
                <option value="DECISION_CLARIFICATION">Decision clarification</option>
                <option value="ESCALATION_REVIEW">Escalation review</option>
                <option value="BOARDROOM_PREPARATION">Boardroom preparation</option>
                <option value="STRATEGIC_INTERVENTION">Strategic intervention</option>
                <option value="RETAINER_REVIEW">Retainer review</option>
              </select>
            </div>

            {/* What decision requires counsel now */}
            <Field label="What decision requires counsel now?" required mono={mono} serif={serif} GOLD={GOLD}>
              <textarea value={form.whatDecisionRequiresCounsel} onChange={(e) => setForm((f) => ({ ...f, whatDecisionRequiresCounsel: e.target.value }))}
                rows={4} placeholder="Describe the specific decision that requires counsel intervention. What is at stake?"
                style={{ width: "100%", padding: "12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.80)", fontSize: "14px", lineHeight: 1.6, resize: "vertical" }} />
            </Field>

            {/* Summary */}
            <Field label="Summarise the situation in your own words" required mono={mono} serif={serif} GOLD={GOLD}>
              <textarea value={form.userSummary} onChange={(e) => setForm((f) => ({ ...f, userSummary: e.target.value }))}
                rows={3} placeholder="What has led to this counsel request? What is the core issue?"
                style={{ width: "100%", padding: "12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.80)", fontSize: "14px", lineHeight: 1.6, resize: "vertical" }} />
            </Field>

            {/* What would make successful */}
            <Field label="What would make counsel intervention successful?" mono={mono} serif={serif} GOLD={GOLD}>
              <textarea value={form.whatWouldMakeSuccessful} onChange={(e) => setForm((f) => ({ ...f, whatWouldMakeSuccessful: e.target.value }))}
                rows={2} placeholder="What outcome would justify this counsel engagement?"
                style={{ width: "100%", padding: "12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.80)", fontSize: "14px", lineHeight: 1.6, resize: "vertical" }} />
            </Field>

            {/* Constraints */}
            <Field label="What constraint must counsel respect?" mono={mono} serif={serif} GOLD={GOLD}>
              <textarea value={form.whatConstraintMustCounselRespect} onChange={(e) => setForm((f) => ({ ...f, whatConstraintMustCounselRespect: e.target.value }))}
                rows={2} placeholder="Timing, confidentiality, stakeholder sensitivities, or other boundaries."
                style={{ width: "100%", padding: "12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.80)", fontSize: "14px", lineHeight: 1.6, resize: "vertical" }} />
            </Field>

            {/* What has been attempted */}
            <Field label="What has already been attempted outside the system?" mono={mono} serif={serif} GOLD={GOLD}>
              <textarea value={form.whatAttemptedOutsideSystem} onChange={(e) => setForm((f) => ({ ...f, whatAttemptedOutsideSystem: e.target.value }))}
                rows={2} placeholder="Prior interventions, conversations, or decisions made outside this platform."
                style={{ width: "100%", padding: "12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.80)", fontSize: "14px", lineHeight: 1.6, resize: "vertical" }} />
            </Field>

            {/* Authority */}
            <Field label="Who has authority to act on counsel output?" mono={mono} serif={serif} GOLD={GOLD}>
              <input value={form.whoHasAuthorityToAct} onChange={(e) => setForm((f) => ({ ...f, whoHasAuthorityToAct: e.target.value }))}
                placeholder="Role or relationship, not a specific name"
                style={{ width: "100%", padding: "12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.80)", fontSize: "14px" }} />
            </Field>

            {/* What must not be exposed */}
            <Field label="What must not be exposed to stakeholders?" mono={mono} serif={serif} GOLD={GOLD}>
              <textarea value={form.whatMustNotBeExposed} onChange={(e) => setForm((f) => ({ ...f, whatMustNotBeExposed: e.target.value }))}
                rows={2} placeholder="Any context that must remain confidential from specific parties."
                style={{ width: "100%", padding: "12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.80)", fontSize: "14px", lineHeight: 1.6, resize: "vertical" }} />
            </Field>

            {/* Deadline */}
            <Field label="What is the deadline or consequence window?" mono={mono} serif={serif} GOLD={GOLD}>
              <input value={form.deadlineOrConsequenceWindow} onChange={(e) => setForm((f) => ({ ...f, deadlineOrConsequenceWindow: e.target.value }))}
                placeholder="e.g. Board meeting in 14 days, regulatory deadline Q3"
                style={{ width: "100%", padding: "12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.80)", fontSize: "14px" }} />
            </Field>

            {/* What changed */}
            <Field label="What has changed since the system assessment?" mono={mono} serif={serif} GOLD={GOLD}>
              <textarea value={form.whatChangedSinceSystemAssessment} onChange={(e) => setForm((f) => ({ ...f, whatChangedSinceSystemAssessment: e.target.value }))}
                rows={2} placeholder="New developments the system may not have captured."
                style={{ width: "100%", padding: "12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.80)", fontSize: "14px", lineHeight: 1.6, resize: "vertical" }} />
            </Field>

            {/* What counsel must consider */}
            <Field label="What must human counsel consider?" required mono={mono} serif={serif} GOLD={GOLD}>
              <textarea value={form.whatHumanCounselMustConsider} onChange={(e) => setForm((f) => ({ ...f, whatHumanCounselMustConsider: e.target.value }))}
                rows={3} placeholder="What context, nuance, or constraint is critical for counsel to understand?"
                style={{ width: "100%", padding: "12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.80)", fontSize: "14px", lineHeight: 1.6, resize: "vertical" }} />
            </Field>

            {/* Urgency */}
            <div>
              <label style={{ ...mono, fontSize: "8px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}90`, display: "block", marginBottom: "0.5rem" }}>
                Urgency
              </label>
              <select value={form.urgency} onChange={(e) => setForm((f) => ({ ...f, urgency: e.target.value }))}
                style={{ width: "100%", padding: "12px 16px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.80)", ...mono, fontSize: "11px" }}>
                <option value="NORMAL">Normal</option>
                <option value="TIME_SENSITIVE">Time sensitive</option>
                <option value="BOARD_OR_LEGAL_EXPOSURE">Board or legal exposure</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>

            {/* Permission */}
            <label className="flex items-start gap-3" style={{ cursor: "pointer" }}>
              <input type="checkbox" checked={form.permissionToUseEvidencePackage}
                onChange={(e) => setForm((f) => ({ ...f, permissionToUseEvidencePackage: e.target.checked }))}
                style={{ marginTop: "3px", width: "16px", height: "16px" }} />
              <span style={{ ...serif, fontSize: "0.92rem", lineHeight: 1.55, color: "rgba(255,255,255,0.50)" }}>
                I authorise the use of my diagnostic evidence package as context for counsel review.
              </span>
            </label>

            {/* Error */}
            {error && (
              <div style={{ padding: "1rem", border: "1px solid rgba(252,165,165,0.20)", backgroundColor: "rgba(252,165,165,0.04)" }}>
                <div className="flex items-center gap-2">
                  <AlertTriangle style={{ width: "14px", height: "14px", color: "rgba(252,165,165,0.55)" }} />
                  <span style={{ fontSize: "13px", color: "rgba(252,165,165,0.70)" }}>{error}</span>
                </div>
              </div>
            )}

            {/* Submit */}
            <button onClick={handleSubmit} disabled={!canSubmit || submitting}
              style={{ padding: "14px 32px", backgroundColor: canSubmit ? "rgba(255,255,255,0.96)" : "rgba(255,255,255,0.08)", color: canSubmit ? "rgb(3 3 5)" : "rgba(255,255,255,0.25)", ...mono, fontSize: "9px", letterSpacing: "0.28em", textTransform: "uppercase", border: "none", cursor: canSubmit ? "pointer" : "not-allowed", width: "100%" }}>
              {submitting ? "Submitting..." : "Submit Counsel Intake"}
            </button>
          </div>
        </div>
      </main>
    </Layout>
  );
};

function Field({ label, required, children, mono, serif, GOLD }: { label: string; required?: boolean; children: React.ReactNode; mono: React.CSSProperties; serif: React.CSSProperties; GOLD: string }) {
  return (
    <div>
      <label style={{ ...mono, fontSize: "8px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}90`, display: "block", marginBottom: "0.5rem" }}>
        {label}{required ? " *" : ""}
      </label>
      {children}
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<IntakePageProps> = async (ctx) => {
  try {
    const { session, access } = await resolvePageAccess(ctx);
    if (!access.permissions.isAuthenticated || !session?.user?.email) {
      return { redirect: { destination: `/api/auth/signin?callbackUrl=${encodeURIComponent("/counsel/intake")}`, permanent: false } };
    }
    const counselState = await resolveCounselRoomState({ email: session.user.email, userId: session.user.id });
    return { props: { counselState } };
  } catch {
    return { props: { counselState: null } };
  }
};

export default CounselIntakePage;
