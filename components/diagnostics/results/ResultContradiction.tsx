/**
 * BLOCK 3 — CONTRADICTION
 * The headline finding. Score vs reality. Free-text vs behaviour.
 * Must reference user input directly.
 */

export type ContradictionEvidence = {
  scoreLabel: string;
  scoreValue: string;
  textEvidence: string;
  contradictionType: string;
};

export default function ResultContradiction({ evidence }: { evidence: ContradictionEvidence[] }) {
  if (evidence.length === 0) return null;

  return (
    <div style={{
      border: "1px solid rgba(252,165,165,0.18)",
      backgroundColor: "rgba(252,165,165,0.03)",
      padding: "1.25rem",
    }}>
      <div style={{
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        fontSize: "7px",
        letterSpacing: "0.32em",
        textTransform: "uppercase",
        color: "rgba(252,165,165,0.55)",
        marginBottom: "0.65rem",
      }}>
        Evidence from your answers
      </div>
      {evidence.map((e, i) => (
        <div key={i} style={{ marginBottom: i < evidence.length - 1 ? "0.75rem" : 0 }}>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "baseline", flexWrap: "wrap" }}>
            <span style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "8px",
              color: "rgba(255,255,255,0.62)",
            }}>
              {e.scoreLabel}: {e.scoreValue}
            </span>
            <span style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "7px",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "rgba(252,165,165,0.58)",
            }}>
              {e.contradictionType.replace(/_/g, " ")}
            </span>
          </div>
          <p style={{
            marginTop: "0.25rem",
            fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
            fontSize: "0.92rem",
            lineHeight: 1.75,
            color: "rgba(255,255,255,0.78)",
            maxWidth: "62ch",
          }}>
            {e.textEvidence}
          </p>
        </div>
      ))}
    </div>
  );
}
