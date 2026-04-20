// pages/api/deal-flow/qualify.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/db";
import { evaluateDealAI } from "@/lib/ai/deal-intelligence";
import { fuseScores } from "@/lib/ai/deal-fusion";
import { predictDealOutcome } from "@/lib/ai/predictive-deal-engine";
import { hubspotSync } from "@/lib/hubspot/sync";

const getIp = (req: NextApiRequest) =>
  (req.headers["x-forwarded-for"] as string)?.split(",")[0] ||
  req.socket.remoteAddress ||
  "unknown";

function asBoolLike(input: string): boolean {
  return ["yes", "y", "true", "1"].includes(String(input || "").trim().toLowerCase());
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const {
    name,
    email,
    revenue,
    problem,
    urgency,
    authority,
    sessionDepth,
    timeOnSite,
    returnVisitor,
  } = req.body ?? {};

  if (!name || !email || !revenue || !problem || !urgency || !authority) {
    return res.status(400).json({ ok: false, error: "Invalid input" });
  }

  const rev = Number(revenue || 0);
  let ruleScore = 0;

  if (rev > 1_000_000) ruleScore += 40;
  else if (rev > 500_000) ruleScore += 35;
  else if (rev > 250_000) ruleScore += 25;
  else if (rev > 100_000) ruleScore += 15;

  if (asBoolLike(authority)) ruleScore += 30;

  if (String(urgency).toLowerCase().includes("week")) ruleScore += 30;
  else if (String(urgency).toLowerCase().includes("month")) ruleScore += 20;
  else ruleScore += 10;

  if (String(problem).length > 100) ruleScore += 5;
  if (String(problem).length > 250) ruleScore += 10;

  const ai = evaluateDealAI({
    problem: String(problem),
    revenue: rev,
    urgency: String(urgency),
  });

  const fusion = fuseScores({
    ruleScore,
    aiScore: ai.score,
    aiConfidence: ai.confidence,
    revenue: rev,
    authority,
    urgency: String(urgency),
    problem: String(problem),
    sessionDepth: Number(sessionDepth || 0),
    timeOnSite: Number(timeOnSite || 0),
    returnVisitor: Boolean(returnVisitor),
  });

  const prediction = predictDealOutcome({
    name,
    email,
    revenue: rev,
    problem,
    urgency,
    authority,
    ruleScore,
    aiScore: ai.score,
    aiConfidence: ai.confidence,
    aiIntent: null,
    aiDealQuality: null,
    sessionDepth: Number(sessionDepth || 0),
    timeOnSite: Number(timeOnSite || 0),
    returnVisitor: Boolean(returnVisitor),
    route: fusion.route,
    status: "NEW",
  });

  const finalRoute =
    prediction.nextBestAction === "FAST_TRACK_STRATEGY"
      ? "STRATEGY"
      : prediction.nextBestAction === "SEND_TO_DIAGNOSTIC"
      ? "DIAGNOSTIC"
      : fusion.route === "STRATEGY"
      ? "DIAGNOSTIC"
      : "REJECT";

  const prisma =
    typeof (db as any)?.getPrismaClient === "function"
      ? await (db as any).getPrismaClient()
      : db;

  const submission = await prisma.dealFlowSubmission.create({
    data: {
      name,
      email,
      revenue: String(revenue),
      problem: String(problem),
      urgency: String(urgency),
      authority: String(authority),
      score: ruleScore,
      route: finalRoute,

      aiScore: ai.score,
      aiConfidence: ai.confidence,
      aiIntent: null,
      aiDealQuality: null,
      aiSummary: null,

      sessionDepth: Number(sessionDepth || 0),
      timeOnSite: Number(timeOnSite || 0),
      returnVisitor: Boolean(returnVisitor),

      // Predictive layer
      predictedWinProbability: prediction.winProbability,
      predictedCloseVelocityDays: prediction.closeVelocityDays,
      predictedExpectedRevenue: prediction.expectedRevenue,
      predictedPriority: prediction.priority,
      predictedTemperature: prediction.pipelineTemperature,
      predictedNextAction: prediction.nextBestAction,
      predictiveRationale: JSON.stringify(prediction.rationale),

      status: "NEW",
      priority: prediction.priority,

      ipAddress: getIp(req),
      userAgent: req.headers["user-agent"],
      referrer: req.headers["referer"],
    },
  });

  console.log({
    timestamp: new Date().toISOString(),
    id: submission.id,
    ruleScore,
    aiScore: ai.score,
    finalRoute,
    winProbability: prediction.winProbability,
    expectedRevenue: prediction.expectedRevenue,
    priority: prediction.priority,
  });

  // HubSpot sync — fire and forget
  hubspotSync({
    event: "deal_flow_qualified",
    email: String(body.email || ""),
    data: {
      fullName: String(body.name || ""),
      route: finalRoute,
      score: ruleScore,
      revenue: String(body.revenue || ""),
      problem: String(body.problem || ""),
      urgency: String(body.urgency || ""),
    },
  }).catch(() => {});

  return res.status(200).json({
    ok: true,
    route: finalRoute,
    score: ruleScore,
    aiScore: ai.score,
    submissionId: submission.id,
    predictive: {
      winProbability: prediction.winProbability,
      closeVelocityDays: prediction.closeVelocityDays,
      expectedRevenue: prediction.expectedRevenue,
      priority: prediction.priority,
      temperature: prediction.pipelineTemperature,
      nextBestAction: prediction.nextBestAction,
    },
  });
}