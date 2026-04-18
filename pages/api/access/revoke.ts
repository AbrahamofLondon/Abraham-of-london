import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Allow", ["POST"]);
  return res.status(410).json({
    ok: false,
    error: "LEGACY_ENDPOINT_REMOVED",
    message: "Use the dedicated admin key, invite, or entitlement revoke endpoints.",
  });
}
