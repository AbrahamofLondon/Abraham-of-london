/** POST /api/corridor/recommendation-context — persist Signal's non-sensitive corridor context. */
import type { NextApiRequest, NextApiResponse } from "next";
import { saveRecommendationContext, getRecommendationContext, type CorridorAccessMode } from "@/lib/intelligence/corridor/recommendation-context-store";

const ACCESS: CorridorAccessMode[] = ["free", "self_serve", "controlled", "manual_billing", "unavailable", "none"];
const clean = (v: unknown, max = 280) => typeof v === "string" ? v.slice(0, max) : "";
const cleanList = (v: unknown) => Array.isArray(v) ? v.map((x) => clean(x)).filter(Boolean).slice(0, 8) : [];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    const id = typeof req.query.recommendationId === "string" ? req.query.recommendationId : "";
    if (!id) return res.status(400).json({ error: "recommendationId required" });
    const record = getRecommendationContext(id);
    if (!record) return res.status(404).json({ error: "not found" });
    return res.status(200).json(record);
  }
  if (req.method !== "POST") { res.setHeader("Allow", "GET, POST"); return res.status(405).json({ error: "Method not allowed" }); }
  const b = req.body ?? {};
  if (typeof b.recommendationId !== "string") return res.status(400).json({ error: "recommendationId required" });
  if (typeof b.sessionId !== "string") return res.status(400).json({ error: "sessionId required" });
  const accessMode = ACCESS.includes(b.accessMode) ? b.accessMode : "unavailable";
  try {
    const record = saveRecommendationContext({
      recommendationId: clean(b.recommendationId, 80),
      sessionId: clean(b.sessionId, 96),
      sessionVersion: Number.isFinite(Number(b.sessionVersion)) ? Number(b.sessionVersion) : 1,
      pressureBand: clean(b.pressureBand, 24),
      targetProductCode: clean(b.targetProductCode, 80),
      targetLabel: clean(b.targetLabel, 120),
      targetRoute: clean(b.targetRoute, 180),
      accessMode,
      whyAdmissible: clean(b.whyAdmissible, 500),
      evidenceBasis: cleanList(b.evidenceBasis),
      established: cleanList(b.established),
      unresolved: {
        contradiction: b.unresolved?.contradiction ? clean(b.unresolved.contradiction, 500) : null,
        evidenceGap: b.unresolved?.evidenceGap ? clean(b.unresolved.evidenceGap, 500) : null,
        ownershipGap: b.unresolved?.ownershipGap ? clean(b.unresolved.ownershipGap, 500) : null,
        timingPressure: b.unresolved?.timingPressure ? clean(b.unresolved.timingPressure, 500) : null,
        unresolvedCommitment: b.unresolved?.unresolvedCommitment ? clean(b.unresolved.unresolvedCommitment, 500) : null,
      },
      notYetAppropriate: b.notYetAppropriate ? clean(b.notYetAppropriate, 500) : null,
      carryForward: cleanList(b.carryForward),
    });
    return res.status(201).json({ recommendationId: record.recommendationId, contextId: record.contextId, stateHash: record.stateHash });
  } catch (err) {
    console.error("[corridor-context] save failed", err);
    return res.status(400).json({ error: "context rejected" });
  }
}
