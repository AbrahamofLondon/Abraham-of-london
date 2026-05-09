/* lib/pdf/proof-pack-pdf.tsx — Proof Pack PDF renderer */
import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { ProofPack, ProofPackLine, ProofLabel } from "@/lib/product/proof-pack-generator";
import type { RetainedOutcomeSummary } from "@/lib/product/retained-outcome-summary";

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
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: COLOURS.ink,
    paddingBottom: 4,
    marginBottom: 4,
  },
  tableHeaderCell: {
    fontSize: 7.5,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: COLOURS.grey,
    fontWeight: 700,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: COLOURS.lightBorder,
    alignItems: "center",
  },
  cellLabel: {
    flex: 3,
    fontSize: 9.5,
    color: COLOURS.ink,
  },
  cellCount: {
    flex: 1,
    fontSize: 10,
    fontWeight: 700,
    color: COLOURS.ink,
    textAlign: "center",
  },
  cellPosture: {
    flex: 2,
    fontSize: 7,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: COLOURS.gold,
    textAlign: "center",
  },
  cellNote: {
    flex: 4,
    fontSize: 8.5,
    lineHeight: 1.5,
    color: COLOURS.grey,
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
  outcomeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: COLOURS.lightBorder,
  },
  outcomeName: {
    fontSize: 9,
    color: COLOURS.grey,
  },
  outcomeValue: {
    fontSize: 9,
    fontWeight: 700,
    color: COLOURS.ink,
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

function ProofRow({ line }: { line: ProofPackLine }) {
  return (
    <View style={styles.tableRow}>
      <Text style={styles.cellLabel}>{line.label}</Text>
      <Text style={styles.cellCount}>{line.count}</Text>
      <Text style={styles.cellPosture}>{line.posture}</Text>
      <Text style={styles.cellNote}>{line.note}</Text>
    </View>
  );
}

type Props = {
  pack: ProofPack;
  generatedAt?: string;
};

export function ProofPackPdfDocument({ pack, generatedAt }: Props) {
  const timestamp = generatedAt ?? pack.generatedAt;

  const lines: ProofPackLine[] = [
    pack.diagnosticsCompleted,
    pack.evidenceCaptured,
    pack.contradictionsDetected,
    pack.checkpointsCreated,
    pack.checkpointResponses,
    pack.outcomesVerified,
    pack.decisionVelocityTrend,
    pack.counselReviews,
    pack.oversightCycles,
  ];

  const history: RetainedOutcomeSummary = pack.retainedOutcomeHistory;

  return (
    <Document title="Proof Pack" author="Abraham of London">
      <Page size="A4" style={styles.page}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.brandName}>ABRAHAM OF LONDON</Text>
          <Text style={styles.title}>Proof Pack</Text>
          <View style={styles.metaRow}>
            <View>
              <Text style={styles.metaLabel}>Owner</Text>
              <Text style={styles.metaValue}>{pack.ownerEmail}</Text>
            </View>
            <View>
              <Text style={styles.metaLabel}>Generated</Text>
              <Text style={styles.metaValue}>{formatDate(pack.generatedAt)}</Text>
            </View>
          </View>
        </View>

        {/* ── Evidence Table ── */}
        <View>
          <Text style={styles.sectionTitle}>Evidence Record</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { flex: 3 }]}>Measure</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: "center" }]}>Count</Text>
            <Text style={[styles.tableHeaderCell, { flex: 2, textAlign: "center" }]}>Posture</Text>
            <Text style={[styles.tableHeaderCell, { flex: 4 }]}>Note</Text>
          </View>
          {lines.map((line) => (
            <ProofRow key={line.label} line={line} />
          ))}
        </View>

        {/* ── Retained Outcome History ── */}
        <View>
          <Text style={styles.sectionTitle}>Retained Outcome History</Text>
          {history.thinState ? (
            <Text style={styles.smallBody}>Outcome history is thin.</Text>
          ) : (
            <View>
              <View style={styles.outcomeRow}>
                <Text style={styles.outcomeName}>Confirmed Outcomes</Text>
                <Text style={styles.outcomeValue}>{history.confirmedOutcomes}</Text>
              </View>
              <View style={styles.outcomeRow}>
                <Text style={styles.outcomeName}>Blocked Outcomes</Text>
                <Text style={styles.outcomeValue}>{history.blockedOutcomes}</Text>
              </View>
              <View style={styles.outcomeRow}>
                <Text style={styles.outcomeName}>Abandoned Outcomes</Text>
                <Text style={styles.outcomeValue}>{history.abandonedOutcomes}</Text>
              </View>
              <View style={styles.outcomeRow}>
                <Text style={styles.outcomeName}>Disputed Findings</Text>
                <Text style={styles.outcomeValue}>{history.disputedFindings}</Text>
              </View>
            </View>
          )}
          <Text style={[styles.smallBody, { marginTop: 6 }]}>
            Evidence posture: {history.evidencePosture}
            {history.latestOutcomeDate ? ` · Latest: ${formatDate(history.latestOutcomeDate)}` : ""}
          </Text>
        </View>

        {/* ── Summary ── */}
        <View>
          <Text style={styles.sectionTitle}>Summary</Text>
          <Text style={styles.body}>{pack.summary}</Text>
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
