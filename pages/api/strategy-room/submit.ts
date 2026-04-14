/* pages/api/strategy-room/submit.ts — legacy structured-form adapter */
import type { NextApiRequest, NextApiResponse } from "next";
import type { Prisma } from "@prisma/client";
import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";

type SubmitResponse =
  | {
      success: true;
      intakeId: string;
    }
  | {
      error: string;
    };

type PayloadLike = Record<string, unknown>;

function toSafeObject(value: unknown): PayloadLike {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as PayloadLike)
    : {};
}

function toJsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? {})) as Prisma.InputJsonValue;
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SubmitResponse>,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const body = toSafeObject(req.body);
  const fullName = String(body.fullName || "").trim();
  const organisation = String(body.organisation || "").trim();

  if (!fullName || !organisation) {
    return res.status(400).json({
      error:
        "Incomplete Dossier: Principal Identity and Institutional Affiliation required.",
    });
  }

  try {
    const dependencyLevel = String(body.dependencyLevel || "").trim() || "unknown";
    const volatility = String(body.volatility || "").trim() || "unknown";

    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const emailHash = email ? sha256(email) : null;

    const intakePayload: PayloadLike = {
      ...body,
      source: body.source || "strategy_room_submit_legacy",
      submittedAt: new Date().toISOString(),
    };

    const intake = await prisma.strategyIntake.create({
      data: {
        fullName,
        organisation,
        dependencyLevel,
        volatility,
        payload: JSON.stringify(intakePayload),
        emailHash,
      },
    });

    return res.status(201).json({
      success: true,
      intakeId: intake.id,
    });
  } catch (error) {
    console.error("[STRATEGY_ROOM_SUBMIT_ERROR]", error);
    return res.status(500).json({
      error: "System failure during intake registration.",
    });
  }
}