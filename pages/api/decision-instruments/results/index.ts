/**
 * POST /api/decision-instruments/results — persist instrument result
 * GET  /api/decision-instruments/results — list user's results
 *
 * Uses DiagnosticJourney with diagnosticType = "instrument_result"
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { resolveIdentity } from "@/lib/auth/resolve-identity";
import {
  completeInstrumentRun,
  entitlementSlugForInstrument,
  failInstrumentRun,
  InstrumentEntitlementError,
  InstrumentRunPersistenceError,
  startInstrumentRun,
} from "@/lib/decision-instruments/instrument-run-authority";

function stringOrNull(value: unknown): string | null {
  const text = typeof value === "string" ? value.trim() : "";
  return text || null;
}

function nextRouteForInstrument(instrumentSlug: string): string | null {
  if (instrumentSlug === "decision-exposure-instrument") return "executive-reporting";
  if (instrumentSlug === "mandate-clarity-framework") return "structural-failure-diagnostic-canvas";
  if (instrumentSlug === "intervention-path-selector") return "strategy-room";
  return null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    let runId: string | null = null;
    try {
      const { instrumentSlug, version, answers, scores, result, email, spineId } = req.body ?? {};
      if (!instrumentSlug || !result) return res.status(400).json({ error: "Missing instrumentSlug or result" });

      const slug = String(instrumentSlug);
      const entitlementSlug = entitlementSlugForInstrument(slug);
      if (!entitlementSlug) return res.status(404).json({ error: "Instrument not found" });

      const identity = await resolveIdentity(req);
      const userEmail = identity.email ?? stringOrNull(email);
      const userId = identity.subjectId ?? null;

      const run = await startInstrumentRun({
        instrumentSlug: slug,
        userId,
        userEmail,
        entitlementSlug,
        tier: identity.tier,
        inputObject: { instrumentSlug: slug, version, answers, scores, result, email: userEmail, spineId },
      });
      runId = run.id;

      const completedAt = new Date().toISOString();
      const journeyKey = `instrument_${slug}_${run.id}`;
      const payload = JSON.parse(JSON.stringify({
        instrumentSlug: slug,
        version,
        answers,
        scores,
        result,
        runId: run.id,
        entitlementSlug,
        completedAt,
      }));

      await prisma.diagnosticJourney.upsert({
        where: { journeyKey },
        create: {
          journeyKey,
          subjectKey: userEmail ?? spineId ?? run.id,
          email: userEmail,
          diagnosticType: "instrument_result",
          status: "completed",
          mergedTensionThread: payload,
        },
        update: {
          mergedTensionThread: payload,
          status: "completed",
          updatedAt: new Date(),
        },
      });

      const nextRouteSlug = nextRouteForInstrument(slug) ?? undefined;
      await completeInstrumentRun(run.id, {
        scoreJson: payload,
        nextRouteSlug,
      });

      // Non-fatal verification record — instrument completion creates a future accountability point
      try {
        const { createMaterialOutputVerificationRecord } = await import(
          "@/lib/product/signal-verification-record"
        );
        await createMaterialOutputVerificationRecord({
          source: "decision-instrument",
          sourceId: run.id,
          userEmail,
          conditionName: slug,
          severity: null,
          score: null,
          recommendedMove: null,
          operatorReviewRequired: false,
          dueDays: 30,
        });
      } catch {
        // non-fatal
      }

      return res.status(200).json({ ok: true, runId: run.id, journeyKey });
    } catch (error) {
      if (runId) {
        await failInstrumentRun(runId, error instanceof Error ? error.message : "Instrument run failed").catch(() => undefined);
      }
      if (error instanceof InstrumentEntitlementError) {
        return res.status(403).json({ error: error.message, code: "INSTRUMENT_ENTITLEMENT_REQUIRED" });
      }
      if (error instanceof InstrumentRunPersistenceError) {
        return res.status(500).json({ error: "Failed to start instrument run", code: "INSTRUMENT_RUN_NOT_PERSISTED" });
      }
      console.error("[instrument-results] POST error:", error);
      return res.status(500).json({ error: "Failed to save result" });
    }
  }

  if (req.method === "GET") {
    const identity = await resolveIdentity(req);
    const email = identity.email ?? (typeof req.query.email === "string" ? req.query.email : "");
    if (!email) return res.status(400).json({ error: "Email required" });

    try {
      const results = await prisma.decisionInstrumentRun.findMany({
        where: { userEmail: email },
        orderBy: { createdAt: "desc" },
        take: 20,
      });

      return res.status(200).json({
        results: results.map((r) => ({
          id: r.id,
          runId: r.id,
          instrumentSlug: r.instrumentSlug,
          entitlementSlug: r.entitlementSlug,
          status: r.status,
          artifactState: r.artifactState,
          artifactUrl: r.artifactUrl,
          scoreJson: r.scoreJson,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        })),
      });
    } catch (error) {
      console.error("[instrument-results] GET error:", error);
      return res.status(500).json({ error: "Failed to load results" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
