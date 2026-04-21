/**
 * scripts/generate-case-dossiers.ts — HARDENED FINAL
 *
 * Institutional-grade case dossiers with:
 * classification panel, signal register, counterfactual,
 * decision frame, board actions, system trace.
 *
 * Run: npx tsx scripts/generate-case-dossiers.ts
 */

import { jsPDF } from "jspdf";
import fs from "fs";
import path from "path";

type RGB = [number, number, number];
const C = {
  black: [20, 20, 22] as RGB, dark: [40, 40, 42] as RGB, mid: [90, 90, 92] as RGB,
  light: [140, 140, 142] as RGB, faint: [210, 210, 210] as RGB, gold: [180, 152, 100] as RGB,
  red: [170, 55, 55] as RGB, green: [60, 140, 80] as RGB,
};
const P = { w: 210, h: 297, mx: 22, mt: 24, mb: 22, cw: 166 };

function frame(doc: jsPDF, pg: number, total: number, title: string, cls: string) {
  doc.setDrawColor(...C.faint); doc.setLineWidth(0.3);
  doc.line(P.mx, P.mt, P.w - P.mx, P.mt); doc.line(P.mx, P.h - P.mb, P.w - P.mx, P.h - P.mb);
  doc.setFontSize(6.5); doc.setTextColor(...C.light); doc.setFont("helvetica", "normal");
  doc.text("ABRAHAM OF LONDON", P.mx, P.mt - 4);
  doc.text("CASE DOSSIER \u00b7 " + cls.toUpperCase(), P.w - P.mx, P.mt - 4, { align: "right" });
  doc.setFontSize(6);
  doc.text(title, P.mx, P.h - P.mb + 5);
  doc.text(`${pg} / ${total}`, P.w - P.mx, P.h - P.mb + 5, { align: "right" });
  doc.setFontSize(5.5);
  doc.text("CLASSIFICATION: CASE EVIDENCE \u00b7 INSTITUTIONAL USE \u00b7 NOT FOR PUBLIC CIRCULATION", P.mx, P.h - P.mb + 9);
}

function lbl(doc: jsPDF, y: number, t: string): number {
  doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.gold);
  doc.text(t.toUpperCase(), P.mx, y); return y + 5;
}

function hd(doc: jsPDF, y: number, t: string, sz = 14): number {
  doc.setFontSize(sz); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.black);
  const l = doc.splitTextToSize(t, P.cw); doc.text(l, P.mx, y); return y + l.length * (sz * 0.4) + 3;
}

function txt(doc: jsPDF, y: number, t: string, color?: RGB): number {
  doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(...(color ?? C.dark));
  const l = doc.splitTextToSize(t, P.cw); doc.text(l, P.mx, y); return y + l.length * 3.6 + 2;
}

function metaRow(doc: jsPDF, y: number, label: string, value: string, gold = false): number {
  doc.setFontSize(6); doc.setFont("helvetica", "bold"); doc.setTextColor(...(gold ? C.gold : C.light));
  doc.text(label.toUpperCase(), P.mx + 2, y);
  doc.setFontSize(7.5); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.dark);
  const l = doc.splitTextToSize(value, P.cw - 42);
  doc.text(l, P.mx + 40, y); return y + Math.max(l.length * 3.5, 5) + 1;
}

function basisTag(doc: jsPDF, x: number, y: number, basis: string, label: string): number {
  const color = basis === "Observed" ? C.green : basis === "Modelled" ? [190, 140, 40] as RGB : basis === "Anonymised" ? C.gold : C.light;
  doc.setFontSize(5); doc.setFont("helvetica", "bold"); doc.setTextColor(...color);
  doc.text(`[${basis.toUpperCase()}]`, x, y);
  doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.dark);
  doc.text(label, x + 24, y);
  return y + 4;
}

function bullet(doc: jsPDF, y: number, items: string[], color?: RGB): number {
  doc.setFontSize(7.5); doc.setFont("helvetica", "normal"); doc.setTextColor(...(color ?? C.dark));
  for (const item of items) {
    const l = doc.splitTextToSize("\u2022  " + item, P.cw - 4);
    doc.text(l, P.mx + 2, y); y += l.length * 3.5 + 1.5;
  }
  return y + 1;
}

function numberedList(doc: jsPDF, y: number, items: string[]): number {
  for (let i = 0; i < items.length; i++) {
    doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.gold);
    doc.text(String(i + 1).padStart(2, "0"), P.mx + 2, y);
    doc.setFontSize(7.5); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.dark);
    const l = doc.splitTextToSize(items[i], P.cw - 14);
    doc.text(l, P.mx + 12, y); y += l.length * 3.5 + 2;
  }
  return y + 1;
}

// ═════════════════════════════════════════════════════════════════════════════

type Dossier = {
  slug: string;
  title: string;
  conditionType: string;
  domain: string;
  confidence: string;
  evidenceBasis: Array<{ label: string; basis: string }>;
  decisionRelevance: string;
  context: string;
  primarySignals: string[];
  secondarySignals: string[];
  systemInterpretation: string;
  classification: string;
  reclassification: string;
  wrongAction: string;
  resultOfPath: string;
  requiredDecision: string;
  constraints: string[];
  implications: string[];
  boardActions: string[];
  systemFeeds: string[];
  principle: string;
  systemLinkLabel: string;
};

const D: Dossier[] = [
  {
    slug: "case-dossier-tariff-shock",
    title: "When Growth Models Broke Under Tariff Shock",
    conditionType: "Structural Inflection",
    domain: "Market Regime / Institutional Positioning",
    confidence: "High",
    evidenceBasis: [
      { label: "Tariff repricing magnitude", basis: "Observed" },
      { label: "Consensus positioning data", basis: "Observed" },
      { label: "Institutional repositioning lag", basis: "Observed" },
      { label: "Exposure compounding estimate", basis: "Modelled" },
    ],
    decisionRelevance: "Portfolio allocation, growth-dependency assumptions, decision-delay cost",
    context: "April 2026. US\u2013China tariff escalation repriced import costs by 15\u201340% across key sectors in under 72 hours.",
    primarySignals: [
      "Growth consensus priced into equity, credit, and forward earnings across Q2 2026",
      "Tariff announcements repriced import costs 15\u201340% in under 72 hours",
      "Institutional positioning calibrated to a growth regime that ceased to exist",
    ],
    secondarySignals: [
      "Credit spreads widened before equity indices corrected",
      "Supply-chain forward contracts repriced before spot markets",
      "Consensus analyst revisions lagged repricing by 4\u20136 weeks",
    ],
    systemInterpretation: "Regime change, not correction. Growth-model dependency was structural, not cyclical.",
    classification: "STRUCTURAL BREAK",
    reclassification: "Growth \u2192 Survivability",
    wrongAction: "Treating the tariff shock as a temporary dislocation and maintaining growth allocations.",
    resultOfPath: "Reversion did not come. Structural break compounded for 6 weeks. Estimated additional exposure: 12\u201318% drawdown for late movers.",
    requiredDecision: "Reclassify regime from growth to survivability and reallocate accordingly.",
    constraints: ["Consensus had not yet moved", "Mandate inertia in institutional allocators", "Political sensitivity of tariff-driven repositioning"],
    implications: [
      "Growth assumptions must be stress-tested against trade regime shifts",
      "Decision delay during structural breaks compounds exposure geometrically",
      "Consensus lag is not caution \u2014 it is unpriced risk",
    ],
    boardActions: [
      "Mandate regime-break stress test for all growth-dependent allocations",
      "Establish 72-hour tariff-event decision protocol",
      "Require survivability scenario in quarterly portfolio review",
      "Flag consensus-dependent positioning as standing risk item",
      "Commission Executive Reporting to price current exposure",
    ],
    systemFeeds: [
      "Executive Reporting \u2014 Financial Exposure / regime-break detection",
      "Decision Exposure Instrument \u2014 Reversibility and concentration risk",
      "Intelligence layer \u2014 Tariff-driven structural repricing signals",
    ],
    principle: "The cost of waiting for consensus to confirm a structural break is the break itself.",
    systemLinkLabel: "Executive Reporting",
  },
  {
    slug: "case-dossier-team-alignment-illusion",
    title: "The Illusion of Team Alignment Under Pressure",
    conditionType: "Hidden Divergence",
    domain: "Team Governance / Execution Coherence",
    confidence: "High",
    evidenceBasis: [
      { label: "Leadership self-assessment (4 domains)", basis: "Observed" },
      { label: "Team respondent scores (n=34)", basis: "Observed" },
      { label: "OKR/reporting gap analysis", basis: "Observed" },
      { label: "Restructuring impact projection", basis: "Inferred" },
    ],
    decisionRelevance: "Restructuring decisions, team investment, governance reporting accuracy",
    context: "Mid-size firm. Leadership reported 85% alignment. Team respondents (n=34) scored 42\u201358%.",
    primarySignals: [
      "Leadership rated alignment at 85% across 4 domains",
      "Team respondents scored 42\u201358% on same domains",
      "Gap not visible in performance reviews, OKRs, or management reporting",
    ],
    secondarySignals: [
      "Highest divergence in Strategic Alignment (85% vs 42%)",
      "Narrowest gap in Operational Velocity (80% vs 58%)",
      "Exit interview data retrospectively consistent with divergence",
    ],
    systemInterpretation: "Alignment assumed at top, contradicted at base. Standard governance did not detect.",
    classification: "HIDDEN DIVERGENCE",
    reclassification: "Aligned \u2192 Structurally Fractured",
    wrongAction: "Proceeding with restructuring based on leadership\u2019s alignment reading.",
    resultOfPath: "Intervention would have amplified divergence. Projected dissonance increase from 30\u201343 to 50\u201365 points within 90 days.",
    requiredDecision: "Halt restructuring. Measure execution-layer alignment before structural change.",
    constraints: ["Restructuring already approved by board", "Leadership confidence in alignment was high", "No precedent for overriding leadership self-assessment"],
    implications: [
      "Alignment cannot be assessed from the top \u2014 must be measured at execution level",
      "Restructuring under assumed alignment carries compounding risk",
      "Standard governance instruments do not detect perception divergence",
    ],
    boardActions: [
      "Require execution-layer alignment measurement before restructuring",
      "Add team perception gap to governance risk register",
      "Mandate bi-annual Team Assessment for units above 20 headcount",
      "Flag leadership self-assessment as insufficient for structural decisions",
    ],
    systemFeeds: [
      "Diagnostics \u2014 Team Assessment / perception gap measurement",
      "Mandate Clarity Framework \u2014 Authority divergence detection",
      "Executive Reporting \u2014 Team coherence index",
    ],
    principle: "What leadership believes about alignment is not evidence. Measurement is.",
    systemLinkLabel: "Diagnostics",
  },
  {
    slug: "case-dossier-escalation-denied",
    title: "Why Escalation Was Denied (And That Saved the System)",
    conditionType: "Premature Escalation",
    domain: "Escalation Governance / Evidence Sufficiency",
    confidence: "High",
    evidenceBasis: [
      { label: "Failure mode identification (3 domains)", basis: "Observed" },
      { label: "Escalation readiness score", basis: "Observed" },
      { label: "Evidence sufficiency assessment", basis: "Observed" },
      { label: "Board response projection", basis: "Inferred" },
      { label: "Root cause attribution", basis: "Anonymised" },
    ],
    decisionRelevance: "Escalation timing, evidence threshold governance, intervention sequencing",
    context: "Institutional client. Three failure modes active. Leadership requested immediate board-level escalation.",
    primarySignals: [
      "Three failure modes active: mandate drift, execution fragility, stakeholder misalignment",
      "Leadership requested immediate escalation to board level",
      "Surface signals alarming \u2014 evidence base incomplete",
    ],
    secondarySignals: [
      "Escalation readiness score: 38/100",
      "Evidence documented in 1 of 3 failure domains only",
      "Stakeholder misalignment reported, not measured",
    ],
    systemInterpretation: "Signal severity high. Evidence readiness low. Escalation under these conditions amplifies risk.",
    classification: "PREMATURE ESCALATION",
    reclassification: "Escalate \u2192 Gather Evidence",
    wrongAction: "Escalating to board with incomplete evidence.",
    resultOfPath: "Board would demand restructuring targeting symptoms. Root cause (mandate drift) reinforced. Projected: 60\u201390 day crisis recurrence.",
    requiredDecision: "Deny escalation. Complete evidence gathering across all 3 failure domains.",
    constraints: ["Leadership urgency was genuine", "Political cost of denial was high", "Failure signals were real, even if evidence was partial"],
    implications: [
      "Escalation is not always the correct response to urgency",
      "Signal severity and evidence readiness are independent variables",
      "Governed escalation criteria prevent compounding intervention errors",
    ],
    boardActions: [
      "Adopt escalation readiness threshold (minimum 65/100 before board engagement)",
      "Require evidence coverage across all failure domains before escalation",
      "Separate urgency assessment from evidence assessment in protocols",
      "Document escalation denials as governed decisions",
      "Commission full evidence gathering with 14-day deadline",
    ],
    systemFeeds: [
      "Strategy Room \u2014 Entry gated by evidence sufficiency",
      "Escalation Readiness Scorecard \u2014 38/100 triggered denial",
      "Intervention Path Selector \u2014 Monitor path selected",
      "Executive Reporting \u2014 Evidence completeness scoring",
    ],
    principle: "The discipline to deny escalation under pressure is a system capability, not a failure.",
    systemLinkLabel: "Strategy Room",
  },
];

function buildDossier(d: Dossier): Uint8Array {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const totalPages = 4;

  // PAGE 1 — Classification + Context + Signal Register
  frame(doc, 1, totalPages, d.title, d.conditionType); let y = 30;
  y = hd(doc, y, d.title, 13); y += 1;

  // Classification panel
  doc.setDrawColor(...C.gold); doc.setLineWidth(0.3);
  const panelTop = y;
  y = lbl(doc, y, "Case Classification"); y += 1;
  y = metaRow(doc, y, "Condition Type", d.conditionType, true);
  y = metaRow(doc, y, "Domain", d.domain);
  y = metaRow(doc, y, "Confidence", d.confidence);
  y = metaRow(doc, y, "Relevance", d.decisionRelevance);
  y += 2;
  doc.setFontSize(5.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.light);
  doc.text("EVIDENCE BASIS", P.mx + 2, y); y += 3;
  for (const eb of d.evidenceBasis) { y = basisTag(doc, P.mx + 2, y, eb.basis, eb.label); }
  y += 2;
  doc.rect(P.mx, panelTop - 3, P.cw, y - panelTop + 4);
  y += 4;

  // Context
  y = txt(doc, y, d.context);
  y += 2;

  // Signal register
  y = lbl(doc, y, "Primary Signals");
  y = bullet(doc, y, d.primarySignals);
  y = lbl(doc, y, "Secondary Signals");
  y = bullet(doc, y, d.secondarySignals, C.mid);
  doc.setDrawColor(...C.gold); doc.setLineWidth(0.2);
  doc.line(P.mx, y, P.mx + 3, y); y += 3;
  doc.setFontSize(6); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.gold);
  doc.text("SYSTEM INTERPRETATION", P.mx, y); y += 4;
  y = txt(doc, y, d.systemInterpretation);

  // PAGE 2 — Classification + Counterfactual
  doc.addPage(); frame(doc, 2, totalPages, d.title, d.conditionType); y = 30;
  y = lbl(doc, y, "System Classification");
  doc.setFontSize(11); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.gold);
  doc.text(d.classification, P.mx, y); y += 5;
  doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.mid);
  doc.text(d.reclassification, P.mx, y); y += 8;

  // Counterfactual
  y = lbl(doc, y, "Counterfactual");
  doc.setDrawColor(...C.red); doc.setLineWidth(0.3);
  const cfTop = y;
  doc.setFontSize(6); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.red);
  doc.text("WRONG ACTION", P.mx + 3, y + 1); y += 5;
  y = txt(doc, y, d.wrongAction); y += 2;
  doc.setFontSize(6); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.red);
  doc.text("RESULT OF THAT PATH", P.mx + 3, y); y += 4;
  doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(140, 55, 55);
  const rl = doc.splitTextToSize(d.resultOfPath, P.cw - 8);
  doc.text(rl, P.mx + 3, y); y += rl.length * 3.6 + 3;
  doc.rect(P.mx, cfTop - 3, P.cw, y - cfTop + 4);
  y += 6;

  // Decision frame
  y = lbl(doc, y, "Decision Frame");
  doc.setFontSize(6); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.light);
  doc.text("REQUIRED DECISION", P.mx + 2, y); y += 4;
  y = txt(doc, y, d.requiredDecision); y += 2;
  doc.setFontSize(6); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.light);
  doc.text("CONSTRAINTS", P.mx + 2, y); y += 4;
  y = bullet(doc, y, d.constraints, C.mid);

  // PAGE 3 — Implications + Board Actions
  doc.addPage(); frame(doc, 3, totalPages, d.title, d.conditionType); y = 30;
  y = lbl(doc, y, "Outcome / Implications");
  y = bullet(doc, y, d.implications); y += 4;

  y = lbl(doc, y, "Board-Level Actions");
  doc.setDrawColor(...C.faint); doc.setLineWidth(0.15);
  const actTop = y;
  y = numberedList(doc, y, d.boardActions);
  doc.rect(P.mx, actTop - 2, P.cw, y - actTop + 3);

  // PAGE 4 — System Trace
  doc.addPage(); frame(doc, 4, totalPages, d.title, d.conditionType); y = 30;
  doc.setDrawColor(...C.gold); doc.setLineWidth(0.3);
  const stTop = y;
  y = lbl(doc, y, "System Trace"); y += 1;
  y = bullet(doc, y, d.systemFeeds);
  y += 3;
  doc.setDrawColor(...C.gold); doc.setLineWidth(0.2);
  doc.line(P.mx + 2, y, P.mx + 40, y); y += 4;
  doc.setFontSize(8.5); doc.setFont("helvetica", "italic"); doc.setTextColor(...C.gold);
  const pl = doc.splitTextToSize(`\u201c${d.principle}\u201d`, P.cw - 8);
  doc.text(pl, P.mx + 2, y); y += pl.length * 4 + 4;
  doc.rect(P.mx, stTop - 3, P.cw, y - stTop + 4);

  return doc.output("arraybuffer") as unknown as Uint8Array;
}

const OUT = path.join(process.cwd(), "private_storage", "premium-content", "case-dossiers");
for (const d of D) {
  const bytes = buildDossier(d);
  const p = path.join(OUT, `${d.slug}.pdf`);
  fs.writeFileSync(p, Buffer.from(bytes));
  console.log(`\u2713 ${d.slug}.pdf \u2014 ${(fs.statSync(p).size / 1024).toFixed(1)} KB`);
}
console.log(`\nDone. ${D.length} hardened case dossiers generated.`);
