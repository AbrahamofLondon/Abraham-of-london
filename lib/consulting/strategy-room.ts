/* lib/consulting/strategy-room.ts */
import pkg from 'pg';
const { Pool } = pkg;
import fs from 'fs';
import path from 'path';

export type StrategyRoomIntakePayload = {
  meta: { source: "web" | "inner-circle" | "referral"; page: string; submittedAtIso: string };
  contact: { fullName: string; email: string; organisation: string };
  authority: { role: string; hasAuthority: "Yes, fully" | "Yes, with board approval" | "No"; mandate: string };
  decision: { statement: string; type: string; stuckReasons: string[] };
  constraints: { nonRemovableConstraints: string | null; avoidedTradeOff: string; unacceptableOutcome: string };
  timeCost: { costOfDelay: string[]; affected: string; breaksFirst: string };
  readiness: { readyForUnpleasantDecision: "Yes" | "No"; willingAccountability: "Yes" | "No"; whyNow: string };
  declarationAccepted: boolean;
  recaptchaToken: string;
};

export type StrategyRoomIntakeResult =
  | { ok: true; status: "accepted"; message: string; nextUrl: string }
  | { ok: false; status: "declined"; message: string };

/**
 * DATABASE INITIALIZATION
 * Connects to Neon via DATABASE_URL. Uses a Pool for serverless efficiency.
 */
const pool = process.env.DATABASE_URL 
  ? new Pool({ connectionString: process.env.DATABASE_URL }) 
  : null;

/**
 * ARCHIVE INTAKE (Neon + File System Fallback)
 */
export async function archiveIntake(payload: StrategyRoomIntakePayload, result: StrategyRoomIntakeResult, score: number) {
  const createdAt = new Date().toISOString();

  // 1. Primary: Neon PostgreSQL
  if (pool) {
    try {
      const query = `
        INSERT INTO strategy_room_intakes 
        (full_name, email_hash, organisation, status, score, decision_statement, payload, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `;
      const values = [
        payload.contact.fullName,
        payload.contact.email, // Hashing recommended for production
        payload.contact.organisation,
        result.status,
        score,
        payload.decision.statement,
        JSON.stringify(payload),
        createdAt
      ];
      await pool.query(query, values);
      return; 
    } catch (err: any) {
      console.error("⚠️ Neon Insertion failed, triggering FS backup:", err.message);
    }
  }

  // 2. Fallback: Local File System
  const logEntry = `[INTAKE_BACKUP][${result.status.toUpperCase()}] ${JSON.stringify({ payload, score, createdAt })}\n`;
  try {
    const backupDir = path.join(process.cwd(), 'tmp');
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
    fs.appendFileSync(path.join(backupDir, 'intakes.log'), logEntry);
  } catch (e) {
    console.error("❌ Critical: Could not write to local fallback log.");
  }
}

/**
 * NOTIFICATIONS (Discord)
 */
export async function notifyDiscord(payload: StrategyRoomIntakePayload, score: number, status: string) {
  const webhookUrl = process.env.DISCORD_STRATEGY_ROOM_WEBHOOK;
  if (!webhookUrl) return;

  const embed = {
    title: `Intake: ${status.toUpperCase()}`,
    color: status === 'accepted' ? 0xD4AF37 : 0x444444,
    fields: [
      { name: "Principal", value: payload.contact.fullName, inline: true },
      { name: "Score", value: `${score}/25`, inline: true },
      { name: "Decision", value: payload.decision.statement }
    ],
    timestamp: new Date().toISOString()
  };

  try {
    await fetch(webhookUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ embeds: [embed] }) });
  } catch (err) {
    console.error("❌ Discord Notification delivery failed.");
  }
}

/**
 * EVALUATION & SCORING LOGIC
 */
export function evaluateIntake(payload: StrategyRoomIntakePayload): StrategyRoomIntakeResult {
  if (payload.authority.hasAuthority === "No" || !payload.declarationAccepted || payload.readiness.willingAccountability === "No") {
    return { ok: false, status: "declined", message: "Hard gate: Entry requirements not met." };
  }

  const scoreData = computeScore(payload);
  if (scoreData.total < 16) {
    return { ok: false, status: "declined", message: "Audit score below threshold. Refine your decision statement." };
  }

  return { ok: true, status: "accepted", message: "Accepted. Check your email for materials.", nextUrl: "/resources/strategic-frameworks" };
}

export function computeScore(payload: StrategyRoomIntakePayload) {
  const s = (txt: string, min: number, max: number) => {
    const len = (txt || "").trim().length;
    if (len <= min) return 0;
    return Math.round(Math.min(max, (len / (min * 3)) * max));
  };

  const total = 10 + s(payload.decision.statement, 60, 5) + s(payload.constraints.avoidedTradeOff, 45, 5) + s(payload.readiness.whyNow, 45, 5);
  return { total: Math.min(25, total) };
}