/**
 * BLOCK 5 — TRAJECTORY
 * Time-bound consequences. Used for limited free warning, not priced escalation.
 */

export default function ResultTrajectory({
  timeHorizon,
  consequences,
  label = "If unresolved",
}: {
  timeHorizon: string;
  consequences: string[];
  label?: string;
}) {
  if (consequences.length === 0) return null;

  return (
    <div style={{ padding: "1rem 0" }}>
      <div style={{
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        fontSize: "7px",
        letterSpacing: "0.32em",
        textTransform: "uppercase",
        color: "rgba(252,165,165,0.45)",
        marginBottom: "0.5rem",
      }}>
        {label} &middot; {timeHorizon}
      </div>
      <div className="space-y-1.5">
        {consequences.map((c, i) => (
          <p key={i} style={{
            fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
            fontSize: "0.9rem",
            lineHeight: 1.7,
            color: "rgba(255,255,255,0.70)",
            maxWidth: "62ch",
          }}>
            {c}
          </p>
        ))}
      </div>
    </div>
  );
}
