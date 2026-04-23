/**
 * AvoidancePatternNotice — surfaces repeated avoidance from system memory.
 * Only renders when avoidanceCount >= 2. Lands psychologically before decision log.
 */

export default function AvoidancePatternNotice({ avoidanceCount, repeatedPatternLabel }: {
  avoidanceCount: number;
  repeatedPatternLabel?: string | null;
}) {
  if (avoidanceCount < 2) return null;

  return (
    <div style={{ border: "1px solid rgba(253,186,116,0.25)", backgroundColor: "rgba(253,186,116,0.04)", padding: "0.75rem 1rem" }}>
      <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(253,186,116,0.70)", fontWeight: 700 }}>
        This decision has been avoided {avoidanceCount} times.
      </div>
      <p style={{ marginTop: "0.2rem", fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.82rem", lineHeight: 1.5, color: "rgba(253,186,116,0.45)" }}>
        {avoidanceCount >= 3
          ? "The system is no longer treating this as isolated hesitation. The pattern is structural."
          : "The same avoidance pattern is repeating."}
      </p>
      {repeatedPatternLabel && (
        <div style={{ marginTop: "0.25rem", fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "6.5px", letterSpacing: "0.14em", color: "rgba(253,186,116,0.35)" }}>
          Pattern: {repeatedPatternLabel.replace(/_/g, " ")}
        </div>
      )}
    </div>
  );
}
