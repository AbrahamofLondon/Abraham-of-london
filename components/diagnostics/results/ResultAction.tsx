/**
 * BLOCK 8 — ACTION (MANDATORY)
 * Executable immediately. Time + action + consequence.
 */

const AMBER = "#F59E0B";

export type ActionStep = {
  step: string;
  timeframe?: string;
};

export default function ResultAction({
  steps,
  consequence,
  title = "Immediate direction",
}: {
  steps: ActionStep[];
  consequence: string;
  title?: string;
}) {
  if (steps.length === 0) return null;

  return (
    <div style={{
      border: `1px solid ${AMBER}30`,
      backgroundColor: `${AMBER}06`,
      padding: "1.25rem",
    }}>
      <div style={{
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        fontSize: "7px",
        letterSpacing: "0.32em",
        textTransform: "uppercase",
        color: AMBER,
        marginBottom: "0.55rem",
      }}>
        {title}
      </div>
      {steps.map((s, i) => (
        <div key={i} className="flex items-start gap-2 py-1" style={{ borderBottom: i < steps.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
          <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", color: `${AMBER}80`, flexShrink: 0 }}>
            {String(i + 1).padStart(2, "0")}
          </span>
          <div>
            <span style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.88rem", lineHeight: 1.5, color: "rgba(255,255,255,0.65)" }}>
              {s.step}
            </span>
            {s.timeframe && (
              <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "6.5px", letterSpacing: "0.14em", color: "rgba(255,255,255,0.25)", marginLeft: "0.5rem" }}>
                {s.timeframe}
              </span>
            )}
          </div>
        </div>
      ))}
      {consequence && (
        <p style={{
          marginTop: "0.65rem",
          fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
          fontSize: "0.88rem",
          lineHeight: 1.7,
          color: "rgba(255,255,255,0.66)",
          maxWidth: "62ch",
        }}>
          If ignored: {consequence}
        </p>
      )}
    </div>
  );
}
