/**
 * BLOCK 7 — DECISION EXTRACTION
 * Must be explicit. Must come from user input.
 */

const GOLD = "#C9A96E";

export default function ResultDecision({ decision }: { decision: string }) {
  if (!decision) return null;

  return (
    <div style={{
      border: `1px solid ${GOLD}28`,
      backgroundColor: `${GOLD}06`,
      padding: "1.25rem",
    }}>
      <div style={{
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        fontSize: "7px",
        letterSpacing: "0.32em",
        textTransform: "uppercase",
        color: `${GOLD}80`,
        marginBottom: "0.4rem",
      }}>
        The decision you are avoiding
      </div>
      <p style={{
        fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
        fontWeight: 300,
        fontSize: "1.05rem",
        lineHeight: 1.5,
        color: "rgba(255,255,255,0.78)",
      }}>
        {decision}
      </p>
    </div>
  );
}
