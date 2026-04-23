import type { EngagementReadiness } from "@/lib/diagnostics/prognosis";

const GOLD = "#C9A96E";

export default function EngagementReadinessPanel({
  readiness,
  title = "Engagement readiness assessment",
}: {
  readiness: EngagementReadiness;
  title?: string;
}) {
  const readinessColor =
    readiness.readinessPercent >= 70
      ? "rgba(110,231,183,0.80)"
      : readiness.readinessPercent >= 45
        ? `${GOLD}CC`
        : "rgba(252,165,165,0.80)";

  return (
    <div
      style={{
        border: `1px solid ${GOLD}18`,
        backgroundColor: `${GOLD}06`,
      }}
    >
      <div
        style={{
          padding: "0.85rem 1.25rem",
          borderBottom: `1px solid ${GOLD}10`,
        }}
      >
        <div
          style={{
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontSize: "7px",
            letterSpacing: "0.34em",
            textTransform: "uppercase",
            color: `${GOLD}90`,
          }}
        >
          {title}
        </div>
      </div>

      <div style={{ padding: "1rem 1.25rem" }}>
        <div className="grid gap-4 md:grid-cols-2">
          <Metric
            label="Engagement readiness"
            value={`${readiness.readinessPercent}%`}
            color={readinessColor}
          />
          <Metric
            label="Advisory value estimate"
            value={readiness.advisoryValueFormatted}
          />
          <Metric
            label="Decision velocity"
            value={`${readiness.decisionVelocityDays} days`}
          />
          <Metric
            label="Signal intent"
            value={readiness.intent}
          />
        </div>

        <div
          style={{
            marginTop: "1rem",
            padding: "0.85rem 1rem",
            border: `1px solid ${readinessColor}25`,
            backgroundColor: `${readinessColor}08`,
          }}
        >
          <div
            style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "7px",
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: readinessColor,
              marginBottom: "0.4rem",
            }}
          >
            Required action
          </div>
          <p
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
              fontWeight: 300,
              fontSize: "0.95rem",
              lineHeight: 1.55,
              color: "rgba(255,255,255,0.62)",
            }}
          >
            {readiness.nextActionLabel}
          </p>
        </div>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,0.06)",
        backgroundColor: "rgba(255,255,255,0.02)",
        padding: "0.75rem 1rem",
      }}
    >
      <div
        style={{
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontSize: "6.5px",
          letterSpacing: "0.26em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.24)",
          marginBottom: "0.35rem",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontSize: "10px",
          letterSpacing: "0.12em",
          color: color ?? "rgba(255,255,255,0.68)",
        }}
      >
        {value}
      </div>
    </div>
  );
}
