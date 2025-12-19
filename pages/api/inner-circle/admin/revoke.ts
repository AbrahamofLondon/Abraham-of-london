import type { NextApiRequest, NextApiResponse } from "next";
import { revokeInnerCircleKey } from "@/lib/inner-circle";

type RevokeResponse = { ok: boolean; message?: string; error?: string };

function isAdmin(req: NextApiRequest): boolean {
  const raw =
    (req.headers["x-inner-circle-admin-key"] as string | undefined) ||
    (req.headers["authorization"] as string | undefined) ||
    (req.body?.adminSecret as string | undefined);

  const token = raw?.replace(/^Bearer\s+/i, "").trim();
  const expected = process.env.INNER_CIRCLE_ADMIN_KEY;
  return !!token && !!expected && token === expected;
}

function keySuffix(key: string): string {
  return key.slice(-6);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<RevokeResponse>) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ ok: false, error: "POST required" });
  }

  if (!isAdmin(req)) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  const key = typeof req.body?.key === "string" ? req.body.key.trim() : "";
  if (!key) return res.status(400).json({ ok: false, error: "Key required" });

  try {
    const success = await revokeInnerCircleKey(key, "admin", req.body?.reason || "manual");
    if (!success) return res.status(404).json({ ok: false, error: "Key not found" });

    return res.status(200).json({
      ok: true,
      message: `Key ending in ${keySuffix(key)} revoked.`,
    });
  } catch (e) {
    console.error("[InnerCircle] revoke error:", e);
    return res.status(500).json({ ok: false, error: "Internal storage failure" });
  }
}