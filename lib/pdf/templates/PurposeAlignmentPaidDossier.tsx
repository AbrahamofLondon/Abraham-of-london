/**
 * lib/pdf/templates/PurposeAlignmentPaidDossier.tsx
 *
 * PAID PDF DOSSIER — the £49 deliverable document.
 *
 * This is the full PDF dossier that the paid Purpose Alignment result
 * produces. It includes all 10 deliverables from the paid contract:
 *   1. Mandate clarity reading
 *   2. Obligation conflict map
 *   3. Decision behaviour pattern
 *   4. Alignment drift warning
 *   5. Execution integrity implication
 *   6. Personal decision constitution summary
 *   7. Next admissible move
 *   8. Decision Centre memory reference
 *   9. PDF dossier (this document)
 *   10. ER/Strategy Room bridge
 *
 * This replaces the old AlignmentReportDocument for paid users.
 */

import React from "react";
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { PurposeAlignmentPaidResult } from "@/lib/alignment/purpose-alignment-paid-contract";
import { ALIGNMENT_DOMAIN_LABELS } from "@/lib/alignment/checklist";
import type { WatermarkPayload } from "@/lib/intelligence/watermark-delegate";

import BriefCoverPage from "@/components/print/BriefCoverPage";
import BriefHeaderBar from "@/components/print/BriefHeaderBar";
import BriefFooterBar from "@/components/print/BriefFooterBar";
import ForensicMarkLayer from "@/components/print/ForensicMarkLayer";

const PAPER = "#FCFBF7";
const INK = "#121416";
const BRASS = "#8A6A2F";
const SILVER = "#56606C";
const SOFTER = "#76808C";
const MIST = "#E8E1D4";
const PANEL = "#F7F3EC";
const PANEL_ALT = "#FBF9F4";
const ALERT = "#9B2C2C";
const ALERT_BG = "#FDF2F2";
const GREEN = "#276749";
const GREEN_BG = "#F0FFF4";

const styles = StyleSheet.create({
  page: {
    backgroundColor: PAPER,
    color: INK,
    paddingTop: 58,
    paddingBottom: 56,
    paddingHorizontal: 54,
    fontFamily: "Helvetica",
    fontSize: 10,
    lineHeight: 1.55,
  },
  frameTop: {
    position: "absolute",
    top: 24,
    left: 54,
    right: 54,
    height: 1,
    backgroundColor: MIST,
  },
  frameBottom: {
    position: "absolute",
    bottom: 48,
    left: 54,
    right: 54,
    height: 1,
    backgroundColor: MIST,
  },
  sectionKicker: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7.8,
    color: BRASS,
    textTransform: "uppercase",
    letterSpacing: 1.6,
    marginBottom: 8,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeaderRule: {
    height: 1,
    backgroundColor: MIST,
    marginBottom: 6,
  },
  sectionTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8.1,
    color: BRASS,
    textTransform: "uppercase",
    letterSpacing: 1.6,
    marginBottom: 8,
  },
  narrativePanel: {
    borderWidth: 1,
    borderColor: MIST,
    backgroundColor: PANEL_ALT,
    paddingTop: 10,
    paddingBottom: 9,
    paddingHorizontal: 12,
  },
  narrativeTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8.5,
    color: INK,
    marginBottom: 5,
  },
  narrativeBody: {
    fontFamily: "Helvetica",
    fontSize: 9,
    lineHeight: 1.55,
    color: SILVER,
  },
  alertPanel: {
    borderWidth: 1,
    borderColor: ALERT,
    backgroundColor: ALERT_BG,
    paddingTop: 10,
    paddingBottom: 9,
    paddingHorizontal: 12,
  },
  alertTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8.5,
    color: ALERT,
    marginBottom: 5,
  },
  alertBody: {
    fontFamily: "Helvetica",
    fontSize: 9,
    lineHeight: 1.55,
    color: SILVER,
  },
  greenPanel: {
    borderWidth: 1,
    borderColor: GREEN,
    backgroundColor: GREEN_BG,
    paddingTop: 10,
    paddingBottom: 9,
    paddingHorizontal: 12,
  },
  greenTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8.5,
    color: GREEN,
    marginBottom: 5,
  },
  greenBody: {
    fontFamily: "Helvetica",
    fontSize: 9,
    lineHeight: 1.55,
    color: SILVER,
  },
  domainTable: {
    borderWidth: 1,
    borderColor: MIST,
  },
  domainHeaderRow: {
    flexDirection: "row",
    backgroundColor: PANEL,
    borderBottomWidth: 1,
    borderBottomColor: MIST,
  },
  domainRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: MIST,
  },
  domainLabelHeader: {
    flex: 2.1,
    paddingVertical: 7,
    paddingHorizontal: 8,
    fontFamily: "Helvetica-Bold",
    fontSize: 8.1,
    color: INK,
  },
  domainMetricHeader: {
    flex: 1,
    paddingVertical: 7,
    paddingHorizontal: 8,
    fontFamily: "Helvetica-Bold",
    fontSize: 8.1,
    color: INK,
    textAlign: "right",
  },
  domainLabel: {
    flex: 2.1,
    paddingVertical: 7,
    paddingHorizontal: 8,
    fontFamily: "Helvetica",
    fontSize: 8.9,
    color: INK,
    lineHeight: 1.35,
  },
  domainMetric: {
    flex: 1,
    paddingVertical: 7,
    paddingHorizontal: 8,
    fontFamily: "Helvetica",
    fontSize: 8.8,
    color: SILVER,
    textAlign: "right",
  },
  listPanel: {
    borderWidth: 1,
    borderColor: MIST,
    backgroundColor: PANEL_ALT,
    paddingTop: 10,
    paddingBottom: 8,
    paddingHorizontal: 12,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  bulletMark: {
    width: 12,
    fontFamily: "Helvetica-Bold",
    fontSize: 8.4,
    color: BRASS,
    marginTop: 1,
  },
  bulletText: {
    flex: 1,
    fontFamily: "Helvetica",
    fontSize: 9,
    lineHeight: 1.52,
    color: SILVER,
  },
  closingBand: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: MIST,
  },
  closingText: {
    fontFamily: "Helvetica",
    fontSize: 8.3,
    lineHeight: 1.48,
    color: SOFTER,
  },
  summaryPanel: {
    borderWidth: 1,
    borderColor: MIST,
    backgroundColor: PANEL,
    paddingTop: 14,
    paddingBottom: 12,
    paddingHorizontal: 16,
    marginBottom: 18,
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  summaryCell: {
    width: "50%",
    marginBottom: 8,
    paddingRight: 10,
  },
  summaryKey: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7.1,
    color: SOFTER,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 2,
  },
  summaryValue: {
    fontFamily: "Helvetica",
    fontSize: 9.4,
    color: INK,
    lineHeight: 1.4,
  },
  constitutionPanel: {
    borderWidth: 1,
    borderColor: MIST,
    backgroundColor: PANEL,
    paddingTop: 10,
    paddingBottom: 9,
    paddingHorizontal: 12,
  },
  constitutionRule: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    color: INK,
    marginBottom: 4,
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: BRASS,
  },
  constitutionText: {
    fontFamily: "Helvetica",
    fontSize: 9,
    lineHeight: 1.5,
    color: SILVER,
    marginBottom: 4,
  },
});

function formatDate(value: string): string {
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PurposeAlignmentPaidDossier({
  result,
  watermark,
  qrCode,
}: {
  result: PurposeAlignmentPaidResult;
  watermark: WatermarkPayload;
  qrCode?: string;
}) {
  const reference = `PAID-PA-${result.resultId.slice(0, 8).toUpperCase()}`;
  const classification = "CONFIDENTIAL";

  const coverConfig = {
    id: result.resultId,
    title: "Purpose Alignment — Full Dossier",
    subtitle: "Personal Decision Audit · £49",
    description:
      "Mandate clarity reading, obligation conflict map, decision behaviour pattern, alignment drift warning, execution integrity implication, personal decision constitution, next admissible move, and governed corridor bridge.",
    institutionalId: reference,
    version: "2.0.0",
    date: result.createdAt,
    author: "Abraham of London",
  };

  return (
    <Document
      author="Abraham of London"
      title="Purpose Alignment — Full Dossier"
      subject="Personal Decision Audit"
      creator="Abraham of London Purpose Alignment System"
      producer="Abraham of London"
      keywords={`purpose alignment, personal decision audit, ${result.coherenceBand}, ${result.mandateReading.alignmentBand}`}
      language="en-GB"
    >
      <BriefCoverPage
        config={coverConfig as never}
        watermark={watermark}
        qrCode={qrCode}
        classification={classification}
        reference={reference}
        subtitle="Full dossier: mandate reading, obligation conflict map, decision behaviour pattern, alignment drift warning, execution integrity implication, personal decision constitution, next admissible move, and governed corridor bridge."
      />

      {/* ── PAGE 1: EXECUTIVE SUMMARY + MANDATE ── */}
      <Page size="A4" style={styles.page}>
        <ForensicMarkLayer watermark={watermark} mode="interior" />
        <View style={styles.frameTop} fixed />
        <View style={styles.frameBottom} fixed />

        <BriefHeaderBar
          title="Purpose Alignment — Full Dossier"
          reference={reference}
          classification={classification}
        />

        {/* Summary */}
        <View style={styles.summaryPanel}>
          <Text style={styles.sectionKicker}>Assessment Summary</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCell}>
              <Text style={styles.summaryKey}>Coherence Band</Text>
              <Text style={styles.summaryValue}>{result.coherenceBand}</Text>
            </View>
            <View style={styles.summaryCell}>
              <Text style={styles.summaryKey}>Severity</Text>
              <Text style={styles.summaryValue}>{result.severity.toUpperCase()}</Text>
            </View>
            <View style={styles.summaryCell}>
              <Text style={styles.summaryKey}>Mandate Alignment</Text>
              <Text style={styles.summaryValue}>{result.mandateReading.alignmentBand}</Text>
            </View>
            <View style={styles.summaryCell}>
              <Text style={styles.summaryKey}>Mandate Viability</Text>
              <Text style={styles.summaryValue}>{result.mandateReading.mandateViability}</Text>
            </View>
            <View style={styles.summaryCell}>
              <Text style={styles.summaryKey}>Execution Integrity</Text>
              <Text style={styles.summaryValue}>{result.executionIntegrityImplication.integrityScore}/100</Text>
            </View>
            <View style={styles.summaryCell}>
              <Text style={styles.summaryKey}>Generated</Text>
              <Text style={styles.summaryValue}>{formatDate(result.createdAt)}</Text>
            </View>
          </View>
        </View>

        {/* 1. Mandate Clarity Reading */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRule} />
          <Text style={styles.sectionTitle}>1. Mandate Clarity Reading</Text>
          <View style={styles.narrativePanel}>
            <Text style={styles.narrativeTitle}>Declared Mandate</Text>
            <Text style={styles.narrativeBody}>{result.mandateReading.declaredMandate}</Text>
          </View>
          <View style={[styles.narrativePanel, { marginTop: 8 }]}>
            <Text style={styles.narrativeTitle}>Inferred Mandate Pressure</Text>
            <Text style={styles.narrativeBody}>{result.mandateReading.inferredMandatePressure}</Text>
          </View>
          <View style={[styles.narrativePanel, { marginTop: 8 }]}>
            <Text style={styles.narrativeTitle}>Operating Mandate Sentence</Text>
            <Text style={styles.narrativeBody}>{result.mandateReading.operatingMandateSentence}</Text>
          </View>
        </View>

        {/* 2. Obligation Conflict Map */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRule} />
          <Text style={styles.sectionTitle}>2. Obligation Conflict Map</Text>
          <View style={styles.narrativePanel}>
            <Text style={styles.narrativeTitle}>Primary Competing Obligation</Text>
            <Text style={styles.narrativeBody}>{result.obligationConflictMap.primaryCompetingObligation}</Text>
          </View>
          <View style={[styles.narrativePanel, { marginTop: 8 }]}>
            <Text style={styles.narrativeTitle}>Consequence If Unresolved</Text>
            <Text style={styles.narrativeBody}>{result.obligationConflictMap.consequenceIfUnresolved}</Text>
          </View>
          <View style={[styles.narrativePanel, { marginTop: 8 }]}>
            <Text style={styles.narrativeTitle}>Distortion Effect</Text>
            <Text style={styles.narrativeBody}>{result.obligationConflictMap.distortionEffect}</Text>
          </View>
          <View style={[styles.narrativePanel, { marginTop: 8 }]}>
            <Text style={styles.narrativeTitle}>Obligation Nature</Text>
            <Text style={styles.narrativeBody}>{result.obligationConflictMap.obligationNature.replace(/_/g, " ")}</Text>
          </View>
          {result.obligationConflictMap.renegotiationPath && (
            <View style={[styles.narrativePanel, { marginTop: 8 }]}>
              <Text style={styles.narrativeTitle}>Renegotiation Path</Text>
              <Text style={styles.narrativeBody}>{result.obligationConflictMap.renegotiationPath}</Text>
            </View>
          )}
          <View style={[styles.narrativePanel, { marginTop: 8 }]}>
            <Text style={styles.narrativeTitle}>Carrying Cost</Text>
            <Text style={styles.narrativeBody}>{result.obligationConflictMap.carryingCost}</Text>
          </View>
        </View>

        <BriefFooterBar
          watermark={watermark}
          reference={reference}
          signAs="The Architect"
        />
      </Page>

      {/* ── PAGE 2: PATTERN + DRIFT + EXECUTION ── */}
      <Page size="A4" style={styles.page}>
        <ForensicMarkLayer watermark={watermark} mode="interior" />
        <View style={styles.frameTop} fixed />
        <View style={styles.frameBottom} fixed />

        <BriefHeaderBar
          title="Purpose Alignment — Full Dossier"
          reference={reference}
          classification={classification}
        />

        {/* 3. Decision Behaviour Pattern */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRule} />
          <Text style={styles.sectionTitle}>3. Decision Behaviour Pattern</Text>
          <View style={styles.narrativePanel}>
            <Text style={styles.narrativeTitle}>Primary Pattern</Text>
            <Text style={styles.narrativeBody}>{result.decisionBehaviourPattern.primaryPattern.label}</Text>
          </View>
          <View style={[styles.narrativePanel, { marginTop: 8 }]}>
            <Text style={styles.narrativeTitle}>Manifestation</Text>
            <Text style={styles.narrativeBody}>{result.decisionBehaviourPattern.manifestation}</Text>
          </View>
          <View style={[styles.narrativePanel, { marginTop: 8 }]}>
            <Text style={styles.narrativeTitle}>Trigger Conditions</Text>
            {result.decisionBehaviourPattern.triggerConditions.map((condition) => (
              <View key={condition} style={styles.bulletRow}>
                <Text style={styles.bulletMark}>•</Text>
                <Text style={styles.bulletText}>{condition}</Text>
              </View>
            ))}
          </View>
          <View style={[styles.narrativePanel, { marginTop: 8 }]}>
            <Text style={styles.narrativeTitle}>Recurrence Risk</Text>
            <Text style={styles.narrativeBody}>{result.decisionBehaviourPattern.recurrenceRisk}</Text>
          </View>
        </View>

        {/* 4. Alignment Drift Warning */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRule} />
          <Text style={styles.sectionTitle}>4. Alignment Drift Warning</Text>
          {result.alignmentDriftWarning.driftActive ? (
            <View style={styles.alertPanel}>
              <Text style={styles.alertTitle}>⚠ Drift Active</Text>
              <Text style={styles.alertBody}>{result.alignmentDriftWarning.driftDirection}</Text>
            </View>
          ) : (
            <View style={styles.greenPanel}>
              <Text style={styles.greenTitle}>✓ No Active Drift</Text>
              <Text style={styles.greenBody}>Current trajectory is stable. Maintain the conditions that produced this reading.</Text>
            </View>
          )}
          <View style={[styles.narrativePanel, { marginTop: 8 }]}>
            <Text style={styles.narrativeTitle}>30-Day Projection</Text>
            <Text style={styles.narrativeBody}>{result.alignmentDriftWarning.projectedStateAt30Days}</Text>
          </View>
          <View style={[styles.narrativePanel, { marginTop: 8 }]}>
            <Text style={styles.narrativeTitle}>60-Day Projection</Text>
            <Text style={styles.narrativeBody}>{result.alignmentDriftWarning.projectedStateAt60Days}</Text>
          </View>
          <View style={[styles.narrativePanel, { marginTop: 8 }]}>
            <Text style={styles.narrativeTitle}>90-Day Projection</Text>
            <Text style={styles.narrativeBody}>{result.alignmentDriftWarning.projectedStateAt90Days}</Text>
          </View>
          <View style={[styles.narrativePanel, { marginTop: 8 }]}>
            <Text style={styles.narrativeTitle}>Corrective Vector</Text>
            <Text style={styles.narrativeBody}>{result.alignmentDriftWarning.correctiveVector}</Text>
          </View>
        </View>

        {/* 5. Execution Integrity Implication */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRule} />
          <Text style={styles.sectionTitle}>5. Execution Integrity Implication</Text>
          <View style={styles.narrativePanel}>
            <Text style={styles.narrativeTitle}>Integrity Score: {result.executionIntegrityImplication.integrityScore}/100</Text>
            <Text style={styles.narrativeBody}>{result.executionIntegrityImplication.executionManifestation}</Text>
          </View>
          {result.executionIntegrityImplication.integrityImpacted && (
            <View style={[styles.alertPanel, { marginTop: 8 }]}>
              <Text style={styles.alertTitle}>Execution Risk</Text>
              <Text style={styles.alertBody}>{result.executionIntegrityImplication.executionRisk}</Text>
            </View>
          )}
          <View style={[styles.narrativePanel, { marginTop: 8 }]}>
            <Text style={styles.narrativeTitle}>Must Protect</Text>
            {result.executionIntegrityImplication.mustProtect.map((item) => (
              <View key={item} style={styles.bulletRow}>
                <Text style={styles.bulletMark}>•</Text>
                <Text style={styles.bulletText}>{item}</Text>
              </View>
            ))}
          </View>
          {result.executionIntegrityImplication.mustStop.length > 0 && (
            <View style={[styles.alertPanel, { marginTop: 8 }]}>
              <Text style={styles.alertTitle}>Must Stop</Text>
              {result.executionIntegrityImplication.mustStop.map((item) => (
                <View key={item} style={styles.bulletRow}>
                  <Text style={styles.bulletMark}>•</Text>
                  <Text style={styles.alertBody}>{item}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <BriefFooterBar
          watermark={watermark}
          reference={reference}
          signAs="The Architect"
        />
      </Page>

      {/* ── PAGE 3: CONSTITUTION + NEXT MOVE + BRIDGE ── */}
      <Page size="A4" style={styles.page}>
        <ForensicMarkLayer watermark={watermark} mode="interior" />
        <View style={styles.frameTop} fixed />
        <View style={styles.frameBottom} fixed />

        <BriefHeaderBar
          title="Purpose Alignment — Full Dossier"
          reference={reference}
          classification={classification}
        />

        {/* 6. Personal Decision Constitution */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRule} />
          <Text style={styles.sectionTitle}>6. Personal Decision Constitution</Text>

          <View style={styles.constitutionPanel}>
            <Text style={styles.sectionKicker}>Governing Principle</Text>
            <Text style={styles.constitutionRule}>{result.personalDecisionConstitution.governingPrinciple}</Text>
          </View>

          <View style={[styles.constitutionPanel, { marginTop: 8 }]}>
            <Text style={styles.sectionKicker}>Decision Rules</Text>
            {result.personalDecisionConstitution.decisionRules.map((rule) => (
              <View key={rule} style={styles.bulletRow}>
                <Text style={styles.bulletMark}>•</Text>
                <Text style={styles.bulletText}>{rule}</Text>
              </View>
            ))}
          </View>

          <View style={[styles.constitutionPanel, { marginTop: 8 }]}>
            <Text style={styles.sectionKicker}>Authority Boundaries</Text>
            {result.personalDecisionConstitution.authorityBoundaries.map((boundary) => (
              <View key={boundary} style={styles.bulletRow}>
                <Text style={styles.bulletMark}>•</Text>
                <Text style={styles.bulletText}>{boundary}</Text>
              </View>
            ))}
          </View>

          <View style={[styles.constitutionPanel, { marginTop: 8 }]}>
            <Text style={styles.sectionKicker}>Escalation Triggers</Text>
            {result.personalDecisionConstitution.escalationTriggers.map((trigger) => (
              <View key={trigger} style={styles.bulletRow}>
                <Text style={styles.bulletMark}>•</Text>
                <Text style={styles.bulletText}>{trigger}</Text>
              </View>
            ))}
          </View>

          <View style={[styles.constitutionPanel, { marginTop: 8 }]}>
            <Text style={styles.sectionKicker}>Decision Rights Statement</Text>
            <Text style={styles.constitutionText}>{result.personalDecisionConstitution.decisionRightsStatement}</Text>
          </View>

          <View style={[styles.constitutionPanel, { marginTop: 8 }]}>
            <Text style={styles.sectionKicker}>Accepted Obligations</Text>
            {result.personalDecisionConstitution.acceptedObligations.map((obligation) => (
              <View key={obligation} style={styles.bulletRow}>
                <Text style={styles.bulletMark}>•</Text>
                <Text style={styles.bulletText}>{obligation}</Text>
              </View>
            ))}
          </View>

          {result.personalDecisionConstitution.contestedObligations.length > 0 && (
            <View style={[styles.alertPanel, { marginTop: 8 }]}>
              <Text style={styles.alertTitle}>Contested Obligations</Text>
              {result.personalDecisionConstitution.contestedObligations.map((obligation) => (
                <View key={obligation} style={styles.bulletRow}>
                  <Text style={styles.bulletMark}>•</Text>
                  <Text style={styles.alertBody}>{obligation}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* 7. Next Admissible Move */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRule} />
          <Text style={styles.sectionTitle}>7. Next Admissible Move</Text>
          <View style={styles.narrativePanel}>
            <Text style={styles.narrativeTitle}>Move</Text>
            <Text style={styles.narrativeBody}>{result.nextAdmissibleMove.move}</Text>
          </View>
          <View style={[styles.narrativePanel, { marginTop: 8 }]}>
            <Text style={styles.narrativeTitle}>Rationale</Text>
            <Text style={styles.narrativeBody}>{result.nextAdmissibleMove.rationale}</Text>
          </View>
          <View style={[styles.narrativePanel, { marginTop: 8 }]}>
            <Text style={styles.narrativeTitle}>Cost of Delay</Text>
            <Text style={styles.narrativeBody}>{result.nextAdmissibleMove.costOfDelay}</Text>
          </View>
          <View style={[styles.narrativePanel, { marginTop: 8 }]}>
            <Text style={styles.narrativeTitle}>Time Sensitivity</Text>
            <Text style={styles.narrativeBody}>{result.nextAdmissibleMove.timeSensitivity.replace(/_/g, " ")}</Text>
          </View>
        </View>

        {/* 10. Corridor Bridge */}
        {result.corridorBridge.bridgeJustified && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRule} />
            <Text style={styles.sectionTitle}>10. Corridor Bridge — Escalation Justified</Text>
            <View style={styles.alertPanel}>
              <Text style={styles.alertTitle}>Bridge to {result.corridorBridge.targetSurface}</Text>
              <Text style={styles.alertBody}>{result.corridorBridge.justification}</Text>
            </View>
            <View style={[styles.narrativePanel, { marginTop: 8 }]}>
              <Text style={styles.narrativeTitle}>Bridge Evidence</Text>
              {result.corridorBridge.bridgeEvidence.map((evidence) => (
                <View key={evidence} style={styles.bulletRow}>
                  <Text style={styles.bulletMark}>•</Text>
                  <Text style={styles.bulletText}>{evidence}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Domain Scores */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRule} />
          <Text style={styles.sectionTitle}>Domain Scores</Text>
          <View style={styles.domainTable}>
            <View style={styles.domainHeaderRow}>
              <Text style={styles.domainLabelHeader}>Domain</Text>
              <Text style={styles.domainMetricHeader}>Resonance</Text>
              <Text style={styles.domainMetricHeader}>Certainty</Text>
              <Text style={styles.domainMetricHeader}>Score</Text>
            </View>
            {result.domainProfiles.map((domain, index) => (
              <View
                key={domain.domain}
                style={[
                  styles.domainRow,
                  index === result.domainProfiles.length - 1 ? { borderBottomWidth: 0 } : {},
                ]}
              >
                <Text style={styles.domainLabel}>
                  {ALIGNMENT_DOMAIN_LABELS[domain.domain]}
                </Text>
                <Text style={styles.domainMetric}>{domain.resonance}/10</Text>
                <Text style={styles.domainMetric}>{domain.certainty}/10</Text>
                <Text style={styles.domainMetric}>{domain.percent}%</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Corrections */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRule} />
          <Text style={styles.sectionTitle}>Corrections</Text>
          <View style={styles.listPanel}>
            {result.corrections.map((correction) => (
              <View key={correction} style={styles.bulletRow}>
                <Text style={styles.bulletMark}>•</Text>
                <Text style={styles.bulletText}>{correction}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.closingBand}>
          <Text style={styles.closingText}>
            This dossier was generated by the Abraham of London Purpose Alignment System. 
            It is a governed document. The findings, patterns, and recommendations are based 
            on the user's self-reported responses and the system's structural analysis. 
            This is not a personality assessment. It is a structural reading of alignment 
            under obligation.
          </Text>
        </View>

        <BriefFooterBar
          watermark={watermark}
          reference={reference}
          signAs="The Architect"
        />
      </Page>
    </Document>
  );
}
