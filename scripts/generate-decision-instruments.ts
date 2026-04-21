/**
 * scripts/generate-decision-instruments.ts
 *
 * HARDENED FINAL — 3 premium decision instrument PDFs
 * Each constitutionally distinct in logic, feel, workflow, and visual structure.
 *
 * Run: npx tsx scripts/generate-decision-instruments.ts
 */

import { jsPDF } from "jspdf";
import fs from "fs";
import path from "path";

// ─────────────────────────────────────────────────────────────────────────────
// THEME
// ─────────────────────────────────────────────────────────────────────────────

type RGB = [number, number, number];

const C = {
  black: [20, 20, 22] as RGB,
  dark: [40, 40, 42] as RGB,
  mid: [90, 90, 92] as RGB,
  light: [140, 140, 142] as RGB,
  faint: [210, 210, 210] as RGB,
  gold: [180, 152, 100] as RGB,
  white: [255, 255, 255] as RGB,
  red: [170, 55, 55] as RGB,
  amber: [190, 140, 40] as RGB,
  green: [60, 140, 80] as RGB,
};

const P = { w: 210, h: 297, mx: 20, mt: 22, mb: 20, cw: 170 };

// ─────────────────────────────────────────────────────────────────────────────
// SHARED HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function frame(doc: jsPDF, pg: number, total: number, title: string, cat: string) {
  doc.setDrawColor(...C.faint); doc.setLineWidth(0.3);
  doc.line(P.mx, P.mt, P.w - P.mx, P.mt);
  doc.line(P.mx, P.h - P.mb, P.w - P.mx, P.h - P.mb);
  doc.setFontSize(6.5); doc.setTextColor(...C.light); doc.setFont("helvetica", "normal");
  doc.text("ABRAHAM OF LONDON", P.mx, P.mt - 3);
  doc.text(cat.toUpperCase(), P.w - P.mx, P.mt - 3, { align: "right" });
  doc.setFontSize(6);
  doc.text(title, P.mx, P.h - P.mb + 5);
  doc.text(`${pg} / ${total}`, P.w - P.mx, P.h - P.mb + 5, { align: "right" });
  doc.setFontSize(5.5);
  doc.text("CLASSIFICATION: DECISION INSTRUMENT \u00b7 PAID \u00b7 NOT FOR REDISTRIBUTION", P.mx, P.h - P.mb + 9);
}

function hd(doc: jsPDF, y: number, t: string, sz = 16): number {
  doc.setFontSize(sz); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.black);
  const l = doc.splitTextToSize(t, P.cw); doc.text(l, P.mx, y); return y + l.length * (sz * 0.42) + 3;
}

function lbl(doc: jsPDF, y: number, t: string): number {
  doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.gold);
  doc.text(t.toUpperCase(), P.mx, y); return y + 5;
}

function sub(doc: jsPDF, y: number, t: string, mw?: number): number {
  doc.setFontSize(9.5); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.mid);
  const l = doc.splitTextToSize(t, mw ?? P.cw); doc.text(l, P.mx, y); return y + l.length * 4.2 + 3;
}

function body(doc: jsPDF, y: number, t: string, mw?: number, x?: number): number {
  doc.setFontSize(8.5); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.dark);
  const l = doc.splitTextToSize(t, mw ?? P.cw); doc.text(l, x ?? P.mx, y); return y + l.length * 3.8 + 2;
}

function fld(doc: jsPDF, y: number, label: string, w: number, x?: number): number {
  const sx = x ?? P.mx;
  doc.setFontSize(6.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.mid);
  doc.text(label.toUpperCase(), sx, y);
  doc.setDrawColor(...C.faint); doc.setLineWidth(0.2);
  doc.line(sx, y + 3, sx + w, y + 3);
  return y + 9;
}

function gridCell(doc: jsPDF, x: number, y: number, w: number, h: number, label: string, value: string, color?: RGB) {
  doc.setDrawColor(...C.faint); doc.setLineWidth(0.15);
  doc.rect(x, y, w, h);
  doc.setFontSize(5.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.light);
  doc.text(label.toUpperCase(), x + 2, y + 3.5);
  doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(...(color ?? C.dark));
  const lines = doc.splitTextToSize(value, w - 4);
  doc.text(lines, x + 2, y + 7.5);
}

function outBox(doc: jsPDF, y: number, label: string, h: number): number {
  doc.setDrawColor(...C.gold); doc.setLineWidth(0.4);
  doc.rect(P.mx, y, P.cw, h);
  doc.setFontSize(6.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.gold);
  doc.text(label.toUpperCase(), P.mx + 3, y + 4);
  return y + h + 3;
}

function transition(doc: jsPDF, y: number): number {
  doc.setDrawColor(...C.faint); doc.setLineWidth(0.2); doc.line(P.mx, y, P.mx + P.cw, y);
  y += 5;
  doc.setFontSize(6.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.gold);
  doc.text("SYSTEM TRANSITION", P.mx, y); y += 4;
  doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.mid);
  const t1 = doc.splitTextToSize("If this condition is confirmed, move to Executive Reporting (\u00a395) to price consequence and formalise next action.", P.cw);
  doc.text(t1, P.mx, y); y += t1.length * 3.8 + 2;
  const t2 = doc.splitTextToSize("If intervention is already justified, move to Strategy Room (\u00a3395).", P.cw);
  doc.text(t2, P.mx, y); return y + t2.length * 3.8 + 3;
}

function chk(doc: jsPDF, y: number, items: string[]): number {
  doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.dark);
  for (const item of items) { doc.rect(P.mx, y - 2.8, 2.8, 2.8); doc.text(item, P.mx + 5, y); y += 5.5; }
  return y + 1;
}

function talkTrigger(doc: jsPDF, y: number, text: string): number {
  doc.setDrawColor(...C.gold); doc.setLineWidth(0.3);
  doc.line(P.mx, y, P.mx + 80, y);
  y += 5;
  doc.setFontSize(8.5); doc.setFont("helvetica", "italic"); doc.setTextColor(...C.gold);
  const l = doc.splitTextToSize(`\u201c${text}\u201d`, P.cw);
  doc.text(l, P.mx, y);
  return y + l.length * 4 + 4;
}

// ═════════════════════════════════════════════════════════════════════════════
// ASSET 1 — DECISION EXPOSURE INSTRUMENT (£29)
// Feel: numerical, ledger-like, bounded, financially concrete
// Workflow: define → quantify → weight → classify → act
// ═════════════════════════════════════════════════════════════════════════════

function buildAsset1(): Uint8Array {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const T = "Decision Exposure Instrument";
  const CAT = "Decision Instrument \u00b7 \u00a329";

  // ── PAGE 1: DEFINE ────────────────────────────────────────────────────────
  frame(doc, 1, 4, T, CAT);
  let y = 28;
  y = lbl(doc, y, "Page 1 \u2014 Define the Decision");
  y = hd(doc, y, "Decision Exposure Instrument");
  y = sub(doc, y, "Quantifies the cost of being wrong before the market enforces it.");
  y += 2;
  y = fld(doc, y, "Decision under review (one sentence)", 150);
  y = fld(doc, y, "Decision owner (name + role)", 120);
  y = fld(doc, y, "Scope: team / department / organisation / market", 130);
  y = fld(doc, y, "Timeframe: when must this be resolved?", 100);
  y = fld(doc, y, "Current escalation status", 80);
  y += 3;

  // Reference bands table
  y = lbl(doc, y, "Reference Bands \u2014 use to bound your estimates");
  doc.setFontSize(6); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.mid);
  const cols = [P.mx, P.mx + 34, P.mx + 68, P.mx + 102, P.mx + 136];
  const headers = ["Revenue Band", "Headcount", "Sector Pressure", "Weekly Delay Cost", "Multiplier"];
  headers.forEach((h, i) => doc.text(h.toUpperCase(), cols[i], y));
  y += 3; doc.setDrawColor(...C.faint); doc.line(P.mx, y, P.mx + P.cw, y); y += 3;

  const rows = [
    ["< \u00a31M", "< 20", "Low", "\u00a3500\u2013\u00a32,000/wk", "\u00d71.0"],
    ["\u00a31M\u2013\u00a310M", "20\u2013100", "Moderate", "\u00a32,000\u2013\u00a310,000/wk", "\u00d71.5"],
    ["\u00a310M\u2013\u00a350M", "100\u2013500", "High", "\u00a310,000\u2013\u00a350,000/wk", "\u00d72.0"],
    ["\u00a350M+", "500+", "Critical", "\u00a350,000+/wk", "\u00d73.0"],
  ];
  doc.setFontSize(6.5); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.dark);
  for (const row of rows) {
    row.forEach((cell, i) => doc.text(cell, cols[i], y));
    y += 4;
  }
  y += 3;
  y = fld(doc, y, "Your selected band (circle or write)", 100);
  y = fld(doc, y, "Your weekly delay cost estimate (\u00a3)", 80);

  // ── PAGE 2: QUANTIFY ──────────────────────────────────────────────────────
  doc.addPage(); frame(doc, 2, 4, T, CAT); y = 28;
  y = lbl(doc, y, "Page 2 \u2014 Quantify Exposure Dimensions");
  y = hd(doc, y, "Exposure Inputs", 13);
  y += 1;
  doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.mid);
  doc.text("Score each dimension 1\u20135. Reference: 1 = negligible, 2 = minor, 3 = moderate, 4 = severe, 5 = existential.", P.mx, y); y += 6;

  const dims = [
    ["Revenue Dependency", "How much revenue depends on this decision being correct?"],
    ["Cost Sensitivity", "If wrong, what is the cost impact? (direct + indirect)"],
    ["Supply / Delivery Risk", "How fragile is the delivery chain if this decision fails?"],
    ["Reversibility", "Can this decision be undone? (5 = fully irreversible)"],
    ["Concentration Risk", "Does failure create a single point of failure elsewhere?"],
  ];

  for (const [name, desc] of dims) {
    doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.dark);
    doc.text(name, P.mx, y);
    // Score boxes
    for (let i = 1; i <= 5; i++) {
      const bx = P.mx + 115 + (i - 1) * 8;
      doc.setDrawColor(...C.faint); doc.rect(bx, y - 3, 6, 4);
      doc.setFontSize(5.5); doc.setTextColor(...C.light); doc.text(String(i), bx + 2, y);
    }
    y += 4;
    doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.light);
    doc.text(desc, P.mx + 2, y); y += 7;
  }

  y += 2;
  y = fld(doc, y, "Sum of 5 scores (5\u201325) = Raw Exposure Score", 100);
  y = fld(doc, y, "Number of dependencies blocked by this decision", 80);
  y = fld(doc, y, "Political / reputational multiplier (0\u20135)", 80);
  y += 4;
  y = lbl(doc, y, "Composite Formula");
  y = body(doc, y, "Composite Exposure = (Raw Score \u00d7 Dependency Count) + Political Multiplier");
  y = fld(doc, y, "Your Composite Exposure Score", 80);

  // ── PAGE 3: WEIGHT — WORKED EXAMPLE ───────────────────────────────────────
  doc.addPage(); frame(doc, 3, 4, T, CAT); y = 28;
  y = lbl(doc, y, "Page 3 \u2014 Weight: Worked Example + Thresholds");
  y = hd(doc, y, "Exposure Calculation", 13);
  y += 1;

  // Worked example
  y = lbl(doc, y, "Worked Example");
  const exLines = [
    "Decision: Delay hiring Head of Operations (vacancy 8 weeks)",
    "Revenue Dependency: 4  |  Cost Sensitivity: 3  |  Supply Risk: 2  |  Reversibility: 3  |  Concentration: 4",
    "Raw Score: 16  |  Dependencies Blocked: 3  |  Political Multiplier: 2",
    "Composite: (16 \u00d7 3) + 2 = 50",
    "Weekly delay cost: \u00a38,000  |  Annual if unresolved: \u00a3416,000",
    "Classification: EXPOSED  |  Implication: Material downside accumulating",
  ];
  doc.setFontSize(7.5); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.dark);
  for (const line of exLines) { doc.text(line, P.mx + 2, y); y += 4.5; }
  y += 4;

  // Thresholds
  y = lbl(doc, y, "Published Thresholds");
  const thresholds = [
    { label: "CONTAINED", range: "Composite < 25", color: C.green, desc: "Exposure is bounded. Decision can proceed with standard oversight." },
    { label: "EXPOSED", range: "Composite 25\u201360", color: C.amber, desc: "Material downside exists. Requires explicit ownership and deadline." },
    { label: "CRITICAL", range: "Composite > 60", color: C.red, desc: "Structural or financial exposure is severe. Escalation required." },
  ];
  for (const t of thresholds) {
    doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(...t.color);
    doc.text(t.label, P.mx, y);
    doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.mid);
    doc.text(t.range, P.mx + 30, y);
    y += 4;
    doc.setFontSize(7.5); doc.setTextColor(...C.dark);
    doc.text(t.desc, P.mx + 2, y); y += 7;
  }

  y += 3;
  y = lbl(doc, y, "Your Probability-Weighted Exposure");
  y = fld(doc, y, "Probability of adverse outcome (%)", 80);
  y = fld(doc, y, "Estimated financial impact if adverse (\u00a3)", 100);
  y = fld(doc, y, "Probability-weighted exposure = probability \u00d7 impact (\u00a3)", 120);
  y += 3;
  y = fld(doc, y, "Estimated annual exposure if unresolved: weekly cost \u00d7 52 (\u00a3)", 130);

  // ── PAGE 4: CLASSIFY + ACT ────────────────────────────────────────────────
  doc.addPage(); frame(doc, 4, 4, T, CAT); y = 28;
  y = lbl(doc, y, "Page 4 \u2014 Classify and Act");
  y = hd(doc, y, "Decision Exposure Output", 14);
  y += 2;

  // Classification
  y = chk(doc, y, [
    "CONTAINED \u2014 exposure bounded, proceed with oversight",
    "EXPOSED \u2014 material downside, requires ownership + deadline",
    "CRITICAL \u2014 severe exposure, escalation required immediately",
  ]);
  y += 3;

  y = outBox(doc, y, "Estimated Annual Exposure (\u00a3)", 14);
  y = outBox(doc, y, "Classification", 10);
  y = outBox(doc, y, "Decision Implication (one sentence)", 16);
  y = outBox(doc, y, "Immediate Next Move", 14);
  y = outBox(doc, y, "Escalation Note (if Critical)", 14);

  y += 4;
  y = talkTrigger(doc, y, "Most decisions feel ambiguous until the cost is forced into view.");
  y += 2;
  y = body(doc, y, "Feeds into Executive Reporting: Financial Exposure, Priority Stack, Escalation Logic.");
  y += 2;
  y = transition(doc, y);

  // First-use instruction
  y += 2;
  doc.setFontSize(6.5); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.light);
  doc.text("First use: Complete pages 1\u20132 (10 min). Use page 3 reference to calculate. Record output on page 4.", P.mx, y);

  return doc.output("arraybuffer") as unknown as Uint8Array;
}

// ═════════════════════════════════════════════════════════════════════════════
// ASSET 2 — MANDATE CLARITY FRAMEWORK (£49)
// Feel: structural-political, matrix-led, diagrammatic, authority-revealing
// Workflow: map → challenge → classify → correct → govern
// ═════════════════════════════════════════════════════════════════════════════

function buildAsset2(): Uint8Array {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const T = "Mandate Clarity Framework";
  const CAT = "Decision Framework \u00b7 \u00a349";

  // ── PAGE 1: MAP — Authority Map ───────────────────────────────────────────
  frame(doc, 1, 5, T, CAT); let y = 28;
  y = lbl(doc, y, "Page 1 \u2014 Map the Authority");
  y = hd(doc, y, "Mandate Clarity Framework");
  y = sub(doc, y, "Maps where authority is real, assumed, fragmented, or absent.");
  y += 2;
  y = fld(doc, y, "Decision domain (one sentence defining scope)", 150);
  y += 2;

  // Authority map — 4 quadrant visual
  y = lbl(doc, y, "Authority Map");
  const quadW = 82, quadH = 32;
  const quads = [
    { x: P.mx, y, label: "FORMAL AUTHORITY", sub: "Documented, approved, legally valid", color: C.green },
    { x: P.mx + quadW + 6, y, label: "ACTUAL AUTHORITY", sub: "Who makes the decision in practice", color: C.dark },
    { x: P.mx, y: y + quadH + 4, label: "SPONSOR AUTHORITY", sub: "Who funds, backs, or enables this domain", color: C.gold },
    { x: P.mx + quadW + 6, y: y + quadH + 4, label: "CONTESTED / SHADOW", sub: "Overlapping claims, undocumented power", color: C.red },
  ];
  for (const q of quads) {
    doc.setDrawColor(...q.color); doc.setLineWidth(0.4); doc.rect(q.x, q.y, quadW, quadH);
    doc.setFontSize(6.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...q.color);
    doc.text(q.label, q.x + 2, q.y + 4.5);
    doc.setFontSize(6); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.light);
    doc.text(q.sub, q.x + 2, q.y + 8.5);
    // Input lines inside each quadrant
    for (let i = 0; i < 3; i++) {
      doc.setDrawColor(...C.faint); doc.setLineWidth(0.1);
      doc.line(q.x + 2, q.y + 14 + i * 6, q.x + quadW - 2, q.y + 14 + i * 6);
    }
  }
  y += (quadH * 2) + 10;
  y = fld(doc, y, "Last formal mandate review (date)", 80);
  y = fld(doc, y, "Mismatch between formal and actual (describe)", 150);

  // ── PAGE 2: CHALLENGE — Forcing Questions ─────────────────────────────────
  doc.addPage(); frame(doc, 2, 5, T, CAT); y = 28;
  y = lbl(doc, y, "Page 2 \u2014 Challenge: Forcing Questions");
  y = hd(doc, y, "Mandate Sub-Scores", 13);
  y += 1;
  y = body(doc, y, "Score each block 0\u201325. Answer every question honestly. Total = Mandate Clarity Score (0\u2013100).");
  y += 2;

  const blocks = [
    { title: "A. Formal Authority Clarity (0\u201325)", qs: [
      "Is the decision owner documented in writing?",
      "Does the owner have budget authority matching the decision scope?",
      "Is the mandate current (reviewed within 12 months)?",
      "Does the owner know they own this decision?",
      "Would a new hire be able to find this mandate in writing?",
    ]},
    { title: "B. Actual Decision Behaviour (0\u201325)", qs: [
      "In the last 3 decisions, who actually decided?",
      "Did the documented owner make the call, or was it someone else?",
      "Were any decisions made by default (inaction = decision)?",
      "Is there a pattern of decisions being escalated unnecessarily?",
    ]},
    { title: "C. Escalation Coherence (0\u201325)", qs: [
      "Is the escalation path from this decision domain documented?",
      "Has the escalation path been used successfully in the last 6 months?",
      "Is there a defined trigger for when escalation is appropriate?",
      "Does the escalation target accept escalations from this domain?",
    ]},
    { title: "D. Contested / Shadow Authority Load (0\u201325)", qs: [
      "Are there two or more people who believe they own this decision?",
      "Has anyone exercised authority in this domain without formal mandate?",
      "Are there approval bottlenecks that add unofficial veto power?",
      "Is there a stakeholder whose informal influence overrides the formal owner?",
    ]},
  ];

  for (const block of blocks) {
    y = lbl(doc, y, block.title);
    for (const q of block.qs) {
      doc.setFontSize(7.5); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.dark);
      doc.text(q, P.mx + 2, y);
      // Yes/No/Partial boxes
      doc.setFontSize(5); doc.setTextColor(...C.light);
      doc.text("Y", P.mx + 140, y); doc.rect(P.mx + 143, y - 2.5, 3, 3);
      doc.text("N", P.mx + 149, y); doc.rect(P.mx + 152, y - 2.5, 3, 3);
      doc.text("P", P.mx + 158, y); doc.rect(P.mx + 161, y - 2.5, 3, 3);
      y += 5;
    }
    y = fld(doc, y, `${block.title.split(".")[0]}. Sub-Score`, 50);
    y += 1;
  }

  // ── PAGE 3: CLASSIFY ──────────────────────────────────────────────────────
  doc.addPage(); frame(doc, 3, 5, T, CAT); y = 28;
  y = lbl(doc, y, "Page 3 \u2014 Classify the Mandate");
  y = hd(doc, y, "Mandate Classification", 13);
  y += 1;

  y = fld(doc, y, "Total Mandate Clarity Score (A + B + C + D)", 80);
  y += 3;

  const classes = [
    { label: "CLEAR", range: "75\u2013100", color: C.green, path: "Maintain current structure. Schedule quarterly review." },
    { label: "FRAGMENTED", range: "50\u201374", color: C.amber, path: "Consolidate ownership. Eliminate overlapping mandates. Document escalation. Review in 60 days." },
    { label: "DELAYED", range: "25\u201349", color: C.mid, path: "Remove approval bottlenecks. Accelerate mandate documentation. Escalate to sponsor for resolution. Review in 30 days." },
    { label: "ABSENT", range: "0\u201324", color: C.red, path: "Immediate mandate assignment required. Escalate to board/sponsor. No decisions in this domain until ownership is resolved." },
  ];

  for (const cls of classes) {
    doc.setDrawColor(...cls.color); doc.setLineWidth(0.4);
    doc.rect(P.mx, y, P.cw, 20);
    doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(...cls.color);
    doc.text(cls.label, P.mx + 3, y + 5);
    doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.mid);
    doc.text(`Score: ${cls.range}`, P.mx + 35, y + 5);
    doc.setFontSize(7); doc.setTextColor(...C.dark);
    const pathLines = doc.splitTextToSize(`Corrective path: ${cls.path}`, P.cw - 8);
    doc.text(pathLines, P.mx + 3, y + 10);
    y += 23;
  }

  y += 4;
  y = lbl(doc, y, "Recommended Review Cadence");
  y = body(doc, y, "CLEAR = Quarterly  |  FRAGMENTED = 60 days  |  DELAYED = 30 days  |  ABSENT = Immediate reset");

  // ── PAGE 4: CORRECT ───────────────────────────────────────────────────────
  doc.addPage(); frame(doc, 4, 5, T, CAT); y = 28;
  y = lbl(doc, y, "Page 4 \u2014 Correct: Friction Diagnosis");
  y = hd(doc, y, "Friction Detection", 13);
  y += 1;

  const frictions = [
    { name: "Overlapping Mandate", desc: "Two or more parties claim decision ownership in the same domain." },
    { name: "Absent Mandate", desc: "No one formally owns this decision. It is made by default or crisis." },
    { name: "Shadow Authority", desc: "Someone exercises power without documented authority." },
    { name: "Approval Bottleneck", desc: "Decision requires sign-off that creates structural delay." },
  ];

  for (const f of frictions) {
    doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.dark);
    doc.text(f.name, P.mx, y);
    doc.setFontSize(5.5); doc.setTextColor(...C.light);
    doc.text("PRESENT", P.mx + 115, y); doc.rect(P.mx + 130, y - 2.5, 3, 3);
    doc.text("ABSENT", P.mx + 138, y); doc.rect(P.mx + 152, y - 2.5, 3, 3);
    y += 4;
    doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.mid);
    doc.text(f.desc, P.mx + 2, y); y += 4;
    y = fld(doc, y, "Instance (describe)", 140);
    y = fld(doc, y, "Impact on decision quality", 140);
    y += 2;
  }

  // ── PAGE 5: GOVERN — Output ───────────────────────────────────────────────
  doc.addPage(); frame(doc, 5, 5, T, CAT); y = 28;
  y = lbl(doc, y, "Page 5 \u2014 Govern: Output");
  y = hd(doc, y, "Mandate Clarity Output", 14);
  y += 2;

  y = outBox(doc, y, "Mandate Classification (Clear / Fragmented / Delayed / Absent)", 12);
  y = outBox(doc, y, "Mandate Clarity Score (0\u2013100)", 10);
  y = outBox(doc, y, "Structural Implication", 16);
  y = outBox(doc, y, "Corrective Next Move", 16);
  y = outBox(doc, y, "Review Cadence (Quarterly / 60d / 30d / Immediate)", 10);
  y = outBox(doc, y, "Escalation Risk", 14);

  y += 4;
  y = talkTrigger(doc, y, "Most organisations do not lack leadership. They lack clean authority.");
  y += 2;
  y = body(doc, y, "Feeds into Executive Reporting: Authority Scope, Sponsor/Board Section, Decision Logic, Strategy Qualification.");
  y += 2;
  y = transition(doc, y);
  y += 2;
  doc.setFontSize(6.5); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.light);
  doc.text("First use: Complete authority map (page 1), answer forcing questions (page 2), classify (page 3), diagnose frictions (page 4), record output (page 5).", P.mx, y);

  return doc.output("arraybuffer") as unknown as Uint8Array;
}

// ═════════════════════════════════════════════════════════════════════════════
// ASSET 3 — INTERVENTION PATH SELECTOR (£79)
// Feel: command-oriented, consequential, decisive, closest to escalation
// Workflow: read condition → compare paths → resolve conflict → select → execute
// ═════════════════════════════════════════════════════════════════════════════

function buildAsset3(): Uint8Array {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const T = "Intervention Path Selector";
  const CAT = "Decision Toolkit \u00b7 \u00a379";

  // ── PAGE 1: READ CONDITION ────────────────────────────────────────────────
  frame(doc, 1, 5, T, CAT); let y = 28;
  y = lbl(doc, y, "Page 1 \u2014 Read the Condition");
  y = hd(doc, y, "Intervention Path Selector");
  y = sub(doc, y, "Determines what should happen next when action can no longer be deferred.");
  y += 2;

  y = fld(doc, y, "Problem statement (one sentence)", 150);
  y += 1;

  // Condition scoring — each as a labelled scale
  const conditions = [
    { name: "Escalation Level", anchors: ["Operational", "Strategic", "Existential"] },
    { name: "Urgency", anchors: ["Months", "Weeks", "Immediate"] },
    { name: "Evidence Sufficiency", anchors: ["Insufficient", "Adequate", "Decisive"] },
    { name: "Authority Constraint", anchors: ["None", "Partial", "Severe"] },
  ];

  for (const c of conditions) {
    doc.setFontSize(7.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.dark);
    doc.text(c.name.toUpperCase(), P.mx, y); y += 4;
    for (let i = 1; i <= 5; i++) {
      const bx = P.mx + (i - 1) * 18;
      doc.setDrawColor(...C.faint); doc.rect(bx, y, 15, 5);
      doc.setFontSize(6); doc.setTextColor(...C.light);
      doc.text(String(i), bx + 6, y + 3.5);
    }
    doc.setFontSize(5.5); doc.setTextColor(...C.light);
    doc.text(c.anchors[0], P.mx, y + 8);
    doc.text(c.anchors[1], P.mx + 36, y + 8);
    doc.text(c.anchors[2], P.mx + 72, y + 8);
    y += 12;
  }

  y += 1;
  y = fld(doc, y, "Primary tension signals (up to 3)", 150);
  y = fld(doc, y, "Previous intervention attempts", 150);
  y = fld(doc, y, "Resources available for intervention", 130);

  // ── PAGE 2: COMPARE PATHS ─────────────────────────────────────────────────
  doc.addPage(); frame(doc, 2, 5, T, CAT); y = 28;
  y = lbl(doc, y, "Page 2 \u2014 Compare Intervention Paths");
  y = hd(doc, y, "Path Comparison Matrix", 13);
  y += 1;
  y = body(doc, y, "Score each path 1\u20135 on three dimensions. Net = Feasibility + Time Fit \u2013 Failure Risk. Highest net = recommended.");
  y += 3;

  const paths = [
    { name: "STABILISE", desc: "Fix within current authority and resources. No structural change.", color: C.green },
    { name: "RESTRUCTURE", desc: "Requires new authority, team composition, or process redesign.", color: C.amber },
    { name: "ESCALATE", desc: "Exceeds current leadership mandate. Higher authority must act.", color: C.red },
    { name: "MONITOR", desc: "Evidence insufficient or timing premature. Accumulate and observe.", color: C.mid },
  ];

  for (const p of paths) {
    doc.setDrawColor(...p.color); doc.setLineWidth(0.4);
    doc.rect(P.mx, y, P.cw, 24);
    doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(...p.color);
    doc.text(p.name, P.mx + 3, y + 5);
    doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.mid);
    doc.text(p.desc, P.mx + 3, y + 10);

    // Score row inside box
    const scoreY = y + 15;
    doc.setFontSize(6.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.dark);
    doc.text("Feasibility: ___/5", P.mx + 3, scoreY);
    doc.text("Time Fit: ___/5", P.mx + 45, scoreY);
    doc.text("Failure Risk: ___/5", P.mx + 85, scoreY);
    doc.text("NET: ___", P.mx + 130, scoreY);
    y += 27;
  }

  // ── PAGE 3: RESOLVE CONFLICT ──────────────────────────────────────────────
  doc.addPage(); frame(doc, 3, 5, T, CAT); y = 28;
  y = lbl(doc, y, "Page 3 \u2014 Resolve Conflict + Select Path");
  y = hd(doc, y, "Path Conflict Resolution", 13);
  y += 1;

  // Tie-breaker rules
  y = lbl(doc, y, "Tie-Breaker Rules (when two paths score within 1 point)");
  const tieBreakers = [
    "STABILISE vs RESTRUCTURE \u2192 Default to RESTRUCTURE. Stabilisation in ambiguous conditions delays necessary structural change.",
    "STABILISE vs ESCALATE \u2192 Default to ESCALATE. If escalation is plausible, the mandate gap is already too wide for local stabilisation.",
    "RESTRUCTURE vs ESCALATE \u2192 Default to ESCALATE. Restructuring without higher authority usually produces cosmetic change.",
    "Any path vs MONITOR \u2192 Default to the active path. Monitoring is only correct when evidence is genuinely insufficient.",
  ];
  for (const rule of tieBreakers) {
    doc.setFontSize(7.5); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.dark);
    const lines = doc.splitTextToSize(rule, P.cw - 4);
    doc.text(lines, P.mx + 2, y);
    y += lines.length * 3.8 + 3;
  }
  y += 3;

  // Selected path
  y = lbl(doc, y, "Selected Path");
  y = chk(doc, y, ["STABILISE", "RESTRUCTURE", "ESCALATE", "MONITOR"]);
  y += 3;
  y = fld(doc, y, "Rationale for selection (one sentence)", 150);

  // Fallback
  y += 3;
  y = lbl(doc, y, "Fallback Trigger Logic");
  y = body(doc, y, "If the selected path fails, what specific signal triggers the fallback? Define the condition, not just the alternative.");
  y = fld(doc, y, "Fallback path", 80);
  y = fld(doc, y, "Trigger condition (what must happen to activate fallback)", 150);
  y = fld(doc, y, "Trigger timeline (by when must the signal appear)", 100);

  // Strategy Room readiness
  y += 4;
  y = lbl(doc, y, "Strategy Room Readiness Indicator");
  y = chk(doc, y, [
    "Evidence is sufficient to justify intervention",
    "Authority constraints are identified and documented",
    "Consequence has been priced (or can be priced in Executive Reporting)",
    "Escalation is not premature \u2014 local resolution has been attempted or ruled out",
  ]);
  y += 1;
  doc.setFontSize(7.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.gold);
  doc.text("If all 4 boxes are checked: this condition is ready for Strategy Room (\u00a3395).", P.mx, y);

  // ── PAGE 4: EXECUTE — Ordered Intervention Stack ──────────────────────────
  doc.addPage(); frame(doc, 4, 5, T, CAT); y = 28;
  y = lbl(doc, y, "Page 4 \u2014 Execute: Ordered Intervention Stack");
  y = hd(doc, y, "Intervention Stack", 13);
  y += 1;
  y = body(doc, y, "Define 3\u20135 ordered actions for the selected path. Each action needs: dependency, urgency, effect, resistance, and failure signal.");
  y += 2;

  for (let i = 1; i <= 4; i++) {
    doc.setDrawColor(...C.faint); doc.setLineWidth(0.15);
    doc.rect(P.mx, y, P.cw, 30);
    doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.gold);
    doc.text(`ACTION ${i}`, P.mx + 2, y + 4);
    doc.setFontSize(5.5); doc.setTextColor(...C.light);
    doc.text("\u25A1 Immediate   \u25A1 Short-term   \u25A1 Structural", P.mx + 90, y + 4);
    // Fields inside
    const fy = y + 7;
    doc.setDrawColor(...C.faint);
    doc.setFontSize(6); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.mid);
    doc.text("ACTION:", P.mx + 2, fy); doc.line(P.mx + 18, fy + 1, P.mx + P.cw - 2, fy + 1);
    doc.text("DEPENDS ON:", P.mx + 2, fy + 5); doc.line(P.mx + 24, fy + 6, P.mx + 80, fy + 6);
    doc.text("LIKELY RESISTANCE:", P.mx + 2, fy + 10); doc.line(P.mx + 32, fy + 11, P.mx + P.cw - 2, fy + 11);
    doc.text("EXPECTED EFFECT:", P.mx + 2, fy + 15); doc.line(P.mx + 30, fy + 16, P.mx + 80, fy + 16);
    doc.text("FAILURE SIGNAL:", P.mx + 85, fy + 15); doc.line(P.mx + 108, fy + 16, P.mx + P.cw - 2, fy + 16);
    doc.text("REASSESS IF:", P.mx + 2, fy + 20); doc.line(P.mx + 22, fy + 21, P.mx + P.cw - 2, fy + 21);
    y += 33;
  }

  // ── PAGE 5: OUTPUT ────────────────────────────────────────────────────────
  doc.addPage(); frame(doc, 5, 5, T, CAT); y = 28;
  y = lbl(doc, y, "Page 5 \u2014 Output");
  y = hd(doc, y, "Intervention Path Output", 14);
  y += 2;

  y = outBox(doc, y, "Selected Path (Stabilise / Restructure / Escalate / Monitor)", 12);
  y = outBox(doc, y, "Ordered Actions (summary, 1\u20135)", 25);
  y = outBox(doc, y, "Risk Note", 16);
  y = outBox(doc, y, "Escalation Decision", 14);
  y = outBox(doc, y, "Strategy Room Ready? (Yes / No + reason)", 12);

  y += 4;
  y = talkTrigger(doc, y, "Wrong intervention does not slow recovery. It compounds failure.");
  y += 2;
  y = body(doc, y, "Feeds into Executive Reporting: Governed Recommendations, Priority Stack, Decision Logic, Strategy Room Bridge.");
  y += 2;
  y = transition(doc, y);
  y += 2;
  doc.setFontSize(6.5); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.light);
  doc.text("First use: Read condition (p1), compare paths (p2), resolve + select (p3), build stack (p4), record output (p5).", P.mx, y);

  return doc.output("arraybuffer") as unknown as Uint8Array;
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN
// ═════════════════════════════════════════════════════════════════════════════

const OUT = path.join(process.cwd(), "private", "assets", "paid-instruments");

const assets = [
  { slug: "decision-exposure-instrument", build: buildAsset1 },
  { slug: "mandate-clarity-framework", build: buildAsset2 },
  { slug: "intervention-path-selector", build: buildAsset3 },
];

for (const a of assets) {
  const bytes = a.build();
  const p = path.join(OUT, `${a.slug}.pdf`);
  fs.writeFileSync(p, Buffer.from(bytes));
  const sz = fs.statSync(p).size;
  console.log(`\u2713 ${a.slug}.pdf \u2014 ${(sz / 1024).toFixed(1)} KB`);
}
console.log(`\nDone. ${assets.length} hardened instruments generated.`);
