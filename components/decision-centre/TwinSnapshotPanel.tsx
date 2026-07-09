/**
 * components/decision-centre/TwinSnapshotPanel.tsx
 *
 * OPP-14 — the customer-visible Decision Centre surface over the governed twin read
 * model (buildTwinSnapshotView). Pure presentational component: it renders only the
 * evidence-backed fields the read model exposes (no raw internal reasoning, no data
 * fetching, no auth — ownership/tenant isolation is enforced upstream by
 * buildTwinSnapshotView before the view reaches this component).
 */

import * as React from "react";
import type { TwinSnapshotView } from "@/lib/intelligence/compounding/decision-centre-intelligence";

function Section({ title, items }: { title: string; items: React.ReactNode[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <h3>{title}</h3>
      <ul>{items.map((n, i) => <li key={i}>{n}</li>)}</ul>
    </div>
  );
}

export function TwinSnapshotPanel({ view, deniedReason }: { view: TwinSnapshotView | null; deniedReason?: string }) {
  if (deniedReason) {
    return <div data-testid="dc-denied" role="alert">This decision twin is not available to you.</div>;
  }
  if (!view) {
    return <div data-testid="dc-empty">No decision history yet — complete a governed run to begin your compounding decision twin.</div>;
  }
  return (
    <section data-testid="dc-twin" aria-label="Decision twin snapshot">
      <header data-testid="dc-header">Decision Twin — v{view.twinVersion} · updated {view.updatedAt}</header>
      <Section title="Current commitments" items={view.currentCommitments.map((c) => `${c.statement} — ${c.owner ?? "unowned"}${c.deadline ? ` (due ${c.deadline})` : ""}`)} />
      <Section title="Active contradictions" items={view.activeContradictions.map((c) => `${c.key} ×${c.count}${c.severity ? ` [${c.severity}]` : ""}`)} />
      <Section title="Repeated signals" items={view.repeatedSignals.map((s) => `${s.key} ×${s.count}${s.trend ? ` (${s.trend})` : ""}`)} />
      <Section title="Evidence gaps" items={view.evidenceGaps.map((g) => g.key)} />
      <Section title="What the system noticed" items={view.whatTheSystemNoticed} />
      <Section title="What remains uncertain" items={view.whatRemainsUncertain} />
      <footer data-testid="dc-provenance">
        Next: {view.nextCheckpointHint} · source: {view.provenance.source} (twin v{view.provenance.twinVersion})
      </footer>
    </section>
  );
}

export default TwinSnapshotPanel;
