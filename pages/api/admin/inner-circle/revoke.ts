import type { NextApiRequest, NextApiResponse } from "next";
import "server-only";
import { revokeKey } from "@/lib/server/inner-circle/keys";

type ResData = { success: boolean } | { error: string };

function assertAdmin(req: NextApiRequest) {
  const k = req.headers["x-admin-key"];
  const provided = Array.isArray(k) ? k[0] : k;
  if (!provided || provided !== process.env.ADMIN_API_KEY) throw new Error("forbidden");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ResData>) {
  try {
    assertAdmin(req);
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ error: "method_not_allowed" });
    }
    const { key } = req.body ?? {};
    if (!key || typeof key !== "string") return res.status(400).json({ error: "key_required" });
    const ok = await revokeKey(key);
    return res.status(200).json({ success: ok });
  } catch (e: any) {
    if (e?.message === "forbidden") return res.status(403).json({ error: "forbidden" });
    return res.status(500).json({ error: "server_error" });
  }
}