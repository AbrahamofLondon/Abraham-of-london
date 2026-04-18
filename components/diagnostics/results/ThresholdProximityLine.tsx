const GOLD = "#C9A96E";

export function thresholdProximityText({
  label,
  value,
  thresholdLabel,
  threshold,
  higherIsBetter = true,
}: {
  label: string;
  value: number;
  thresholdLabel: string;
  threshold: number;
  higherIsBetter?: boolean;
}): string {
  const current = Math.round(value);
  const target = Math.round(threshold);
  const delta = higherIsBetter ? current - target : target - current;
  const distance = Math.abs(delta);
  const relation = delta >= 0 ? "above" : "below";
  return `${label} at ${current}${label.toLowerCase().includes("gap") ? " pts" : "%"} — ${distance} point${distance === 1 ? "" : "s"} ${relation} ${thresholdLabel} threshold`;
}

export default function ThresholdProximityLine({
  text,
}: {
  text: string;
}) {
  return (
    <p
      style={{
        marginTop: "0.75rem",
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        fontSize: "7.5px",
        letterSpacing: "0.20em",
        textTransform: "uppercase",
        color: `${GOLD}B8`,
      }}
    >
      {text}
    </p>
  );
}
