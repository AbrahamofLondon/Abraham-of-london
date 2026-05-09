import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";

import { requireAdminServer } from "@/lib/auth/requireAdminServer";
import { deliverReturnBrief } from "@/lib/product/return-brief-delivery-service";

const schema = z.object({
  sessionId: z.string().trim().min(1),
  recipientEmail: z.string().trim().email(),
  recipientName: z.string().trim().max(120).optional().nullable(),
  preview: z.boolean().optional(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  const session = await requireAdminServer(req, res, {
    routeKey: "internal-return-brief-send",
    rateLimit: { limit: 20, windowMs: 15 * 60_000 },
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
    const result = await deliverReturnBrief(parsed.data);
    return res.status(200).json({
      ok: true,
      actorEmail: session.user?.email ?? null,
      delivery: result,
    });
  } catch (error) {
    console.error("[internal-return-brief-send]", error);
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "RETURN_BRIEF_DELIVERY_FAILED",
    });
  }
}
