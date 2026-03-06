/* pages/api/keys/verify.ts */
import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";
import prisma from "@/lib/prisma";

function getClientIp(req: NextApiRequest): string {
  const xff = req.headers["x-forwarded-for"];
  const real = req.headers["x-real-ip"];

  if (Array.isArray(xff) && xff[0]) return String(xff[0]).split(",")[0].trim();
  if (typeof xff === "string" && xff) return xff.split(",")[0].trim();
  if (typeof real === "string" && real) return real.trim();

  return req.socket?.remoteAddress || "unknown";
}

/**
 * Hash the presented key so DB only stores hashes.
 * ✅ If your DB already stores SHA-256 hex, keep this.
 * If you used a different hash scheme previously, change here ONCE.
 */
function hashKey(presented: string): string {
  return crypto.createHash("sha256").update(presented, "utf8").digest("hex");
}

type Data =
  | { valid: true; tier: string }
  | { valid: false };

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  if (req.method !== "POST") return res.status(405).end();

  const rawKey = String((req.body as any)?.key || "").trim();
  if (!rawKey || rawKey.length > 4096) return res.status(200).json({ valid: false });

  const ip = getClientIp(req);
  const ua = String(req.headers["user-agent"] || "").slice(0, 512);

  try {
    // 1) Locate key by hashed key
    const keyHash = hashKey(rawKey);

    const keyRecord = await prisma.innerCircleKey.findUnique({
      where: { keyHash },
      select: {
        id: true,
        status: true,
        expiresAt: true,
        memberId: true,
        lastUsedAt: true,
        metadata: true,
      },
    });

    if (!keyRecord) return res.status(200).json({ valid: false });
    if (String(keyRecord.status).toLowerCase() !== "active") return res.status(200).json({ valid: false });
    if (keyRecord.expiresAt && keyRecord.expiresAt < new Date()) return res.status(200).json({ valid: false });

    // 2) Fetch member tier (no relation needed)
    const member = await prisma.innerCircleMember.findUnique({
      where: { id: keyRecord.memberId },
      select: { tier: true, status: true },
    });

    if (!member) return res.status(200).json({ valid: false });
    if (String(member.status).toLowerCase() !== "active") return res.status(200).json({ valid: false });

    // 3) Update usage telemetry (schema-safe: store in metadata)
    const prevMeta = (keyRecord.metadata ?? {}) as any;
    const unlocks = Number(prevMeta?.unlocks || 0);

    await prisma.innerCircleKey.update({
      where: { id: keyRecord.id },
      data: {
        lastUsedAt: new Date(),
        metadata: {
          ...(typeof prevMeta === "object" && prevMeta ? prevMeta : {}),
          unlocks: unlocks + 1,
          lastIp: ip,
          lastUserAgent: ua,
          lastUsedAtIso: new Date().toISOString(),
        },
      },
    });

    return res.status(200).json({ valid: true, tier: String(member.tier) });
  } catch (error) {
    console.error("[KEY_VERIFY_ERROR]", error);
    return res.status(500).json({ valid: false });
  }
}