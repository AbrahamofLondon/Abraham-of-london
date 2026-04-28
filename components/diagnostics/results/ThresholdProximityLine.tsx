const GOLD = "#C9A96E";

export function boundaryProximityText({
  label,
  value,
  boundaryLabel,
  boundary,
  higherIsBetter = true,
}: {
  label: string;
  value: number;
  boundaryLabel: string;
  boundary: number;
  higherIsBetter?: boolean;
}): string {
  const current = Math.round(value);
  const target = Math.round(boundary);
  const delta = higherIsBetter ? current - target : target - current;
  const distance = Math.abs(delta);
  const relation = delta >= 0 ? "above" : "below";
  return `${label} at ${current}${label.toLowerCase().includes("gap") ? " pts" : "%"} — ${distance} point${distance === 1 ? "" : "s"} ${relation} the ${boundaryLabel} review point`;
}

export default function BoundaryProximityLine({
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
