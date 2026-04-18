import type { NextApiRequest, NextApiResponse } from "next";
import { resolveRequestAccess } from "@/lib/access/server";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { session, access } = await resolveRequestAccess(req, res);
  return res.status(200).json({
    ok: true,
    authenticated: access.permissions.isAuthenticated,
    user: session?.user ?? null,
    access,
  });
}
