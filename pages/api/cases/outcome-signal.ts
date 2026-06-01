/**
 * pages/api/cases/outcome-signal.ts
 *
 * Captures an outcome signal for a governed case.
 * When recommendationId is provided, binds the outcome to the recommendation
 * ledger and appends an OUTCOME_REPORTED journey event.
 *
 * POST /api/cases/outcome-signal
 *
 * Body:
 *   {
 *     caseId: string;
 *     source: string;
 *     signal: OutcomeSignal;
 *     blocker?: string;
 *     freeText?: string;
 *     recommendationId?: string;
 *     whatChanged?: string;
 *   }
 *
 * Privacy:
 *   - Optional free text is not persisted in v1
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
  /** recommendationId to bind this outcome to a specific recommendation ledger entry */
  recommendationId: z.string().min(1).max(200).optional(),
  /** whatChanged description for the outcome report */
  whatChanged: z.string().min(1).max(2000).optional(),
});

type Response =
  | { ok: true; recommendationUpdated?: boolean }
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

  const { caseId, source, signal, blocker, freeText, recommendationId, whatChanged } = parsed.data;

  try {
    const { prisma } = await import("@/lib/prisma.server");

    // Store outcome signal as an audit event
    // v1: store in a generic audit/event store
    // v2: migrate to a dedicated OutcomeSignal table
    await prisma.auditEvent.create({
      data: {
        actorType: "USER",
        actorId: identity.subjectId ?? identity.email,
        objectType: "OUTCOME",
        objectId: caseId,
        actionType: signal,
        summary: `Outcome signal: ${signal}${blocker ? ` (blocker: ${blocker})` : ""}`,
        metadata: {
          source,
          signal,
          blocker: blocker ?? null,
          hasFreeText: Boolean(freeText),
          freeTextStored: false,
          recommendationId: recommendationId ?? null,
          capturedAt: new Date().toISOString(),
        },
      },
    });

    // ── Recommendation ledger binding ──────────────────────────────────────
    // If recommendationId is provided, update the recommendation ledger and
    // append an OUTCOME_REPORTED journey event.
    let recommendationUpdated = false;
    if (recommendationId) {
      try {
        const { attachOutcomeReport } = await import("@/lib/product/recommendation-outcome-ledger");
        const { appendDiagnosticJourneyEvent } = await import("@/lib/product/diagnostic-journey-store");

        // Build a safe outcome summary from the signal data
        const outcomeSummary = whatChanged
          ? `${signal}: ${whatChanged.slice(0, 500)}`
          : blocker
            ? `${signal}: Blocked by ${blocker}`
            : `${signal}: User reported outcome`;

        // Update the recommendation ledger
        const updated = await attachOutcomeReport({
          caseId,
          recommendationId,
          outcomeSummary,
          verified: false, // User-reported — never automatically verified
        });

        if (updated !== null) {
          recommendationUpdated = true;

          // Append OUTCOME_REPORTED journey event (non-blocking)
          try {
            await appendDiagnosticJourneyEvent({
              caseId,
              surface: 'fast_diagnostic',
              type: 'OUTCOME_REPORTED',
              engineId: 'outcome-signal',
              summary: outcomeSummary.slice(0, 200),
              payload: {
                recommendationId,
                outcomeSummary,
                verificationStatus: 'USER_REPORTED',
                verified: false,
                signal,
                blocker: blocker ?? null,
              },
              audienceSafe: true,
            });
          } catch {
            // Journey event failure does not affect the response
          }
        }
      } catch {
        // Recommendation ledger binding failure does not block the response
      }
    }

    return res.status(200).json({ ok: true, recommendationUpdated });
  } catch (error) {
    console.error("[outcome-signal] Failed to capture signal:", error);
    return res.status(500).json({ ok: false, error: "Failed to capture outcome signal" });
  }
}