import type { NextApiRequest, NextApiResponse } from "next";
import "server-only";
import { requireAdmin } from "@/lib/access/require-admin";
import { createOrUpdateMemberAndIssueKey } from "@/lib/inner-circle/keys.server";
import { normalizeTier } from "@/lib/inner-circle/access.server";

type Ok = {
  ok: true;
  memberId: string;
  tier: string;
  key: string;
};

type Err = {
  ok: false;
  error: string;
};

function methodNotAllowed(res: NextApiResponse<Err>) {
  res.setHeader("Allow", "POST");
  return res.status(405).json({ ok: false, error: "Method Not Allowed" });
}

function pickString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function getClientIp(req: NextApiRequest): string {
  const xf = req.headers["x-forwarded-for"];
  const raw =
    typeof xf === "string"
      ? xf
      : Array.isArray(xf)
      ? xf[0]
      : req.socket.remoteAddress || "";
  return String(raw).split(",")[0]?.trim() || "";
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Ok | Err>
) {
  const admin = await requireAdmin(req, res);
  if (!admin) return; // 401/403 already sent

  try {
    if (req.method !== "POST") {
      return methodNotAllowed(res);
    }
    const email = pickString(req.body?.email);
    const memberId = pickString(req.body?.memberId);
    const tierRaw = req.body?.tier;
    const tier = normalizeTier(tierRaw);
    const ipAddress = getClientIp(req);
    const userAgent = String(req.headers["user-agent"] || "");
    // Institutional alignment:
    // the issuance service requires a concrete email string.
    // If future support for memberId-only issuance is needed,
    // that belongs in keys.server, not as a fake workaround here.
    if (!email) {
      return res.status(400).json({
        ok: false,
        error:
          "Email is required for key issuance. The current issuance service does not support memberId-only requests.",
      });
    }
    const meta = {
      issuedBy: "admin-api",
      issuedAt: new Date().toISOString(),
      ip: ipAddress,
      ua: userAgent,
    };
    const args: any = {
      email,
      tier,
      ipAddress,
      source: "admin",
      meta,
    };
    args.memberId = memberId || undefined;
    const result = await createOrUpdateMemberAndIssueKey(args);
    if (!result?.key || !result?.memberId) {
      return res.status(500).json({
        ok: false,
        error: "Failed to issue key",
      });
    }
    return res.status(200).json({
      ok: true,
      memberId: String(result.memberId),
      tier: String(result.tier || tier),
      key: String(result.key),
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    const status = message === "Unauthorized" ? 401 : 500;
    return res.status(status).json({
      ok: false,
      error: message,
    });
  }
}