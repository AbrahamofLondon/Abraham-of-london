import type { NextApiRequest, NextApiResponse } from "next";
import "server-only";
import { revokeKey } from "@/lib/server/inner-circle/keys";

type ResData = { success: boolean } | { error: string };

// Phase 0: consolidated admin auth — standard Authorization: Bearer pattern.
function assertAdmin(req: NextApiRequest) {
  const adminKey = (process.env.ADMIN_API_KEY || "").trim();
  if (!adminKey) throw new Error("forbidden");
  const auth = String(req.headers.authorization || "");
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!token || token !== adminKey) throw new Error("forbidden");
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