import * as React from "react";
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

import type { buildGmiBoardPulse } from "./gmi-control-plane";
import type { buildGmiBoardPackSnapshot } from "./gmi-instrument";

type BoardPack = ReturnType<typeof buildGmiBoardPackSnapshot>;
type BoardPulse = ReturnType<typeof buildGmiBoardPulse>;

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#111827",
    backgroundColor: "#ffffff",
  },
  eyebrow: {
    fontSize: 7,
    textTransform: "uppercase",
    letterSpacing: 1.6,
    color: "#8a6d35",
    marginBottom: 6,
  },
  title: {
    fontSize: 22,
    lineHeight: 1.15,
    marginBottom: 8,
  },
  boundary: {
    fontSize: 8,
    lineHeight: 1.45,
    color: "#4b5563",
    marginBottom: 16,
  },
  section: {
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  sectionTitle: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    color: "#8a6d35",
    marginBottom: 8,
  },
  card: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 8,
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 10,
    marginBottom: 3,
  },
  muted: {
    color: "#6b7280",
    lineHeight: 1.45,
  },
  footer: {
    position: "absolute",
    left: 36,
    right: 36,
    bottom: 24,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 8,
    fontSize: 7,
    color: "#6b7280",
  },
});

export function GmiBoardPackPDF({ pack }: { pack: BoardPack }) {
  return (
    <Document title={pack.title} author="Abraham of London">
      <Page size="A4" style={styles.page}>
        <Text style={styles.eyebrow}>{pack.editionId} · Board Pack Snapshot</Text>
        <Text style={styles.title}>{pack.title}</Text>
        <Text style={styles.boundary}>{pack.legalBoundary}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Three Watch Signals</Text>
          {pack.watchSignals.map((signal) => (
            <View key={signal.signal} style={styles.card}>
              <Text style={styles.cardTitle}>{signal.signal}</Text>
              <Text style={styles.muted}>Status: {signal.currentStatus}</Text>
              <Text style={styles.muted}>Trigger: {signal.triggerThreshold}</Text>
              <Text style={styles.muted}>Action: {signal.actionIfTriggered}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Operator Consequence Index</Text>
          {pack.operatorConsequenceIndex.map((item) => (
            <Text key={item.dimension} style={styles.muted}>
              {item.dimension}: {item.score}/5 — {item.decisionImplication}
            </Text>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Five Board Decisions</Text>
          {pack.boardDecisions.map((decision) => (
            <View key={decision.decision} style={styles.card}>
              <Text style={styles.cardTitle}>{decision.decision}</Text>
              <Text style={styles.muted}>Timing: {decision.timingCondition}</Text>
              <Text style={styles.muted}>Risk if delayed: {decision.riskIfDelayed}</Text>
              <Text style={styles.muted}>Owner/function: {decision.ownerFunction}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Decision Deadlines</Text>
          {pack.decisionsToMakeIn30Days.map((decision) => (
            <Text key={decision.decision} style={styles.muted}>
              30 days: {decision.decision} Owner: {decision.suggestedOwner}
            </Text>
          ))}
          {pack.decisionsToPrepareIn90Days.map((decision) => (
            <Text key={decision.decision} style={styles.muted}>
              90 days: {decision.decision} Trigger: {decision.triggerCondition}
            </Text>
          ))}
          {pack.decisionsToDefer.map((decision) => (
            <Text key={decision.decision} style={styles.muted}>
              Defer: {decision.decision} Review: {decision.reviewDate}
            </Text>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Scenario Summary</Text>
          {pack.scenarioSummary.map((scenario) => (
            <Text key={scenario.label} style={styles.muted}>
              {scenario.label}: {scenario.probability}% — {scenario.methodNote}
            </Text>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Falsification Thresholds</Text>
          {pack.falsificationThresholds.map((threshold) => (
            <Text key={threshold.threshold} style={styles.muted}>
              {threshold.threshold} Observable signal: {threshold.observableSignal} Review: {threshold.reviewTiming}
            </Text>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prior-Call Score Summary</Text>
          <Text style={styles.muted}>
            Calls: {pack.priorCallSummary.totalCalls}. Reviewed: {pack.priorCallSummary.reviewed}. Pending: {pack.priorCallSummary.pending}. Average score: {pack.priorCallSummary.averageScore ?? "not scored"}.
          </Text>
        </View>

        <Text style={styles.footer}>
          Institutional record · Generated {pack.generatedAt} · This board-pack snapshot is generated from the GMI Operator Dashboard data source.
        </Text>
      </Page>
    </Document>
  );
}

export function GmiBoardPulsePDF({ pulse }: { pulse: BoardPulse }) {
  return (
    <Document title={`${pulse.editionId} Board Pulse`} author="Abraham of London">
      <Page size="A4" style={styles.page}>
        <Text style={styles.eyebrow}>{pulse.editionId} · Board Pulse</Text>
        <Text style={styles.title}>{pulse.currentThesis}</Text>
        <Text style={styles.boundary}>Last updated {pulse.lastUpdatedTimestamp}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Operator Consequence Index</Text>
          {pulse.operatorConsequenceIndex.map((item) => (
            <Text key={item.dimension} style={styles.muted}>
              {item.dimension}: {item.score}/5 — {item.decisionImplication}
            </Text>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Three Watch Signals</Text>
          {pulse.watchSignals.map((signal) => (
            <Text key={signal.signal} style={styles.muted}>
              {signal.signal}: {signal.triggerThreshold}
            </Text>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Five Board Decisions</Text>
          {pulse.boardDecisions.map((decision) => (
            <Text key={decision.decision} style={styles.muted}>
              {decision.decision} Owner: {decision.suggestedOwner}. Route: {decision.route}.
            </Text>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Falsification Risk</Text>
          <Text style={styles.muted}>
            {pulse.topFalsificationRisk?.thesisStatement ?? "No falsification rule registered."}
          </Text>
          <Text style={styles.muted}>What would change the view: {pulse.whatWouldChangeTheView}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance Snapshot</Text>
          <Text style={styles.muted}>
            Calls issued: {pulse.performanceSnapshot.totalCallsIssued}. Reviewed: {pulse.performanceSnapshot.reviewedCallPercentage}%. Confirmed: {pulse.performanceSnapshot.confirmedCount}. Carry-forward: {pulse.performanceSnapshot.pendingCarryForwardCount}. Weak/disconfirmed: {pulse.performanceSnapshot.weakDisconfirmedCount}.
          </Text>
        </View>

        <Text style={styles.footer}>
          Public board pulse · Generated from the GMI control plane · Full GMI edition remains gated.
        </Text>
      </Page>
    </Document>
  );
}
