/**
 * GET /api/downloads/instrument-pdf?slug=decision-exposure-instrument
 *
 * Controlled PDF delivery for paid instruments.
 * Requires a persisted DecisionInstrumentRun and matching entitlement.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { resolveIdentity } from "@/lib/auth/resolve-identity";
import { resolveCanonicalEntitlement } from "@/lib/commercial/entitlement-authority";
import { prisma } from "@/lib/prisma";
import {
  beginArtifactGeneration,
  entitlementSlugForInstrument,
  failArtifactGeneration,
  hashRunInput,
  INSTRUMENT_ENTITLEMENTS,
  recordArtifact,
} from "@/lib/decision-instruments/instrument-run-authority";

const ALLOWED_SLUGS = new Set(Object.keys(INSTRUMENT_ENTITLEMENTS));

function stringOrNull(value: unknown): string | null {
  const text = typeof value === "string" ? value.trim() : "";
  return text || null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();

  const slug = typeof req.query.slug === "string" ? req.query.slug.trim() : "";
  if (!slug || !ALLOWED_SLUGS.has(slug)) {
    return res.status(404).json({ error: "Instrument not found" });
  }

  const runId = stringOrNull(req.query.runId);
  if (!runId) {
    return res.status(400).json({ error: "runId required", code: "INSTRUMENT_RUN_REQUIRED" });
  }

  const entitlementSlug = entitlementSlugForInstrument(slug);
  if (!entitlementSlug) {
    return res.status(404).json({ error: "Instrument not found" });
  }

  const run = await prisma.decisionInstrumentRun.findFirst({
    where: {
      id: runId,
      instrumentSlug: slug,
      entitlementSlug,
      entitlementVerified: true,
    },
  });

  if (!run) {
    return res.status(404).json({ error: "Instrument run not found", code: "RUN_NOT_FOUND" });
  }

  if (run.status !== "COMPLETED") {
    return res.status(409).json({ error: "Instrument run is not complete", code: "RUN_NOT_COMPLETE" });
  }

  const identity = await resolveIdentity(req);
  const email = identity.email ?? stringOrNull(req.query.email);
  const ownsRun = Boolean(identity.subjectId && run.userId === identity.subjectId)
    || Boolean(email && run.userEmail === email);

  if (!ownsRun) {
    return res.status(identity.authenticated || email ? 403 : 401).json({
      error: "Instrument run ownership required",
      code: "RUN_OWNERSHIP_REQUIRED",
    });
  }

  const entitlement = await resolveCanonicalEntitlement({
    userId: identity.subjectId,
    email,
    slug: run.entitlementSlug,
    tier: identity.tier,
  });

  if (!entitlement.granted || !entitlement.verified) {
    return res.status(403).json({
      error: "Instrument entitlement required",
      code: "INSTRUMENT_ENTITLEMENT_REQUIRED",
    });
  }

  try {
    await beginArtifactGeneration(run.id);
    const artifactUrl = `/api/downloads/${encodeURIComponent(slug)}`;
    const artifactHash = hashRunInput({
      runId: run.id,
      instrumentSlug: run.instrumentSlug,
      entitlementSlug: run.entitlementSlug,
      inputSnapshotHash: run.inputSnapshotHash,
      scoreJson: run.scoreJson,
      artifactUrl,
    });
    await recordArtifact(run.id, { artifactUrl, artifactHash });

    res.setHeader("Cache-Control", "private, no-store, max-age=0");
    res.setHeader("Location", artifactUrl);
    return res.status(307).end();
  } catch (error) {
    await failArtifactGeneration(run.id, error instanceof Error ? error.message : "Artifact generation failed").catch(() => undefined);
    return res.status(500).json({ error: "Failed to prepare instrument artifact" });
  }
}
