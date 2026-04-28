import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { decryptEncryptedStateToken } from "@/lib/security/secure-client-state";

const stageSchema = z.enum([
  "team-assessment",
  "executive-reporting",
  "strategy-room",
]);

const querySchema = z.object({
  token: z.string().min(20),
});

type ApiSuccess = {
  ok: true;
  stage: z.infer<typeof stageSchema>;
  bridge: unknown;
};

type ApiFailure = {
  ok: false;
  error: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiSuccess | ApiFailure>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  const stageResult = stageSchema.safeParse(req.query.stage);
  const queryResult = querySchema.safeParse({
    token: typeof req.query.token === "string" ? req.query.token : "",
  });

  if (!stageResult.success || !queryResult.success) {
    return res.status(400).json({ ok: false, error: "INVALID_REQUEST" });
  }

  const tokenPayload = decryptEncryptedStateToken(queryResult.data.token);
  if (!tokenPayload) {
    return res.status(401).json({ ok: false, error: "INVALID_TOKEN" });
  }

  const report = await prisma.constitutionalIntakeReport.findUnique({
    where: { id: tokenPayload.reportId },
    select: { bridgeJson: true },
  });

  if (!report?.bridgeJson) {
    return res.status(404).json({ ok: false, error: "HANDOFF_NOT_FOUND" });
  }

  try {
    const bridge = JSON.parse(report.bridgeJson);
    return res.status(200).json({
      ok: true,
      stage: stageResult.data,
      bridge,
    });
  } catch {
    return res.status(500).json({ ok: false, error: "HANDOFF_CORRUPT" });
  }
}
