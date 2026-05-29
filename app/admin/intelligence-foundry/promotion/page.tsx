// app/admin/intelligence-foundry/promotion/page.tsx
// Promotion Workflow — deliberate, evidenced maturity stage transitions.
// Records FoundryPromotion decisions for governance events and product surfaces.
// Only one-step-at-a-time advances are allowed (RESERVED_CONCEPT → SIMULATION_ONLY etc.)

"use client";

import * as React from "react";
import Link from "next/link";

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
  createdAt: string;
};

const MATURITY_ORDER = [
  "RESERVED_CONCEPT",
  "SIMULATION_ONLY",
  "PILOT_READY",
  "LIVE_GOVERNED",
] as const;

const STAGE_STYLES: Record<string, { label: string; color: string; bg: string; border: string }> = {
  RESERVED_CONCEPT: { label: "Reserved",      color: "text-white/35",       bg: "bg-white/5",           border: "border-white/8" },
  SIMULATION_ONLY:  { label: "Simulation",     color: "text-purple-400/70",  bg: "bg-purple-500/8",      border: "border-purple-500/15" },
  PILOT_READY:      { label: "Pilot Ready",    color: "text-violet-400/80",  bg: "bg-violet-500/8",      border: "border-violet-500/15" },
  LIVE_GOVERNED:    { label: "Live Governed",  color: "text-emerald-400/85", bg: "bg-emerald-500/8",     border: "border-emerald-500/15" },
};

const STAGE_CHIP = ({ stage }: { stage: string }) => {
  const s = STAGE_STYLES[stage] ?? { label: stage, color: "text-white/30", bg: "bg-white/5", border: "border-white/8" };
  return (
    <span className={`rounded px-1.5 py-0.5 text-[8px] font-mono uppercase tracking-wider ${s.bg} ${s.color} border ${s.border}`}>
      {s.label}
    </span>
  );
};

const ARROW = () => (
  <span className="text-white/20 font-mono text-xs mx-1">→</span>
);

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

export default function PromotionWorkflowPage() {
  const [promotions, setPromotions] = React.useState<PromotionRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Form state
  const [showForm, setShowForm] = React.useState(false);
  const [eventType, setEventType] = React.useState("");
  const [fromStage, setFromStage] = React.useState<typeof MATURITY_ORDER[number]>("RESERVED_CONCEPT");
  const [approvedBy, setApprovedBy] = React.useState("");
  const [promotionReason, setPromotionReason] = React.useState("");
  const [researchRunId, setResearchRunId] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [formSuccess, setFormSuccess] = React.useState<string | null>(null);

  const toStage = nextStage(fromStage);

  React.useEffect(() => {
    fetch("/api/admin/intelligence-foundry/promotion")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setPromotions(data.promotions);
        else setError(data.error ?? "Failed to load promotions");
      })
      .catch(() => setError("Network error"))
      .finally(() => setLoading(false));
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
          criteriaMet:     (EXAMPLE_CRITERIA[`${fromStage}→${toStage}`] ?? []),
        }),
      });
      const data = await res.json();

      if (!data.ok) {
        const errMsg = typeof data.error === "object" && data.error !== null
          ? `${data.error.type}: ${JSON.stringify(data.error)}`
          : String(data.error ?? "Promotion failed");
        setFormError(errMsg);
      } else {
        setFormSuccess(`Promotion created: ${data.promotion?.id}`);
        setPromotions((prev) => [data.promotion, ...prev]);
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
          one maturity stage at a time. Promotions are append-only — roll back by recording a
          rollback, not by deleting.
        </p>
      </div>

      {/* Stage ladder reminder */}
      <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
        <p className="text-[10px] font-mono uppercase tracking-widest text-white/20 mb-3">Maturity Ladder</p>
        <div className="flex items-center gap-2 flex-wrap">
          {MATURITY_ORDER.map((stage, i) => (
            <React.Fragment key={stage}>
              <STAGE_CHIP stage={stage} />
              {i < MATURITY_ORDER.length - 1 && <ARROW />}
            </React.Fragment>
          ))}
        </div>
        <p className="text-[10px] font-mono text-white/15 mt-2">
          Only one-step advances allowed. LIVE_GOVERNED is terminal. RETIRED is not a promotion target.
        </p>
      </div>

      {/* Record promotion button */}
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
              {/* Event type */}
              <div>
                <label className="block text-[10px] font-mono uppercase text-white/20 mb-1">
                  Event / Surface Type *
                </label>
                <input
                  required
                  type="text"
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  placeholder="e.g. GMI_WEEKLY_BRIEF or FAST_DIAGNOSTIC_SURFACE"
                  className="w-full rounded-lg border border-white/8 bg-white/2 px-3 py-2 text-sm text-white/60 placeholder:text-white/15 focus:outline-none focus:border-white/20 font-mono"
                />
              </div>

              {/* From stage */}
              <div>
                <label className="block text-[10px] font-mono uppercase text-white/20 mb-1">
                  Current Stage (from) *
                </label>
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

              {/* To stage (derived) */}
              <div>
                <label className="block text-[10px] font-mono uppercase text-white/20 mb-1">
                  Target Stage (to)
                </label>
                <div className="rounded-lg border border-white/8 bg-white/[0.02] px-3 py-2 flex items-center gap-2">
                  <STAGE_CHIP stage={fromStage} />
                  <ARROW />
                  {toStage ? <STAGE_CHIP stage={toStage} /> : <span className="text-red-400/60 text-xs font-mono">No valid next stage</span>}
                </div>
              </div>

              {/* Approved by */}
              <div>
                <label className="block text-[10px] font-mono uppercase text-white/20 mb-1">
                  Approved By (email) *
                </label>
                <input
                  required
                  type="email"
                  value={approvedBy}
                  onChange={(e) => setApprovedBy(e.target.value)}
                  placeholder="operator@example.com"
                  className="w-full rounded-lg border border-white/8 bg-white/2 px-3 py-2 text-sm text-white/60 placeholder:text-white/15 focus:outline-none focus:border-white/20 font-mono"
                />
              </div>

              {/* Promotion reason */}
              <div>
                <label className="block text-[10px] font-mono uppercase text-white/20 mb-1">
                  Promotion Reason *
                </label>
                <textarea
                  required
                  value={promotionReason}
                  onChange={(e) => setPromotionReason(e.target.value)}
                  placeholder="Why is this surface ready to advance? What evidence exists? What was the decision?"
                  rows={3}
                  className="w-full rounded-lg border border-white/8 bg-white/2 px-3 py-2 text-sm text-white/60 placeholder:text-white/15 focus:outline-none focus:border-white/20 resize-y"
                />
              </div>

              {/* Research run ID */}
              <div>
                <label className="block text-[10px] font-mono uppercase text-white/20 mb-1">
                  Evidence ResearchRun ID (optional)
                </label>
                <input
                  type="text"
                  value={researchRunId}
                  onChange={(e) => setResearchRunId(e.target.value)}
                  placeholder="cuid of the ResearchRun that serves as evidence"
                  className="w-full rounded-lg border border-white/8 bg-white/2 px-3 py-2 text-sm text-white/60 placeholder:text-white/15 focus:outline-none focus:border-white/20 font-mono text-xs"
                />
              </div>

              {/* Example criteria for this transition */}
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
                  <p className="text-[10px] text-white/15 mt-2">
                    These criteria will be auto-attached to the promotion record.
                  </p>
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
        <p className="text-[10px] font-mono uppercase tracking-widest text-white/20 mb-3">Promotion Ledger</p>

        {loading && (
          <p className="text-xs text-white/25 font-mono">Loading promotions…</p>
        )}
        {!loading && error && (
          <p className="text-xs text-red-400/60 font-mono">{error}</p>
        )}
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
                className={`rounded-xl border p-4 ${p.rollbackAt ? "border-white/5 bg-white/[0.01] opacity-60" : "border-white/8 bg-white/[0.02]"}`}
              >
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <STAGE_CHIP stage={p.fromStage} />
                    <ARROW />
                    <STAGE_CHIP stage={p.toStage} />
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

                <p className="text-sm font-medium text-white/65 mb-1">{p.eventType}</p>
                <p className="text-xs text-white/35 leading-relaxed mb-2">{p.promotionReason}</p>

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

                {p.criteriaMetJson && (() => {
                  try {
                    const criteria = JSON.parse(p.criteriaMetJson) as string[];
                    if (criteria.length === 0) return null;
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

                {p.rollbackAt && p.rollbackReason && (
                  <div className="mt-2 rounded bg-red-400/[0.04] px-2 py-1.5 border border-red-400/10">
                    <p className="text-[9px] font-mono uppercase text-red-400/40 mb-0.5">Rollback Reason</p>
                    <p className="text-[10px] text-red-400/40">{p.rollbackReason}</p>
                    <p className="text-[9px] text-white/15 mt-0.5">
                      {new Date(p.rollbackAt).toLocaleDateString("en-GB")}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Doctrine note */}
      <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
        <p className="text-[10px] font-mono uppercase tracking-widest text-white/20 mb-2">
          Promotion Doctrine
        </p>
        <ul className="space-y-1.5">
          {[
            "Promotions are one stage at a time. No jumps. RESERVED_CONCEPT → SIMULATION_ONLY → PILOT_READY → LIVE_GOVERNED.",
            "A ResearchRun must exist as evidence before promotion. Simulations don't count for PILOT_READY → LIVE_GOVERNED.",
            "LIVE_GOVERNED is terminal. Nothing promotes out of it — it can only be RETIRED via a separate archival workflow.",
            "Rollbacks are recorded, not deleted. The ledger is append-only.",
            "Nothing is labelled GREEN on the Product Health Dashboard unless it is LIVE_GOVERNED.",
          ].map((item, i) => (
            <li key={i} className="flex gap-2 text-xs text-white/30">
              <span className="text-amber-400/40 shrink-0 mt-px">—</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
