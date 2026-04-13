/* pages/api/admin/sync-fix.ts — EXPLICIT NO-OP UNDER CONSOLIDATED IDENTITY */
import type { NextApiRequest, NextApiResponse } from "next";

/**
 * Historical purpose: reconcile tier drift between InnerCircleMember.tier
 * and a linked global User.tier. Under the locked Option A identity
 * doctrine (see SCHEMA-DECISION-FRAME-01), InnerCircleMember is the sole
 * persisted identity truth. There is no second User model to drift from,
 * so the drift-detection premise is obsolete by construction.
 *
 * Rather than delete the route (which would remove a public surface and
 * break any caller still hitting /api/admin/sync-fix) or invent a
 * replacement reconciliation behavior (which would widen scope), this
 * handler is preserved as an explicit no-op. The HTTP contract, method
 * gate, and authorization posture are unchanged; the response always
 * reports fixed: 0 because there is never any drift to fix.
 *
 * The GovernanceLog write from the original implementation was
 * conditional on updates.length > 0, which can no longer occur, so no
 * governance entry is written — consistent with the original's intent
 * to log only when non-trivial fixes happened.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ ok: false });

  const authHeader = req.headers["authorization"];
  if (authHeader !== `Bearer ${process.env.ADMIN_API_KEY}`) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  return res.status(200).json({ ok: true, fixed: 0 });
}
