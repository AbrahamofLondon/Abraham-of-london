/**
 * components/product/TrialExpiredCaseSelection.tsx
 *
 * Visible post-trial downgrade experience.
 */

import * as React from "react";
import Link from "next/link";

import type { TrialExpiryResolutionState } from "@/lib/product/trial-expiry-service";
import { trackCommercialEvent } from "@/lib/product/commercial-analytics";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

type Props = {
  state: TrialExpiryResolutionState;
  onResolved: (state: TrialExpiryResolutionState) => void;
};

export default function TrialExpiredCaseSelection({ state, onResolved }: Props) {
  const [selected, setSelected] = React.useState<string[]>(state.activeCaseIds);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    trackCommercialEvent("trial_expired", "decision_centre", { actionType: "trial_expiry" });
  }, []);

  function toggleCase(caseId: string) {
    setSelected((current) => {
      if (current.includes(caseId)) return current.filter((id) => id !== caseId);
      if (current.length >= state.maxActiveCases) return current;
      return [...current, caseId];
    });
  }

  async function saveSelection() {
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/trial/resolve-expiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedCaseIds: selected }),
      });
      const data = await response.json() as {
        ok?: boolean;
        state?: TrialExpiryResolutionState;
        error?: string;
      };
      if (!response.ok || !data.ok || !data.state) {
        throw new Error(data.error ?? "Could not update active cases.");
      }
      const archivedCount = data.state.cases.filter((item) => item.status === "ARCHIVED").length;
      if (archivedCount > 0) {
        trackCommercialEvent("case_archived_after_trial", "decision_centre", { actionType: "trial_expiry" });
      }
      onResolved(data.state);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update active cases.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section
      style={{
        border: `1px solid ${GOLD}28`,
        backgroundColor: `${GOLD}05`,
        padding: "20px",
        marginBottom: "20px",
      }}
    >
      <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}AA`, marginBottom: "8px" }}>
        Professional trial expired
      </p>
      <h2 style={{ ...serif, fontSize: "1.15rem", lineHeight: 1.3, color: "rgba(255,255,255,0.88)", marginBottom: "10px" }}>
        Choose the {state.maxActiveCases} cases that remain active on the free tier.
      </h2>
      <p style={{ fontSize: "13px", lineHeight: 1.7, color: "rgba(255,255,255,0.52)", marginBottom: "14px" }}>
        Your existing records remain readable. Cases not kept active become archived and read-only unless you upgrade again.
        {state.autoResolved ? " We kept your most recently updated cases active as a safe default." : ""}
      </p>

      <div style={{ display: "grid", gap: "8px", marginBottom: "16px" }}>
        {state.cases.map((item) => {
          const checked = selected.includes(item.caseId);
          return (
            <label
              key={item.caseId}
              style={{
                display: "flex",
                gap: "10px",
                alignItems: "flex-start",
                border: checked ? `1px solid ${GOLD}35` : "1px solid rgba(255,255,255,0.06)",
                backgroundColor: checked ? `${GOLD}08` : "rgba(255,255,255,0.015)",
                padding: "10px 12px",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggleCase(item.caseId)}
                style={{ marginTop: "3px" }}
              />
              <span>
                <span style={{ display: "block", fontSize: "13px", lineHeight: 1.5, color: "rgba(255,255,255,0.72)" }}>
                  {item.title}
                </span>
                <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.10em", textTransform: "uppercase", color: "rgba(255,255,255,0.24)" }}>
                  {item.status.replace(/_/g, " ").toLowerCase()} · updated {new Date(item.updatedAt).toLocaleDateString("en-GB")}
                </span>
              </span>
            </label>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
        <button
          type="button"
          onClick={saveSelection}
          disabled={saving || selected.length === 0}
          style={{
            ...mono,
            fontSize: "8px",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: saving || selected.length === 0 ? "rgba(255,255,255,0.25)" : "#0A0A0A",
            backgroundColor: saving || selected.length === 0 ? "rgba(255,255,255,0.08)" : GOLD,
            padding: "10px 16px",
            border: "none",
            cursor: saving || selected.length === 0 ? "not-allowed" : "pointer",
          }}
        >
          {saving ? "Saving..." : "Keep selected active"}
        </button>
        <Link
          href="/pricing"
          onClick={() => trackCommercialEvent("pricing_viewed_from_prompt", "decision_centre", { actionType: "trial_expiry" })}
          style={{
            ...mono,
            fontSize: "8px",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: `${GOLD}AA`,
            border: `1px solid ${GOLD}28`,
            padding: "10px 16px",
            textDecoration: "none",
          }}
        >
          Upgrade to keep all active
        </Link>
        <button
          type="button"
          onClick={() => {
            trackCommercialEvent("trial_declined", "decision_centre", { actionType: "trial_expiry" });
            void saveSelection();
          }}
          style={{
            ...mono,
            fontSize: "8px",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.38)",
            border: "1px solid rgba(255,255,255,0.08)",
            background: "transparent",
            padding: "10px 16px",
            cursor: "pointer",
          }}
        >
          Continue free
        </button>
      </div>

      {error && (
        <p style={{ marginTop: "10px", fontSize: "11px", lineHeight: 1.5, color: "rgba(252,165,165,0.72)" }}>
          {error}
        </p>
      )}
    </section>
  );
}
