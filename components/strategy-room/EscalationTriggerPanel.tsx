/**
 * EscalationTriggerPanel — shows exactly why escalation occurred or will occur.
 * Only renders when triggers exist. System instrumentation.
 */

type Trigger = { triggerType: string; message: string; createdAt?: string };

export default function EscalationTriggerPanel({ triggers }: { triggers: Trigger[] }) {
  if (triggers.length === 0) return null;

  return (
    <div style={{ border: "1px solid rgba(252,165,165,0.22)", backgroundColor: "rgba(252,165,165,0.03)", padding: "0.85rem 1rem" }}>
      <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.32em", textTransform: "uppercase", color: "rgba(252,165,165,0.55)", marginBottom: "0.5rem" }}>
        Escalation triggers
      </div>
      {triggers.map((t, i) => (
        <div key={i} className="flex items-start gap-2 py-1" style={{ borderBottom: i < triggers.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
          <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "6.5px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(252,165,165,0.45)", flexShrink: 0, marginTop: "2px" }}>
            {t.triggerType.replace(/_/g, " ")}
          </span>
          <span style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.82rem", lineHeight: 1.5, color: "rgba(252,165,165,0.50)" }}>
            {t.message}
          </span>
        </div>
      ))}
    </div>
  );
}
