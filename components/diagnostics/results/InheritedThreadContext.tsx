import type { ConstitutionalThread } from "@/lib/diagnostics/session-thread";
import { getJourneySummary, getStageDeltaSummary } from "@/lib/diagnostics/session-thread";

const GOLD = "#C9A96E";

export default function InheritedThreadContext({
  thread,
  title = "Inherited constitutional context",
}: {
  thread: ConstitutionalThread;
  title?: string;
}) {
  const journeyLines = getJourneySummary(thread);
  const deltaLines = getStageDeltaSummary(thread);
  const hasAccumulated = !!(thread.teamFindings || thread.enterpriseFindings || thread.executiveFindings);

  return (
    <div
      style={{
        border: `1px solid ${GOLD}18`,
        backgroundColor: `${GOLD}06`,
        padding: "1.25rem 1.5rem",
      }}
    >
      <div
        style={{
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontSize: "7px",
          letterSpacing: "0.34em",
          textTransform: "uppercase",
          color: `${GOLD}90`,
          marginBottom: "0.85rem",
        }}
      >
        {title}
      </div>
      <p
        style={{
          fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
          fontWeight: 300,
          fontSize: "0.98rem",
          lineHeight: 1.65,
          color: "rgba(255,255,255,0.66)",
          marginBottom: "0.9rem",
        }}
      >
        {thread.summary.narrative}
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        <Metric label="Route" value={thread.route} />
        <Metric label="Readiness" value={thread.readinessTier} />
        <Metric label="Authority" value={thread.authorityType} />
        <Metric label="Posture" value={thread.posture} />
      </div>

      {deltaLines.length > 0 && (
        <div style={{ marginTop: "0.9rem", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "0.9rem" }}>
          <div
            style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "6.5px",
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: `${GOLD}70`,
              marginBottom: "0.65rem",
            }}
          >
            Diagnostic progression
          </div>
          <ul style={{ display: "flex", flexDirection: "column", gap: "0.38rem", margin: 0, paddingLeft: "1rem" }}>
            {deltaLines.map((line) => (
              <li
                key={line}
                style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "7.5px",
                  lineHeight: 1.55,
                  color: "rgba(255,255,255,0.50)",
                  letterSpacing: "0.08em",
                }}
              >
                {line}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Accumulated downstream findings */}
      {hasAccumulated && (
        <div style={{ marginTop: "0.9rem", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "0.9rem" }}>
          <div
            style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "6.5px",
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: `${GOLD}70`,
              marginBottom: "0.65rem",
            }}
          >
            Accumulated journey context
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            {journeyLines.map((line, i) => (
              <div
                key={i}
                style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "7.5px",
                  lineHeight: 1.55,
                  color: "rgba(255,255,255,0.48)",
                  letterSpacing: "0.08em",
                }}
              >
                {line}
              </div>
            ))}
          </div>
        </div>
      )}

      <p
        style={{
          marginTop: "0.9rem",
          fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
          fontWeight: 300,
          fontSize: "0.92rem",
          lineHeight: 1.6,
          color: "rgba(255,255,255,0.44)",
          fontStyle: "italic",
        }}
      >
        {thread.summary.whatThisStageTests}
      </p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,0.06)",
        backgroundColor: "rgba(255,255,255,0.02)",
        padding: "0.85rem 1rem",
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
          fontSize: "8px",
          letterSpacing: "0.12em",
          color: "rgba(255,255,255,0.68)",
        }}
      >
        {value}
      </div>
    </div>
  );
}
