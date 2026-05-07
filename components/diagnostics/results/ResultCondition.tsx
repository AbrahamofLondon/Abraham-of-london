/**
 * BLOCK 2 — CONDITION
 * Named condition from condition classification. Visually dominant. Not generic severity.
 */

const GOLD = "#C9A96E";

export default function ResultCondition({ name, definition }: { name: string; definition: string }) {
  return (
    <div style={{ padding: "1.25rem 0" }}>
      <div style={{
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        fontSize: "6.5px",
        letterSpacing: "0.32em",
        textTransform: "uppercase",
        color: `${GOLD}70`,
        marginBottom: "0.35rem",
      }}>
        Primary condition
      </div>
      <h2 style={{
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        fontSize: "clamp(0.9rem, 2vw, 1.2rem)",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: "rgba(255,255,255,0.90)",
        fontWeight: 700,
      }}>
        {name}
      </h2>
      <p style={{
        marginTop: "0.5rem",
        fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
        fontSize: "0.95rem",
        lineHeight: 1.8,
        color: "rgba(255,255,255,0.74)",
        maxWidth: "62ch",
      }}>
        {definition}
      </p>
    </div>
  );
}
