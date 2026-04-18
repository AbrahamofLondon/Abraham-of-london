import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminApi } from "./server";

export async function requireAdmin(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<{ userId: string; email: string | null } | null> {
  const resolved = await requireAdminApi(req, res);
  if (!resolved) return null;

  return {
    userId: resolved.access.userId as string,
    email: resolved.session?.user?.email ?? resolved.access.email,
  };
}
