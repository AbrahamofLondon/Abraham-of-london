/* pages/api/foundry/interest.ts — PUBLIC INTEREST CAPTURE
 *
 * Receives review-interest signals from the public proof layer.
 * Accepts structured fields: decision type, deadline, professional help
 * status, financial constraint, what was already tried, and minimum outcome.
 *
 * No auth required. Rate-limited. Validated with zod. Stored to DB.
 * Does NOT send emails automatically.
 * Does NOT log free-text inputs to analytics.
 */

import { z } from "zod";
import crypto from "crypto";
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma.server";
import {
  rateLimit,
  getClientIp,
} from "@/lib/server/rateLimit";

type ResponseBody =
  | { ok: true; message: string }
  | { ok: false; error: string; fields?: Record<string, unknown> };

const InterestSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  email: z.string().email().toLowerCase().trim(),
  organisation: z.string().max(200).trim().optional().or(z.literal("")),
  role: z.string().max(200).trim().optional().or(z.literal("")),
  // Structured fields
  decisionType: z.string().max(100).trim().optional().or(z.literal("")),
  deadline: z.string().max(200).trim().optional().or(z.literal("")),
  professionalHelpStatus: z
    .enum(["can_access", "seeking", "cannot_afford", "not_applicable", ""])
    .optional(),
  hasFinancialConstraint: z.boolean().optional(),
  alreadyTried: z.string().max(1000).trim().optional().or(z.literal("")),
  minimumOutcome: z.string().max(500).trim().optional().or(z.literal("")),
  // Legacy / shared
  context: z.string().max(1000).trim().optional().or(z.literal("")),
  urgency: z
    .enum(["Low", "Medium", "High", "Board-sensitive"])
    .default("Medium"),
  sourceTest: z
    .enum(["decision", "market-signal", "release-risk", "general"])
    .optional(),
  consentGiven: z.boolean().refine(v => v === true, {
    message: "Consent is required",
  }),
  _hp: z.string().max(0).optional(),
});

const FOUNDRY_INTEREST_RL = { limit: 3, windowSeconds: 3600 };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseBody>,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  const ip = getClientIp(req);
  const rl = rateLimit(`foundry-interest:${ip}`, FOUNDRY_INTEREST_RL);
  if (!rl.allowed) {
    res.setHeader("Retry-After", String(rl.resetSeconds ?? 3600));
    return res.status(429).json({ ok: false, error: "TOO_MANY_REQUESTS" });
  }

  const parsed = InterestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: "VALIDATION_ERROR",
      fields: parsed.error.flatten().fieldErrors,
    });
  }

  const {
    name, email, organisation, role,
    decisionType, deadline, professionalHelpStatus, hasFinancialConstraint,
    alreadyTried, minimumOutcome, context, urgency, sourceTest,
    consentGiven, _hp,
  } = parsed.data;

  if (_hp) {
    return res.status(200).json({ ok: true, message: "Signal received." });
  }

  const ipHash = ip
    ? crypto
        .createHash("sha256")
        .update(ip + (process.env.IP_HASH_SALT || "aol-foundry"))
        .digest("hex")
        .slice(0, 16)
    : undefined;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma.foundryInterest as any).create({
      data: {
        name,
        email,
        organisation: organisation || null,
        role: role || null,
        decisionType: decisionType || null,
        deadline: deadline || null,
        professionalHelpStatus: professionalHelpStatus || null,
        hasFinancialConstraint: hasFinancialConstraint ?? false,
        alreadyTried: alreadyTried || null,
        minimumOutcome: minimumOutcome || null,
        context: context || null,
        urgency,
        sourceTest: sourceTest || null,
        ipHash: ipHash || null,
        consentGiven,
      },
    });

    return res.status(200).json({
      ok: true,
      message:
        "Thank you. Your review interest has been recorded. A member of the Foundry team will be in touch.",
    });
  } catch (error) {
    console.error("[foundry.interest]", error);
    return res.status(500).json({ ok: false, error: "INTERNAL_ERROR" });
  }
}
