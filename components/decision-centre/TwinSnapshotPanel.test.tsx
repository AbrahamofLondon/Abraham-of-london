// @vitest-environment jsdom
/**
 * components/decision-centre/TwinSnapshotPanel.test.tsx
 *
 * OPP-14 render proof (local jsdom, no running app): the Decision Centre surface
 * renders the governed twin read model — populated, empty, and denied states — with
 * provenance visible and no raw internal fields. Twin built through the real spine.
 */

import "@testing-library/jest-dom";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TwinSnapshotPanel } from "./TwinSnapshotPanel";
import { buildTwinSnapshotView } from "@/lib/intelligence/compounding/decision-centre-intelligence";
import { createInMemoryInteractionStore, recordProductInteraction, getStrategicTwin, type SpineDeps } from "@/lib/intelligence/interaction-spine/product-interaction-spine";

function seededView() {
  const d: SpineDeps = { store: createInMemoryInteractionStore(), isCanonicalProduct: (p) => p === "execution_integrity_protocol", now: () => "2026-07-07T00:00:00Z" };
  const base = { tenantId: "tA", caseId: "c1", productCode: "execution_integrity_protocol", interactionType: "playbook_run", actorType: "organisation" as const, provenance: { sourceSurface: "s" } };
  recordProductInteraction(d, { ...base, idempotencyKey: "i1", structuredResult: { summary: "r", contradictions: [{ key: "supply_dependency", severity: "HIGH" }], commitments: [{ key: "k1", statement: "reduce single-supplier dependency", owner: "COO", deadline: "2026-09-30" }], evidenceGaps: [{ key: "supplier_exposure" }] } });
  recordProductInteraction(d, { ...base, idempotencyKey: "i2", structuredResult: { summary: "r2", contradictions: [{ key: "supply_dependency", severity: "HIGH" }] } }); // recur
  return buildTwinSnapshotView(getStrategicTwin(d, "tA", "c1")!, "tA");
}

describe("TwinSnapshotPanel (OPP-14 render)", () => {
  it("renders the populated twin with commitments, contradictions, noticed, and provenance", () => {
    render(<TwinSnapshotPanel view={seededView()} />);
    expect(screen.getByTestId("dc-twin")).toBeInTheDocument();
    expect(screen.getByText(/reduce single-supplier dependency/)).toBeInTheDocument();
    expect(screen.getByText(/supply_dependency ×2/)).toBeInTheDocument();
    expect(screen.getByText(/recurred 2 times/)).toBeInTheDocument();
    expect(screen.getByTestId("dc-provenance")).toHaveTextContent(/strategic_twin/);
    // no raw internal reasoning field leaked
    expect(screen.queryByText(/reasoning|chain-of-thought/i)).toBeNull();
  });

  it("renders an empty state when there is no twin", () => {
    render(<TwinSnapshotPanel view={null} />);
    expect(screen.getByTestId("dc-empty")).toBeInTheDocument();
  });

  it("renders a denied state (ownership enforced upstream)", () => {
    render(<TwinSnapshotPanel view={null} deniedReason="OWNERSHIP_DENIED" />);
    expect(screen.getByTestId("dc-denied")).toBeInTheDocument();
    expect(screen.queryByTestId("dc-twin")).toBeNull();
  });
});
