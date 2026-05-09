/* lib/pdf/oversight-brief-pdf.tsx — Oversight Brief PDF renderer */
import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { ClientSafeOversightBrief } from "@/lib/product/client-safe-oversight-brief";
import type { OversightBrief } from "@/lib/product/oversight-brief-contract";

const COLOURS = {
  ink: "#1A1713",
  grey: "#646464",
  gold: "#C9A96E",
  accent: "#003366",
  lightBorder: "#D4D0C8",
  background: "#FFFFFF",
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingBottom: 60,
    paddingHorizontal: 42,
    fontFamily: "AoLInter",
    fontSize: 10,
    color: COLOURS.ink,
    backgroundColor: COLOURS.background,
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLOURS.gold,
    paddingBottom: 12,
  },
  brandName: {
    fontFamily: "AoLSerif",
    fontSize: 16,
    fontWeight: 700,
    color: COLOURS.ink,
    letterSpacing: 1.2,
  },
  title: {
    fontFamily: "AoLSerif",
    fontSize: 13,
    fontWeight: 700,
    marginTop: 6,
    color: COLOURS.accent,
  },
  metaRow: {
    flexDirection: "row",
    marginTop: 6,
    gap: 18,
  },
  metaLabel: {
    fontSize: 7,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: COLOURS.grey,
  },
  metaValue: {
    fontSize: 9,
    color: COLOURS.ink,
    marginTop: 2,
  },
  sectionTitle: {
    fontFamily: "AoLSerif",
    fontSize: 12,
    fontWeight: 700,
    marginTop: 18,
    marginBottom: 6,
    color: COLOURS.ink,
  },
  body: {
    fontSize: 10.2,
    lineHeight: 1.62,
    marginBottom: 10,
    textAlign: "justify",
    color: COLOURS.ink,
  },
  smallBody: {
    fontSize: 9,
    lineHeight: 1.55,
    marginBottom: 6,
    color: COLOURS.ink,
  },
  label: {
    fontSize: 7.5,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: COLOURS.grey,
    marginBottom: 3,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: COLOURS.lightBorder,
  },
  badge: {
    fontSize: 7,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: COLOURS.gold,
    marginLeft: 8,
  },
  suppressionNotice: {
    marginTop: 14,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 0.5,
    borderColor: COLOURS.gold,
    backgroundColor: "#FAF8F5",
  },
  suppressionText: {
    fontSize: 8.5,
    lineHeight: 1.5,
    color: COLOURS.grey,
    fontStyle: "italic",
  },
  legend: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: COLOURS.lightBorder,
  },
  legendItem: {
    fontSize: 7.5,
    lineHeight: 1.6,
    color: COLOURS.grey,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 42,
    right: 42,
    borderTopWidth: 0.5,
    borderTopColor: COLOURS.lightBorder,
    paddingTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 7,
    color: COLOURS.grey,
  },
});

function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

type Props = {
  clientSafeBrief: ClientSafeOversightBrief;
  generatedAt?: string;
};

export function OversightBriefPdfDocument({ clientSafeBrief, generatedAt }: Props) {
  const brief: OversightBrief = clientSafeBrief.brief;
  const suppressions = clientSafeBrief.suppressions;
  const timestamp = generatedAt ?? new Date().toISOString();

  return (
    <Document title="Retained Oversight Brief" author="Abraham of London">
      <Page size="A4" style={styles.page}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.brandName}>ABRAHAM OF LONDON</Text>
          <Text style={styles.title}>Retained Oversight Brief</Text>
          <View style={styles.metaRow}>
            <View>
              <Text style={styles.metaLabel}>Period</Text>
              <Text style={styles.metaValue}>
                {formatDate(brief.periodStart)} — {formatDate(brief.periodEnd)}
              </Text>
            </View>
            {brief.cadence && (
              <View>
                <Text style={styles.metaLabel}>Cadence Posture</Text>
                <Text style={styles.metaValue}>
                  {brief.cadence.status} · {brief.cadence.health}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Executive Summary ── */}
        <View>
          <Text style={styles.sectionTitle}>Executive Summary</Text>
          <Text style={styles.body}>{brief.executiveSummary}</Text>
        </View>

        {/* ── Active Cases Summary ── */}
        <View>
          <Text style={styles.sectionTitle}>Active Cases</Text>
          <Text style={styles.smallBody}>
            {brief.activeCases.length} active case{brief.activeCases.length !== 1 ? "s" : ""}
          </Text>
          {brief.activeCases.map((c, i) => (
            <View key={c.caseId || i} style={styles.row}>
              <Text style={styles.smallBody}>{c.title} — {c.state}</Text>
              {c.primaryRisk && <Text style={styles.badge}>{c.primaryRisk}</Text>}
            </View>
          ))}
        </View>

        {/* ── Cost of Inaction ── */}
        {brief.costOfInaction && (
          <View>
            <Text style={styles.sectionTitle}>Cost of Inaction</Text>
            <Text style={styles.body}>
              £{brief.costOfInaction.totalEstimated.toLocaleString()} estimated across{" "}
              {brief.costOfInaction.casesIncluded} case{brief.costOfInaction.casesIncluded !== 1 ? "s" : ""}.
            </Text>
          </View>
        )}

        {/* ── What Repeated / What Worsened ── */}
        <View style={{ flexDirection: "row", gap: 20, marginTop: 4 }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>What Repeated</Text>
            <Text style={styles.smallBody}>
              {brief.patternRecurrence
                ? `${brief.patternRecurrence.explanation} (${brief.patternRecurrence.priorCount} prior case${brief.patternRecurrence.priorCount !== 1 ? "s" : ""}).`
                : "No recurrence signal published in this cycle."}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>What Worsened</Text>
            <Text style={styles.smallBody}>
              {brief.costOfInaction
                ? `Estimated cost increased to £${brief.costOfInaction.totalEstimated.toLocaleString()}.`
                : "No verified cost basis was published in this cycle."}
            </Text>
          </View>
        </View>

        {/* ── Counsel Memory ── */}
        <View>
          <Text style={styles.sectionTitle}>Counsel Memory</Text>
          <Text style={styles.smallBody}>
            {brief.counsel.reviewsTriggered} review{brief.counsel.reviewsTriggered !== 1 ? "s" : ""} triggered
            · {brief.counsel.requiredNow} required now
          </Text>
          {brief.counselHistory && (
            <Text style={styles.smallBody}>
              {brief.counselHistory.totalEvents} total event{brief.counselHistory.totalEvents !== 1 ? "s" : ""}
              · {brief.counselHistory.openCount} open
            </Text>
          )}
        </View>

        {/* ── Boardroom Archive ── */}
        <View>
          <Text style={styles.sectionTitle}>Boardroom Archive</Text>
          <Text style={styles.smallBody}>
            {brief.boardroom.dossiersAvailable} dossier{brief.boardroom.dossiersAvailable !== 1 ? "s" : ""} available
            · {brief.boardroom.exportsQueued} export{brief.boardroom.exportsQueued !== 1 ? "s" : ""} queued
          </Text>
          {brief.boardroomArchive && (
            <Text style={styles.smallBody}>
              {brief.boardroomArchive.totalDossiers} total
              · {brief.boardroomArchive.previousDossierCount} prior
              · {brief.boardroomArchive.repeatedExposureCount} repeated exposure{brief.boardroomArchive.repeatedExposureCount !== 1 ? "s" : ""}
            </Text>
          )}
        </View>

        {/* ── Verification / Commitment Status ── */}
        <View>
          <Text style={styles.sectionTitle}>Verification Status</Text>
          <Text style={styles.smallBody}>
            {brief.verification.commitmentsDue} commitment{brief.verification.commitmentsDue !== 1 ? "s" : ""} due
            · {brief.verification.commitmentsVerified} verified
            · {brief.verification.unresolvedBreaches} unresolved breach{brief.verification.unresolvedBreaches !== 1 ? "es" : ""}
          </Text>
        </View>

        {/* ── Suppression Notice ── */}
        <View style={styles.suppressionNotice}>
          <Text style={styles.suppressionText}>
            Some material has been withheld for privacy or evidence-safety reasons.
          </Text>
          {suppressions.length > 0 && (
            <Text style={[styles.suppressionText, { marginTop: 4 }]}>
              {suppressions.length} section{suppressions.length !== 1 ? "s" : ""} suppressed.
            </Text>
          )}
        </View>

        {/* ── Evidence Posture Legend ── */}
        <View style={styles.legend}>
          <Text style={[styles.legendItem, { fontWeight: 700 }]}>Evidence Posture Legend</Text>
          <Text style={styles.legendItem}>VERIFIED — independently confirmed by operator review or outcome verification</Text>
          <Text style={styles.legendItem}>OPERATOR_REVIEWED — reviewed by a human operator but not independently confirmed</Text>
          <Text style={styles.legendItem}>USER_REPORTED — based on client-supplied information only</Text>
          <Text style={styles.legendItem}>SYSTEM_INFERRED — derived from system analysis, not independently verified</Text>
          <Text style={styles.legendItem}>INSUFFICIENT_EVIDENCE — evidence basis does not yet support a posture claim</Text>
        </View>

        {/* ── Footer ── */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Generated {formatDate(timestamp)} at {new Date(timestamp).toLocaleTimeString("en-GB")}
          </Text>
          <Text style={styles.footerText}>Not independently verified unless stated</Text>
        </View>
      </Page>
    </Document>
  );
}
