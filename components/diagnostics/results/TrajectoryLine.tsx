import { TRAJECTORY_LABELS, TRAJECTORY_COLORS, type Trajectory } from "@/lib/diagnostics/prognosis";

const GOLD = "#C9A96E";

export default function TrajectoryLine({ trajectory }: { trajectory: Trajectory }) {
  const color = TRAJECTORY_COLORS[trajectory];
  const label = TRAJECTORY_LABELS[trajectory];

  return (
    <div
      style={{
        marginTop: "0.85rem",
        padding: "0.85rem 1.25rem",
        border: `1px solid ${color}30`,
        backgroundColor: `${color}08`,
      }}
    >
      <div className="flex items-center gap-3">
        <div
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            backgroundColor: color,
            flexShrink: 0,
          }}
        />
        <div>
          <div
            style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "7.5px",
              letterSpacing: "0.30em",
              textTransform: "uppercase",
              color,
            }}
          >
            Trajectory: {trajectory}
          </div>
          <p
            style={{
              marginTop: "0.3rem",
              fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
              fontWeight: 300,
              fontSize: "0.92rem",
              lineHeight: 1.55,
              color: "rgba(255,255,255,0.50)",
            }}
          >
            {label}
          </p>
        </div>
      </div>
    </div>
  );
}
