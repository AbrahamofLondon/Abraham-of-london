import * as React from "react";
import type { PortfolioMemory } from "@/lib/product/portfolio-memory-surface";

const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };

const eyebrowStyle: React.CSSProperties = {
  ...mono,
  fontSize: "9px",
  letterSpacing: "0.20em",
  textTransform: "uppercase",
  color: "rgba(201,169,110,0.82)",
};

const metaStyle: React.CSSProperties = {
  ...mono,
  fontSize: "8px",
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "rgba(255,255,255,0.34)",
};

const cardStyle: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.02)",
  padding: "1rem",
};

function Stat({ label, value, note }: { label: string; value: string | number; note?: string }) {
  return (
    <article style={cardStyle}>
      <p style={eyebrowStyle}>{label}</p>
      <p className="mt-3 text-3xl text-white">{value}</p>
      {note && <p className="mt-3 text-sm leading-6 text-white/55">{note}</p>}
    </article>
  );
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Not available";
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toLocaleDateString("en-GB") : "Not available";
}

type Props = {
  data: PortfolioMemory;
};

export default function PortfolioMemorySummary({ data }: Props) {
  return (
    <div className="space-y-8">
      {/* Retained Scope Summary */}
      <section style={cardStyle}>
        <p style={eyebrowStyle}>Retained Scope Summary</p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <Stat label="Active cases" value={data.activeCases} />
          <Stat label="Completed stages" value={data.completedStages} />
          <Stat label="Retained scopes" value={data.retainedScopes.length} />
        </div>
        {data.retainedScopes.length > 0 && (
          <div className="mt-5 space-y-2">
            {data.retainedScopes.slice(0, 20).map((scope, index) => (
              <div key={`${scope.label}-${index}`} className="flex items-baseline gap-3">
                <span style={metaStyle}>{scope.status}</span>
                <span className="text-sm text-white/65">{scope.label}</span>
                <span style={metaStyle}>First captured · {formatDate(scope.firstCaptured)}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Pattern Memory */}
      <section style={cardStyle}>
        <p style={eyebrowStyle}>Pattern Memory</p>
        {data.recurringPatterns.length > 0 ? (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-white/55">Recurring patterns detected across diagnostic surfaces:</p>
            {data.recurringPatterns.map((pattern, index) => (
              <div key={`${pattern.pattern}-${index}`} className="border border-white/5 bg-black/20 p-3">
                <p className="text-sm text-white/70">{pattern.pattern}</p>
                <p style={metaStyle} className="mt-2">
                  {pattern.occurrences} occurrence{pattern.occurrences === 1 ? "" : "s"} · First seen {formatDate(pattern.firstSeen)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-white/45">No recurring patterns have been detected across current diagnostic evidence.</p>
        )}

        {data.contradictionClasses.length > 0 && (
          <div className="mt-6">
            <p style={{ ...eyebrowStyle, color: "rgba(255,255,255,0.45)" }}>Contradiction Classes</p>
            <div className="mt-3 space-y-2">
              {data.contradictionClasses.map((item, index) => (
                <div key={`${item.label}-${index}`} className="flex items-baseline gap-3">
                  <span
                    style={{
                      ...metaStyle,
                      color:
                        item.severity === "HIGH"
                          ? "rgba(220,120,100,0.85)"
                          : item.severity === "MEDIUM"
                            ? "rgba(201,169,110,0.75)"
                            : "rgba(255,255,255,0.34)",
                    }}
                  >
                    {item.severity}
                  </span>
                  <span className="text-sm text-white/60">{item.label}</span>
                  <span style={metaStyle}>{item.count} case{item.count === 1 ? "" : "s"}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Decision Velocity */}
      <section style={cardStyle}>
        <p style={eyebrowStyle}>Decision Velocity</p>
        {data.decisionVelocity ? (
          <div className="mt-4">
            <p className="text-white">{data.decisionVelocity.trend.replace(/_/g, " ")}</p>
            <p className="mt-2 text-sm text-white/55">
              Based on {data.decisionVelocity.dataPoints} data point{data.decisionVelocity.dataPoints === 1 ? "" : "s"}.
            </p>
            {data.decisionVelocity.thinState && (
              <p className="mt-3 text-sm italic text-white/40">
                Decision velocity trend requires at least 3 data points. Current analysis is provisional.
              </p>
            )}
          </div>
        ) : (
          <p className="mt-4 text-sm text-white/45">Insufficient data for trend analysis.</p>
        )}
        <p style={metaStyle} className="mt-4">Evidence posture · {data.evidencePosture}</p>
      </section>

      {/* Checkpoint Posture */}
      <section style={cardStyle}>
        <p style={eyebrowStyle}>Checkpoint Posture</p>
        <div className="mt-4 grid gap-4 md:grid-cols-4">
          <Stat label="Created" value={data.checkpointPosture.created} />
          <Stat label="Responded" value={data.checkpointPosture.responded} />
          <Stat label="Overdue" value={data.checkpointPosture.overdue} />
          <Stat label="Response rate" value={`${data.checkpointPosture.responseRate}%`} />
        </div>
      </section>

      {/* Institutional Memory */}
      <section style={cardStyle}>
        <p style={eyebrowStyle}>Institutional Memory</p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <Stat label="Counsel escalations" value={data.counselEscalations} note="Governed counsel events across the relationship." />
          <Stat label="Boardroom dossiers" value={data.boardroomDossiers} note="Board-level dossier records retained across cycles." />
          <Stat label="Retained outcomes" value={data.retainedOutcomes} note="Outcome verification records carried forward." />
        </div>
      </section>

      {/* Cadence Reliability */}
      {data.cadenceReliability && (
        <section style={cardStyle}>
          <p style={eyebrowStyle}>Cadence Reliability</p>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <Stat label="Completed cycles" value={data.cadenceReliability.completed} />
            <Stat label="Total cycles" value={data.cadenceReliability.total} />
            <Stat label="Reliability" value={`${data.cadenceReliability.reliability}%`} />
          </div>
        </section>
      )}

      {/* Suppression & Limitations */}
      <footer style={{ ...cardStyle, borderColor: "rgba(201,169,110,0.18)" }}>
        <p style={eyebrowStyle}>Disclosure Boundary</p>
        <p className="mt-3 text-sm leading-7 text-white/50">{data.suppressionNotice}</p>
        {data.sampleLimitation && (
          <p className="mt-2 text-sm italic leading-7 text-white/40">{data.sampleLimitation}</p>
        )}
        <p style={metaStyle} className="mt-4">
          Evidence posture · {data.evidencePosture} · Generated {formatDate(data.generatedAt)}
        </p>
      </footer>
    </div>
  );
}
