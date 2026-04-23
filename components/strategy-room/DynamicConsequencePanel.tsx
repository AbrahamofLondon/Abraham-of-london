/**
 * DynamicConsequencePanel — shows exposure changing based on user behaviour.
 * Number + delta + breakdown. No long explanation.
 */

const GOLD = "#C9A96E";

type Props = {
  currentExposure: number;
  previousExposure?: number | null;
  baseRisk?: number | null;
  timePenalty?: number | null;
  failurePenalty?: number | null;
};

export default function DynamicConsequencePanel({ currentExposure, previousExposure, baseRisk, timePenalty, failurePenalty }: Props) {
  if (currentExposure <= 0) return null;

  const delta = previousExposure != null ? currentExposure - previousExposure : null;
  const deltaFormatted = delta != null && delta !== 0
    ? `${delta > 0 ? "+" : ""}${Math.round(delta)} since last review`
    : null;

  return (
    <div style={{ border: `1px solid ${GOLD}22`, backgroundColor: `${GOLD}04`, padding: "0.85rem 1rem" }}>
      <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.32em", textTransform: "uppercase", color: `${GOLD}70` }}>
        Current exposure
      </div>
      <div className="mt-1 flex items-baseline gap-3">
        <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "18px", letterSpacing: "0.02em", color: GOLD }}>
          {Math.round(currentExposure)}
        </span>
        {deltaFormatted && (
          <span style={{
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontSize: "8px",
            color: delta! > 0 ? "rgba(252,165,165,0.65)" : "rgba(110,231,183,0.65)",
          }}>
            {deltaFormatted}
          </span>
        )}
      </div>
      {(baseRisk != null || timePenalty != null || failurePenalty != null) && (
        <div className="mt-2 flex gap-3">
          {[
            { label: "Base risk", value: baseRisk },
            { label: "Time penalty", value: timePenalty },
            { label: "Failure penalty", value: failurePenalty },
          ].filter((r) => r.value != null).map((r) => (
            <div key={r.label}>
              <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "5.5px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.20)" }}>{r.label}</span>
              <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "9px", color: "rgba(255,255,255,0.45)", marginTop: "0.1rem" }}>{Math.round(r.value!)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
