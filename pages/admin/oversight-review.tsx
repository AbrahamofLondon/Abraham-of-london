import * as React from "react";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import Head from "next/head";

import AdminLayout from "@/components/admin/AdminLayout";
import { requireAdminPage } from "@/lib/access/server";
import type { OversightReviewDecision } from "@/lib/product/oversight-review-decision-contract";

type PreviewResponse = {
  ok: boolean;
  internalBrief: any;
  clientSafeBrief: any;
  efficacy: any;
  cycle: any;
  suppressions: Array<{ section: string; reason: string; explanation: string }>;
  ledgerEvents: Array<{ id: string; eventType: string; timestamp: string; reason?: string }>;
  cycleComparison: { available: boolean; deltas: Array<{ dimension: string; direction: string; explanation: string }>; warnings: string[] };
  recommendedDecision: {
    recommendedDecision: OversightReviewDecision;
    reasons: string[];
    deliveryAllowed: boolean;
    operatorNoteRequired: boolean;
    explanation: string;
  };
  operatorDecisionRecord?: any;
  deliveryIntent: { state: string; reason: string; nextStep: string; deliveryAllowed: boolean };
  nextCycleIntent?: { cadence: string; nextCycleRecommendedDate: string; reason: string };
  warnings: string[];
};

const DECISION_OPTIONS: Array<{ value: OversightReviewDecision; label: string }> = [
  { value: "APPROVE_FOR_CLIENT", label: "Approve For Client" },
  { value: "REVISE_BEFORE_DELIVERY", label: "Revise Before Delivery" },
  { value: "WITHHOLD_FROM_CLIENT", label: "Withhold From Client" },
  { value: "ESCALATE_TO_COUNSEL", label: "Escalate To Counsel" },
  { value: "ESCALATE_TO_BOARDROOM", label: "Escalate To Boardroom" },
  { value: "WAIT_FOR_MORE_EVIDENCE", label: "Wait For More Evidence" },
];

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border border-white/10 bg-zinc-950/70 p-5">
      <h2 className="text-[10px] font-mono uppercase tracking-[0.28em] text-amber-500/70">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function DataLine({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/5 py-2 text-sm">
      <span className="text-white/45">{label}</span>
      <span className="text-right text-white">{value}</span>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const guard = await requireAdminPage(ctx);
  if (!guard.authorized) return guard.redirect;
  return { props: {} };
};

export default function OversightReviewPage(
  _props: InferGetServerSidePropsType<typeof getServerSideProps>,
) {
  const [accountId, setAccountId] = React.useState("");
  const [organisationId, setOrganisationId] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [persist, setPersist] = React.useState(false);
  const [firstCycleException, setFirstCycleException] = React.useState(false);
  const [operatorDecision, setOperatorDecision] = React.useState<OversightReviewDecision | "">("");
  const [operatorNote, setOperatorNote] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [preview, setPreview] = React.useState<PreviewResponse | null>(null);

  const submit = React.useCallback(async (withDecision: boolean) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/internal/oversight/review-cycle-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: accountId || undefined,
          organisationId: organisationId || undefined,
          email: email || undefined,
          persist,
          firstCycleException,
          operatorDecision: withDecision ? operatorDecision || undefined : undefined,
          operatorNote: withDecision ? operatorNote || undefined : undefined,
        }),
      });

      const data = await response.json() as PreviewResponse & { error?: string; reason?: string };
      if (!response.ok || !data.ok) {
        throw new Error(data.reason || data.error || "Oversight review preview failed.");
      }
      setPreview(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Oversight review preview failed.");
    } finally {
      setLoading(false);
    }
  }, [accountId, email, firstCycleException, operatorDecision, operatorNote, organisationId, persist]);

  const recommendation = preview?.recommendedDecision;
  const override = Boolean(
    operatorDecision
    && recommendation
    && operatorDecision !== recommendation.recommendedDecision,
  );

  return (
    <AdminLayout title="Oversight Review">
      <Head>
        <title>Oversight Review | Admin</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <div className="space-y-6">
        <section className="border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-6">
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-amber-500/60">Oversight Review Bench</p>
          <h1 className="mt-3 font-serif text-3xl text-white">Governed brief review</h1>
          <p className="mt-2 max-w-3xl text-sm text-white/55">
            Generate the internal brief, inspect the client-safe version, apply the review decision, and record delivery intent without pretending delivery has happened.
          </p>
        </section>

        <Panel title="Review Decision">
          <div className="grid gap-4 md:grid-cols-3">
            <label className="block text-sm text-white/70">
              <span className="mb-1 block text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">Account Selector</span>
              <input value={accountId} onChange={(e) => setAccountId(e.target.value)} className="w-full border border-white/10 bg-black/40 px-3 py-2 text-white" placeholder="Retainer account id" />
            </label>
            <label className="block text-sm text-white/70">
              <span className="mb-1 block text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">Organisation Selector</span>
              <input value={organisationId} onChange={(e) => setOrganisationId(e.target.value)} className="w-full border border-white/10 bg-black/40 px-3 py-2 text-white" placeholder="Organisation id" />
            </label>
            <label className="block text-sm text-white/70">
              <span className="mb-1 block text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">User Scope</span>
              <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-white/10 bg-black/40 px-3 py-2 text-white" placeholder="client@example.com" />
            </label>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-white/70">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={persist} onChange={(e) => setPersist(e.target.checked)} />
              Persist review-cycle events
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={firstCycleException} onChange={(e) => setFirstCycleException(e.target.checked)} />
              First-cycle exception
            </label>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button onClick={() => void submit(false)} disabled={loading} className="border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-200 disabled:opacity-50">
              {loading ? "Loading..." : "Generate Review Cycle"}
            </button>
          </div>

          {error && <p className="mt-4 text-sm text-rose-300">{error}</p>}
        </Panel>

        {preview && (
          <>
            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <Panel title="Required Operator Action">
                <DataLine label="Efficacy Grade" value={`${preview.efficacy?.grade ?? "UNKNOWN"} (${preview.efficacy?.totalScore ?? 0})`} />
                <DataLine label="Recommended Decision" value={recommendation?.recommendedDecision ?? "WAIT_FOR_MORE_EVIDENCE"} />
                <DataLine label="Delivery Allowed" value={recommendation?.deliveryAllowed ? "Yes" : "No"} />
                <DataLine label="Cycle Status" value={preview.cycle.status} />
                <p className="mt-4 text-sm text-white/60">{recommendation?.explanation}</p>

                <div className="mt-5 grid gap-4 md:grid-cols-[1fr_1fr]">
                  <label className="block text-sm text-white/70">
                    <span className="mb-1 block text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">Operator Decision</span>
                    <select value={operatorDecision} onChange={(e) => setOperatorDecision(e.target.value as OversightReviewDecision | "")} className="w-full border border-white/10 bg-black/40 px-3 py-2 text-white">
                      <option value="">Choose decision</option>
                      {DECISION_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </label>

                  <label className="block text-sm text-white/70">
                    <span className="mb-1 block text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">Delivery State</span>
                    <div className="border border-white/10 bg-black/40 px-3 py-2 text-white">
                      {preview.deliveryIntent.state}
                    </div>
                  </label>
                </div>

                <label className="mt-4 block text-sm text-white/70">
                  <span className="mb-1 block text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">Operator Note</span>
                  <textarea value={operatorNote} onChange={(e) => setOperatorNote(e.target.value)} rows={4} className="w-full border border-white/10 bg-black/40 px-3 py-2 text-white" placeholder="Required for overrides, escalation, withhold, and first-cycle exceptions." />
                </label>

                <div className="mt-4 flex flex-wrap gap-3">
                  <button onClick={() => void submit(true)} disabled={loading || !operatorDecision || (override && !operatorNote.trim())} className="border border-white/15 bg-white/5 px-4 py-2 text-sm text-white disabled:opacity-50">
                    Record Review Decision
                  </button>
                </div>
                {override && !operatorNote.trim() && (
                  <p className="mt-3 text-sm text-amber-300">Operator note is required when overriding the recommended decision.</p>
                )}
              </Panel>

              <Panel title="Delivery State">
                <DataLine label="State" value={preview.deliveryIntent.state} />
                <DataLine label="Method" value="INTERNAL_PREVIEW" />
                <DataLine label="Allowed" value={preview.deliveryIntent.deliveryAllowed ? "Yes" : "No"} />
                <p className="mt-4 text-sm text-white/60">{preview.deliveryIntent.reason}</p>
                <p className="mt-3 text-sm text-white/45">{preview.deliveryIntent.nextStep}</p>

                {preview.nextCycleIntent && (
                  <div className="mt-6 border-t border-white/10 pt-4">
                    <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">Next Cycle Intent</p>
                    <p className="mt-2 text-sm text-white">Cadence: {preview.nextCycleIntent.cadence}</p>
                    <p className="mt-1 text-sm text-white/60">Recommended date: {new Date(preview.nextCycleIntent.nextCycleRecommendedDate).toLocaleDateString("en-GB")}</p>
                    <p className="mt-2 text-sm text-white/45">{preview.nextCycleIntent.reason}</p>
                  </div>
                )}
              </Panel>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <Panel title="Suppression Ledger">
                {preview.suppressions.length === 0 ? (
                  <p className="text-sm text-white/45">No suppressions were required for this cycle.</p>
                ) : (
                  <div className="space-y-4">
                    {preview.suppressions.map((item) => (
                      <div key={`${item.section}-${item.reason}`} className="border border-white/10 bg-black/30 p-4">
                        <p className="text-sm text-white">{item.section}</p>
                        <p className="mt-1 text-[10px] font-mono uppercase tracking-[0.2em] text-amber-300/70">{item.reason}</p>
                        <p className="mt-2 text-sm text-white/55">{item.explanation}</p>
                      </div>
                    ))}
                  </div>
                )}
              </Panel>

              <Panel title="Warnings">
                {preview.warnings.length === 0 ? (
                  <p className="text-sm text-white/45">No material warnings were emitted for this cycle.</p>
                ) : (
                  <ul className="space-y-3 text-sm text-white/60">
                    {preview.warnings.map((warning) => (
                      <li key={warning} className="border-b border-white/5 pb-3">{warning}</li>
                    ))}
                  </ul>
                )}
              </Panel>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <Panel title="Internal Brief Summary">
                <p className="text-sm text-white/70">{preview.internalBrief?.executiveSummary || "No internal brief available."}</p>
                <div className="mt-4">
                  <DataLine label="Required Actions" value={preview.internalBrief?.requiredActions?.length ?? 0} />
                  <DataLine label="Cost Clock" value={preview.internalBrief?.costOfInaction ? `£${preview.internalBrief.costOfInaction.totalEstimated}` : "Unavailable"} />
                  <DataLine label="Pattern Recurrence" value={preview.internalBrief?.patternRecurrence?.status ?? "Not present"} />
                  <DataLine label="Boardroom Trigger" value={(preview.internalBrief?.boardroom?.dossiersAvailable ?? 0) > 0 ? "Yes" : "No"} />
                  <DataLine label="Counsel Trigger" value={(preview.internalBrief?.counsel?.requiredNow ?? 0) > 0 ? "Yes" : "No"} />
                </div>
              </Panel>

              <Panel title="Client-Safe Output">
                <p className="text-sm text-white/70">{preview.clientSafeBrief?.executiveSummary || "No client-safe brief available."}</p>
                <div className="mt-4">
                  <DataLine label="Cases Visible" value={preview.clientSafeBrief?.activeCases?.length ?? 0} />
                  <DataLine label="Required Actions" value={preview.clientSafeBrief?.requiredActions?.length ?? 0} />
                  <DataLine label="Decision Credit" value={preview.clientSafeBrief?.decisionCredit?.score ?? "Suppressed"} />
                </div>
              </Panel>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <Panel title="Cycle Comparison">
                {preview.cycleComparison.available ? (
                  <div className="space-y-3">
                    {preview.cycleComparison.deltas.map((delta) => (
                      <div key={`${delta.dimension}-${delta.explanation}`} className="border-b border-white/5 pb-3">
                        <p className="text-sm text-white">{delta.dimension} · {delta.direction}</p>
                        <p className="mt-1 text-sm text-white/55">{delta.explanation}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-white/45">No prior cycle is available for continuity comparison.</p>
                )}
              </Panel>

              <Panel title="Ledger Events">
                {preview.ledgerEvents.length === 0 ? (
                  <p className="text-sm text-white/45">No persisted ledger events exist for this cycle yet.</p>
                ) : (
                  <div className="space-y-3">
                    {preview.ledgerEvents.map((event) => (
                      <div key={event.id} className="border-b border-white/5 pb-3">
                        <p className="text-sm text-white">{event.eventType}</p>
                        <p className="mt-1 text-sm text-white/45">{new Date(event.timestamp).toLocaleString("en-GB")}</p>
                        {event.reason && <p className="mt-1 text-sm text-white/55">{event.reason}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </Panel>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
