/* lib/consulting/strategy-room.ts */
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// --- TYPES ---
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

// --- DB CLIENT WITH WORKAROUND ---
// Only initializes if keys are present, preventing runtime crashes in local dev.
const supabase = (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY)
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)
  : null;

// --- PERSISTENCE & NOTIFICATION LOGIC ---

/**
 * ARCHIVE INTAKE:
 * Attempts Supabase persistence. If DB is offline or keys missing, 
 * fails over to local File System and Console Logs.
 */
export async function archiveIntake(payload: StrategyRoomIntakePayload, result: StrategyRoomIntakeResult, score: number) {
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

  // 1. Attempt Supabase Persistence
  if (supabase) {
    try {
      const { error } = await supabase.from('strategy_room_intakes').insert([intakeData]);
      if (!error) return; 
      console.error("⚠️ Supabase insertion failed, triggering FS backup:", error.message);
    } catch (err) {
      console.error("⚠️ Supabase connection failed, triggering FS backup.");
    }
  }

  // 2. Fallback: Local FS / Console Redundancy
  const logEntry = `[INTAKE_BACKUP][${intakeData.status.toUpperCase()}] ${JSON.stringify(intakeData)}\n`;
  console.log(logEntry);
  
  try {
    const backupDir = path.join(process.cwd(), 'tmp');
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
    fs.appendFileSync(path.join(backupDir, 'intakes.log'), logEntry);
  } catch (e) {
    // Fail silently on FS to ensure API response is not blocked
  }
}

/**
 * DISCORD NOTIFICATION:
 * Real-time alerting for the Board with high-signal context.
 */
export async function notifyDiscord(payload: StrategyRoomIntakePayload, score: number, status: string) {
  const webhookUrl = process.env.DISCORD_STRATEGY_ROOM_WEBHOOK;
  if (!webhookUrl) return;

  const embed = {
    title: `Strategic Intake: ${status === 'accepted' ? '✅ ACCEPTED' : '🛑 DECLINED'}`,
    color: status === 'accepted' ? 0xD4AF37 : 0x444444, // Gold or Gray
    fields: [
      { name: "Principal", value: payload.contact.fullName, inline: true },
      { name: "Organisation", value: payload.contact.organisation, inline: true },
      { name: "Audit Score", value: `${score}/25`, inline: true },
      { name: "Decision Statement", value: payload.decision.statement }
    ],
    footer: { text: "Abraham of London Strategic Engine" },
    timestamp: new Date().toISOString()
  };

  try {
    await fetch(webhookUrl, { 
      method: "POST", 
      headers: { "Content-Type": "application/json" }, 
      body: JSON.stringify({ embeds: [embed] }) 
    });
  } catch (err) {
    console.error("❌ Discord Notification Failed");
  }
}

// --- EVALUATION ENGINE ---

export function evaluateIntake(payload: StrategyRoomIntakePayload): StrategyRoomIntakeResult {
  // Hard gates (Fail-closed security posture)
  if (payload.authority.hasAuthority === "No") {
    return { ok: false, status: "declined", message: "This environment requires decision authority." };
  }
  if (!payload.declarationAccepted) {
    return { ok: false, status: "declined", message: "Declaration acceptance is required." };
  }
  if (payload.readiness.readyForUnpleasantDecision === "No" || payload.readiness.willingAccountability === "No") {
    return { ok: false, status: "declined", message: "Commitment to outcome and execution is required." };
  }

  const b = computeScore(payload);
  const threshold = 16; 

  if (b.total < threshold) {
    return {
      ok: false,
      status: "declined",
      message: "A Strategy Room would not be productive at this stage. Please refine your decision statement and constraints using the Strategic Frameworks provided.",
    };
  }

  return {
    ok: true,
    status: "accepted",
    message: "Accepted. Pre-read materials and scheduling protocols have been dispatched to your email.",
    nextUrl: "/resources/strategic-frameworks",
  };
}

// --- SCORING UTILITIES ---

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function textLen(s: string | null | undefined) {
  return (s || "").trim().length;
}

function scoreTextSignal(s: string, minLen: number, maxScore: number) {
  const len = textLen(s);
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

  const total = authorityBucket + decisionGravityBucket + constraintsBucket + costDelayBucket + readinessBucket;

  return {
    authority: authorityBucket,
    decisionGravity: decisionGravityBucket,
    constraints: constraintsBucket,
    costDelay: costDelayBucket,
    readiness: readinessBucket,
    total,
  };
}