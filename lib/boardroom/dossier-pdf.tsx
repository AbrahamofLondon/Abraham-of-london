import React from "react";
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type {
  BoardAction,
  BoardroomDossier,
  BreachEntry,
  ContradictionEntry,
  DecisionPortfolioEntry,
  OutcomeEntry,
  RiskExposureEntry,
} from "./dossier-types";

export type DossierPdfProps = {
  dossier: BoardroomDossier;
  organisationName: string;
  customerName?: string | null;
  orderId?: string | null;
  referenceId?: string | null;
  artifactHash?: string | null;
};

const colours = {
  paper: "#F5F0E8",
  ink: "#1A1814",
  brass: "#B8943F",
  silver: "#8A8A8A",
  panel: "#EDE8DC",
  softPanel: "#FAF7F0",
  risk: "#8A2F2F",
  proof: "#2E6F4E",
};

const font = {
  serif: "Times-Roman",
  serifBold: "Times-Bold",
  sans: "Times-Roman",
  sansBold: "Times-Bold",
  mono: "Courier",
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: colours.paper,
    color: colours.ink,
    fontFamily: font.sans,
    padding: 42,
  },
  coverPage: {
    backgroundColor: colours.paper,
    color: colours.ink,
    fontFamily: font.sans,
    padding: 50,
  },
  coverIdentity: {
    fontFamily: font.serif,
    fontSize: 26,
    color: colours.brass,
    marginBottom: 98,
  },
  coverTitle: {
    fontFamily: font.serifBold,
    fontSize: 42,
    letterSpacing: 1.5,
    marginBottom: 14,
  },
  brassRule: {
    height: 1,
    backgroundColor: colours.brass,
    width: 150,
    marginBottom: 16,
  },
  coverReference: {
    fontFamily: font.mono,
    fontSize: 9,
    letterSpacing: 1.2,
    color: colours.silver,
    marginBottom: 130,
  },
  coverFooter: {
    borderTopWidth: 0.5,
    borderTopColor: colours.brass,
    paddingTop: 14,
    flexDirection: "row",
    gap: 18,
  },
  coverFooterCol: {
    flex: 1,
  },
  coverFooterLabel: {
    fontFamily: font.mono,
    fontSize: 7,
    letterSpacing: 1,
    color: colours.silver,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  coverFooterValue: {
    fontFamily: font.serifBold,
    fontSize: 10,
    lineHeight: 1.3,
  },
  transmissionTitle: {
    fontFamily: font.mono,
    fontSize: 10,
    letterSpacing: 2,
    color: colours.brass,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  sectionKicker: {
    fontFamily: font.mono,
    fontSize: 8,
    letterSpacing: 1.5,
    color: colours.brass,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  sectionTitle: {
    fontFamily: font.serifBold,
    fontSize: 24,
    lineHeight: 1.15,
    marginBottom: 12,
  },
  body: {
    fontSize: 10.2,
    lineHeight: 1.55,
    color: colours.ink,
  },
  muted: {
    fontSize: 8.5,
    lineHeight: 1.45,
    color: colours.silver,
  },
  metadataPanel: {
    backgroundColor: colours.panel,
    borderWidth: 0.5,
    borderColor: "#D8CDBA",
    padding: 14,
    marginTop: 12,
    marginBottom: 16,
  },
  metadataRow: {
    flexDirection: "row",
    borderBottomWidth: 0.25,
    borderBottomColor: "#D8CDBA",
    paddingVertical: 6,
  },
  metadataKey: {
    width: 145,
    fontFamily: font.mono,
    fontSize: 7.5,
    letterSpacing: 0.8,
    color: colours.silver,
    textTransform: "uppercase",
  },
  metadataValue: {
    flex: 1,
    fontSize: 9.5,
    lineHeight: 1.35,
  },
  weightStatement: {
    fontFamily: font.serif,
    fontSize: 15,
    lineHeight: 1.45,
    marginVertical: 22,
  },
  sectionPageHeader: {
    borderBottomWidth: 0.5,
    borderBottomColor: colours.brass,
    paddingBottom: 10,
    marginBottom: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },
  headerMeta: {
    fontFamily: font.mono,
    fontSize: 7,
    color: colours.silver,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  sectionBody: {
    flex: 1,
  },
  panel: {
    backgroundColor: colours.softPanel,
    borderWidth: 0.5,
    borderColor: "#D8CDBA",
    padding: 12,
    marginBottom: 10,
  },
  table: {
    borderWidth: 0.5,
    borderColor: "#D8CDBA",
    marginTop: 8,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.25,
    borderBottomColor: "#D8CDBA",
  },
  tableHeader: {
    backgroundColor: colours.panel,
  },
  tableCell: {
    flex: 1,
    padding: 7,
    fontSize: 8.4,
    lineHeight: 1.35,
  },
  tableCellNarrow: {
    width: 72,
    padding: 7,
    fontSize: 8.4,
    lineHeight: 1.35,
  },
  tableHeading: {
    fontFamily: font.mono,
    fontSize: 7,
    color: colours.brass,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  bulletRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 7,
  },
  bulletMark: {
    width: 12,
    fontFamily: font.mono,
    fontSize: 9,
    color: colours.brass,
  },
  bulletText: {
    flex: 1,
    fontSize: 9.6,
    lineHeight: 1.42,
  },
  footer: {
    borderTopWidth: 0.25,
    borderTopColor: "#D8CDBA",
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  footerText: {
    fontFamily: font.mono,
    fontSize: 7,
    color: colours.silver,
  },
});

function cleanText(value: unknown, fallback = "Not provided."): string {
  if (value === null || value === undefined) return fallback;
  const text = String(value)
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text || fallback;
}

function truncate(value: unknown, max = 500, fallback = "Not provided."): string {
  const text = cleanText(value, fallback);
  if (text.length <= max) return text;
  return `${text.slice(0, Math.max(0, max - 16)).trim()} [...continued]`;
}

function formatDate(value: unknown): string {
  const raw = cleanText(value, "");
  const date = raw ? new Date(raw) : new Date();
  if (Number.isNaN(date.getTime())) return raw || "Undated";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: currency || "GBP",
      maximumFractionDigits: 0,
    }).format(amount || 0);
  } catch {
    return `${currency || "GBP"} ${Math.round(amount || 0)}`;
  }
}

function deriveReference(props: DossierPdfProps): string {
  if (props.referenceId) return cleanText(props.referenceId, "");
  const date = new Date(props.dossier.generatedAt);
  const stamp = Number.isNaN(date.getTime())
    ? "UNDATED"
    : `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, "0")}${String(date.getUTCDate()).padStart(2, "0")}`;
  const order = cleanText(props.orderId || props.dossier.organisationId, "UNFILED")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 10)
    .toUpperCase();
  return `AoL-BB-${order}-${stamp}`;
}

function preparedFor(props: DossierPdfProps): string {
  return cleanText(props.customerName || props.organisationName, "Boardroom client");
}

function severityFromRisk(entry: RiskExposureEntry | BreachEntry): string {
  if ("breachCount" in entry && entry.breachCount >= 3) return "High";
  if ("escalationLevel" in entry && cleanText(entry.escalationLevel, "").toLowerCase().includes("critical")) return "High";
  return "Medium";
}

function hasItems<T>(items: T[] | undefined | null): items is T[] {
  return Array.isArray(items) && items.length > 0;
}

const EmptyState = ({ children }: { children: React.ReactNode }) => (
  <View style={styles.panel}>
    <Text style={styles.muted}>{children}</Text>
  </View>
);

const Bullet = ({ children }: { children: React.ReactNode }) => (
  <View style={styles.bulletRow}>
    <Text style={styles.bulletMark}>-</Text>
    <Text style={styles.bulletText}>{children}</Text>
  </View>
);

function CoverPage(props: DossierPdfProps & { reference: string; issueDate: string }) {
  return (
    <Page size="A4" style={styles.coverPage}>
      <Text style={styles.coverIdentity}>Abraham of London</Text>
      <Text style={styles.coverTitle}>BOARDROOM BRIEF</Text>
      <View style={styles.brassRule} />
      <Text style={styles.coverReference}>{props.reference}</Text>

      <View style={styles.coverFooter}>
        <View style={styles.coverFooterCol}>
          <Text style={styles.coverFooterLabel}>Prepared for</Text>
          <Text style={styles.coverFooterValue}>{preparedFor(props)}</Text>
        </View>
        <View style={styles.coverFooterCol}>
          <Text style={styles.coverFooterLabel}>Issue date</Text>
          <Text style={styles.coverFooterValue}>{props.issueDate}</Text>
        </View>
        <View style={styles.coverFooterCol}>
          <Text style={styles.coverFooterLabel}>Classification</Text>
          <Text style={styles.coverFooterValue}>BOARDROOM · CONFIDENTIAL</Text>
        </View>
      </View>
    </Page>
  );
}

function Footer({ reference, pageLabel }: { reference: string; pageLabel: string }) {
  return (
    <View style={styles.footer}>
      <Text style={styles.footerText}>Abraham of London · Boardroom Dossier</Text>
      <Text style={styles.footerText}>{reference} · {pageLabel}</Text>
    </View>
  );
}

function TransmissionPage(props: DossierPdfProps & { reference: string; issueDate: string }) {
  const hash = props.artifactHash ? truncate(props.artifactHash, 90, "") : "Pending final artifact hash";

  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.transmissionTitle}>Transmission Note</Text>
      <View style={styles.brassRule} />

      <View style={styles.metadataPanel}>
        <View style={styles.metadataRow}>
          <Text style={styles.metadataKey}>Issuer</Text>
          <Text style={styles.metadataValue}>Abraham of London · Alomarada Ltd</Text>
        </View>
        <View style={styles.metadataRow}>
          <Text style={styles.metadataKey}>Reference</Text>
          <Text style={styles.metadataValue}>{props.reference}</Text>
        </View>
        <View style={styles.metadataRow}>
          <Text style={styles.metadataKey}>Prepared for</Text>
          <Text style={styles.metadataValue}>{preparedFor(props)}</Text>
        </View>
        <View style={styles.metadataRow}>
          <Text style={styles.metadataKey}>Order</Text>
          <Text style={styles.metadataValue}>{cleanText(props.orderId, "Not linked to an order record in this export.")}</Text>
        </View>
        <View style={styles.metadataRow}>
          <Text style={styles.metadataKey}>Issue date</Text>
          <Text style={styles.metadataValue}>{props.issueDate}</Text>
        </View>
        <View style={styles.metadataRow}>
          <Text style={styles.metadataKey}>Artifact hash</Text>
          <Text style={styles.metadataValue}>{hash}</Text>
        </View>
      </View>

      <Text style={styles.weightStatement}>
        This brief was prepared on the basis of the submitted intake, available boardroom telemetry,
        and Abraham of London's structured review of the decision context. It is intended for serious
        reading, controlled circulation, and governed follow-through.
      </Text>

      <View style={styles.panel}>
        <Text style={styles.sectionKicker}>Scope Note</Text>
        <Text style={styles.body}>
          The document uses decision, authority, risk, commitment, breach, outcome, and financial
          signals available for the stated period. Where fields were incomplete, assumptions and
          evidence gaps are stated explicitly rather than hidden in the judgement.
        </Text>
      </View>

      <View style={styles.panel}>
        <Text style={styles.sectionKicker}>What Follows</Text>
        <Text style={styles.body}>
          The dossier begins with the executive judgement before moving through pressure diagnosis,
          intake facts, assumptions, risk exposure, objections, decision paths, falsification questions,
          outcome hypothesis, delivery note, and feedback instruction.
        </Text>
      </View>

      <View style={styles.panel}>
        <Text style={styles.sectionKicker}>Circulation</Text>
        <Text style={styles.body}>
          BOARDROOM · CONFIDENTIAL. Prepared for {preparedFor(props)}. Not for redistribution without
          express authorisation.
        </Text>
      </View>

      <Footer reference={props.reference} pageLabel="2" />
    </Page>
  );
}

function SectionPage({
  number,
  title,
  reference,
  children,
}: {
  number: number;
  title: string;
  reference: string;
  children: React.ReactNode;
}) {
  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.sectionPageHeader}>
        <Text style={styles.headerMeta}>BOARDROOM · CONFIDENTIAL</Text>
        <Text style={styles.headerMeta}>{reference}</Text>
      </View>
      <View style={styles.sectionBody}>
        <Text style={styles.sectionKicker}>Section {String(number).padStart(2, "0")}</Text>
        <Text style={styles.sectionTitle}>{title}</Text>
        {children}
      </View>
      <Footer reference={reference} pageLabel={`Section ${number}`} />
    </Page>
  );
}

function ExecutiveJudgement({ dossier }: { dossier: BoardroomDossier }) {
  return (
    <Text style={styles.body}>
      {truncate(dossier.executiveSummary, 1100, "No executive judgement was generated for this dossier.")}
    </Text>
  );
}

function PressureDiagnosis({ dossier }: { dossier: BoardroomDossier }) {
  const pressureLines = [
    `${dossier.decisionPortfolio.length} active decision records in the reviewed period.`,
    `${dossier.topContradictions.length} contradiction signals requiring board attention.`,
    `${dossier.riskExposure.length + dossier.breaches.length} live risk or breach signals.`,
    `${dossier.openCommitments.length} open commitments against the decision estate.`,
  ];

  return (
    <View>
      {pressureLines.map((line) => <Bullet key={line}>{line}</Bullet>)}
      {dossier.sovereignSignalAssessment ? (
        <View style={styles.panel}>
          <Text style={styles.sectionKicker}>Signal Exposure</Text>
          <Text style={styles.body}>
            Sovereign signal assessment attached. Evidence strength should be read with the original
            signal context and not as an independent market claim.
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function IntakeFacts({ decisions }: { decisions: DecisionPortfolioEntry[] }) {
  if (!hasItems(decisions)) return <EmptyState>No decision intake records were available for this period.</EmptyState>;

  return (
    <View>
      {decisions.slice(0, 6).map((decision) => (
        <View key={decision.decisionId} style={styles.panel}>
          <Text style={styles.sectionKicker}>{cleanText(decision.sourceStage, "Decision")}</Text>
          <Text style={styles.body}>{truncate(decision.decisionText)}</Text>
          <Text style={styles.muted}>
            Domain {cleanText(decision.affectedDomain, "unclassified")} · Confidence {decision.confidence} · Velocity {decision.decisionVelocityScore}
          </Text>
        </View>
      ))}
    </View>
  );
}

function Assumptions({ dossier }: { dossier: BoardroomDossier }) {
  const missing = dossier.dataCompleteness?.missingFields ?? [];
  return (
    <View>
      <Text style={styles.body}>
        Data completeness score: {dossier.dataCompleteness?.score ?? 0}. The judgement assumes that
        missing records do not materially reverse the decision pressure unless listed below.
      </Text>
      <View style={{ marginTop: 12 }}>
        {hasItems(missing)
          ? missing.map((field) => <Bullet key={field}>{field}</Bullet>)
          : <EmptyState>No missing fields were declared by the dossier builder.</EmptyState>}
      </View>
    </View>
  );
}

function RiskMap({ risks, breaches }: { risks: RiskExposureEntry[]; breaches: BreachEntry[] }) {
  const rows = [
    ...risks.map((risk) => ({
      id: risk.contractId,
      risk: risk.commitment,
      type: "Execution",
      severity: severityFromRisk(risk),
      status: risk.status,
    })),
    ...breaches.map((breach) => ({
      id: breach.contractId,
      risk: breach.commitment,
      type: "Governance",
      severity: severityFromRisk(breach),
      status: breach.escalationLevel,
    })),
  ];

  if (!hasItems(rows)) return <EmptyState>No risk exposure records were available.</EmptyState>;

  return (
    <View style={styles.table}>
      <View style={[styles.tableRow, styles.tableHeader]}>
        <Text style={[styles.tableCell, styles.tableHeading]}>Risk</Text>
        <Text style={[styles.tableCellNarrow, styles.tableHeading]}>Type</Text>
        <Text style={[styles.tableCellNarrow, styles.tableHeading]}>Severity</Text>
        <Text style={[styles.tableCellNarrow, styles.tableHeading]}>Status</Text>
      </View>
      {rows.slice(0, 9).map((row) => (
        <View key={`${row.id}-${row.status}`} style={styles.tableRow}>
          <Text style={styles.tableCell}>{truncate(row.risk, 180)}</Text>
          <Text style={styles.tableCellNarrow}>{row.type}</Text>
          <Text style={styles.tableCellNarrow}>{row.severity}</Text>
          <Text style={styles.tableCellNarrow}>{truncate(row.status, 45)}</Text>
        </View>
      ))}
    </View>
  );
}

function ObjectionHandling({ contradictions }: { contradictions: ContradictionEntry[] }) {
  if (!hasItems(contradictions)) {
    return <EmptyState>No contradiction records were available. A human reviewer should still test the judgement against an opposing view before delivery.</EmptyState>;
  }

  return (
    <View>
      {contradictions.slice(0, 5).map((entry, index) => (
        <View key={`${entry.type}-${index}`} style={styles.panel}>
          <Text style={styles.sectionKicker}>{entry.type} · {entry.severity}</Text>
          <Text style={styles.body}>{truncate(entry.message, 420)}</Text>
          <Text style={styles.muted}>
            Opposing claims: {truncate(entry.userA?.claim, 160)} / {truncate(entry.userB?.claim, 160)}
          </Text>
        </View>
      ))}
    </View>
  );
}

function DecisionPaths({ actions }: { actions: BoardAction[] }) {
  if (!hasItems(actions)) return <EmptyState>No board action path was generated.</EmptyState>;

  return (
    <View>
      {actions.slice(0, 5).map((action, index) => (
        <View key={`${action.category}-${index}`} style={styles.panel}>
          <Text style={styles.sectionKicker}>{action.priority} · {action.category}</Text>
          <Text style={styles.body}>{truncate(action.description, 420)}</Text>
        </View>
      ))}
    </View>
  );
}

function NextMove({ actions }: { actions: BoardAction[] }) {
  const next = actions.find((action) => action.priority === "critical") ?? actions[0];
  if (!next) {
    return <Text style={styles.body}>The next admissible move is manual review: the available dossier data is not sufficient to recommend a board action without additional context.</Text>;
  }
  return (
    <View style={styles.panel}>
      <Text style={styles.sectionKicker}>{next.priority} · {next.category}</Text>
      <Text style={styles.body}>{truncate(next.description, 700)}</Text>
    </View>
  );
}

function EvidenceGaps({ dossier }: { dossier: BoardroomDossier }) {
  const gaps = dossier.dataCompleteness?.missingFields ?? [];
  return (
    <View>
      {hasItems(gaps)
        ? gaps.map((gap) => <Bullet key={gap}>{gap}</Bullet>)
        : <EmptyState>No explicit evidence gaps were declared. This does not remove the need for reviewer challenge before delivery.</EmptyState>}
    </View>
  );
}

function FalsificationQuestions({ dossier }: { dossier: BoardroomDossier }) {
  const questions = [
    "What new evidence would materially weaken the executive judgement above?",
    "Which stakeholder would credibly dispute the risk classification, and on what evidence?",
    "Which assumption would change the recommended next move if it proved false?",
    dossier.topContradictions[0]
      ? `If the contradiction "${truncate(dossier.topContradictions[0].type, 80)}" resolves against the current view, what changes?`
      : "If a hidden contradiction appears after delivery, which section of the judgement should be reopened first?",
    "What outcome signal should be checked next quarter to test whether the recommendation held?",
  ];

  return <View>{questions.map((question) => <Bullet key={question}>{question}</Bullet>)}</View>;
}

function OutcomeHypothesis({ outcomes, financialImpact }: { outcomes: OutcomeEntry[]; financialImpact: BoardroomDossier["financialImpact"] }) {
  const recovered = formatCurrency(financialImpact.totalRecovered, financialImpact.currency);
  const delay = formatCurrency(financialImpact.totalCostOfDelay, financialImpact.currency);

  return (
    <View>
      <Text style={styles.body}>
        If the recommended path is followed under current conditions, the dossier expects risk exposure
        to reduce through clearer ownership, earlier escalation, and disciplined review of unresolved commitments.
      </Text>
      <View style={styles.metadataPanel}>
        <View style={styles.metadataRow}>
          <Text style={styles.metadataKey}>Recovered value</Text>
          <Text style={styles.metadataValue}>{recovered}</Text>
        </View>
        <View style={styles.metadataRow}>
          <Text style={styles.metadataKey}>Cost of delay</Text>
          <Text style={styles.metadataValue}>{delay}</Text>
        </View>
        <View style={styles.metadataRow}>
          <Text style={styles.metadataKey}>Verified outcomes</Text>
          <Text style={styles.metadataValue}>{outcomes.length}</Text>
        </View>
      </View>
      {hasItems(outcomes) ? (
        outcomes.slice(0, 4).map((outcome) => (
          <Bullet key={outcome.outcomeId}>
            {outcome.outcomeClassification}: effectiveness {outcome.effectivenessScore}, velocity delta {outcome.decisionVelocityDelta}.
          </Bullet>
        ))
      ) : (
        <EmptyState>No verified outcome record is linked yet. Treat outcome claims as pending until tested.</EmptyState>
      )}
    </View>
  );
}

export function BoardroomDossierDocument(props: DossierPdfProps) {
  const reference = deriveReference(props);
  const issueDate = formatDate(props.dossier.generatedAt);

  return (
    <Document
      title={`Boardroom Dossier ${reference}`}
      author="Abraham of London"
      subject="Boardroom Brief"
      creator="Abraham of London"
      producer="Abraham of London"
    >
      <CoverPage {...props} reference={reference} issueDate={issueDate} />
      <TransmissionPage {...props} reference={reference} issueDate={issueDate} />

      <SectionPage number={1} title="Executive Judgement" reference={reference}>
        <ExecutiveJudgement dossier={props.dossier} />
      </SectionPage>
      <SectionPage number={2} title="Decision Pressure Diagnosis" reference={reference}>
        <PressureDiagnosis dossier={props.dossier} />
      </SectionPage>
      <SectionPage number={3} title="Intake Facts" reference={reference}>
        <IntakeFacts decisions={props.dossier.decisionPortfolio} />
      </SectionPage>
      <SectionPage number={4} title="Our Assumptions" reference={reference}>
        <Assumptions dossier={props.dossier} />
      </SectionPage>
      <SectionPage number={5} title="Risk Exposure Map" reference={reference}>
        <RiskMap risks={props.dossier.riskExposure} breaches={props.dossier.breaches} />
      </SectionPage>
      <SectionPage number={6} title="Objection Handling" reference={reference}>
        <ObjectionHandling contradictions={props.dossier.topContradictions} />
      </SectionPage>
      <SectionPage number={7} title="Decision Paths" reference={reference}>
        <DecisionPaths actions={props.dossier.recommendedBoardActions} />
      </SectionPage>
      <SectionPage number={8} title="Next Admissible Move" reference={reference}>
        <NextMove actions={props.dossier.recommendedBoardActions} />
      </SectionPage>
      <SectionPage number={9} title="Evidence Gaps" reference={reference}>
        <EvidenceGaps dossier={props.dossier} />
      </SectionPage>
      <SectionPage number={10} title="Falsification Questions" reference={reference}>
        <FalsificationQuestions dossier={props.dossier} />
      </SectionPage>
      <SectionPage number={11} title="Outcome Hypothesis" reference={reference}>
        <OutcomeHypothesis
          outcomes={props.dossier.verifiedOutcomes}
          financialImpact={props.dossier.financialImpact}
        />
      </SectionPage>
      <SectionPage number={12} title="Delivery Note" reference={reference}>
        <Text style={styles.body}>
          Prepared on {issueDate} by Abraham of London. This dossier should be read as a governed
          decision artefact, not as a generic report. If new evidence changes a material assumption,
          the judgement should be reopened rather than informally amended.
        </Text>
      </SectionPage>
      <SectionPage number={13} title="Feedback Instruction" reference={reference}>
        <Text style={styles.body}>
          Challenge, clarify, or return this report through the designated Abraham of London delivery
          route. Serious feedback on accuracy, evidence quality, trust, or outcome relevance should
          trigger human review and may update the evidence spine.
        </Text>
      </SectionPage>
    </Document>
  );
}
