import * as React from "react";
import Head from "next/head";
import Link from "next/link";

import Layout from "@/components/Layout";
import { track } from "@/lib/analytics/track";

// ─── Design tokens ────────────────────────────────────────────────────────────

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
  fontWeight: 300,
};

// ─── Session data shape ───────────────────────────────────────────────────────

type DiagnosticSummary = {
  decision: string | null;
  band: string | null;
  score: number | null;
  consequence: string | null;
  pattern: string | null;
  recommendedMove: string | null;
  provenanceHash: string | null;
  completedSurfaces: string[];
};

function loadDiagnosticSummary(): DiagnosticSummary {
  const result: DiagnosticSummary = {
    decision: null,
    band: null,
    score: null,
    consequence: null,
    pattern: null,
    recommendedMove: null,
    provenanceHash: null,
    completedSurfaces: [],
  };

  try {
    const checks = [
      { key: "aol_fast_result", label: "Fast Diagnostic" },
      { key: "purpose-alignment-result", label: "Purpose Alignment" },
      { key: "team-assessment-result", label: "Team Assessment" },
      { key: "enterprise-assessment-result", label: "Enterprise Assessment" },
    ];
    for (const c of checks) {
      if (sessionStorage.getItem(c.key)) result.completedSurfaces.push(c.label);
    }

    const fast = sessionStorage.getItem("aol_fast_result");
    if (fast) {
      const parsed = JSON.parse(fast) as Record<string, unknown>;
      const stateRaw = localStorage.getItem("aol-fast-assessment-state");
      const answers = stateRaw
        ? ((JSON.parse(stateRaw) as Record<string, unknown>)?.data as Record<string, unknown>)?.answers ?? {}
        : {};

      result.decision =
        (answers as Record<string, string>).decision ||
        (parsed?.synthesis as Record<string, string> | undefined)?.avoidedDecision ||
        null;
      result.band =
        (parsed?.conditionLabel as string | undefined) ||
        (parsed?.condition as string | undefined) ||
        null;
      result.score = typeof parsed?.score === "number" ? parsed.score : null;
      result.consequence =
        (answers as Record<string, string>).consequence ||
        (parsed?.synthesis as Record<string, string> | undefined)?.defaultPathForecast ||
        null;
      result.pattern =
        (parsed?.anchorNarrative as Record<string, string> | undefined)?.pattern ||
        null;
      result.recommendedMove =
        (parsed?.requiredMove as string | undefined) ||
        (parsed?.primaryRecommendation as string | undefined) ||
        null;
      result.provenanceHash =
        (parsed?.provenanceHash as string | undefined) || null;
    }

    const enterprise = sessionStorage.getItem("enterprise-assessment-result");
    if (enterprise) {
      const parsed = JSON.parse(enterprise) as Record<string, unknown>;
      if (!result.decision) result.decision = (parsed?.recentDecision as string | undefined) ?? null;
      if (!result.band) result.band = (parsed?.band as string | undefined) ?? null;
      if (!result.consequence)
        result.consequence =
          (parsed?.primaryReading as string | undefined) ||
          (parsed?.dominantFailure as string | undefined) ||
          null;
      if (!result.provenanceHash)
        result.provenanceHash = (parsed?.provenanceHash as string | undefined) ?? null;
    }

    const purpose = sessionStorage.getItem("purpose-alignment-result");
    if (purpose) {
      const parsed = JSON.parse(purpose) as Record<string, unknown>;
      if (!result.pattern)
        result.pattern =
          (parsed?.primaryPattern as string | undefined) ||
          (parsed?.anchorNarrative as Record<string, string> | undefined)?.pattern ||
          null;
      if (!result.band) result.band = (parsed?.conditionLabel as string | undefined) ?? null;
    }

    const team = sessionStorage.getItem("team-assessment-result");
    if (team) {
      const parsed = JSON.parse(team) as Record<string, unknown>;
      if (!result.pattern)
        result.pattern =
          (parsed?.patternTitle as string | undefined) ||
          (parsed?.evidenceCapture as Record<string, string> | undefined)?.recurrenceSignal ||
          null;
    }
  } catch { /* degrade gracefully */ }

  return result;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        ...mono,
        fontSize: "7px",
        letterSpacing: "0.28em",
        textTransform: "uppercase",
        color: `${GOLD}70`,
        marginBottom: "16px",
      }}
    >
      {children}
    </p>
  );
}

function GoldRule() {
  return (
    <div
      style={{
        height: "1px",
        background: `linear-gradient(90deg, transparent 0%, ${GOLD}28 20%, ${GOLD}28 80%, transparent 100%)`,
        margin: "48px 0",
      }}
    />
  );
}

function HashDisplay({ hash }: { hash: string }) {
  const [copied, setCopied] = React.useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(hash).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }).catch(() => { /* clipboard unavailable */ });
  }

  const short = hash.length > 18 ? `${hash.slice(0, 12)}…${hash.slice(-6)}` : hash;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
      <span
        style={{
          ...mono,
          fontSize: "10px",
          letterSpacing: "0.10em",
          color: `${GOLD}CC`,
        }}
        title={hash}
      >
        {short}
      </span>
      <button
        type="button"
        onClick={handleCopy}
        style={{
          ...mono,
          fontSize: "7px",
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: copied ? "#6EE7B7" : "rgba(255,255,255,0.28)",
          background: "none",
          border: "1px solid rgba(255,255,255,0.10)",
          padding: "3px 8px",
          cursor: "pointer",
        }}
      >
        {copied ? "Copied" : "Copy full hash"}
      </button>
    </div>
  );
}

// ─── No-data state ────────────────────────────────────────────────────────────

function NoDataState() {
  return (
    <div
      style={{
        border: `1px solid ${GOLD}18`,
        backgroundColor: `${GOLD}05`,
        padding: "32px",
        marginTop: "40px",
      }}
    >
      <p
        style={{
          ...serif,
          fontSize: "17px",
          lineHeight: 1.75,
          color: "rgba(255,255,255,0.60)",
          marginBottom: "20px",
        }}
      >
        No diagnostic evidence is available in this session. Complete the Fast Diagnostic first
        to generate a board summary.
      </p>
      <Link
        href="/diagnostics/fast"
        style={{
          display: "inline-block",
          padding: "12px 24px",
          border: `1px solid ${GOLD}40`,
          backgroundColor: `${GOLD}10`,
          color: `${GOLD}CC`,
          textDecoration: "none",
          ...mono,
          fontSize: "8px",
          letterSpacing: "0.20em",
          textTransform: "uppercase",
          minHeight: "44px",
        }}
      >
        Start Fast Diagnostic
      </Link>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BoardSummaryPage() {
  const [summary, setSummary] = React.useState<DiagnosticSummary | null>(null);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    track("board_summary_page_view", {
      has_session_data: Boolean(
        sessionStorage.getItem("aol_fast_result") ||
        sessionStorage.getItem("enterprise-assessment-result"),
      ),
    });
    setSummary(loadDiagnosticSummary());
    setLoaded(true);
  }, []);

  const hasData = loaded && (summary?.decision || summary?.band || summary?.consequence);
  const today = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <Layout
      title="Board Summary | Abraham of London"
      description="A board-ready summary of diagnostic findings, consequence exposure, and recommended next move."
      canonicalUrl="/diagnostics/board-summary"
    >
      <Head>
        <meta name="robots" content="noindex,nofollow" />
        <style>{`
          @media print {
            header, footer, nav, [data-no-print] { display: none !important; }
            body { background: white !important; color: black !important; }
            main { padding-top: 0 !important; }
          }
        `}</style>
      </Head>

      <main
        style={{
          backgroundColor: "#030305",
          minHeight: "100vh",
          color: "#F5F5F5",
          paddingTop: "120px",
          paddingBottom: "96px",
        }}
      >
        <div style={{ maxWidth: "680px", margin: "0 auto", padding: "0 24px" }}>

          {/* ─── Header ─────────────────────────────────────────────────── */}
          <div style={{ marginBottom: "40px" }}>
            <p
              style={{
                ...mono,
                fontSize: "7px",
                letterSpacing: "0.30em",
                textTransform: "uppercase",
                color: `${GOLD}70`,
                marginBottom: "20px",
              }}
            >
              Diagnostics · Board Summary
            </p>
            <h1
              style={{
                ...serif,
                fontSize: "clamp(28px, 5vw, 44px)",
                lineHeight: 1.1,
                color: "#F5F5F5",
                marginBottom: "12px",
              }}
            >
              Board summary preview
            </h1>
            <p
              style={{
                ...mono,
                fontSize: "8px",
                letterSpacing: "0.14em",
                color: "rgba(255,255,255,0.28)",
              }}
            >
              Prepared: {today}
            </p>
          </div>

          {/* ─── Print button ────────────────────────────────────────────── */}
          <div data-no-print style={{ marginBottom: "40px" }}>
            <button
              type="button"
              onClick={() => window.print()}
              style={{
                ...mono,
                fontSize: "8px",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.40)",
                background: "none",
                border: "1px solid rgba(255,255,255,0.12)",
                padding: "10px 18px",
                cursor: "pointer",
                minHeight: "44px",
              }}
            >
              Print / Save as PDF
            </button>
          </div>

          <GoldRule />

          {/* ─── No data state ───────────────────────────────────────────── */}
          {!loaded && (
            <p style={{ ...serif, color: "rgba(255,255,255,0.38)", fontSize: "16px" }}>
              Loading diagnostic evidence…
            </p>
          )}

          {loaded && !hasData && <NoDataState />}

          {/* ─── Summary content ─────────────────────────────────────────── */}
          {loaded && hasData && summary && (
            <div>

              {/* 1. Finding */}
              <section style={{ marginBottom: "48px" }}>
                <SectionLabel>1. Decision finding</SectionLabel>
                {summary.decision ? (
                  <>
                    <p
                      style={{
                        ...serif,
                        fontSize: "17px",
                        lineHeight: 1.75,
                        color: "rgba(255,255,255,0.55)",
                      }}
                    >
                      The decision currently deferred:
                    </p>
                    <blockquote
                      style={{
                        borderLeft: `2px solid ${GOLD}35`,
                        paddingLeft: "20px",
                        margin: "14px 0 0 0",
                      }}
                    >
                      <p
                        style={{
                          ...serif,
                          fontSize: "18px",
                          lineHeight: 1.65,
                          color: "#EAEAEA",
                          fontStyle: "italic",
                        }}
                      >
                        &ldquo;{summary.decision}&rdquo;
                      </p>
                    </blockquote>
                  </>
                ) : (
                  <p
                    style={{
                      ...serif,
                      fontSize: "16px",
                      lineHeight: 1.7,
                      color: "rgba(255,255,255,0.45)",
                    }}
                  >
                    No decision has been named in the current session. Complete the Fast Diagnostic
                    to identify the avoided decision.
                  </p>
                )}
              </section>

              {/* 2. Score / Band */}
              {(summary.band || summary.score !== null) && (
                <>
                  <GoldRule />
                  <section style={{ marginBottom: "48px" }}>
                    <SectionLabel>2. Condition band</SectionLabel>
                    <div
                      style={{
                        border: `1px solid ${GOLD}20`,
                        backgroundColor: `${GOLD}06`,
                        padding: "24px",
                        display: "inline-block",
                        minWidth: "200px",
                      }}
                    >
                      {summary.band && (
                        <p
                          style={{
                            ...mono,
                            fontSize: "11px",
                            letterSpacing: "0.14em",
                            textTransform: "uppercase",
                            color: `${GOLD}CC`,
                          }}
                        >
                          {summary.band}
                        </p>
                      )}
                      {summary.score !== null && (
                        <p
                          style={{
                            ...mono,
                            fontSize: "9px",
                            letterSpacing: "0.12em",
                            color: "rgba(255,255,255,0.40)",
                            marginTop: "6px",
                          }}
                        >
                          Score: {summary.score}
                        </p>
                      )}
                    </div>
                    {summary.pattern && (
                      <p
                        style={{
                          ...serif,
                          fontSize: "15px",
                          lineHeight: 1.7,
                          color: "rgba(255,255,255,0.55)",
                          marginTop: "16px",
                        }}
                      >
                        Pattern: {summary.pattern}
                      </p>
                    )}
                  </section>
                </>
              )}

              {/* 3. Consequence exposure */}
              {summary.consequence && (
                <>
                  <GoldRule />
                  <section style={{ marginBottom: "48px" }}>
                    <SectionLabel>3. Consequence exposure</SectionLabel>
                    <div style={{ display: "grid", gap: "20px" }}>
                      <div style={{ borderLeft: `2px solid ${GOLD}30`, paddingLeft: "18px" }}>
                        <p
                          style={{
                            ...mono,
                            fontSize: "8px",
                            letterSpacing: "0.20em",
                            textTransform: "uppercase",
                            color: `${GOLD}80`,
                          }}
                        >
                          30 days
                        </p>
                        <p
                          style={{
                            ...serif,
                            fontSize: "16px",
                            lineHeight: 1.75,
                            color: "rgba(255,255,255,0.62)",
                            marginTop: "6px",
                          }}
                        >
                          The same constraint remains active. Workarounds are replacing structure.
                        </p>
                      </div>
                      <div style={{ borderLeft: `2px solid ${GOLD}45`, paddingLeft: "18px" }}>
                        <p
                          style={{
                            ...mono,
                            fontSize: "8px",
                            letterSpacing: "0.20em",
                            textTransform: "uppercase",
                            color: `${GOLD}80`,
                          }}
                        >
                          60 days
                        </p>
                        <p
                          style={{
                            ...serif,
                            fontSize: "16px",
                            lineHeight: 1.75,
                            color: "rgba(255,255,255,0.62)",
                            marginTop: "6px",
                          }}
                        >
                          {summary.consequence}
                        </p>
                      </div>
                      <div style={{ borderLeft: `2px solid ${GOLD}65`, paddingLeft: "18px" }}>
                        <p
                          style={{
                            ...mono,
                            fontSize: "8px",
                            letterSpacing: "0.20em",
                            textTransform: "uppercase",
                            color: `${GOLD}80`,
                          }}
                        >
                          90 days
                        </p>
                        <p
                          style={{
                            ...serif,
                            fontSize: "16px",
                            lineHeight: 1.75,
                            color: "rgba(255,255,255,0.62)",
                            marginTop: "6px",
                          }}
                        >
                          The decision will be forced under worse conditions. The cost of delay
                          will have transferred from revenue to structural damage.
                        </p>
                      </div>
                    </div>
                    <p
                      style={{
                        ...mono,
                        fontSize: "7px",
                        letterSpacing: "0.12em",
                        color: "rgba(255,255,255,0.22)",
                        marginTop: "16px",
                        lineHeight: 1.65,
                      }}
                    >
                      Consequence exposure is scenario framing derived from diagnostic evidence.
                      It is not a financial forecast.
                    </p>
                  </section>
                </>
              )}

              {/* 4. Recommended next move */}
              <GoldRule />
              <section style={{ marginBottom: "48px" }}>
                <SectionLabel>4. Recommended next move</SectionLabel>
                <p
                  style={{
                    ...serif,
                    fontSize: "17px",
                    lineHeight: 1.75,
                    color: "rgba(255,255,255,0.72)",
                  }}
                >
                  {summary.recommendedMove ||
                    "Name the decision, assign a single owner, and set a resolution date. " +
                    "Use the Fast Diagnostic to identify the structural blocker and what evidence is required to close it."}
                </p>
                <Link
                  href="/diagnostics/fast"
                  data-no-print
                  style={{
                    display: "inline-block",
                    marginTop: "20px",
                    padding: "12px 24px",
                    backgroundColor: GOLD,
                    color: "#0B0B0B",
                    textDecoration: "none",
                    ...mono,
                    fontSize: "8px",
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    fontWeight: 600,
                    minHeight: "44px",
                  }}
                >
                  Run Fast Diagnostic →
                </Link>
              </section>

              {/* 5. Evidence surface ladder */}
              {summary.completedSurfaces.length > 0 && (
                <>
                  <GoldRule />
                  <section style={{ marginBottom: "48px" }}>
                    <SectionLabel>Evidence sources</SectionLabel>
                    <div style={{ display: "grid", gap: "8px" }}>
                      {summary.completedSurfaces.map((surface) => (
                        <div
                          key={surface}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            padding: "8px 0",
                            borderBottom: "1px solid rgba(255,255,255,0.04)",
                          }}
                        >
                          <span style={{ ...mono, fontSize: "7px", color: `${GOLD}80` }}>✓</span>
                          <span style={{ ...serif, fontSize: "15px", color: "rgba(255,255,255,0.68)" }}>
                            {surface}
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>
                </>
              )}

              {/* 6. Provenance / hash */}
              {summary.provenanceHash && (
                <>
                  <GoldRule />
                  <section style={{ marginBottom: "48px" }}>
                    <SectionLabel>Provenance record</SectionLabel>
                    <p
                      style={{
                        ...serif,
                        fontSize: "15px",
                        lineHeight: 1.7,
                        color: "rgba(255,255,255,0.55)",
                        marginBottom: "14px",
                      }}
                    >
                      This diagnostic session has a provenance record. The hash below identifies
                      the integrity of the evidence captured at the time of assessment.
                    </p>
                    <HashDisplay hash={summary.provenanceHash} />
                    <p
                      style={{
                        ...mono,
                        fontSize: "7px",
                        letterSpacing: "0.12em",
                        color: "rgba(255,255,255,0.22)",
                        marginTop: "10px",
                        lineHeight: 1.65,
                      }}
                    >
                      Internal review notes, suppression details, and actor identities are not
                      included in this view.
                    </p>
                  </section>
                </>
              )}

              {/* 7. Scenario disclaimer */}
              <GoldRule />
              <section>
                <p
                  style={{
                    ...mono,
                    fontSize: "7px",
                    letterSpacing: "0.12em",
                    color: "rgba(255,255,255,0.22)",
                    lineHeight: 1.75,
                  }}
                >
                  This board summary is a scenario preview derived from evidence captured
                  during the diagnostic session. It does not constitute financial advice, a legal
                  opinion, or an audited assessment. Consequence exposure is scenario framing only.
                  Evidence confidence levels reflect user-reported and system-inferred data. This
                  document should be validated against current information before board presentation.
                </p>
              </section>

            </div>
          )}

          <GoldRule />

          {/* ─── Navigation ─────────────────────────────────────────────── */}
          <nav data-no-print>
            <Link
              href="/diagnostics"
              style={{
                ...mono,
                fontSize: "8px",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.30)",
                textDecoration: "none",
              }}
            >
              ← Return to diagnostic ladder
            </Link>
          </nav>

        </div>
      </main>
    </Layout>
  );
}
