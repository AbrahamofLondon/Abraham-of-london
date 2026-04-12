import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { revokeArtifact } from "@/lib/server/diagnostics/revocation";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const session = await getServerSession(req, res, authOptions);
  const role = (session as any)?.user?.role ?? (session as any)?.aol?.tier;
  if (!session || (role !== "ADMIN" && role !== "SUPER_ADMIN" && role !== "owner" && role !== "architect")) {
    return res.status(401).json({ ok: false, error: "Admin access required" });
  }

  const { ref, version, reason } = req.body;

  const count = await revokeArtifact({
    diagnosticRef: ref,
    version,
    reason: reason || "manual_revoke",
  });

  return res.json({ ok: true, revoked: count });
}