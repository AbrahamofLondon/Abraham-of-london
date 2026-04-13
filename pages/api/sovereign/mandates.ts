import type { NextApiRequest, NextApiResponse } from "next";
import {
  createMandate,
  updateMandate,
  listMandates,
} from "@/lib/sovereign/mandate-store";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "GET") {
      return res.status(200).json({ ok: true, data: listMandates() });
    }

    if (req.method === "POST") {
      const mandate = createMandate(req.body);
      return res.status(200).json({ ok: true, mandate });
    }

    if (req.method === "PATCH") {
      const { id, action } = req.body;

      // PATCH semantics: load existing mandate, merge new audit fields onto
      // the existing audit object so that `createdAt` is preserved across
      // partial updates. The MandateRecord.audit contract requires
      // `createdAt: string` (non-optional); we do not weaken the contract.
      const existing = listMandates().find((m) => m.id === id);
      if (!existing) {
        return res.status(404).json({ ok: false, error: "Mandate not found" });
      }

      if (action === "ACCEPT") {
        const updated = updateMandate(id, {
          status: "ACCEPTED",
          audit: {
            ...existing.audit,
            acceptedAt: new Date().toISOString(),
          },
        });

        return res.status(200).json({ ok: true, updated });
      }

      if (action === "COMPLETE") {
        const updated = updateMandate(id, {
          status: "COMPLETED",
          audit: {
            ...existing.audit,
            completedAt: new Date().toISOString(),
          },
        });

        return res.status(200).json({ ok: true, updated });
      }

      return res.status(400).json({ ok: false });
    }

    return res.status(405).json({ ok: false });
  } catch {
    return res.status(500).json({ ok: false });
  }
}