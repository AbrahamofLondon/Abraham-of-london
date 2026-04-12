import type { NextApiRequest, NextApiResponse } from "next";
import { revokeArtifact } from "@/lib/server/diagnostics/revocation";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const { ref, version, reason } = req.body;

  const count = await revokeArtifact({
    diagnosticRef: ref,
    version,
    reason: reason || "manual_revoke",
  });

  return res.json({ ok: true, revoked: count });
}