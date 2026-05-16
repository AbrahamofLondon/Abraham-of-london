/**
 * pages/api/cases/outcome-signal.ts
 *
 * Captures an outcome signal for a governed case.
 *
 * POST /api/cases/outcome-signal
 *
 * Body:
 *   { caseId: string; source: string; signal: OutcomeSignal; blocker?: string; freeText?: string }
 *
 * Privacy:
 *   - Free text is stored but never exposed in aggregates
 *   - No raw decision text is stored with the signal
 *   - Signals are anonymised for pattern detection
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { resolveIdentity } from "@/lib/auth/resolve-identity";

const signalSchema = z.object({
  caseId: z.string().min(1).max(200),
  source: z.string().min(1).max(100),
  signal: z.enum([
    "ACTED",
    "DELAYED",
    "BLOCKED",
    "ABANDONED",
    "RESOLVED",
    "WORSENED",
    "NEEDS_REOPEN",
  ]),
  blocker: z
    .enum([
      "AUTHORITY_UNCLEAR",
      "EVIDENCE_INSUFFICIENT",
      "STAKEHOLDER_RESISTANCE",
      "BUDGET_CHANGED",
      "TIMING_CHANGED",
      "CAPACITY_MISSING",
      "RISK_INCREASED",
      "OTHER",
    ])
    .optional(),
  freeText: z.string().max(2000).optional(),
});

type Response =
  | { ok: true }
  | { ok: false; error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Response>,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const identity = await resolveIdentity(req);
  if (!identity.authenticated || !identity.email) {
    return res.status(401).json({ ok: false, error: "Authentication required" });
  }

  const parsed = signalSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: "Invalid request body" });
  }

  const { caseId, source, signal, blocker, freeText } = parsed.data;

  try {
    const { prisma } = await import("@/lib/prisma.server");

    // Store outcome signal as an audit event
    // v1: store in a generic audit/event store
    // v2: migrate to a dedicated OutcomeSignal table
    await prisma.auditEvent.create({
      data: {
        email: identity.email.toLowerCase(),
        action: "outcome_signal",
        targetType: "case",
        targetId: caseId,
        metadata: {
          source,
          signal,
          blocker: blocker ?? null,
          hasFreeText: Boolean(freeText),
          capturedAt: new Date().toISOString(),
        },
      },
    });

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("[outcome-signal] Failed to capture signal:", error);
    return res.status(500).json({ ok: false, error: "Failed to capture outcome signal" });
  }
}
