/**
 * pages/api/security-assurance/request.ts
 *
 * POST /api/security-assurance/request
 *
 * Structured intake for controlled security assurance material requests.
 * Persists the request to SecurityAssuranceRequest with status=NEW.
 * Sends admin notification email. Does not auto-deliver documents.
 */

import { z } from "zod";
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma.server";
import {
  getSecurityAssuranceMaterialById,
  VALID_SECURITY_ASSURANCE_MATERIAL_IDS,
} from "@/lib/security-assurance/security-assurance-pack-registry";
import {
  rateLimit,
  getClientIp,
  createRateLimitHeaders,
  RATE_LIMIT_CONFIGS,
} from "@/lib/server/rateLimit";
import { notifyDiscord } from "@/lib/notifications/discord";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
  "https://www.abrahamoflondon.org";

const RequestSchema = z.object({
  name: z.string().min(2).max(100).trim().optional(),
  email: z.string().email().toLowerCase().trim(),
  organisation: z.string().max(200).trim().optional(),
  role: z.string().max(200).trim().optional(),
  requestedMaterial: z
    .string()
    .trim()
    .refine(
      (v) => VALID_SECURITY_ASSURANCE_MATERIAL_IDS.includes(v),
      { message: "Unknown material id" },
    ),
  procurementStage: z
    .enum([
      "early_review",
      "pilot_due_diligence",
      "procurement",
      "security_review",
      "legal_review",
      "other",
    ])
    .optional(),
  message: z.string().max(3000).trim().optional(),
  gRecaptchaToken: z.string().optional(),
});

function getRateLimitExceeded(result: unknown): boolean {
  const rl = result as { ok?: boolean; allowed?: boolean };
  if (typeof rl.ok === "boolean") return !rl.ok;
  if (typeof rl.allowed === "boolean") return !rl.allowed;
  return false;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, message: "Method not allowed" });
  }

  const ip = getClientIp(req);
  const rl = await rateLimit(
    `security-assurance-request:${ip}`,
    RATE_LIMIT_CONFIGS.contact,
  );

  Object.entries(createRateLimitHeaders(rl)).forEach(([k, v]) =>
    res.setHeader(k, v),
  );

  if (getRateLimitExceeded(rl)) {
    return res.status(429).json({ ok: false, message: "Rate limit exceeded." });
  }

  const parsed = RequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, errors: parsed.error.format() });
  }

  const {
    name,
    email,
    organisation,
    role,
    requestedMaterial,
    procurementStage,
    message,
  } = parsed.data;

  const material = getSecurityAssuranceMaterialById(requestedMaterial);

  try {
    const record = await prisma.securityAssuranceRequest.create({
      data: {
        name: name ?? null,
        email,
        organisation: organisation ?? null,
        role: role ?? null,
        requestedMaterial,
        procurementStage: procurementStage ?? null,
        message: message ?? null,
        status: "NEW",
      },
    });

    await notifyDiscord({
      title: "SECURITY ASSURANCE REQUEST",
      description: `New request from **${name ?? email}** (${email})`,
      priority: false,
      color: 0xc9a96e,
      fields: [
        { name: "Material", value: material?.title ?? requestedMaterial, inline: true },
        { name: "Level", value: material?.disclosureLevel ?? "UNKNOWN", inline: true },
        { name: "Organisation", value: organisation ?? "—", inline: true },
        { name: "Role", value: role ?? "—", inline: true },
        { name: "Procurement stage", value: procurementStage ?? "—", inline: true },
        { name: "Requires NDA", value: material?.requiresNda ? "Yes" : "No", inline: true },
        {
          name: "Admin queue",
          value: `${SITE_URL}/admin/security-assurance-requests`,
        },
      ],
    }).catch(() => {});

    return res.status(200).json({
      ok: true,
      requestId: record.id,
      status: "NEW",
      message:
        "Your request has been received for review. We will respond within 48 hours.",
    });
  } catch (err) {
    console.error("[SECURITY_ASSURANCE_REQUEST_ERROR]", err);
    return res
      .status(500)
      .json({ ok: false, message: "Internal server error." });
  }
}
