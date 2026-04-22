/**
 * BLOCK 4 — COST (WITH VISIBLE MATH)
 * No black box. Shows inputs, formula, output.
 */

const GOLD = "#C9A96E";

export type CostCalculation = {
  inputs: Array<{ label: string; value: string }>;
  formula: string;
  result: string;
  explanation: string;
};

export default function ResultCost({ calc }: { calc: CostCalculation | null }) {
  if (!calc) return null;

  return (
    <div style={{
      border: `1px solid ${GOLD}20`,
      backgroundColor: `${GOLD}04`,
      padding: "1.25rem",
    }}>
      <div style={{
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        fontSize: "7px",
        letterSpacing: "0.32em",
        textTransform: "uppercase",
        color: `${GOLD}70`,
        marginBottom: "0.65rem",
      }}>
        Exposure calculation
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginBottom: "0.5rem" }}>
        {calc.inputs.map((input) => (
          <div key={input.label} style={{
            border: "1px solid rgba(255,255,255,0.06)",
            backgroundColor: "rgba(255,255,255,0.015)",
            padding: "0.4rem 0.65rem",
          }}>
            <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "5.5px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)" }}>
              {input.label}
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "9px", color: "rgba(255,255,255,0.60)", marginTop: "0.15rem" }}>
              {input.value}
            </div>
          </div>
        ))}
      </div>
      <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", color: "rgba(255,255,255,0.35)", marginBottom: "0.35rem" }}>
        {calc.formula}
      </div>
      <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "14px", letterSpacing: "0.04em", color: GOLD }}>
        {calc.result}
      </div>
      <p style={{
        marginTop: "0.4rem",
        fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
        fontWeight: 300,
        fontSize: "0.82rem",
        lineHeight: 1.5,
        color: "rgba(255,255,255,0.30)",
      }}>
        {calc.explanation}
      </p>
    </div>
  );
}
