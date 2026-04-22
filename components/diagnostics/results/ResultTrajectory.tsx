/**
 * BLOCK 5 — TRAJECTORY
 * Time-bound consequences. 2-3 specific outcomes.
 */

export default function ResultTrajectory({ timeHorizon, consequences }: { timeHorizon: string; consequences: string[] }) {
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
        If unresolved &middot; {timeHorizon}
      </div>
      <div className="space-y-1.5">
        {consequences.map((c, i) => (
          <p key={i} style={{
            fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
            fontWeight: 300,
            fontSize: "0.85rem",
            lineHeight: 1.5,
            color: "rgba(252,165,165,0.50)",
          }}>
            {c}
          </p>
        ))}
      </div>
    </div>
  );
}
