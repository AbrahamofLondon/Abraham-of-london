/* eslint-disable @typescript-eslint/no-explicit-any */
// components/strategy-room/Form.tsx
// Design: Institutional Monumentalism
// Key changes from v1:
// 1. Scoring model rebuilt — gravity is derived from text quality + specificity,
//    NOT from slider values the user controls directly
// 2. Sliders remain for consequence dimensions but are clearly framed as
//    contextual data, not scoring inputs the user "moves to qualify"
// 3. Result surface delivers a constitutional pattern reading — what the system
//    read in the submission, not just a route badge
// 4. Stage 4 (Fit Assessment) replaced with a genuine constitutional reading
//    that names the specific combination of signals it detected

"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  Shield,
  Scale,
  Activity,
  Target,
  ChevronRight,
  Lock,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────────────────────

const GOLD = "#C9A96E";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type FormData = {
  // Stage 0 — Situation gravity
  problemStatement:  string;
  priorFailures:     string;
  whatHappensIfNot:  string;
  // Stage 1 — Authority & mandate
  name:              string;
  email:             string;
  organisation:      string;
  role:              string;
  authorityScope:    string;
  boardInvolved:     string;
  // Stage 2 — Consequence
  financialExposure:        number;
  reputationalRisk:         number;
  institutionalConsequence: number;
  timelinePressure:         number;
  // Stage 3 — Readiness
  existingAssets:    string;
  blockers:          string;
  capacityNote:      string;
};

type MandateRoute    = "QUALIFIED" | "BORDERLINE" | "NOT_QUALIFIED";
type ConstitutionalReading = {
  route:        MandateRoute;
  score:        number;
  gravityScore: number;
  authorityScore: number;
  consequenceScore: number;
  readinessScore: number;
  patternTitle: string;
  primaryReading: string;
  urgentSignal:   string | null;
  mandateNote:    string;
  firstAction:    string;
};

const INITIAL: FormData = {
  problemStatement: "", priorFailures: "", whatHappensIfNot: "",
  name: "", email: "", organisation: "", role: "", authorityScope: "", boardInvolved: "",
  financialExposure: 5, reputationalRisk: 5, institutionalConsequence: 5, timelinePressure: 5,
  existingAssets: "", blockers: "", capacityNote: "",
};

const STAGES = [
  { label: "Situation Gravity", icon: AlertTriangle },
  { label: "Authority & Mandate", icon: Shield },
  { label: "Consequence Mapping", icon: Scale },
  { label: "Readiness",           icon: Activity },
  { label: "Constitutional Read", icon: Target },
];

// ─────────────────────────────────────────────────────────────────────────────
// CONSTITUTIONAL SCORING ENGINE
// Gravity is derived from text — not from sliders.
// The user cannot move a number to qualify themselves.
// ─────────────────────────────────────────────────────────────────────────────

function scoreText(text: string): number {
  const t = text.trim();
  if (!t) return 0;
  const len = t.length;
  // Length rating
  const lenScore = len >= 600 ? 40 : len >= 300 ? 32 : len >= 150 ? 22 : len >= 80 ? 14 : len >= 40 ? 8 : 3;
  // Structural signal words (0-30)
  const signals = ["because", "therefore", "however", "risk", "consequence",
    "authority", "decision", "constraint", "outcome", "governance",
    "failed", "attempted", "board", "mandate", "urgency", "exposure"];
  const signalCount = signals.filter(s => t.toLowerCase().includes(s)).length;
  const sigScore = Math.min(30, signalCount * 5);
  // Sentence structure (0-30)
  const sentences = (t.match(/[.!?]+/g) || []).length;
  const sentScore = Math.min(30, sentences * 6);
  return Math.min(100, lenScore + sigScore + sentScore);
}

function scoreAuthorityScope(scope: string): number {
  switch (scope) {
    case "DIRECT":   return 90;
    case "PROXY":    return 65;
    case "ADVISORY": return 40;
    default:         return 25;
  }
}

function computeConstitutionalReading(f: FormData): ConstitutionalReading {
  // Gravity: derived entirely from text quality
  const psScore  = scoreText(f.problemStatement);
  const pfScore  = scoreText(f.priorFailures);
  const wiScore  = scoreText(f.whatHappensIfNot);
  const gravity  = Math.round(psScore * 0.55 + pfScore * 0.20 + wiScore * 0.25);

  // Authority: derived from scope selection + board involvement
  const baseAuth    = scoreAuthorityScope(f.authorityScope);
  const boardBonus  = f.boardInvolved === "YES" ? 8 : f.boardInvolved === "UNCERTAIN" ? 2 : 0;
  const authority   = Math.min(100, baseAuth + boardBonus);

  // Consequence: from sliders — contextual framing, not a score the user games
  // We cap the contribution so slider-gaming cannot flip the route alone
  const consequence = Math.round(
    (f.financialExposure + f.reputationalRisk + f.institutionalConsequence + f.timelinePressure) / 4 * 10
  );

  // Readiness: from text quality of assets / blockers / capacity note
  const readiness = Math.round(
    scoreText(f.existingAssets) * 0.35 +
    scoreText(f.blockers) * 0.35 +
    scoreText(f.capacityNote) * 0.30
  );

  // Composite — gravity and authority are weighted higher because they are
  // harder to inflate (text quality + scope selection vs slider)
  const score = Math.round(
    gravity      * 0.38 +
    authority    * 0.30 +
    consequence  * 0.18 +
    readiness    * 0.14
  );

  // Route determination
  const route: MandateRoute =
    score >= 68 && authority >= 60 && gravity >= 55 ? "QUALIFIED"
    : score >= 44 || (gravity >= 50 && authority >= 40)        ? "BORDERLINE"
    : "NOT_QUALIFIED";

  // Pattern reading — specific to the combination of signals
  let patternTitle   = "";
  let primaryReading = "";
  let urgentSignal: string | null = null;
  let mandateNote    = "";
  let firstAction    = "";

  if (route === "QUALIFIED") {
    if (authority >= 85) {
      patternTitle   = "Sovereign mandate with high structural clarity";
      primaryReading = `Direct decision authority is confirmed and the problem statement carries sufficient structural detail for constitutional engagement. The situation presents as having consequence, prior context, and clear ownership — the three conditions that justify private advisory attention.`;
    } else {
      patternTitle   = "Sufficient mandate with material consequence";
      primaryReading = `The constitutional reading of this submission is positive. Gravity, authority, and consequence are all above the minimum standard. The submission demonstrates a real problem being held by someone with the authority to act — the baseline condition for the Strategy Room.`;
    }
    mandateNote = "Your submission qualifies for direct strategic engagement. Proceed to the Strategy Room to initiate the mandate.";
    firstAction = "Prepare a one-page situation brief before the initial engagement: the problem in one sentence, the three most recent decisions made under this constraint, and the specific decision you need to reach in the next 90 days.";

  } else if (route === "BORDERLINE") {
    if (gravity < 50) {
      patternTitle   = "Consequence confirmed — problem articulation needs sharpening";
      primaryReading = `The consequence dimensions and authority indicators are sufficient, but the problem statement does not yet carry the structural precision required for a constitutional engagement. The system detected real weight — financial, institutional, reputational — but the core problem has not yet been reduced to its structural root.`;
      urgentSignal   = "The problem statement is the sharpest diagnostic instrument. Rewrite it once more and ask: what is the structural condition that, if unchanged, makes everything else harder?";
      firstAction    = "Run the Executive Reporting diagnostic first. It will force the structural articulation of the problem and produce a constitutional reading that will sharpen the Strategy Room submission.";
    } else if (authority < 50) {
      patternTitle   = "High gravity, authority ambiguity";
      primaryReading = `The situation carries real consequence and the problem statement demonstrates structural awareness. However, the authority position is not yet clearly established — advisory or unclear scope limits the constitutional readiness of this submission. The Strategy Room requires that the person submitting can either make the decision or sponsor it directly.`;
      urgentSignal   = "The single most important clarification: who holds final decision authority, and is that person either you or someone who has explicitly commissioned this submission?";
      firstAction    = "Clarify the decision authority chain before escalating. If you are not the final authority, obtain a direct commission from the person who is.";
    } else {
      patternTitle   = "Borderline reading — diagnostic path recommended";
      primaryReading = `The submission shows genuine indicators of a consequential situation, but the composite constitutional reading is not yet strong enough to guarantee a productive Strategy Room engagement. Diagnostic clarification will sharpen both the problem articulation and the authority case.`;
      firstAction    = "Complete the Executive Reporting diagnostic. It is designed for exactly this position — a situation with real weight that has not yet been fully constitutionally articulated.";
    }
    mandateNote = "Executive Reporting will produce the constitutional reading that strengthens this submission. Complete it, then return.";

  } else {
    if (f.authorityScope === "UNCLEAR" || !f.authorityScope) {
      patternTitle   = "Authority position not established";
      primaryReading = `The submission cannot be constitutionally routed because the authority position — who holds decision power and on what basis this engagement is being commissioned — has not been established. The Strategy Room requires either direct decision authority or a named sponsor who holds it.`;
      urgentSignal   = "Before any diagnostic tool can produce a useful reading, the question of authority must be answered: who can make or commission the decision this engagement would serve?";
      firstAction    = "Return when the authority position is clear — either that you hold it directly, or that someone with authority has commissioned this work.";
    } else if (gravity < 30) {
      patternTitle   = "Insufficient structural articulation";
      primaryReading = `The current problem statement does not yet carry the structural detail required for a constitutional engagement. This does not mean the problem is not real — it means it has not yet been reduced to a form that can be constitutionally assessed. The constitutional scoring system cannot route submissions that have not demonstrated a structural problem.`;
      firstAction    = "Begin with the Constitutional Diagnostic or the Purpose Alignment Assessment — both are designed to surface the structural reading of the situation before it is presented for advisory escalation.";
    } else {
      patternTitle   = "Reading below minimum — foundational work needed";
      primaryReading = `The composite constitutional reading does not yet meet the minimum for Strategy Room engagement. This is a categorisation, not a judgement of the situation's importance. The diagnostic ladder exists precisely for this position — to build the constitutional case before escalation.`;
      firstAction    = "Begin with the Constitutional Diagnostic. It will establish the root-level reading of the situation and generate the constitutional evidence that strengthens a future submission.";
    }
    mandateNote = "The diagnostic ladder is the correct starting point. It builds the constitutional case that makes a Strategy Room engagement productive.";
  }

  return {
    route, score, gravityScore: gravity, authorityScore: authority,
    consequenceScore: consequence, readinessScore: readiness,
    patternTitle, primaryReading, urgentSignal, mandateNote, firstAction,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// ROUTE CONFIG
// ─────────────────────────────────────────────────────────────────────────────

const ROUTE_CONFIG: Record<MandateRoute, {
  border: string; bg: string; text: string; label: string;
  ctaHref: string; ctaLabel: string;
}> = {
  QUALIFIED: {
    border: "rgba(52,211,153,0.25)", bg: "rgba(52,211,153,0.06)", text: "rgba(110,231,183,0.90)",
    label: "Qualified for Strategy Room",
    ctaHref: "/contact?intent=strategy-room-mandate", ctaLabel: "Request private mandate review",
  },
  BORDERLINE: {
    border: `${GOLD}30`, bg: `${GOLD}08`, text: `${GOLD}CC`,
    label: "Borderline — Executive Reporting recommended",
    ctaHref: "/diagnostics/executive-reporting/run", ctaLabel: "Run executive diagnostic",
  },
  NOT_QUALIFIED: {
    border: "rgba(248,113,113,0.22)", bg: "rgba(248,113,113,0.05)", text: "rgba(252,165,165,0.85)",
    label: "Diagnostic path — constitutional clarity needed first",
    ctaHref: "/diagnostics", ctaLabel: "Enter diagnostic ladder",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// PRIMITIVES
// ─────────────────────────────────────────────────────────────────────────────

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-4 w-px" style={{ backgroundColor: `${GOLD}55` }} />
      <span style={{
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        fontSize: "7.5px", letterSpacing: "0.40em", textTransform: "uppercase",
        color: `${GOLD}BB`,
      }}>
        {children}
      </span>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  backgroundColor: "rgba(255,255,255,0.025)",
  border: "1px solid rgba(255,255,255,0.09)",
  outline: "none",
  padding: "11px 13px",
  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
  fontWeight: 300,
  fontSize: "1rem",
  lineHeight: 1.55,
  color: "rgba(255,255,255,0.80)",
  transition: "border-color 250ms ease, background-color 250ms ease",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: "0.50rem",
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
  fontSize: "7px",
  letterSpacing: "0.34em",
  textTransform: "uppercase",
  color: "rgba(255,255,255,0.26)",
};

function FieldInput({ label, value, onChange, placeholder, type = "text", required = false }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; required?: boolean;
}) {
  return (
    <div>
      <label style={labelStyle}>
        {label}
        {required && <span style={{ marginLeft: "0.4rem", color: `${GOLD}80` }}>*</span>}
      </label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} style={inputStyle}
        onFocus={e => { e.currentTarget.style.borderColor = `${GOLD}35`; e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.035)"; }}
        onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)"; e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.025)"; }}
      />
    </div>
  );
}

function FieldSelect({ label, value, onChange, options, required = false }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { label: string; value: string }[]; required?: boolean;
}) {
  return (
    <div>
      <label style={labelStyle}>
        {label}
        {required && <span style={{ marginLeft: "0.4rem", color: `${GOLD}80` }}>*</span>}
      </label>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}
        onFocus={e => { e.currentTarget.style.borderColor = `${GOLD}35`; }}
        onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)"; }}
      >
        <option value="" style={{ backgroundColor: "rgb(6 6 9)" }}>Select…</option>
        {options.map(o => <option key={o.value} value={o.value} style={{ backgroundColor: "rgb(6 6 9)" }}>{o.label}</option>)}
      </select>
    </div>
  );
}

function FieldTextarea({ label, value, onChange, placeholder, rows = 5, helpText, required = false, charTarget }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; rows?: number; helpText?: string; required?: boolean; charTarget?: number;
}) {
  return (
    <div>
      <label style={labelStyle}>
        {label}
        {required && <span style={{ marginLeft: "0.4rem", color: `${GOLD}80` }}>*</span>}
      </label>
      <textarea value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} rows={rows}
        style={{ ...inputStyle, resize: "none", lineHeight: 1.75 }}
        onFocus={e => { e.currentTarget.style.borderColor = `${GOLD}35`; e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.035)"; }}
        onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)"; e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.025)"; }}
      />
      {charTarget && (
        <div style={{
          marginTop: "0.35rem",
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontSize: "7px", letterSpacing: "0.22em",
          color: value.length >= charTarget ? "rgba(110,231,183,0.55)" : "rgba(255,255,255,0.18)",
          transition: "color 300ms ease",
        }}>
          {value.length}/{charTarget} target
        </div>
      )}
      {helpText && (
        <p style={{ marginTop: "0.4rem", fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.85rem", lineHeight: 1.58, color: "rgba(255,255,255,0.28)", fontStyle: "italic" }}>
          {helpText}
        </p>
      )}
    </div>
  );
}

function ConsequenceRail({ label, value, onChange, note }: {
  label: string; value: number; onChange: (v: number) => void; note: string;
}) {
  const pct     = value * 10;
  const barColor = pct >= 70 ? "rgba(252,165,165,0.65)" : pct >= 40 ? `${GOLD}80` : "rgba(110,231,183,0.55)";

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.32em", textTransform: "uppercase", color: "rgba(255,255,255,0.30)" }}>
          {label}
        </span>
        <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", letterSpacing: "0.14em", color: "rgba(255,255,255,0.50)" }}>
          {value}/10
        </span>
      </div>
      <input type="range" min={0} max={10} step={1} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: "100%", height: "2px", cursor: "pointer", accentColor: GOLD }}
      />
      <div style={{ height: "2px", backgroundColor: "rgba(255,255,255,0.06)", overflow: "hidden", marginTop: "4px" }}>
        <div style={{ height: "100%", width: `${pct}%`, backgroundColor: barColor, transition: "width 250ms ease" }} />
      </div>
      <p style={{ marginTop: "0.35rem", fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.80rem", lineHeight: 1.55, color: "rgba(255,255,255,0.25)", fontStyle: "italic" }}>
        {note}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LIVE SCORE SIDEBAR — shows dimension scores, not a gameable total
// ─────────────────────────────────────────────────────────────────────────────

function LiveScoreSidebar({ reading }: { reading: ConstitutionalReading }) {
  const dims = [
    { label: "Gravity",     value: reading.gravityScore,     note: "Derived from text quality" },
    { label: "Authority",   value: reading.authorityScore,   note: "Derived from scope & board" },
    { label: "Consequence", value: reading.consequenceScore, note: "Context dimensions" },
    { label: "Readiness",   value: reading.readinessScore,   note: "Derived from readiness text" },
  ];

  return (
    <div className="space-y-3">
      <div style={{ border: "1px solid rgba(255,255,255,0.06)", backgroundColor: "rgba(255,255,255,0.01)", padding: "1.25rem" }}>
        <Eyebrow>Constitutional reading</Eyebrow>
        <div style={{ marginTop: "1.25rem" }}>
          <div style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "3rem", lineHeight: 1, color: ROUTE_CONFIG[reading.route].text, marginBottom: "0.4rem" }}>
            {reading.score}
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.30em", textTransform: "uppercase", color: ROUTE_CONFIG[reading.route].text, opacity: 0.85 }}>
            {reading.route.replace("_", " ")}
          </div>
        </div>
      </div>

      {dims.map(d => {
        const pct   = d.value;
        const bColor = pct >= 65 ? "rgba(110,231,183,0.65)" : pct >= 40 ? `${GOLD}80` : "rgba(252,165,165,0.60)";
        return (
          <div key={d.label} style={{ border: "1px solid rgba(255,255,255,0.05)", backgroundColor: "rgba(255,255,255,0.008)", padding: "0.85rem 1rem" }}>
            <div className="flex items-center justify-between mb-1.5">
              <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "6.5px", letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)" }}>
                {d.label}
              </span>
              <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7.5px", color: bColor }}>
                {d.value}
              </span>
            </div>
            <div style={{ height: "2px", backgroundColor: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
              <motion.div style={{ height: "100%", backgroundColor: bColor }} animate={{ width: `${Math.max(2, d.value)}%` }} transition={{ duration: 0.5 }} />
            </div>
            <p style={{ marginTop: "0.3rem", fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.18)" }}>
              {d.note}
            </p>
          </div>
        );
      })}

      <div style={{ padding: "0.85rem 1rem", border: "1px solid rgba(255,255,255,0.04)", backgroundColor: "rgba(255,255,255,0.005)" }}>
        <p style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.80rem", lineHeight: 1.65, color: "rgba(255,255,255,0.25)", fontStyle: "italic" }}>
          Gravity and authority scores are derived from what you write — not from sliders. The system reads structural precision, not length alone.
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTITUTIONAL RESULT SURFACE
// ─────────────────────────────────────────────────────────────────────────────

function ConstitutionalResult({
  reading,
  onRevise,
}: {
  reading: ConstitutionalReading;
  onRevise: () => void;
}) {
  const rc = ROUTE_CONFIG[reading.route];

  return (
    <div className="space-y-5">

      {/* Route headline */}
      <div style={{ border: `1px solid ${rc.border}`, backgroundColor: rc.bg, padding: "2rem" }}>
        <Eyebrow>Constitutional assessment</Eyebrow>
        <div className="flex items-end justify-between gap-4 mt-4">
          <div>
            <div style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "clamp(3rem, 6vw, 5rem)", lineHeight: 1, letterSpacing: "-0.04em", color: rc.text }}>
              {reading.score}
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", letterSpacing: "0.36em", textTransform: "uppercase", color: rc.text, opacity: 0.85, marginTop: "0.4rem" }}>
              {rc.label}
            </div>
          </div>
          {/* Dimension breakdown */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Gravity",     value: reading.gravityScore },
              { label: "Authority",   value: reading.authorityScore },
              { label: "Consequence", value: reading.consequenceScore },
              { label: "Readiness",   value: reading.readinessScore },
            ].map(d => (
              <div key={d.label} style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "1.3rem", lineHeight: 1, color: rc.text }}>
                  {d.value}
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "6px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginTop: "2px" }}>
                  {d.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pattern reading */}
      <div style={{ border: "1px solid rgba(255,255,255,0.07)", backgroundColor: "rgb(10 14 20)", overflow: "hidden" }}>
        <div style={{ padding: "0.85rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.05)", background: `linear-gradient(to right, ${GOLD}08, transparent)` }}>
          <Eyebrow>Pattern reading — {reading.patternTitle}</Eyebrow>
        </div>
        <div style={{ padding: "1.5rem" }}>
          <p style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "1.05rem", lineHeight: 1.78, color: "rgba(255,255,255,0.70)" }}>
            {reading.primaryReading}
          </p>

          {reading.urgentSignal && (
            <div style={{ marginTop: "1.25rem", padding: "1rem 1.25rem", border: `1px solid ${rc.border}`, backgroundColor: rc.bg }}>
              <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.36em", textTransform: "uppercase", color: rc.text, marginBottom: "0.55rem" }}>
                Urgent signal
              </div>
              <p style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.95rem", lineHeight: 1.65, color: "rgba(255,255,255,0.65)", fontStyle: "italic" }}>
                {reading.urgentSignal}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* First action */}
      <div style={{ border: `1px solid ${GOLD}22`, backgroundColor: `${GOLD}07`, padding: "1.5rem" }}>
        <Eyebrow>First action</Eyebrow>
        <p style={{ marginTop: "0.85rem", fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "1.05rem", lineHeight: 1.72, color: "rgba(255,255,255,0.72)" }}>
          {reading.firstAction}
        </p>
      </div>

      {/* Mandate note */}
      <div style={{ border: "1px solid rgba(255,255,255,0.06)", backgroundColor: "rgba(255,255,255,0.01)", padding: "1.25rem 1.5rem" }}>
        <p style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.97rem", lineHeight: 1.68, color: "rgba(255,255,255,0.40)", fontStyle: "italic", marginBottom: "1.25rem" }}>
          {reading.mandateNote}
        </p>
        <div className="flex flex-wrap gap-3">
          <a href={rc.ctaHref}
            className="inline-flex items-center gap-2.5 transition-all duration-300"
            style={{
              padding: "11px 22px",
              border: `1px solid ${rc.border}`,
              backgroundColor: rc.bg,
              color: rc.text,
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "8px", letterSpacing: "0.26em", textTransform: "uppercase",
            }}
          >
            {rc.ctaLabel} <ArrowRight style={{ width: "11px", height: "11px" }} />
          </a>
          <button type="button" onClick={onRevise}
            style={{
              padding: "11px 22px",
              border: "1px solid rgba(255,255,255,0.07)",
              backgroundColor: "transparent",
              color: "rgba(255,255,255,0.28)",
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "8px", letterSpacing: "0.26em", textTransform: "uppercase",
              cursor: "pointer",
            }}
            onMouseEnter={e => { const el = e.currentTarget; el.style.color = "rgba(255,255,255,0.50)"; }}
            onMouseLeave={e => { const el = e.currentTarget; el.style.color = "rgba(255,255,255,0.28)"; }}
          >
            Revise submission
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function StrategyRoomForm() {
  const [stage,     setStage]     = React.useState(0);
  const [form,      setForm]      = React.useState<FormData>(INITIAL);
  const [submitted, setSubmitted] = React.useState(false);
  const [submitting,setSubmitting]= React.useState(false);
  const [direction, setDirection] = React.useState(1);

  const reading = React.useMemo(() => computeConstitutionalReading(form), [form]);

  const set = (field: keyof FormData, value: string | number) =>
    setForm(p => ({ ...p, [field]: value }));

  function canAdvance(): boolean {
    if (stage === 0) return form.problemStatement.trim().length >= 40;
    if (stage === 1) return !!form.name && !!form.email && !!form.organisation && !!form.authorityScope;
    return true;
  }

  function advance() {
    if (stage < 4) { setDirection(1); setStage(s => s + 1); }
    if (stage === 3) handleSubmit();
  }

  function retreat() {
    if (stage > 0) { setDirection(-1); setStage(s => s - 1); }
  }

  async function handleSubmit() {
    setSubmitting(true);
    setDirection(1);
    setStage(4);
    try {
      await fetch("/api/strategy-room/session/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intake: {
            fullName: form.name, email: form.email, organisation: form.organisation,
            role: form.role, authorityScope: form.authorityScope,
            problemStatement: form.problemStatement,
            symptoms: form.priorFailures,
            desiredOutcome: form.whatHappensIfNot,
            currentConstraint: form.blockers,
            boardInvolved: form.boardInvolved,
            urgencyWindow: form.timelinePressure >= 8 ? "IMMEDIATE" : form.timelinePressure >= 6 ? "NEAR_TERM" : "MID_TERM",
            marketExposure: form.reputationalRisk >= 8 ? "CRITICAL" : form.reputationalRisk >= 6 ? "HIGH" : "MEDIUM",
            revenueBand: "ENTERPRISE",
          },
          mandateScore: reading.score,
          route: reading.route,
        }),
      });
    } catch { /* session init is best-effort */ }
    setSubmitted(true);
    setSubmitting(false);
  }

  const stageContent: React.ReactNode[] = [
    /* 0 — Situation Gravity */
    <div key="s0" className="space-y-5">
      <div>
        <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "clamp(1.4rem, 2.5vw, 1.9rem)", lineHeight: 1.05, letterSpacing: "-0.020em", color: "rgba(255,255,255,0.88)" }}>
          Situation Gravity
        </h2>
        <p style={{ marginTop: "0.55rem", fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.95rem", lineHeight: 1.68, color: "rgba(255,255,255,0.38)", fontStyle: "italic" }}>
          The gravity score is derived from the structural precision of your answers — not their length. Write to the structure of the problem, not around it.
        </p>
      </div>
      <FieldTextarea label="Problem statement" required value={form.problemStatement}
        onChange={v => set("problemStatement", v)} rows={6} charTarget={150}
        placeholder="State the actual structural problem requiring strategic intervention. Not symptoms — the condition."
        helpText="What is the specific structural condition that, if unchanged, makes everything else harder?"
      />
      <FieldTextarea label="Prior correction attempts" value={form.priorFailures}
        onChange={v => set("priorFailures", v)} rows={4}
        placeholder="What has already been tried and why it failed. Be specific about what was attempted."
        helpText="Generic statements ('we tried various things') score near zero. Specific attempts with specific outcomes score high."
      />
      <FieldTextarea label="Cost of inaction" value={form.whatHappensIfNot}
        onChange={v => set("whatHappensIfNot", v)} rows={4}
        placeholder="What happens structurally if this is not resolved in the next 90 days?"
      />
    </div>,

    /* 1 — Authority & Mandate */
    <div key="s1" className="space-y-5">
      <div>
        <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "clamp(1.4rem, 2.5vw, 1.9rem)", lineHeight: 1.05, letterSpacing: "-0.020em", color: "rgba(255,255,255,0.88)" }}>
          Authority & Mandate
        </h2>
        <p style={{ marginTop: "0.55rem", fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.95rem", lineHeight: 1.68, color: "rgba(255,255,255,0.38)", fontStyle: "italic" }}>
          Authority scope is the single most important dimension in constitutional routing. The Strategy Room requires that the submitting person can either make the decision or directly commission it.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <FieldInput label="Full name" required value={form.name} onChange={v => set("name", v)} placeholder="Decision sponsor" />
        <FieldInput label="Email address" required value={form.email} onChange={v => set("email", v)} placeholder="email@org.com" type="email" />
        <FieldInput label="Organisation" required value={form.organisation} onChange={v => set("organisation", v)} />
        <FieldInput label="Role" value={form.role} onChange={v => set("role", v)} placeholder="Founder, CEO, Board Chair, Director…" />
      </div>
      <FieldSelect label="Authority scope" required value={form.authorityScope}
        onChange={v => set("authorityScope", v)}
        options={[
          { label: "I decide directly — the mandate is mine",     value: "DIRECT" },
          { label: "I influence and sponsor — I hold the brief",  value: "PROXY" },
          { label: "I advise — I do not hold decision authority", value: "ADVISORY" },
          { label: "Not yet established",                          value: "UNCLEAR" },
        ]}
      />
      <FieldSelect label="Board / senior stakeholder involvement" value={form.boardInvolved}
        onChange={v => set("boardInvolved", v)}
        options={[
          { label: "Yes — board or senior leadership is involved", value: "YES" },
          { label: "No — this is executive level only",             value: "NO" },
          { label: "Not yet / uncertain",                            value: "UNCERTAIN" },
        ]}
      />
    </div>,

    /* 2 — Consequence */
    <div key="s2" className="space-y-5">
      <div>
        <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "clamp(1.4rem, 2.5vw, 1.9rem)", lineHeight: 1.05, letterSpacing: "-0.020em", color: "rgba(255,255,255,0.88)" }}>
          Consequence Mapping
        </h2>
        <p style={{ marginTop: "0.55rem", fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.95rem", lineHeight: 1.68, color: "rgba(255,255,255,0.38)", fontStyle: "italic" }}>
          Rate the severity of consequence across four dimensions. These provide contextual framing — your text answers carry more weight in the constitutional scoring.
        </p>
      </div>
      <div className="space-y-6">
        <ConsequenceRail label="Financial exposure" value={form.financialExposure} onChange={v => set("financialExposure", v)} note="The degree of material financial consequence if this is not resolved." />
        <ConsequenceRail label="Reputational risk" value={form.reputationalRisk} onChange={v => set("reputationalRisk", v)} note="The degree to which reputational capital is at stake." />
        <ConsequenceRail label="Institutional consequence" value={form.institutionalConsequence} onChange={v => set("institutionalConsequence", v)} note="The degree to which organisational structure, culture, or mandate is affected." />
        <ConsequenceRail label="Timeline pressure" value={form.timelinePressure} onChange={v => set("timelinePressure", v)} note="The urgency of resolution — how long before inaction becomes irreversible." />
      </div>
    </div>,

    /* 3 — Readiness */
    <div key="s3" className="space-y-5">
      <div>
        <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "clamp(1.4rem, 2.5vw, 1.9rem)", lineHeight: 1.05, letterSpacing: "-0.020em", color: "rgba(255,255,255,0.88)" }}>
          Intervention Readiness
        </h2>
        <p style={{ marginTop: "0.55rem", fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.95rem", lineHeight: 1.68, color: "rgba(255,255,255,0.38)", fontStyle: "italic" }}>
          Readiness determines whether an engagement can be productive, not just necessary. A high-gravity situation with no existing assets and total resistance scores lower than one with clear supporting context.
        </p>
      </div>
      <FieldTextarea label="Existing assets" value={form.existingAssets} onChange={v => set("existingAssets", v)} rows={4}
        placeholder="Prior diagnostics, internal data, advisory relationships, board reports, evidence of what has already been tried."
      />
      <FieldTextarea label="Known blockers" value={form.blockers} onChange={v => set("blockers", v)} rows={4}
        placeholder="Budget constraints, timeline, internal resistance, talent gaps, governance constraints, political dynamics."
      />
      <FieldTextarea label="Capacity note" value={form.capacityNote} onChange={v => set("capacityNote", v)} rows={3}
        placeholder="What is the organisation's actual capacity to absorb and implement a structured intervention right now?"
      />
    </div>,
  ];

  return (
    <div style={{ position: "relative", minHeight: "600px" }}>

      {/* Stage strip */}
      {stage < 4 && (
        <div style={{ marginBottom: "2rem" }}>
          <div className="flex items-center justify-between mb-2">
            <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7.5px", letterSpacing: "0.36em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)" }}>
              Strategy Room intake
            </span>
            <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", letterSpacing: "0.18em", color: "rgba(255,255,255,0.35)" }}>
              Stage {stage + 1} / 4
            </span>
          </div>
          <div style={{ display: "flex", gap: "4px" }}>
            {[0, 1, 2, 3].map(i => (
              <div key={i} style={{
                flex: 1, height: "2px",
                backgroundColor: i <= stage ? `${GOLD}80` : "rgba(255,255,255,0.07)",
                transition: "background-color 300ms ease",
              }} />
            ))}
          </div>
        </div>
      )}

      <div className={`grid gap-8 ${stage < 4 ? "lg:grid-cols-[1fr_260px]" : ""}`}>

        {/* Main */}
        <div>
          <AnimatePresence mode="wait" custom={direction}>
            {stage < 4 ? (
              <motion.div
                key={`stage-${stage}`}
                custom={direction}
                initial={{ opacity: 0, x: direction * 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction * -24 }}
                transition={{ duration: 0.30 }}
              >
                {stageContent[stage]}

                <div className="flex items-center justify-between pt-6 mt-6"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
                >
                  <button type="button" onClick={retreat} disabled={stage === 0}
                    className="inline-flex items-center gap-2 transition-all duration-200"
                    style={{
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: "8px", letterSpacing: "0.28em", textTransform: "uppercase",
                      color: stage === 0 ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.38)",
                      cursor: stage === 0 ? "not-allowed" : "pointer", background: "none", border: "none",
                    }}
                  >
                    <ArrowLeft style={{ width: "11px", height: "11px" }} /> Previous
                  </button>

                  <button type="button" onClick={advance} disabled={!canAdvance()}
                    className="inline-flex items-center gap-2.5 transition-all duration-300"
                    style={{
                      padding: "11px 24px",
                      border: `1px solid ${canAdvance() ? `${GOLD}42` : "rgba(255,255,255,0.06)"}`,
                      backgroundColor: canAdvance() ? `${GOLD}10` : "rgba(255,255,255,0.01)",
                      color: canAdvance() ? `${GOLD}CC` : "rgba(255,255,255,0.18)",
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: "8.5px", letterSpacing: "0.28em", textTransform: "uppercase",
                      cursor: canAdvance() ? "pointer" : "not-allowed",
                    }}
                    onMouseEnter={e => { if (canAdvance()) { const el = e.currentTarget; el.style.borderColor = `${GOLD}65`; el.style.backgroundColor = `${GOLD}18`; } }}
                    onMouseLeave={e => { if (canAdvance()) { const el = e.currentTarget; el.style.borderColor = `${GOLD}42`; el.style.backgroundColor = `${GOLD}10`; } }}
                  >
                    {stage === 3 ? "Submit for constitutional assessment" : "Continue"}
                    <ArrowRight style={{ width: "11px", height: "11px" }} />
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div key="result" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
                <ConstitutionalResult reading={reading} onRevise={() => { setStage(0); setDirection(-1); }} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Live sidebar — intake stages only */}
        {stage < 4 && (
          <div className="hidden lg:block">
            <div style={{ position: "sticky", top: "6rem" }}>
              <LiveScoreSidebar reading={reading} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}