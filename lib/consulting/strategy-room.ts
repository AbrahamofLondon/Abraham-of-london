// lib/consulting/strategy-room.ts
import "server-only";

import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import type { Prisma } from "@prisma/client";

function sha256(input: string): string {
  return crypto.createHash("sha256").update(String(input || "")).digest("hex");
}

function normalizeEmail(email: string): string {
  return String(email || "").trim().toLowerCase();
}

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

// --- PERSISTENCE ---
export async function archiveIntake(
  payload: StrategyRoomIntakePayload,
  result: StrategyRoomIntakeResult,
  score: number
) {
  const createdAtDate = new Date();

  const emailNorm = normalizeEmail(payload.contact.email);
  const emailHash = sha256(emailNorm);

  // Store privacy-safe + audit-rich payload
  const persisted = {
    ...payload,
    contact: {
      ...payload.contact,
      email: undefined, // remove raw email from stored payload by default
      emailHash,
    },
    audit: {
      outcome: result.status, // accepted/declined (since no DB column)
      score,
      message: result.message,
      nextUrl: (result as any).nextUrl ?? null,
      archivedAtIso: createdAtDate.toISOString(),
    },
  };

  // 1) Prisma primary
  try {
    const data: Prisma.StrategyIntakeCreateInput = {
      fullName: payload.contact.fullName,
      organisation: payload.contact.organisation,
      dependencyLevel: "standard",
      volatility: "medium",
      readinessScore: score,
      emailHash, // ✅ REQUIRED by your model
      payload: persisted as unknown as Prisma.InputJsonValue,
      // createdAt has default(now()) but safe to omit; leaving explicit is fine:
      createdAt: createdAtDate,
    };

    await prisma.strategyIntake.create({ data });
    return;
  } catch (err: any) {
    console.error("⚠️ Prisma/Neon insertion failed → FS backup:", err?.message || err);
  }

  // 2) Filesystem fallback
  try {
    const backupDir = path.join(process.cwd(), "tmp");
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

    const logEntry =
      `[INTAKE_BACKUP][${result.status.toUpperCase()}] ` +
      `${JSON.stringify({ score, createdAt: createdAtDate.toISOString(), persisted })}\n`;

    fs.appendFileSync(path.join(backupDir, "intakes.log"), logEntry, { encoding: "utf8" });
  } catch (e) {
    console.error("❌ Critical Failure: could not write fallback intake log.", e);
  }
}

// --- NOTIFICATIONS (Discord) ---
export async function notifyDiscord(payload: StrategyRoomIntakePayload, score: number, status: string) {
  const webhookUrl = process.env.DISCORD_STRATEGY_ROOM_WEBHOOK;
  if (!webhookUrl) return;

  const embed = {
    title: `Strategic Intake: ${String(status || "").toUpperCase()}`,
    color: status === "accepted" ? 0xd4af37 : 0x444444,
    fields: [
      { name: "Principal", value: payload.contact.fullName || "Unknown", inline: true },
      { name: "Score", value: `${score}/25`, inline: true },
      { name: "Organisation", value: payload.contact.organisation || "—", inline: true },
      { name: "Decision Statement", value: `"${payload.decision.statement || ""}"` },
    ],
    timestamp: new Date().toISOString(),
    footer: { text: "Abraham of London · Strategy Room" },
  };

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [embed] }),
    });
  } catch (err) {
    console.error("❌ Discord Notification delivery failed.", err);
  }
}

// --- EVALUATION & SCORING ---
export function evaluateIntake(payload: StrategyRoomIntakePayload): StrategyRoomIntakeResult {
  if (
    payload.authority.hasAuthority === "No" ||
    !payload.declarationAccepted ||
    payload.readiness.willingAccountability === "No"
  ) {
    return { ok: false, status: "declined", message: "Hard gate: Entry requirements not met." };
  }

  const scoreData = computeScore(payload);

  if (scoreData.total < 16) {
    return { ok: false, status: "declined", message: "Audit score below threshold. Refine your decision statement." };
  }

  return {
    ok: true,
    status: "accepted",
    message: "Accepted. Strategic materials dispatched to your email.",
    nextUrl: "/resources/strategic-frameworks",
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

  return { total: Math.min(25, baseGravity + decisionWeight + tradeOffWeight + urgencyWeight) };
}