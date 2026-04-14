// lib/consulting/strategy-room.ts
import "server-only";

import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

function sha256(input: string): string {
  return crypto.createHash("sha256").update(String(input || "")).digest("hex");
}

function normalizeEmail(email: string): string {
  return String(email || "").trim().toLowerCase();
}

function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

function uniqueStrings(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return Array.from(
    new Set(
      values
        .map((v) => normalizeText(v))
        .filter(Boolean),
    ),
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

async function appendFallbackLog(filename: string, entry: unknown): Promise<void> {
  const backupDir = path.join(process.cwd(), "tmp");
  await fs.mkdir(backupDir, { recursive: true });
  await fs.appendFile(
    path.join(backupDir, filename),
    `${JSON.stringify(entry)}\n`,
    "utf8",
  );
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs = 5000,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

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
    type: string;
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
  | {
      ok: true;
      status: "accepted";
      message: string;
      nextUrl: string;
    }
  | {
      ok: false;
      status: "declined";
      message: string;
    };

export type StrategyRoomScoreBreakdown = {
  total: number;
  max: number;
  threshold: number;
  gatesPassed: boolean;
  components: {
    authority: number;
    mandate: number;
    decisionClarity: number;
    tradeoffMaturity: number;
    urgencyCredibility: number;
    consequenceAwareness: number;
    constraintRealism: number;
    accountabilityReadiness: number;
  };
  reasons: string[];
};

export type StrategyRoomEvaluation = {
  result: StrategyRoomIntakeResult;
  score: StrategyRoomScoreBreakdown;
};

export type ArchivedStrategyRoomIntake = {
  meta: StrategyRoomIntakePayload["meta"];
  contact: {
    fullName: string;
    organisation: string;
    emailHash: string;
  };
  authority: StrategyRoomIntakePayload["authority"];
  decision: StrategyRoomIntakePayload["decision"];
  constraints: StrategyRoomIntakePayload["constraints"];
  timeCost: StrategyRoomIntakePayload["timeCost"];
  readiness: StrategyRoomIntakePayload["readiness"];
  declarationAccepted: boolean;
  audit: {
    outcome: StrategyRoomIntakeResult["status"];
    score: StrategyRoomScoreBreakdown;
    message: string;
    nextUrl: string | null;
    archivedAtIso: string;
  };
};

// --- NORMALISATION ---
export function normalizePayload(
  payload: StrategyRoomIntakePayload,
): StrategyRoomIntakePayload {
  return {
    meta: {
      source: payload.meta.source,
      page: normalizeText(payload.meta.page),
      submittedAtIso: normalizeText(payload.meta.submittedAtIso),
    },
    contact: {
      fullName: normalizeText(payload.contact.fullName),
      email: normalizeEmail(payload.contact.email),
      organisation: normalizeText(payload.contact.organisation),
    },
    authority: {
      role: normalizeText(payload.authority.role),
      hasAuthority: payload.authority.hasAuthority,
      mandate: normalizeText(payload.authority.mandate),
    },
    decision: {
      statement: normalizeText(payload.decision.statement),
      type: normalizeText(payload.decision.type),
      stuckReasons: uniqueStrings(payload.decision.stuckReasons),
    },
    constraints: {
      nonRemovableConstraints: normalizeText(
        payload.constraints.nonRemovableConstraints,
      ) || null,
      avoidedTradeOff: normalizeText(payload.constraints.avoidedTradeOff),
      unacceptableOutcome: normalizeText(payload.constraints.unacceptableOutcome),
    },
    timeCost: {
      costOfDelay: uniqueStrings(payload.timeCost.costOfDelay),
      affected: normalizeText(payload.timeCost.affected),
      breaksFirst: normalizeText(payload.timeCost.breaksFirst),
    },
    readiness: {
      readyForUnpleasantDecision: payload.readiness.readyForUnpleasantDecision,
      willingAccountability: payload.readiness.willingAccountability,
      whyNow: normalizeText(payload.readiness.whyNow),
    },
    declarationAccepted: Boolean(payload.declarationAccepted),
    recaptchaToken: normalizeText(payload.recaptchaToken),
  };
}

// --- SCORING ---
function scoreByLength(text: string, weak: number, strong: number, max: number): number {
  const len = normalizeText(text).length;
  if (len < weak) return 0;
  if (len >= strong) return max;
  return Math.round(((len - weak) / (strong - weak)) * max);
}

export function computeScore(
  rawPayload: StrategyRoomIntakePayload,
): StrategyRoomScoreBreakdown {
  const payload = normalizePayload(rawPayload);
  const reasons: string[] = [];

  const authority =
    payload.authority.hasAuthority === "Yes, fully"
      ? 4
      : payload.authority.hasAuthority === "Yes, with board approval"
        ? 2
        : 0;
  if (authority === 0) reasons.push("Authority is insufficient for escalation.");

  const mandate = scoreByLength(payload.authority.mandate, 20, 100, 3);
  if (mandate < 2) reasons.push("Mandate articulation is weak.");

  const decisionClarity = scoreByLength(payload.decision.statement, 60, 220, 4);
  if (decisionClarity < 2) reasons.push("Decision statement lacks precision.");

  const tradeoffMaturity = scoreByLength(
    payload.constraints.avoidedTradeOff,
    35,
    140,
    3,
  );
  if (tradeoffMaturity < 2) reasons.push("Trade-off framing is underdeveloped.");

  const urgencyCredibility = scoreByLength(payload.readiness.whyNow, 35, 140, 3);
  if (urgencyCredibility < 2) reasons.push("Urgency case is not yet credible enough.");

  const consequenceAwareness = clamp(
    uniqueStrings(payload.timeCost.costOfDelay).length +
      (payload.timeCost.affected ? 1 : 0) +
      (payload.timeCost.breaksFirst ? 1 : 0),
    0,
    3,
  );
  if (consequenceAwareness < 2) reasons.push("Consequences of delay are weakly stated.");

  const constraintRealism = clamp(
    (payload.constraints.nonRemovableConstraints ? 1 : 0) +
      (payload.constraints.unacceptableOutcome ? 1 : 0) +
      (payload.decision.stuckReasons.length > 0 ? 1 : 0),
    0,
    3,
  );
  if (constraintRealism < 2) reasons.push("Constraint picture is too shallow.");

  const accountabilityReadiness =
    payload.readiness.readyForUnpleasantDecision === "Yes" &&
    payload.readiness.willingAccountability === "Yes"
      ? 2
      : payload.readiness.readyForUnpleasantDecision === "Yes" ||
          payload.readiness.willingAccountability === "Yes"
        ? 1
        : 0;
  if (accountabilityReadiness === 0) reasons.push("Accountability readiness is not established.");

  const total =
    authority +
    mandate +
    decisionClarity +
    tradeoffMaturity +
    urgencyCredibility +
    consequenceAwareness +
    constraintRealism +
    accountabilityReadiness;

  return {
    total,
    max: 25,
    threshold: 16,
    gatesPassed:
      payload.authority.hasAuthority !== "No" &&
      payload.declarationAccepted &&
      payload.readiness.willingAccountability === "Yes",
    components: {
      authority,
      mandate,
      decisionClarity,
      tradeoffMaturity,
      urgencyCredibility,
      consequenceAwareness,
      constraintRealism,
      accountabilityReadiness,
    },
    reasons,
  };
}

// --- EVALUATION ---
export function evaluateIntake(
  rawPayload: StrategyRoomIntakePayload,
): StrategyRoomEvaluation {
  const payload = normalizePayload(rawPayload);
  const score = computeScore(payload);

  if (!payload.declarationAccepted) {
    return {
      score,
      result: {
        ok: false,
        status: "declined",
        message: "Entry requirements not met: declaration not accepted.",
      },
    };
  }

  if (payload.authority.hasAuthority === "No") {
    return {
      score,
      result: {
        ok: false,
        status: "declined",
        message: "Entry requirements not met: decision-bearing authority is insufficient.",
      },
    };
  }

  if (payload.readiness.willingAccountability === "No") {
    return {
      score,
      result: {
        ok: false,
        status: "declined",
        message: "Entry requirements not met: accountability posture is insufficient.",
      },
    };
  }

  if (score.total < score.threshold) {
    return {
      score,
      result: {
        ok: false,
        status: "declined",
        message:
          "Strategic intake is below threshold. Refine the decision statement, stakes, and constraint picture.",
      },
    };
  }

  return {
    score,
    result: {
      ok: true,
      status: "accepted",
      message: "Accepted. Strategic materials dispatched to your email.",
      nextUrl: "/resources/strategic-frameworks",
    },
  };
}

// --- PERSISTENCE ---
export async function archiveIntake(
  rawPayload: StrategyRoomIntakePayload,
  evaluation: StrategyRoomEvaluation,
): Promise<void> {
  const payload = normalizePayload(rawPayload);
  const createdAtDate = new Date();
  const emailHash = sha256(payload.contact.email);

  const persisted: ArchivedStrategyRoomIntake = {
    meta: payload.meta,
    contact: {
      fullName: payload.contact.fullName,
      organisation: payload.contact.organisation,
      emailHash,
    },
    authority: payload.authority,
    decision: payload.decision,
    constraints: payload.constraints,
    timeCost: payload.timeCost,
    readiness: payload.readiness,
    declarationAccepted: payload.declarationAccepted,
    audit: {
      outcome: evaluation.result.status,
      score: evaluation.score,
      message: evaluation.result.message,
      nextUrl: evaluation.result.ok ? evaluation.result.nextUrl : null,
      archivedAtIso: createdAtDate.toISOString(),
    },
  };

  try {
    const data: Prisma.StrategyIntakeCreateInput = {
      fullName: payload.contact.fullName,
      organisation: payload.contact.organisation,
      dependencyLevel: "standard",
      volatility: "medium",
      readinessScore: evaluation.score.total,
      emailHash,
      payload: JSON.stringify(persisted),
      createdAt: createdAtDate,
    };

    await prisma.strategyIntake.create({ data });
    return;
  } catch (err: any) {
    console.error("⚠️ Prisma insertion failed, falling back to filesystem:", err?.message || err);
  }

  try {
    await appendFallbackLog("intakes.log", {
      type: "strategy-room-intake-backup",
      createdAt: createdAtDate.toISOString(),
      persisted,
    });
  } catch (err) {
    console.error("❌ Critical failure: could not write fallback intake log.", err);
  }
}

// --- NOTIFICATIONS ---
export async function notifyDiscord(
  rawPayload: StrategyRoomIntakePayload,
  evaluation: StrategyRoomEvaluation,
): Promise<void> {
  const webhookUrl = process.env.DISCORD_STRATEGY_ROOM_WEBHOOK;
  if (!webhookUrl) return;

  const payload = normalizePayload(rawPayload);

  const embed = {
    title: `Strategic Intake: ${evaluation.result.status.toUpperCase()}`,
    color: evaluation.result.status === "accepted" ? 0xd4af37 : 0x444444,
    fields: [
      {
        name: "Principal",
        value: payload.contact.fullName || "Unknown",
        inline: true,
      },
      {
        name: "Score",
        value: `${evaluation.score.total}/${evaluation.score.max}`,
        inline: true,
      },
      {
        name: "Organisation",
        value: payload.contact.organisation || "—",
        inline: true,
      },
      {
        name: "Authority",
        value: payload.authority.hasAuthority,
        inline: true,
      },
      {
        name: "Decision Statement",
        value: `"${payload.decision.statement || ""}"`.slice(0, 1024),
      },
    ],
    timestamp: new Date().toISOString(),
    footer: { text: "Abraham of London · Strategy Room" },
  };

  try {
    const response = await fetchWithTimeout(
      webhookUrl,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ embeds: [embed] }),
      },
      5000,
    );

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      console.error(
        `❌ Discord notification failed with status ${response.status}: ${body}`,
      );
    }
  } catch (err) {
    console.error("❌ Discord notification delivery failed.", err);
  }
}