/**
 * DecisionStateBanner — shows current decision state clearly and early.
 * System instrumentation, not content.
 */

const STATE_CONFIG: Record<string, { label: string; message: string; border: string; bg: string; text: string }> = {
  PENDING: {
    label: "Execution not complete",
    message: "The required decision is active but not yet executed.",
    border: "rgba(201,169,110,0.25)", bg: "rgba(201,169,110,0.04)", text: "rgba(201,169,110,0.80)",
  },
  EXECUTED: {
    label: "Execution progressing",
    message: "The system has recorded movement against the required decision.",
    border: "rgba(110,231,183,0.25)", bg: "rgba(110,231,183,0.04)", text: "rgba(110,231,183,0.80)",
  },
  BLOCKED: {
    label: "Execution blocked",
    message: "A blocking condition is now preventing forward movement.",
    border: "rgba(253,186,116,0.30)", bg: "rgba(253,186,116,0.04)", text: "rgba(253,186,116,0.80)",
  },
  ESCALATED: {
    label: "System escalation in effect",
    message: "The system has escalated because execution conditions were not met.",
    border: "rgba(252,165,165,0.35)", bg: "rgba(252,165,165,0.05)", text: "rgba(252,165,165,0.85)",
  },
  FAILED: {
    label: "Execution failure",
    message: "The decision has not progressed within governed limits. Intervention state has failed.",
    border: "rgba(252,100,100,0.35)", bg: "rgba(252,100,100,0.06)", text: "rgba(252,100,100,0.85)",
  },
};

export default function DecisionStateBanner({ state }: { state: string; escalationLevel?: number }) {
  const config = STATE_CONFIG[state] ?? STATE_CONFIG.PENDING!;
  return (
    <div style={{ border: `1px solid ${config.border}`, backgroundColor: config.bg, padding: "0.75rem 1rem" }}>
      <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", letterSpacing: "0.22em", textTransform: "uppercase", color: config.text, fontWeight: 700 }}>
        {config.label}
      </div>
      <p style={{ marginTop: "0.2rem", fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.82rem", lineHeight: 1.5, color: "rgba(255,255,255,0.38)" }}>
        {config.message}
      </p>
    </div>
  );
}
