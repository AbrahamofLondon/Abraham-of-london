// pages/api/admin/inner-circle/issue.ts
import type { NextApiRequest, NextApiResponse } from "next";
import "server-only";

import { createOrUpdateMemberAndIssueKey } from "@/lib/inner-circle/keys.server";
import { normalizeTier } from "@/lib/inner-circle/access.server";

type Ok = {
  ok: true;
  memberId: string;
  tier: string;
  key: string; // issued key (admin route, so allowed)
};

type Err = { ok: false; error: string };

function methodNotAllowed(res: NextApiResponse<Err>) {
  res.setHeader("Allow", "POST");
  return res.status(405).json({ ok: false, error: "Method Not Allowed" });
}

// ✅ Minimal admin gate placeholder.
// Replace with your real admin auth (session, key, allowlist, etc.).
function assertAdmin(req: NextApiRequest) {
  const expected = process.env.INNER_CIRCLE_ADMIN_SECRET;
  if (!expected) {
    // Fail closed: if not configured, don't issue keys.
    throw new Error("Server misconfigured: INNER_CIRCLE_ADMIN_SECRET not set");
  }
  const provided =
    (req.headers["x-admin-secret"] as string | undefined) ||
    (req.query.adminSecret as string | undefined);

  if (!provided || provided !== expected) {
    throw new Error("Unauthorized");
  }
}

function pickString(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Ok | Err>) {
  try {
    if (req.method !== "POST") return methodNotAllowed(res);

    assertAdmin(req);

    const email = pickString(req.body?.email);
    const memberId = pickString(req.body?.memberId);
    const tierRaw = req.body?.tier;

    if (!email && !memberId) {
      return res.status(400).json({ ok: false, error: "Provide email or memberId" });
    }

    const tier = normalizeTier(tierRaw);

    // ✅ issues/updates a key (single source of truth: keys.server)
    const result = await createOrUpdateMemberAndIssueKey({
      email: email || undefined,
      memberId: memberId || undefined,
      tier,
      meta: {
        issuedBy: "admin-api",
        issuedAt: new Date().toISOString(),
        ip: (req.headers["x-forwarded-for"] as string | undefined) || req.socket.remoteAddress || "",
        ua: req.headers["user-agent"] || "",
      },
    });

    // Expected shape: { memberId, tier, key } (adapt if yours differs)
    if (!result?.key || !result?.memberId) {
      return res.status(500).json({ ok: false, error: "Failed to issue key" });
    }

    return res.status(200).json({
      ok: true,
      memberId: String(result.memberId),
      tier: String(result.tier || tier),
      key: String(result.key),
    });
  } catch (e: any) {
    const msg = typeof e?.message === "string" ? e.message : "Unknown error";
    const status = msg === "Unauthorized" ? 401 : 500;
    return res.status(status).json({ ok: false, error: msg });
  }
}