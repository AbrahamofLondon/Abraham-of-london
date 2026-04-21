"use client";

import React from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FunnelStage = { stage: string; sessions: number };
type DropOffEntry = { count: number; dropOff: number; dropOffRate: number };
type RevenueEntry = { path: string; revenue: number; count: number };

type DashboardData = {
  period: { from: string; to: string };
  funnel: FunnelStage[];
  dropOff: Record<string, DropOffEntry>;
  flagshipConversion: { rate: number; gateViews: number; purchases: number };
  evidenceCompletion: { rate: number; started: number; completed: number };
  escalationQualification: { rate: number; reports: number; qualified: number };
  buyerEfficiency: {
    avgSteps: number;
    avgTimeMs: number;
    totalPaths: number;
    pathDistribution: Record<string, number>;
  };
  revenueByPath: RevenueEntry[];
  strategyQualification: {
    allowed: number;
    blocked: number;
    attempted: number;
    ratio: number;
  };
};

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

function pct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

function msToTime(ms: number): string {
  if (ms < 60000) return `${Math.round(ms / 1000)}s`;
  if (ms < 3600000) return `${Math.round(ms / 60000)}m`;
  return `${(ms / 3600000).toFixed(1)}h`;
}

function stageLabel(stage: string): string {
  return stage
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ---------------------------------------------------------------------------
// Design tokens (matches admin pattern)
// ---------------------------------------------------------------------------

const GOLD = "#C9A96E";
const VOID = "rgb(6 6 9)";

const monoLabel: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
  fontSize: "8px",
  letterSpacing: "0.28em",
  textTransform: "uppercase",
  color: "rgba(255,255,255,0.35)",
};

const panelStyle: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.08)",
  backgroundColor: "rgba(255,255,255,0.02)",
  padding: "1.25rem",
};

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function MetricCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div style={panelStyle}>
      <div style={monoLabel}>{label}</div>
      <div
        style={{
          marginTop: "0.5rem",
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontSize: "1.5rem",
          fontWeight: 400,
          color: accent ? GOLD : "rgba(255,255,255,0.85)",
          letterSpacing: "-0.02em",
        }}
      >
        {value}
      </div>
      {sub && (
        <div
          style={{
            marginTop: "0.25rem",
            fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
            fontWeight: 300,
            fontSize: "0.85rem",
            color: "rgba(255,255,255,0.38)",
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

function FunnelBar({
  stage,
  sessions,
  maxSessions,
}: {
  stage: string;
  sessions: number;
  maxSessions: number;
}) {
  const width = maxSessions > 0 ? (sessions / maxSessions) * 100 : 0;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        padding: "0.5rem 0",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
      }}
    >
      <div
        style={{
          ...monoLabel,
          minWidth: "10rem",
          flexShrink: 0,
        }}
      >
        {stageLabel(stage)}
      </div>
      <div
        style={{
          flex: 1,
          height: "6px",
          backgroundColor: "rgba(255,255,255,0.04)",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            height: "100%",
            width: `${width}%`,
            backgroundColor: GOLD,
            opacity: 0.6,
            transition: "width 300ms ease",
          }}
        />
      </div>
      <div
        style={{
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontSize: "10px",
          color: "rgba(255,255,255,0.6)",
          minWidth: "3rem",
          textAlign: "right",
        }}
      >
        {sessions}
      </div>
    </div>
  );
}

function DropOffRow({
  stage,
  data,
}: {
  stage: string;
  data: DropOffEntry;
}) {
  const severity =
    data.dropOffRate > 0.5
      ? "rgba(252,165,165,0.70)"
      : data.dropOffRate > 0.3
        ? "rgba(253,186,116,0.70)"
        : "rgba(255,255,255,0.45)";

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "10rem 4rem 4rem 5rem",
        gap: "1rem",
        alignItems: "center",
        padding: "0.5rem 0",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
      }}
    >
      <span style={monoLabel}>{stageLabel(stage)}</span>
      <span
        style={{
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontSize: "10px",
          color: "rgba(255,255,255,0.6)",
          textAlign: "right",
        }}
      >
        {data.count}
      </span>
      <span
        style={{
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontSize: "10px",
          color: severity,
          textAlign: "right",
        }}
      >
        -{data.dropOff}
      </span>
      <span
        style={{
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontSize: "10px",
          color: severity,
          textAlign: "right",
        }}
      >
        {pct(data.dropOffRate)}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function DecisionIntelligencePage() {
  const [data, setData] = React.useState<DashboardData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetch("/api/admin/decision-intelligence")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch");
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div
        style={{
          backgroundColor: VOID,
          minHeight: "100vh",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={monoLabel}>Loading decision intelligence...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div
        style={{
          backgroundColor: VOID,
          minHeight: "100vh",
          color: "white",
          padding: "2rem",
        }}
      >
        <div style={{ ...monoLabel, color: "rgba(252,165,165,0.7)" }}>
          Error: {error ?? "No data"}
        </div>
      </div>
    );
  }

  const maxFunnel = Math.max(...data.funnel.map((f) => f.sessions), 1);

  return (
    <div
      style={{
        backgroundColor: VOID,
        minHeight: "100vh",
        color: "white",
      }}
    >
      <div
        style={{
          maxWidth: "72rem",
          margin: "0 auto",
          padding: "2rem 1.5rem",
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <div style={monoLabel}>Admin / Decision Intelligence</div>
          <h1
            style={{
              marginTop: "0.5rem",
              fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
              fontWeight: 300,
              fontSize: "1.8rem",
              color: "rgba(255,255,255,0.88)",
            }}
          >
            Decision Progression Dashboard
          </h1>
          <div
            style={{
              ...monoLabel,
              marginTop: "0.35rem",
              fontSize: "7px",
            }}
          >
            {new Date(data.period.from).toLocaleDateString()} &ndash;{" "}
            {new Date(data.period.to).toLocaleDateString()} &middot; 30 day
            window
          </div>
        </div>

        {/* ── 1. Key Metrics ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(14rem, 1fr))",
            gap: "0.75rem",
            marginBottom: "2rem",
          }}
        >
          <MetricCard
            label="Evidence Completion"
            value={pct(data.evidenceCompletion.rate)}
            sub={`${data.evidenceCompletion.started} started, ${data.evidenceCompletion.completed} reached enterprise`}
            accent
          />
          <MetricCard
            label="Flagship Conversion"
            value={pct(data.flagshipConversion.rate)}
            sub={`${data.flagshipConversion.gateViews} gate views, ${data.flagshipConversion.purchases} purchases`}
            accent
          />
          <MetricCard
            label="Escalation Qualification"
            value={pct(data.escalationQualification.rate)}
            sub={`${data.escalationQualification.reports} reports, ${data.escalationQualification.qualified} qualified`}
          />
          <MetricCard
            label="Avg Path to Purchase"
            value={`${data.buyerEfficiency.avgSteps} steps`}
            sub={`${msToTime(data.buyerEfficiency.avgTimeMs)} avg time, ${data.buyerEfficiency.totalPaths} paths`}
          />
        </div>

        {/* ── 2. Funnel Progression ── */}
        <div style={{ ...panelStyle, marginBottom: "1.5rem" }}>
          <div style={{ ...monoLabel, marginBottom: "1rem" }}>
            Funnel Progression (unique sessions)
          </div>
          {data.funnel.map((f) => (
            <FunnelBar
              key={f.stage}
              stage={f.stage}
              sessions={f.sessions}
              maxSessions={maxFunnel}
            />
          ))}
        </div>

        {/* ── 3. Drop-Off Heatmap ── */}
        <div style={{ ...panelStyle, marginBottom: "1.5rem" }}>
          <div style={{ ...monoLabel, marginBottom: "1rem" }}>
            Drop-Off Map
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "10rem 4rem 4rem 5rem",
              gap: "1rem",
              marginBottom: "0.5rem",
            }}
          >
            <span style={{ ...monoLabel, fontSize: "6.5px" }}>Stage</span>
            <span
              style={{ ...monoLabel, fontSize: "6.5px", textAlign: "right" }}
            >
              Count
            </span>
            <span
              style={{ ...monoLabel, fontSize: "6.5px", textAlign: "right" }}
            >
              Drop
            </span>
            <span
              style={{ ...monoLabel, fontSize: "6.5px", textAlign: "right" }}
            >
              Rate
            </span>
          </div>
          {Object.entries(data.dropOff).map(([stage, d]) => (
            <DropOffRow key={stage} stage={stage} data={d} />
          ))}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1rem",
            marginBottom: "1.5rem",
          }}
        >
          {/* ── 4. Strategy Room Qualification ── */}
          <div style={panelStyle}>
            <div style={{ ...monoLabel, marginBottom: "1rem" }}>
              Strategy Room Qualification
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: "0.5rem",
              }}
            >
              <div>
                <div style={{ ...monoLabel, fontSize: "6.5px" }}>
                  Attempted
                </div>
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "1.25rem",
                    color: "rgba(255,255,255,0.75)",
                    marginTop: "0.25rem",
                  }}
                >
                  {data.strategyQualification.attempted}
                </div>
              </div>
              <div>
                <div style={{ ...monoLabel, fontSize: "6.5px" }}>Allowed</div>
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "1.25rem",
                    color: "rgba(110,231,183,0.80)",
                    marginTop: "0.25rem",
                  }}
                >
                  {data.strategyQualification.allowed}
                </div>
              </div>
              <div>
                <div style={{ ...monoLabel, fontSize: "6.5px" }}>Blocked</div>
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "1.25rem",
                    color: "rgba(252,165,165,0.80)",
                    marginTop: "0.25rem",
                  }}
                >
                  {data.strategyQualification.blocked}
                </div>
              </div>
            </div>
            <div
              style={{
                marginTop: "0.75rem",
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "10px",
                color: GOLD,
              }}
            >
              Qualification ratio: {pct(data.strategyQualification.ratio)}
            </div>
          </div>

          {/* ── 5. Revenue Per Path ── */}
          <div style={panelStyle}>
            <div style={{ ...monoLabel, marginBottom: "1rem" }}>
              Revenue Per Path
            </div>
            {data.revenueByPath.length === 0 ? (
              <div
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                  fontWeight: 300,
                  fontSize: "0.9rem",
                  color: "rgba(255,255,255,0.32)",
                }}
              >
                No revenue data in period
              </div>
            ) : (
              data.revenueByPath.map((r) => (
                <div
                  key={r.path}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.4rem 0",
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                  }}
                >
                  <span style={monoLabel}>{stageLabel(r.path)}</span>
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: "10px",
                      color: GOLD,
                    }}
                  >
                    &pound;{r.revenue} ({r.count})
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Buyer Path Distribution ── */}
        {Object.keys(data.buyerEfficiency.pathDistribution).length > 0 && (
          <div style={{ ...panelStyle, marginBottom: "1.5rem" }}>
            <div style={{ ...monoLabel, marginBottom: "1rem" }}>
              Buyer Path Distribution
            </div>
            {Object.entries(data.buyerEfficiency.pathDistribution)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 10)
              .map(([path, count]) => (
                <div
                  key={path}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    padding: "0.5rem 0",
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                    gap: "1rem",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: "7px",
                      letterSpacing: "0.08em",
                      color: "rgba(255,255,255,0.45)",
                      lineHeight: 1.6,
                      wordBreak: "break-all",
                    }}
                  >
                    {path}
                  </span>
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: "10px",
                      color: "rgba(255,255,255,0.6)",
                      flexShrink: 0,
                    }}
                  >
                    {count}x
                  </span>
                </div>
              ))}
          </div>
        )}

        {/* Footer */}
        <div style={{ ...monoLabel, fontSize: "6.5px", paddingTop: "1rem" }}>
          Decision progression only &middot; No vanity metrics &middot; All
          values map to decision progression or revenue
        </div>
      </div>
    </div>
  );
}
