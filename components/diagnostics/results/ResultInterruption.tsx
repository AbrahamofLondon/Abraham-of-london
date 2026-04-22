/**
 * BLOCK 1 — INTERRUPTION
 * 1 sentence. Challenges user assumption. No scores. No explanation.
 */
export default function ResultInterruption({ line }: { line: string }) {
  if (!line) return null;
  return (
    <div style={{ padding: "1.5rem 0", borderBottom: "1px solid rgba(252,165,165,0.15)" }}>
      <p style={{
        fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
        fontWeight: 300,
        fontSize: "clamp(1.3rem, 3vw, 1.8rem)",
        lineHeight: 1.15,
        color: "rgba(252,165,165,0.80)",
        fontStyle: "italic",
        maxWidth: "40ch",
      }}>
        {line}
      </p>
    </div>
  );
}
