// pages/api/retainers/status/[token].ts
// GET — client-safe retainer contract status.
// token = contract ID (not a secret; status is non-sensitive).
// Never exposes internal notes, admin data, or other clients.
import type { NextApiRequest, NextApiResponse } from "next";
import {
  getClientSafeContractStatus,
} from "@/lib/retainers/retainer-pipeline-service";
import { assertNoInternalFields } from "@/lib/retainers/retainer-pipeline-contracts";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  const { token } = req.query;
  if (!token || typeof token !== "string" || token.length < 8) {
    return res.status(400).json({ ok: false, error: "INVALID_TOKEN" });
  }

  try {
    const status = await getClientSafeContractStatus(token);
    if (!status) {
      return res.status(404).json({ ok: false, error: "NOT_FOUND" });
    }

    // Verify no internal fields leaked
    assertNoInternalFields(status as unknown as Record<string, unknown>);
    if (status.currentCycle) {
      assertNoInternalFields(status.currentCycle as unknown as Record<string, unknown>);
    }

    return res.status(200).json({ ok: true, status });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("INTERNAL_LEAK")) {
      console.error("[RETAINER_STATUS_PII_LEAK]", error.message);
      return res.status(500).json({ ok: false, error: "INTERNAL_ERROR" });
    }
    console.error("[RETAINER_STATUS_ERROR]", error);
    return res.status(500).json({ ok: false, error: "STATUS_UNAVAILABLE" });
  }
}
