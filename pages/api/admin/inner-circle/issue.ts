// pages/api/admin/inner-circle/issue.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { createAccessToken } from "@/lib/inner-circle/access";
import { generateAccessKey, storeKey, type StoredKey } from "@/lib/inner-circle/keys";

function assertAdmin(req: NextApiRequest) {
  const k = req.headers["x-admin-key"];
  const provided = Array.isArray(k) ? k[0] : k;
  if (!provided || provided !== process.env.ADMIN_API_KEY) throw new Error("forbidden");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    assertAdmin(req);

    if (req.method !== "POST") return res.status(405).end();

    const { memberId, tier = "member", mode = "jwt", expiresAt } = req.body ?? {};

    if (!memberId) return res.status(400).json({ error: "memberId_required" });
    if (!["member", "patron", "founder"].includes(tier)) return res.status(400).json({ error: "invalid_tier" });
    if (!["jwt", "key"].includes(mode)) return res.status(400).json({ error: "invalid_mode" });

    if (mode === "jwt") {
      const token = createAccessToken({ memberId, tier, ttlDays: 30 });
      return res.status(200).json({ success: true, mode: "jwt", token, tier, memberId });
    }

    const key = generateAccessKey();
    const record: StoredKey = {
      key,
      memberId,
      tier,
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt || undefined,
      revoked: false,
    };

    await storeKey(record);
    return res.status(200).json({ success: true, mode: "key", key, tier, memberId, expiresAt: record.expiresAt ?? null });
  } catch (e: any) {
    if (e?.message === "forbidden") return res.status(403).json({ error: "forbidden" });
    return res.status(500).json({ error: "server_error" });
  }
}