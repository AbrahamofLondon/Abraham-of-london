// pages/api/admin/inner-circle/revoke.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { createOrUpdateMemberAndIssueKeyWithRateLimit } from "@/lib/server/inner-circle/keys"

function assertAdmin(req: NextApiRequest) {
  const k = req.headers["x-admin-key"];
  const provided = Array.isArray(k) ? k[0] : k;
  if (!provided || provided !== process.env.ADMIN_API_KEY) throw new Error("forbidden");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    assertAdmin(req);

    if (req.method !== "POST") return res.status(405).end();
    const { key } = req.body ?? {};
    if (!key || typeof key !== "string") return res.status(400).json({ error: "key_required" });

    const ok = await revokeKey(key);
    return res.status(200).json({ success: ok });
  } catch (e: any) {
    if (e?.message === "forbidden") return res.status(403).json({ error: "forbidden" });
    return res.status(500).json({ error: "server_error" });
  }
}