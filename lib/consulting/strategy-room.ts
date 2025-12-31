/* lib/consulting/strategy-room.ts */
// CORRECTED IMPORT: Removed curly braces to match default export in lib/prisma.ts
import prisma from "@/lib/prisma"; 
import fs from 'fs';
import path from 'path';

// --- TYPES ---

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
 * PERSISTENCE LAYER
 * Primary: Neon PostgreSQL (via Prisma)
 * Fallback: Local File System (JSON Log)
 */
export async function archiveIntake(
  payload: StrategyRoomIntakePayload, 
  result: StrategyRoomIntakeResult, 
  score: number
) {
  const createdAtDate = new Date();

  // 1. Primary: Prisma/Neon Integration
  try {
    // Verified: uses default-imported prisma client
    await prisma.strategyRoomIntake.create({
      data: {
        fullName: payload.contact.fullName,
        emailHash: payload.contact.email, 
        organisation: payload.contact.organisation,
        status: result.status,
        score: score,
        decisionStatement: payload.decision.statement,
        payload: JSON.stringify(payload),
        createdAt: createdAtDate,
      },
    });
    return; 
  } catch (err: any) {
    console.error("⚠️ Prisma/Neon Insertion failed, triggering FS backup:", err.message);
  }

  // 2. Fallback: Local File System (Fail-Open Resilience)
  const logEntry = `[INTAKE_BACKUP][${result.status.toUpperCase()}] ${JSON.stringify({ 
    payload, 
    score, 
    createdAt: createdAtDate.toISOString() 
  })}\n`;

  try {
    const backupDir = path.join(process.cwd(), 'tmp');
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
    fs.appendFileSync(path.join(backupDir, 'intakes.log'), logEntry);
  } catch (e) {
    console.error("❌ Critical Failure: Could not write to local fallback log.");
  }
}

/**
 * NOTIFICATIONS (Discord)
 */
export async function notifyDiscord(payload: StrategyRoomIntakePayload, score: number, status: string) {
  const webhookUrl = process.env.DISCORD_STRATEGY_ROOM_WEBHOOK;
  if (!webhookUrl) return;

  const embed = {
    title: `Strategic Intake: ${status.toUpperCase()}`,
    color: status === 'accepted' ? 0xD4AF37 : 0x444444,
    fields: [
      { name: "Principal", value: payload.contact.fullName, inline: true },
      { name: "Score", value: `${score}/25`, inline: true },
      { name: "Organisation", value: payload.contact.organisation, inline: true },
      { name: "Decision Statement", value: `"${payload.decision.statement}"` }
    ],
    timestamp: new Date().toISOString(),
    footer: { text: "Abraham of London · Strategy Room" }
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
 * EVALUATION & SCORING LOGIC
 */
export function evaluateIntake(payload: StrategyRoomIntakePayload): StrategyRoomIntakeResult {
  if (payload.authority.hasAuthority === "No" || !payload.declarationAccepted || payload.readiness.willingAccountability === "No") {
    return { ok: false, status: "declined", message: "Hard gate: Entry requirements not met." };
  }

  const scoreData = computeScore(payload);
  
  if (scoreData.total < 16) {
    return { ok: false, status: "declined", message: "Audit score below threshold. Refine your decision statement for gravity." };
  }

  return { 
    ok: true, 
    status: "accepted", 
    message: "Accepted. Strategic materials dispatched to your email.", 
    nextUrl: "/resources/strategic-frameworks" 
  };
}

export function computeScore(payload: StrategyRoomIntakePayload) {
  const evaluateDensity = (txt: string, min: number, max: number) => {
    const len = (txt || "").trim().length;
    if (len <= min) return 0;
    return Math.round(Math.min(max, (len / (min * 3)) * max));
  };

  const baseGravity = 10;
  const decisionWeight = evaluateDensity(payload.decision.statement, 60, 5);
  const tradeOffWeight = evaluateDensity(payload.constraints.avoidedTradeOff, 45, 5);
  const urgencyWeight = evaluateDensity(payload.readiness.whyNow, 45, 5);

  const total = baseGravity + decisionWeight + tradeOffWeight + urgencyWeight;
  return { total: Math.min(25, total) };
}
