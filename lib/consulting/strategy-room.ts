/* lib/consulting/strategy-room.ts */
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

/**
 * 1. DATA STRUCTURES & SCHEMAS
 * Defines the strict interface for intake data and scoring results.
 */
export type StrategyRoomIntakePayload = {
  meta: {
    source: "web" | "inner-circle" | "referral";
    page: string;
    submittedAtIso: string;
  };
  contact: {
    fullName: string;
    email: string;
    organisation: string;
  };
  authority: {
    role: string;
    hasAuthority: "Yes, fully" | "Yes, with board approval" | "No";
    mandate: string;
  };
  decision: {
    statement: string;
    type:
      | "Irreversible"
      | "High-cost to reverse"
      | "Direction-setting"
      | "Personnel/authority-related"
      | "Capital allocation"
      | "Reputation/governance";
    stuckReasons: string[];
  };
  constraints: {
    nonRemovableConstraints: string | null;
    avoidedTradeOff: string;
    unacceptableOutcome: string;
  };
  timeCost: {
    costOfDelay: string[];
    affected: string;
    breaksFirst: string;
  };
  readiness: {
    readyForUnpleasantDecision: "Yes" | "No";
    willingAccountability: "Yes" | "No";
    whyNow: string;
  };
  declarationAccepted: boolean;
  recaptchaToken: string;
};

export type StrategyRoomIntakeResult =
  | { ok: true; status: "accepted"; message: string; nextUrl: string }
  | { ok: false; status: "declined"; message: string };

type ScoreBreakdown = {
  authority: number;
  decisionGravity: number;
  constraints: number;
  costDelay: number;
  readiness: number;
  total: number;
};

/**
 * 2. INFRASTRUCTURE INITIALIZATION
 * Uses environment variables for Neon/PostgreSQL (via Supabase client logic).
 */
const supabase = (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY)
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)
  : null;

/**
 * 3. PERSISTENCE LAYER
 * Attempts Neon storage with a robust "Fail-Open" to local logs if the DB is offline.
 */
export async function archiveIntake(
  payload: StrategyRoomIntakePayload, 
  result: StrategyRoomIntakeResult, 
  score: number
) {
  const intakeData = {
    full_name: payload.contact.fullName,
    email: payload.contact.email,
    organisation: payload.contact.organisation,
    status: result.status,
    score,
    decision_statement: payload.decision.statement,
    payload: payload,
    created_at: new Date().toISOString(),
  };

  // Primary: Production Database
  if (supabase) {
    try {
      const { error } = await supabase.from('strategy_room_intakes').insert([intakeData]);
      if (!error) return; 
      console.error("⚠️ Neon/Supabase error, triggering FS backup:", error.message);
    } catch (err) {
      console.error("⚠️ Database connection failed. Data redirected to local logs.");
    }
  }

  // Fallback: File System / Console Audit Trail
  const logEntry = `[INTAKE_BACKUP][${intakeData.status.toUpperCase()}] ${JSON.stringify(intakeData)}\n`;
  console.log(logEntry);
  
  try {
    const backupDir = path.join(process.cwd(), 'tmp');
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
    fs.appendFileSync(path.join(backupDir, 'intakes.log'), logEntry);
  } catch (e) {
    // Fail silently to ensure the API response is never blocked by IO errors.
  }
}

/**
 * 4. NOTIFICATION LAYER
 * High-fidelity Discord alerts for immediate board oversight.
 */
export async function notifyDiscord(
  payload: StrategyRoomIntakePayload, 
  score: number, 
  status: string
) {
  const webhookUrl = process.env.DISCORD_STRATEGY_ROOM_WEBHOOK;
  if (!webhookUrl) return;

  const embed = {
    title: `Strategic Intake: ${status === 'accepted' ? '✅ ACCEPTED' : '🛑 DECLINED'}`,
    color: status === 'accepted' ? 0xD4AF37 : 0x444444,
    fields: [
      { name: "Principal", value: payload.contact.fullName, inline: true },
      { name: "Organisation", value: payload.contact.organisation, inline: true },
      { name: "Audit Score", value: `${score}/25`, inline: true },
      { name: "Decision Statement", value: `*${payload.decision.statement}*` }
    ],
    footer: { text: "Abraham of London · Strategic Engine" },
    timestamp: new Date().toISOString()
  };

  try {
    await fetch(webhookUrl, { 
      method: "POST", 
      headers: { "Content-Type": "application/json" }, 
      body: JSON.stringify({ embeds: [embed] }) 
    });
  } catch (err) {
    console.error("❌ Discord Notification delivery failed.");
  }
}

/**
 * 5. EVALUATION ENGINE
 * Filters intakes based on hard gates and weighted audit scores.
 */
export function evaluateIntake(payload: StrategyRoomIntakePayload): StrategyRoomIntakeResult {
  // Hard gates: Protect the room from low-gravity or exploratory requests.
  if (payload.authority.hasAuthority === "No") {
    return { ok: false, status: "declined", message: "This room requires decision authority." };
  }
  if (!payload.declarationAccepted) {
    return { ok: false, status: "declined", message: "Strategic declaration is required." };
  }
  if (payload.readiness.readyForUnpleasantDecision === "No" || payload.readiness.willingAccountability === "No") {
    return { ok: false, status: "declined", message: "Commitment to outcomes and execution is mandatory." };
  }

  const scoreData = computeScore(payload);
  const threshold = 16; 

  if (scoreData.total < threshold) {
    return {
      ok: false,
      status: "declined",
      message: "At this stage, a Strategy Room would not be productive. Please refine your decision logic via our Frameworks before re-applying.",
    };
  }

  return {
    ok: true,
    status: "accepted",
    message: "Accepted. Strategic pre-read materials have been dispatched to your email address.",
    nextUrl: "/resources/strategic-frameworks",
  };
}

/**
 * 6. SCORING UTILITIES
 * Measures the "signal" of the text provided by the principal.
 */
function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function scoreTextSignal(s: string, minLen: number, maxScore: number) {
  const len = (s || "").trim().length;
  if (len <= minLen) return 0;
  if (len >= minLen * 3) return maxScore;
  const ratio = len / (minLen * 3);
  return Math.round(maxScore * ratio);
}

export function computeScore(payload: StrategyRoomIntakePayload): ScoreBreakdown {
  const authorityScore = payload.authority.hasAuthority === "Yes, fully" ? 5 : 3;
  const mandateScore = clamp(scoreTextSignal(payload.authority.mandate, 60, 5), 0, 5);
  const decisionScore = clamp(scoreTextSignal(payload.decision.statement, 60, 5), 0, 5);
  const reasonsScore = clamp(payload.decision.stuckReasons.length, 1, 5);
  const tradeOffScore = clamp(scoreTextSignal(payload.constraints.avoidedTradeOff, 45, 5), 0, 5);
  const unacceptableScore = clamp(scoreTextSignal(payload.constraints.unacceptableOutcome, 45, 5), 0, 5);
  const delayScore = clamp(payload.timeCost.costOfDelay.length, 1, 5);
  const breaksScore = clamp(scoreTextSignal(payload.timeCost.breaksFirst, 35, 5), 0, 5);
  const whyNowScore = clamp(scoreTextSignal(payload.readiness.whyNow, 45, 5), 0, 5);

  const authorityBucket = clamp(Math.round((authorityScore + mandateScore) / 2), 0, 5);
  const decisionGravityBucket = clamp(Math.round((decisionScore + reasonsScore) / 2), 0, 5);
  const constraintsBucket = clamp(Math.round((tradeOffScore + unacceptableScore) / 2), 0, 5);
  const costDelayBucket = clamp(Math.round((delayScore + breaksScore) / 2), 0, 5);
  const readinessBucket = clamp(whyNowScore, 0, 5);

  return {
    authority: authorityBucket,
    decisionGravity: decisionGravityBucket,
    constraints: constraintsBucket,
    costDelay: costDelayBucket,
    readiness: readinessBucket,
    total: authorityBucket + decisionGravityBucket + constraintsBucket + costDelayBucket + readinessBucket,
  };
}