import * as React from "react";
import Head from "next/head";
import Link from "next/link";

import Layout from "@/components/Layout";
import SaveSessionCasePanel from "@/components/product/SaveSessionCasePanel";
import { track } from "@/lib/analytics/track";
import BoardSummaryPreview, {
  buildBoardSummaryFromSessionStorage,
  type BoardSummaryData,
} from "@/components/diagnostics/BoardSummaryPreview";
import { buildBoardSummaryCarryForwardPayload } from "@/lib/product/session-case-continuity";

// ─── Design tokens ────────────────────────────────────────────────────────────

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
  fontWeight: 300,
};

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
  const [data, setData] = React.useState<BoardSummaryData | null>(null);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    const summary = buildBoardSummaryFromSessionStorage();
    track("board_summary_page_view", {
      has_session_data: summary !== null,
      source_label: summary?.sourceLabel ?? "none",
    });
    setData(summary);
    setLoaded(true);
  }, []);

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

          {/* ─── Page header ────────────────────────────────────────────── */}
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
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "6px",
                marginBottom: "16px",
              }}
            >
              <span
                style={{
                  ...mono,
                  fontSize: "7px",
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: `${GOLD}99`,
                  border: `1px solid ${GOLD}30`,
                  padding: "2px 8px",
                }}
              >
                Free preview
              </span>
              <span
                style={{
                  ...mono,
                  fontSize: "7px",
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.30)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  padding: "2px 8px",
                }}
              >
                Session-derived
              </span>
              <span
                style={{
                  ...mono,
                  fontSize: "7px",
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.30)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  padding: "2px 8px",
                }}
              >
                Not a retained governed record
              </span>
            </div>
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
                ...serif,
                fontSize: "15px",
                lineHeight: 1.65,
                color: "rgba(255,255,255,0.40)",
                marginBottom: "12px",
              }}
            >
              This board summary is generated from available diagnostic evidence in this browser session. It does not create a new governed record; the live case continues in the Decision Centre.
            </p>
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

          <div
            style={{
              height: "1px",
              background: `linear-gradient(90deg, transparent 0%, ${GOLD}28 20%, ${GOLD}28 80%, transparent 100%)`,
              marginBottom: "40px",
            }}
          />

          {/* ─── Content ────────────────────────────────────────────────── */}
          {!loaded && (
            <p style={{ ...serif, color: "rgba(255,255,255,0.38)", fontSize: "16px" }}>
              Loading diagnostic evidence…
            </p>
          )}

          {loaded && !data && <NoDataState />}

          {loaded && data && <BoardSummaryPreview data={data} />}

          {loaded && data && (
            <div data-no-print style={{ marginTop: "20px" }}>
              <SaveSessionCasePanel
                payload={buildBoardSummaryCarryForwardPayload(data)}
                copy="This is a session-derived preview. Save or continue in Decision Centre to preserve the case record."
              />
            </div>
          )}

          {/* ─── Navigation ─────────────────────────────────────────────── */}
          <div
            data-no-print
            style={{
              height: "1px",
              background: `linear-gradient(90deg, transparent 0%, ${GOLD}28 20%, ${GOLD}28 80%, transparent 100%)`,
              margin: "48px 0 32px",
            }}
          />
          <nav data-no-print style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <Link
              href="/decision-centre"
              style={{
                ...mono,
                fontSize: "9px",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "#C9A96E",
                textDecoration: "none",
                fontWeight: 600,
                border: `1px solid ${GOLD}40`,
                backgroundColor: `${GOLD}08`,
                padding: "10px 18px",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                alignSelf: "flex-start",
              }}
            >
              → Continue in Decision Centre
            </Link>
            <Link
              href="/diagnostics/executive-reporting"
              style={{
                ...mono,
                fontSize: "8px",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.40)",
                textDecoration: "none",
                padding: "6px 0",
              }}
            >
              Review Executive Reporting →
            </Link>
            <Link
              href="/diagnostics"
              style={{
                ...mono,
                fontSize: "8px",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.25)",
                textDecoration: "none",
                padding: "6px 0",
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
