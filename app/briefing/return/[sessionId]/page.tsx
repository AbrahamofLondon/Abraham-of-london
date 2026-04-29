"use client";

/**
 * Return Brief — private briefing that makes inaction visible.
 *
 * Styled as a document, not an app screen.
 * Same visual system as Executive Report: 680px, left-aligned, document authority.
 */

import * as React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

type ReturnBriefData = {
  sessionId: string;
  generatedAt: string;
  trigger: string;
  opening: string;
  trajectory: { state: string; reason: string };
  contradiction: { decision: string; constraint: string; status: string } | null;
  outcomeEvidence: {
    processedDecisionCases: number;
    improvedPercent: number;
    failureRateWhenIgnored: number;
    averageTimeToImprovementDays: number | null;
    confidence: string;
    statements: string[];
  } | null;
  delta: { clarity: string; authority: string; readiness: string } | null;
  challenge: string;
  retainerTriggered: boolean;
};

export default function ReturnBriefPage() {
  const params = useParams();
  const sessionId = params?.sessionId as string;
  const [brief, setBrief] = React.useState<ReturnBriefData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [noBrief, setNoBrief] = React.useState(false);

  React.useEffect(() => {
    if (!sessionId) return;
    fetch(`/api/strategy-room/briefing/return/${sessionId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && data.briefAvailable) {
          setBrief(data.brief);
        } else {
          setNoBrief(true);
        }
      })
      .catch(() => setNoBrief(true))
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (loading) {
    return (
      <div style={{ backgroundColor: "#0B0B0B", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "14px" }}>Loading briefing...</p>
      </div>
    );
  }

  if (noBrief || !brief) {
    return (
      <div style={{ backgroundColor: "#0B0B0B", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "15px" }}>No return brief is warranted at this time.</p>
          <Link href="/strategy-room" style={{ color: "#C9A96E", fontSize: "13px", marginTop: "16px", display: "inline-block", textDecoration: "none" }}>
            Return to Strategy Room
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main style={{ backgroundColor: "#0B0B0B", minHeight: "100vh", color: "#F5F5F5" }}>
      <div style={{ maxWidth: "680px", margin: "0 auto", padding: "96px 24px 96px" }}>

        {/* ═══ 1. OPENING ═══ */}
        <div style={{ paddingBottom: "64px" }}>
          <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase", color: "#555", marginBottom: "24px" }}>
            Return Brief
          </p>
          <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 500, fontSize: "clamp(28px, 4vw, 40px)", lineHeight: 1.15, color: "#F5F5F5" }}>
            {brief.opening}
          </h1>
        </div>

        {/* ═══ 2. TRAJECTORY SNAPSHOT ═══ */}
        <div style={{ paddingBottom: "64px" }}>
          <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase", color: "#555", marginBottom: "8px" }}>
            Current trajectory
          </p>
          <p style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 500, fontSize: "24px", color: brief.trajectory.state === "DETERIORATING" ? "rgba(252,165,165,0.80)" : brief.trajectory.state === "FRAGILE" ? "#C9A96E" : "rgba(110,231,183,0.70)" }}>
            {brief.trajectory.state}
          </p>
          <p style={{ fontSize: "15px", lineHeight: 1.75, color: "rgba(255,255,255,0.50)", marginTop: "12px" }}>
            {brief.trajectory.reason}
          </p>
        </div>

        {/* ═══ 3. CONTRADICTION RE-EXPOSED ═══ */}
        {brief.contradiction && (
          <div style={{ background: "#111", padding: "24px 28px", borderLeft: "2px solid #444", marginBottom: "64px" }}>
            <p style={{ fontSize: "14px", lineHeight: 1.7, color: "#777" }}>
              You previously committed to:
            </p>
            <p style={{ fontSize: "15px", lineHeight: 1.6, color: "#EAEAEA", paddingLeft: "14px", marginTop: "8px" }}>
              &ldquo;{brief.contradiction.decision}&rdquo;
            </p>
            <p style={{ fontSize: "14px", lineHeight: 1.7, color: "#777", marginTop: "20px" }}>
              The constraint:
            </p>
            <p style={{ fontSize: "15px", lineHeight: 1.6, color: "#EAEAEA", paddingLeft: "14px", marginTop: "8px" }}>
              &ldquo;{brief.contradiction.constraint}&rdquo;
            </p>
            <p style={{ fontSize: "14px", lineHeight: 1.7, color: "rgba(255,255,255,0.45)", marginTop: "20px" }}>
              remains active. {brief.contradiction.status}.
            </p>
            <p style={{ fontSize: "15px", lineHeight: 1.7, color: "rgba(255,255,255,0.55)", marginTop: "12px" }}>
              The structure has not changed.
            </p>
          </div>
        )}

        {/* ═══ 4. OUTCOME EVIDENCE ═══ */}
        {brief.outcomeEvidence && (
          <div style={{ paddingBottom: "64px" }}>
            <div style={{ height: "1px", background: "#1A1A1A", marginBottom: "48px" }} />
            <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase", color: "#555", marginBottom: "16px" }}>
              Observed outcomes in similar cases
            </p>
            {brief.outcomeEvidence.statements.map((statement, i) => (
              <p key={i} style={{ fontSize: "14px", lineHeight: 1.75, color: "rgba(255,255,255,0.50)", marginBottom: "4px", paddingLeft: "16px" }}>
                &bull; {statement}
              </p>
            ))}
            <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "9px", letterSpacing: "0.06em", textTransform: "uppercase", color: "#444", marginTop: "12px" }}>
              Confidence: {brief.outcomeEvidence.confidence} ({brief.outcomeEvidence.processedDecisionCases} cases)
            </p>
          </div>
        )}

        {/* ═══ 5. PERSONAL DELTA ═══ */}
        {brief.delta && (
          <div style={{ paddingBottom: "64px" }}>
            <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase", color: "#555", marginBottom: "16px" }}>
              Change since last session
            </p>
            <div style={{ display: "grid", gap: "8px" }}>
              <DeltaLine label="Clarity" value={brief.delta.clarity} />
              <DeltaLine label="Authority" value={brief.delta.authority} />
              <DeltaLine label="Readiness" value={brief.delta.readiness} />
            </div>
          </div>
        )}

        {/* ═══ 6. DIRECT CHALLENGE ═══ */}
        <div style={{ paddingBottom: "64px" }}>
          <div style={{ height: "1px", background: "#1A1A1A", marginBottom: "48px" }} />
          <p style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 400, fontSize: "20px", lineHeight: 1.4, color: "rgba(255,255,255,0.80)" }}>
            {brief.challenge}
          </p>
        </div>

        {/* ═══ CTA ═══ */}
        <Link
          href={`/strategy-room/session/${brief.sessionId}`}
          style={{ display: "block", width: "100%", padding: "18px 0", textAlign: "center", backgroundColor: "#F5F5F5", color: "#0B0B0B", fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", textDecoration: "none", fontWeight: 500 }}
        >
          Return to Strategy Room
        </Link>

        {/* ═══ RETAINER TRIGGER ═══ */}
        {brief.retainerTriggered && (
          <div style={{ marginTop: "64px", padding: "24px 28px", borderLeft: "2px solid #C9A96E", background: "rgba(201,169,110,0.04)" }}>
            <p style={{ fontSize: "15px", lineHeight: 1.75, color: "rgba(255,255,255,0.60)" }}>
              This is no longer a single decision issue.
            </p>
            <p style={{ fontSize: "15px", lineHeight: 1.75, color: "rgba(255,255,255,0.60)", marginTop: "8px" }}>
              The pattern is persistent. Without ongoing enforcement, this will continue to recur.
            </p>
            <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "10px", letterSpacing: "0.06em", textTransform: "uppercase", color: "#C9A96E", marginTop: "20px" }}>
              Decision Integrity Programme
            </p>
            <p style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontSize: "28px", fontWeight: 300, color: "rgba(255,255,255,0.85)", marginTop: "8px" }}>
              &pound;25,000+
            </p>
            <Link
              href="/consulting?retainer=qualified"
              style={{ display: "inline-block", marginTop: "16px", padding: "12px 24px", border: "1px solid rgba(201,169,110,0.40)", backgroundColor: "rgba(201,169,110,0.08)", color: "#C9A96E", fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", textDecoration: "none" }}
            >
              Request programme access
            </Link>
          </div>
        )}

      </div>
    </main>
  );
}

function DeltaLine({ label, value }: { label: string; value: string }) {
  const isPositive = value.startsWith("+") || value === "increased";
  const isNegative = value === "decreased" || value === "contested";
  const color = isPositive ? "rgba(110,231,183,0.60)" : isNegative ? "rgba(252,165,165,0.60)" : "rgba(255,255,255,0.40)";

  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.45)" }}>{label}</span>
      <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "11px", letterSpacing: "0.04em", color }}>{value}</span>
    </div>
  );
}
