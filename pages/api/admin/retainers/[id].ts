// pages/api/admin/retainers/[id].ts
// GET — candidate/contract detail
// PATCH — pipeline actions: mark_review_ready | approve_for_offer | reject |
//          add_notes | create_contract | create_first_cycle | create_case_study_draft
import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminServer } from "@/lib/auth/requireAdminServer";
import {
  getReadinessCandidateById,
  getContractById,
  listCyclesForContract,
  markReviewReady,
  approveForOffer,
  rejectCandidate,
  addEvaluatorNotes,
  createContractFromApprovedReadiness,
  createFirstOversightCycle,
  createCaseStudyDraftFromCycle,
} from "@/lib/retainers/retainer-pipeline-service";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await requireAdminServer(req, res, { routeKey: "admin-retainers-detail" });
  if (!session) return;

  const { id } = req.query;
  if (!id || typeof id !== "string") {
    return res.status(400).json({ ok: false, error: "ID_REQUIRED" });
  }

  const adminEmail = session.user?.email ?? "admin";

  // ── GET ──────────────────────────────────────────────────────────────────────
  if (req.method === "GET") {
    try {
      const candidate = await getReadinessCandidateById(id);
      if (candidate) {
        return res.status(200).json({ ok: true, type: "readiness_evaluation", record: candidate });
      }
      const contract = await getContractById(id);
      if (contract) {
        const cycles = await listCyclesForContract(id);
        return res.status(200).json({ ok: true, type: "contract", record: contract, cycles });
      }
      return res.status(404).json({ ok: false, error: "NOT_FOUND" });
    } catch (error) {
      console.error("[ADMIN_RETAINER_GET]", error);
      return res.status(500).json({ ok: false, error: "FETCH_FAILED" });
    }
  }

  // ── PATCH ─────────────────────────────────────────────────────────────────────
  if (req.method === "PATCH") {
    const { action, notes, reason, routeTo, tier, orgName, contractId, cycleId } = req.body ?? {};

    try {
      switch (action) {
        case "mark_review_ready": {
          const result = await markReviewReady(id, adminEmail);
          return res.status(result.ok ? 200 : 422).json(result);
        }
        case "approve_for_offer": {
          const result = await approveForOffer(id, adminEmail, notes);
          return res.status(result.ok ? 200 : 422).json(result);
        }
        case "reject": {
          if (!reason) return res.status(400).json({ ok: false, error: "REASON_REQUIRED" });
          const result = await rejectCandidate(id, adminEmail, reason, routeTo);
          return res.status(result.ok ? 200 : 422).json(result);
        }
        case "add_notes": {
          if (!notes) return res.status(400).json({ ok: false, error: "NOTES_REQUIRED" });
          const result = await addEvaluatorNotes(id, adminEmail, notes);
          return res.status(result.ok ? 200 : 422).json(result);
        }
        case "create_contract": {
          if (!tier) return res.status(400).json({ ok: false, error: "TIER_REQUIRED" });
          const result = await createContractFromApprovedReadiness({
            evaluationId: id, tier, adminEmail, orgName,
          });
          return res.status(result.ok ? 201 : 422).json(result);
        }
        case "create_first_cycle": {
          const cid = contractId ?? id;
          const result = await createFirstOversightCycle({ contractId: cid, adminEmail });
          return res.status(result.ok ? 201 : 422).json(result);
        }
        case "create_case_study_draft": {
          if (!cycleId || !contractId) {
            return res.status(400).json({ ok: false, error: "CYCLE_ID_AND_CONTRACT_ID_REQUIRED" });
          }
          const result = await createCaseStudyDraftFromCycle({ cycleId, contractId, adminEmail });
          return res.status(result.ok ? 201 : 422).json(result);
        }
        default:
          return res.status(400).json({ ok: false, error: "UNKNOWN_ACTION", action });
      }
    } catch (error) {
      console.error("[ADMIN_RETAINER_PATCH]", error);
      return res.status(500).json({ ok: false, error: "ACTION_FAILED" });
    }
  }

  res.setHeader("Allow", "GET, PATCH");
  return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
}
