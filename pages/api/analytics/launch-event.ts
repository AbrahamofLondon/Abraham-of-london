import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { resolveIdentity } from "@/lib/auth/resolve-identity";

const LAUNCH_EVENT_NAMES = [
  "homepage_cta_clicked",
  "fast_started",
  "fast_completed",
  "checkpoint_created",
  "checkpoint_responded",
  "earned_step_shown",
  "earned_step_clicked",
  "decision_centre_opened",
  "return_brief_opened",
  "return_brief_response_submitted",
  "purpose_alignment_started",
  "purpose_alignment_completed",
  "executive_reporting_gate_viewed",
  "executive_reporting_started",
  "strategy_room_entered",
  "strategy_room_decision_recorded",
  "counsel_room_viewed",
  "counsel_intake_started",
  "counsel_intake_submitted",
] as const;

const BLOCKED_FIELDS = [
  "decisionText",
  "evidenceText",
  "blockerDescription",
  "counselText",
  "notes",
  "message",
  "freeform",
  "respondentText",
  "rawText",
  "userInput",
];

const PayloadSchema = z
  .object({
    eventName: z.enum(LAUNCH_EVENT_NAMES),
    surface: z.string().max(200),
    caseId: z.string().max(200).nullish(),
    journeyId: z.string().max(200).nullish(),
    sessionId: z.string().max(200).nullish(),
    checkpointId: z.string().max(200).nullish(),
    admissionState: z.string().max(100).nullish(),
    evidencePosture: z.string().max(100).nullish(),
    sourceSurface: z.string().max(200).nullish(),
    productCode: z.string().max(100).nullish(),
    route: z.string().max(500).nullish(),
    timestamp: z.string(),
    userEmailHash: z.string().max(128).nullish(),
  })
  .strict();

function hashEmail(email: string): string {
  return createHash("sha256").update(email.toLowerCase().trim()).digest("hex").slice(0, 16);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }

  // Reject payloads containing raw text fields
  const body = req.body ?? {};
  for (const field of BLOCKED_FIELDS) {
    if (field in body && body[field] != null && body[field] !== "") {
      return res.status(400).json({ error: `Blocked field: ${field}` });
    }
  }

  const parsed = PayloadSchema.safeParse(body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten().fieldErrors });
  }

  const payload = parsed.data;

  // Resolve identity if available (best-effort, not required)
  let userEmail: string | null = null;
  let userId: string | null = null;
  try {
    const identity = await resolveIdentity(req);
    if (identity?.email) {
      userEmail = identity.email.toLowerCase();
      userId = identity.subjectId ?? null;
    }
  } catch {
    /* anonymous events are acceptable */
  }

  // Enrich payload with server-side email hash if available
  const emailHash = userEmail ? hashEmail(userEmail) : payload.userEmailHash ?? null;

  try {
    await prisma.diagnosticRecord.create({
      data: {
        diagnosticType: "launch_event",
        userEmail: userEmail ?? undefined,
        userId: userId ?? undefined,
        status: "completed",
        score: 0,
        severity: "moderate",
        verdict: payload.eventName,
        responsesJson: JSON.stringify({
          ...payload,
          userEmailHash: emailHash,
          serverTimestamp: new Date().toISOString(),
        }),
      },
    });
  } catch (err) {
    console.error("[launch-event] persist failed:", err);
    // Do not fail the request — instrumentation is best-effort
  }

  return res.status(200).json({ ok: true });
}
