import * as React from "react";

const GOLD = "#C9A96E";

const mono: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
};

const CURRENT_STATUS = [
  "Provider posture disclosed",
  "Cloudflare DNS boundary stated",
  "Sub-processors named",
  "Data handling stated",
  "Provenance boundary stated",
] as const;

const NOT_YET_COMPLETED = [
  "SOC 2",
  "ISO 27001",
  "Independent penetration test",
] as const;

export default function SecurityAssuranceStatusStrip() {
  return (
    <section
      style={{
        border: "1px solid rgba(255,255,255,0.08)",
        backgroundColor: "rgba(255,255,255,0.015)",
        padding: "1rem",
      }}
    >
      <p
        style={{
          ...mono,
          fontSize: "7px",
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: `${GOLD}88`,
          marginBottom: "0.75rem",
        }}
      >
        Security assurance status
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <p
            style={{
              ...mono,
              fontSize: "7px",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "rgba(110,231,183,0.68)",
              marginBottom: "0.5rem",
            }}
          >
            Current
          </p>
          <ul className="space-y-2 text-[15px] leading-6 text-white/60">
            {CURRENT_STATUS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div>
          <p
            style={{
              ...mono,
              fontSize: "7px",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: `${GOLD}AA`,
              marginBottom: "0.5rem",
            }}
          >
            Not yet completed
          </p>
          <ul className="space-y-2 text-[15px] leading-6 text-white/50">
            {NOT_YET_COMPLETED.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
