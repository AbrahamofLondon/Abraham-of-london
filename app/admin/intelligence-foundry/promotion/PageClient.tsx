// app/admin/intelligence-foundry/promotion/page.tsx
// Promotion Workflow — deliberate, evidenced maturity stage transitions.
// Records FoundryPromotion decisions for governance events and product surfaces.
// Only one-step-at-a-time advances are allowed (RESERVED_CONCEPT → SIMULATION_ONLY etc.)
// Rollback is append-only — it records reversal evidence without deleting history.

"use client";

import * as React from "react";
import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type PromotionRecord = {
  id: string;
  eventType: string;
  fromStage: string;
  toStage: string;
  approvedBy: string;
  approvedAt: string;
  promotionReason: string;
  criteriaMetJson: string | null;
  blockersJson: string | null;
  researchRunId: string | null;
  rollbackAt: string | null;
  rollbackReason: string | null;
  rollbackBy: string | null;
  createdAt: string;
};

const MATURITY_ORDER = [
  "RESERVED_CONCEPT",
  "SIMULATION_ONLY",
  "PILOT_READY",
  "LIVE_GOVERNED",
] as const;

const STAGE_STYLES: Record<string, { label: string; color: string; bg: string; border: string }> = {
  RESERVED_CONCEPT: { label: "Reserved",     color: "text-white/35",       bg: "bg-white/5",       border: "border-white/8" },
  SIMULATION_ONLY:  { label: "Simulation",   color: "text-purple-400/70",  bg: "bg-purple-500/8",  border: "border-purple-500/15" },
  PILOT_READY:      { label: "Pilot Ready",  color: "text-violet-400/80",  bg: "bg-violet-500/8",  border: "border-violet-500/15" },
  LIVE_GOVERNED:    { label: "Live Governed",color: "text-emerald-400/85", bg: "bg-emerald-500/8", border: "border-emerald-500/15" },
};

const StageChip = ({ stage }: { stage: string }) => {
  const s = STAGE_STYLES[stage] ?? { label: stage, color: "text-white/30", bg: "bg-white/5", border: "border-white/8" };
  return (
    <span className={`rounded px-1.5 py-0.5 text-[8px] font-mono uppercase tracking-wider ${s.bg} ${s.color} border ${s.border}`}>
      {s.label}
    </span>
  );
};

const Arrow = () => <span className="text-white/20 font-mono text-xs mx-1">→</span>;

function nextStage(from: string): string | null {
  const idx = MATURITY_ORDER.indexOf(from as typeof MATURITY_ORDER[number]);
  if (idx === -1 || idx === MATURITY_ORDER.length - 1) return null;
  return MATURITY_ORDER[idx + 1] ?? null;
}

const EXAMPLE_CRITERIA: Record<string, string[]> = {
  "RESERVED_CONCEPT→SIMULATION_ONLY": [
    "Engine adapter built and returns valid EngineRunOutput",
    "At least one ResearchRun recorded with status SIMULATION_RECORDED",
    "Limitations and promotionRequirements documented in adapter",
  ],
  "SIMULATION_ONLY→PILOT_READY": [
    "5+ simulation runs with no CRITICAL self-test failures",
    "Honesty enforcer: no Law violations in last 10 runs",
    "Promotion blockers documented and addressed",
    "Admin owner assigned",
  ],
  "PILOT_READY→LIVE_GOVERNED": [
    "Pilot evidence from real product surface (not fixture)",
    "ResearchRun with status PILOT_RECORDED and maturityStage=PILOT_READY",
    "Zero unresolved ACTION_REQUIRED findings for this module",
    "CI gate not blocked by this module",
    "Governance event entry updated to LIVE_GOVERNED",
  ],
};

// ─── Rollback panel (per-promotion) ──────────────────────────────────────────

function RollbackPanel({ promotion, onDone }: { promotion: PromotionRecord; onDone: (updated: PromotionRecord) => void }) {
  const [open,      setOpen]      = React.useState(false);
  const [reason,    setReason]    = React.useState("");
  const [confirm,   setConfirm]   = React.useState(false);
  const [saving,    setSaving]    = React.useState(false);
  const [err,       setErr]       = React.useState<string | null>(null);

  if (promotion.rollbackAt) {
    return (
      <div className="mt-3 rounded-lg border border-red-400/10 bg-red-400/[0.04] px-3 py-2 space-y-0.5">
        <p className="text-[9px] font-mono uppercase text-red-400/40">Rolled Back</p>
        <p className="text-[10px] text-red-400/50">{promotion.rollbackReason}</p>
        <div className="flex items-center gap-3 text-[9px] text-white/15 font-mono mt-0.5">
          <span>{new Date(promotion.rollbackAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
          {promotion.rollbackBy && <span>by {promotion.rollbackBy}</span>}
        </div>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-3 text-[10px] font-mono text-red-400/30 hover:text-red-400/60 underline underline-offset-2 transition-colors"
      >
        Record rollback…
      </button>
    );
  }

  return (
    <div className="mt-3 rounded-lg border border-red-400/15 bg-red-400/[0.04] p-3 space-y-2">
      <p className="text-[9px] font-mono uppercase text-red-400/50">Record Rollback — Append-Only</p>
      <textarea
        value={reason}
        onChange={(e) => { setReason(e.target.value); setConfirm(false); }}
        rows={2}
        placeholder="Why is this promotion being rolled back? What changed? What evidence contradicts the original decision?"
        className="w-full rounded border border-white/8 bg-white/[0.02] px-2 py-1.5 text-xs text-white/55 placeholder:text-white/15 focus:outline-none resize-none"
      />
      {reason.trim().length > 0 && !confirm && (
        <button
          onClick={() => setConfirm(true)}
          className="text-[10px] font-mono text-amber-400/60 hover:text-amber-400/80 underline underline-offset-2 transition-colors"
        >
          Confirm rollback →
        </button>
      )}
      {confirm && (
        <div className="rounded border border-red-400/20 bg-red-400/[0.06] px-3 py-2 space-y-2">
          <p className="text-[10px] text-red-400/60">
            This will record a rollback of {promotion.eventType} ({promotion.fromStage} → {promotion.toStage}).
            The original promotion record is preserved. This action cannot be undone.
          </p>
          <div className="flex gap-2">
            <button
              disabled={saving}
              onClick={async () => {
                setSaving(true);
                setErr(null);
                try {
                  const res = await fetch(`/api/admin/intelligence-foundry/promotion/${promotion.id}/rollback`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ rollbackReason: reason.trim() }),
                  });
                  const data = await res.json();
                  if (!data.ok) { setErr(String(data.error ?? "Rollback failed")); }
                  else { onDone(data.promotion as PromotionRecord); }
                } catch { setErr("Network error"); }
                finally { setSaving(false); }
              }}
              className="rounded px-3 py-1 text-[10px] font-mono uppercase bg-red-400/10 text-red-400/70 border border-red-400/20 hover:bg-red-400/15 disabled:opacity-40 transition-all"
            >
              {saving ? "Recording…" : "Record rollback"}
            </button>
            <button
              onClick={() => { setOpen(false); setReason(""); setConfirm(false); setErr(null); }}
              className="rounded px-3 py-1 text-[10px] font-mono uppercase text-white/25 hover:text-white/45 transition-colors"
            >
              Cancel
            </button>
          </div>
          {err && <p className="text-[10px] text-red-400 font-mono">{err}</p>}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function PromotionWorkflowInner() {
  const searchParams = useSearchParams();
  const prefillRunId = searchParams?.get("runId") ?? "";

  const [promotions, setPromotions] = React.useState<PromotionRecord[]>([]);
  const [loading,    setLoading]    = React.useState(true);
  const [error,      setError]      = React.useState<string | null>(null);

  // New promotion form — prefill researchRunId from ?runId= query param
  const [showForm,         setShowForm]         = React.useState(!!prefillRunId);
  const [eventType,        setEventType]        = React.useState("");
  const [fromStage,        setFromStage]        = React.useState<typeof MATURITY_ORDER[number]>("RESERVED_CONCEPT");
  const [approvedBy,       setApprovedBy]       = React.useState("");
  const [promotionReason,  setPromotionReason]  = React.useState("");
  const [researchRunId,    setResearchRunId]     = React.useState(prefillRunId);
  const [submitting,       setSubmitting]        = React.useState(false);
  const [formError,        setFormError]         = React.useState<string | null>(null);
  const [formSuccess,      setFormSuccess]       = React.useState<string | null>(null);

  const toStage = nextStage(fromStage);

  const loadPromotions = React.useCallback(() => {
    setLoading(true);
    fetch("/api/admin/intelligence-foundry/promotion")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setPromotions(data.promotions);
        else setError(data.error ?? "Failed to load promotions");
      })
      .catch(() => setError("Network error"))
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => { loadPromotions(); }, [loadPromotions]);

  const handleRollbackDone = React.useCallback((updated: PromotionRecord) => {
    setPromotions((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toStage) return;
    setSubmitting(true);
    setFormError(null);
    setFormSuccess(null);
    try {
      const res = await fetch("/api/admin/intelligence-foundry/promotion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType:       eventType.trim(),
          fromStage,
          toStage,
          approvedBy:      approvedBy.trim(),
          promotionReason: promotionReason.trim(),
          researchRunId:   researchRunId.trim() || undefined,
          criteriaMet:     EXAMPLE_CRITERIA[`${fromStage}→${toStage}`] ?? [],
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        const errMsg = typeof data.error === "object" && data.error !== null
          ? `${(data.error as { type?: string }).type ?? "ERROR"}: ${JSON.stringify(data.error)}`
          : String(data.error ?? "Promotion failed");
        setFormError(errMsg);
      } else {
        setFormSuccess(`Promotion recorded: ${data.promotion?.id}`);
        setPromotions((prev) => [data.promotion as PromotionRecord, ...prev]);
        setEventType("");
        setApprovedBy("");
        setPromotionReason("");
        setResearchRunId("");
        setShowForm(false);
      }
    } catch {
      setFormError("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-4xl">
      {/* Header */}
      <div>
        <Link
          href="/admin/intelligence-foundry"
          className="text-[10px] font-mono uppercase tracking-widest text-white/20 hover:text-white/40 transition-colors"
        >
          ← Intelligence Foundry
        </Link>
        <p className="text-[10px] font-mono uppercase tracking-widest text-white/25 mb-1 mt-3">
          Maturity Governance · Append-Only
        </p>
        <h1 className="text-xl font-semibold text-white/80">Promotion Workflow</h1>
        <p className="mt-1 text-sm text-white/40 max-w-xl">
          Records deliberate, evidenced decisions to advance governance events or product surfaces
          one maturity stage at a time. Promotions are append-only. Rollback records the reversal —
          it does not delete the original promotion history.
        </p>
      </div>

      {/* Stage ladder */}
      <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
        <p className="text-[10px] font-mono uppercase tracking-widest text-white/20 mb-3">Maturity Ladder</p>
        <div className="flex items-center gap-2 flex-wrap">
          {MATURITY_ORDER.map((stage, i) => (
            <React.Fragment key={stage}>
              <StageChip stage={stage} />
              {i < MATURITY_ORDER.length - 1 && <Arrow />}
            </React.Fragment>
          ))}
        </div>
        <p className="text-[10px] font-mono text-white/15 mt-2">
          One-step advances only. LIVE_GOVERNED is terminal — only RETIRED via separate archival workflow.
        </p>
      </div>

      {/* Record promotion */}
      <div>
        {!showForm ? (
          <button
            onClick={() => { setShowForm(true); setFormSuccess(null); }}
            className="rounded-lg border border-amber-400/20 bg-amber-400/8 px-4 py-2 text-xs font-mono uppercase tracking-wide text-amber-400/70 hover:border-amber-400/35 hover:text-amber-400/90 transition-all"
          >
            + Record New Promotion
          </button>
        ) : (
          <div className="rounded-xl border border-white/8 bg-white/[0.02] p-5 space-y-4">
            <p className="text-[10px] font-mono uppercase tracking-widest text-white/25">Record Promotion</p>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-[10px] font-mono uppercase text-white/20 mb-1">Event / Surface Type *</label>
                <input
                  required type="text" value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  placeholder="e.g. GMI_WEEKLY_BRIEF or FAST_DIAGNOSTIC_SURFACE"
                  className="w-full rounded-lg border border-white/8 bg-white/2 px-3 py-2 text-sm text-white/60 placeholder:text-white/15 focus:outline-none focus:border-white/20 font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-white/20 mb-1">Current Stage (from) *</label>
                <select
                  value={fromStage}
                  onChange={(e) => setFromStage(e.target.value as typeof MATURITY_ORDER[number])}
                  className="w-full rounded-lg border border-white/8 bg-white/2 px-3 py-2 text-sm text-white/60 focus:outline-none focus:border-white/20 font-mono"
                >
                  {MATURITY_ORDER.filter((s) => s !== "LIVE_GOVERNED").map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-white/20 mb-1">Target Stage (to)</label>
                <div className="rounded-lg border border-white/8 bg-white/[0.02] px-3 py-2 flex items-center gap-2">
                  <StageChip stage={fromStage} />
                  <Arrow />
                  {toStage
                    ? <StageChip stage={toStage} />
                    : <span className="text-red-400/60 text-xs font-mono">No valid next stage</span>}
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-white/20 mb-1">Approved By (email) *</label>
                <input
                  required type="email" value={approvedBy}
                  onChange={(e) => setApprovedBy(e.target.value)}
                  placeholder="operator@example.com"
                  className="w-full rounded-lg border border-white/8 bg-white/2 px-3 py-2 text-sm text-white/60 placeholder:text-white/15 focus:outline-none focus:border-white/20 font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-white/20 mb-1">Promotion Reason *</label>
                <textarea
                  required value={promotionReason}
                  onChange={(e) => setPromotionReason(e.target.value)}
                  placeholder="Why is this surface ready to advance? What evidence exists? What was the decision?"
                  rows={3}
                  className="w-full rounded-lg border border-white/8 bg-white/2 px-3 py-2 text-sm text-white/60 placeholder:text-white/15 focus:outline-none focus:border-white/20 resize-y"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-white/20 mb-1">
                  Evidence ResearchRun ID
                  <span className="ml-1 text-white/15">(optional)</span>
                </label>
                <input
                  type="text" value={researchRunId}
                  onChange={(e) => setResearchRunId(e.target.value)}
                  placeholder="cuid of the ResearchRun that serves as evidence"
                  className="w-full rounded-lg border border-white/8 bg-white/2 px-3 py-2 text-sm text-white/60 placeholder:text-white/15 focus:outline-none focus:border-white/20 font-mono text-xs"
                />
              </div>
              {toStage && EXAMPLE_CRITERIA[`${fromStage}→${toStage}`] && (
                <div className="rounded-lg border border-white/8 bg-white/[0.02] px-3 py-2">
                  <p className="text-[10px] font-mono uppercase text-white/20 mb-2">
                    Standard Criteria for {fromStage} → {toStage}
                  </p>
                  <ul className="space-y-1">
                    {EXAMPLE_CRITERIA[`${fromStage}→${toStage}`]!.map((c, i) => (
                      <li key={i} className="text-[10px] text-white/30 flex gap-2">
                        <span className="text-emerald-400/40 shrink-0">✓</span>
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-[10px] text-white/15 mt-2">Auto-attached to the promotion record.</p>
                </div>
              )}
              {formError && <p className="text-xs text-red-400/70 font-mono">{formError}</p>}
              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={submitting || !toStage}
                  className="rounded-lg border border-amber-400/20 bg-amber-400/8 px-4 py-2 text-xs font-mono uppercase tracking-wide text-amber-400/70 hover:border-amber-400/35 hover:text-amber-400/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  {submitting ? "Recording…" : "Record Promotion"}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setFormError(null); }}
                  className="rounded-lg border border-white/8 px-4 py-2 text-xs font-mono uppercase tracking-wide text-white/30 hover:text-white/50 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
        {formSuccess && (
          <p className="mt-2 text-xs text-emerald-400/70 font-mono">{formSuccess}</p>
        )}
      </div>

      {/* Promotion ledger */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-mono uppercase tracking-widest text-white/20">Promotion Ledger</p>
          {!loading && promotions.length > 0 && (
            <span className="text-[10px] font-mono text-white/15">
              {promotions.filter((p) => !p.rollbackAt).length} active ·{" "}
              {promotions.filter((p) => p.rollbackAt).length} rolled back
            </span>
          )}
        </div>

        {loading && <p className="text-xs text-white/25 font-mono animate-pulse">Loading promotions…</p>}
        {!loading && error && <p className="text-xs text-red-400/60 font-mono">{error}</p>}
        {!loading && !error && promotions.length === 0 && (
          <div className="rounded-xl border border-white/8 bg-white/[0.02] p-6 text-center">
            <p className="text-sm text-white/25">No promotions recorded yet.</p>
            <p className="text-xs text-white/15 mt-1">
              All governance events start at RESERVED_CONCEPT. Record a promotion to advance one stage.
            </p>
          </div>
        )}

        {!loading && promotions.length > 0 && (
          <div className="space-y-2">
            {promotions.map((p) => (
              <div
                key={p.id}
                className={`rounded-xl border p-4 transition-opacity ${
                  p.rollbackAt ? "border-white/5 bg-white/[0.01] opacity-55" : "border-white/8 bg-white/[0.02]"
                }`}
              >
                {/* Stage transition + date */}
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <StageChip stage={p.fromStage} />
                    <Arrow />
                    <StageChip stage={p.toStage} />
                    {p.rollbackAt && (
                      <span className="rounded px-1.5 py-0.5 text-[8px] font-mono uppercase bg-red-400/8 text-red-400/60 border border-red-400/15">
                        Rolled Back
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-white/15 shrink-0">
                    {new Date(p.approvedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>

                {/* Event + reason */}
                <p className="text-sm font-medium text-white/65 mb-1">{p.eventType}</p>
                <p className="text-xs text-white/35 leading-relaxed mb-2">{p.promotionReason}</p>

                {/* Meta */}
                <div className="flex flex-wrap gap-4 text-[10px] font-mono text-white/20">
                  <span>by {p.approvedBy}</span>
                  {p.researchRunId && (
                    <span>
                      evidence:{" "}
                      <Link
                        href={`/admin/intelligence-foundry/runs/${p.researchRunId}`}
                        className="text-amber-400/40 hover:text-amber-400/60 transition-colors"
                      >
                        {p.researchRunId.slice(0, 12)}…
                      </Link>
                    </span>
                  )}
                  <span>id: {p.id.slice(0, 12)}…</span>
                </div>

                {/* Criteria met */}
                {p.criteriaMetJson && (() => {
                  try {
                    const criteria = JSON.parse(p.criteriaMetJson) as string[];
                    if (!criteria.length) return null;
                    return (
                      <div className="mt-2 rounded bg-white/[0.02] px-2 py-1.5 border border-white/5">
                        <p className="text-[9px] font-mono uppercase text-white/15 mb-1">Criteria Met</p>
                        {criteria.map((c, i) => (
                          <p key={i} className="text-[10px] text-white/20 flex gap-1.5">
                            <span className="text-emerald-400/30">✓</span>{c}
                          </p>
                        ))}
                      </div>
                    );
                  } catch { return null; }
                })()}

                {/* Rollback UI */}
                <RollbackPanel
                  promotion={p}
                  onDone={handleRollbackDone}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Doctrine */}
      <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
        <p className="text-[10px] font-mono uppercase tracking-widest text-white/20 mb-2">Promotion Doctrine</p>
        <ul className="space-y-1.5">
          {[
            "One-step advances only: RESERVED_CONCEPT → SIMULATION_ONLY → PILOT_READY → LIVE_GOVERNED.",
            "A ResearchRun must exist as primary evidence. Simulation fixtures don't count for PILOT_READY → LIVE_GOVERNED.",
            "LIVE_GOVERNED is terminal — only RETIRED via separate archival workflow.",
            "Rollbacks are appended, not deleted. The original promotion record is always preserved.",
            "Nothing is GREEN on Product Health unless it is LIVE_GOVERNED with durable evidence.",
          ].map((item, i) => (
            <li key={i} className="flex gap-2 text-xs text-white/30">
              <span className="text-amber-400/40 shrink-0 mt-px">—</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 pt-3 border-t border-white/5 flex flex-wrap gap-4">
          <Link href="/admin/intelligence-foundry/runs" className="text-xs text-amber-400/50 hover:text-amber-400/70 transition-colors">
            Research Run Vault →
          </Link>
          <Link href="/admin/intelligence-foundry/product-health" className="text-xs text-white/25 hover:text-white/45 transition-colors">
            Product Health →
          </Link>
        </div>
      </div>
    </div>
  );
}


export default function PromotionWorkflowPage() {
  return (
    <Suspense fallback={<div className="p-6 text-xs text-white/30 animate-pulse">Loading…</div>}>
      <PromotionWorkflowInner />
    </Suspense>
  );
}
