import type { NextApiRequest, NextApiResponse } from "next";
import "server-only";
import { requireAdmin } from "@/lib/access/require-admin";
import { revokeKey } from "@/lib/server/inner-circle/keys";
import { verifyAdminMutationOrigin } from "@/lib/api/admin-mutation-guard";

type ResData = { success: boolean } | { error: string };

export default async function handler(req: NextApiRequest, res: NextApiResponse<ResData>) {
  try {
    const originCheck = verifyAdminMutationOrigin(req);
    if (!originCheck.ok) {
      return res.status(403).json({ error: originCheck.reason });
    }
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ error: "method_not_allowed" });
    }
    const { key } = req.body ?? {};
    if (!key || typeof key !== "string") return res.status(400).json({ error: "key_required" });
    const ok = await revokeKey(key);
    if (ok) {
      import("@/lib/reporting/report-lineage").then(({ writeReportLineageEvent }) =>
        writeReportLineageEvent({
          reportType: "EXECUTIVE_REPORT",
          eventType: "REVOKED",
          resourceId: key,
          metadata: { keyPrefix: key.slice(0, 8) },
        })
      ).catch(() => { /* lineage must not break revocation flow */ });
    }
    return res.status(200).json({ success: ok });
  } catch (e: any) {
    return res.status(500).json({ error: "server_error" });
  }
}
