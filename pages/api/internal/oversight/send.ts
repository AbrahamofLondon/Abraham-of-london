import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";

import { requireAdminServer } from "@/lib/auth/requireAdminServer";
import { deliverOversightBrief } from "@/lib/product/oversight-brief-delivery-service";

const schema = z.object({
  recipientEmail: z.string().trim().email(),
  recipientName: z.string().trim().max(120).optional().nullable(),
  organisationId: z.string().trim().optional().nullable(),
  userId: z.string().trim().optional().nullable(),
  periodStart: z.string().trim().optional().nullable(),
  periodEnd: z.string().trim().optional().nullable(),
  preview: z.boolean().optional(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  const session = await requireAdminServer(req, res, {
    routeKey: "internal-oversight-send",
    rateLimit: { limit: 15, windowMs: 15 * 60_000 },
  });
  if (!session) return;

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: "INVALID_PAYLOAD",
      details: parsed.error.flatten().fieldErrors,
    });
  }

  try {
    const result = await deliverOversightBrief(parsed.data);
    return res.status(200).json({
      ok: true,
      actorEmail: session.user?.email ?? null,
      delivery: result,
    });
  } catch (error) {
    console.error("[internal-oversight-send]", error);
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "OVERSIGHT_BRIEF_DELIVERY_FAILED",
    });
  }
}
