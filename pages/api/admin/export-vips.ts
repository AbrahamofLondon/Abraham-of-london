/* pages/api/admin/export-vips.ts — CSV EXPORT ENGINE (HARDENED, NULL-SAFE) */
import type { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import { prisma } from "@/lib/db";
import { consumePersistentRateLimit } from "@/lib/server/security/persistent-rate-limit";

type ErrorResponse = {
  ok: false;
  error: string;
};

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 10;

function getDb() {
  if (!prisma) {
    throw new Error("Database client unavailable");
  }
  return prisma;
}

function getClientIp(req: NextApiRequest): string {
  const xf = req.headers["x-forwarded-for"];
  const raw =
    typeof xf === "string"
      ? xf
      : Array.isArray(xf)
      ? xf[0]
      : req.socket?.remoteAddress || "0.0.0.0";

  return String(raw).split(",")[0]?.trim() || "0.0.0.0";
}

function csvEscape(value: unknown): string {
  const s = value == null ? "" : String(value);
  const escaped = s.replace(/"/g, '""');
  return /[",\n\r]/.test(escaped) ? `"${escaped}"` : escaped;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ErrorResponse | string>
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  const session = await getSession({ req });
  const adminEmail =
    process.env.INITIAL_ADMIN_EMAIL || "admin@abrahamoflondon.com";

  if (!session || session.user?.email !== adminEmail) {
    return res.status(403).json({ ok: false, error: "Unauthorized" });
  }

  const rateKey = `${String(session.user.email).toLowerCase()}|${getClientIp(req)}`;
  const rl = await consumePersistentRateLimit({
    key: `admin-export-vips:${rateKey}`,
    limit: RATE_LIMIT_MAX,
    windowMs: RATE_LIMIT_WINDOW_MS,
    failClosed: true,
  });

  if (!rl.allowed) {
    res.setHeader(
      "Retry-After",
      String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
    );
    return res.status(429).json({
      ok: false,
      error: "Too many export attempts. Try again later.",
    });
  }

  res.setHeader("X-RateLimit-Limit", String(RATE_LIMIT_MAX));
  res.setHeader("X-RateLimit-Remaining", String(rl.remaining));
  res.setHeader("X-RateLimit-Reset", String(rl.resetAt));

  try {
    const db = getDb();

    const vips = await db.innerCircleMember.findMany({
      select: {
        email: true,
        name: true,
        tier: true,
        status: true,
        lastSeenAt: true,
        updatedAt: true,
        createdAt: true,
        viewCount: true,
      },
      orderBy: [{ lastSeenAt: "desc" }, { updatedAt: "desc" }],
    });

    const header = [
      "Name",
      "Email",
      "Tier",
      "Status",
      "LastSeenAt",
      "UpdatedAt",
      "CreatedAt",
      "ViewCount",
    ].join(",");

    const rows = vips.map((vip) =>
      [
        csvEscape(vip.name || ""),
        csvEscape(vip.email || ""),
        csvEscape(vip.tier),
        csvEscape(vip.status),
        csvEscape(vip.lastSeenAt ? vip.lastSeenAt.toISOString() : "Never"),
        csvEscape(vip.updatedAt ? vip.updatedAt.toISOString() : ""),
        csvEscape(vip.createdAt ? vip.createdAt.toISOString() : ""),
        csvEscape(typeof vip.viewCount === "number" ? vip.viewCount : 0),
      ].join(",")
    );

    const csv = [header, ...rows].join("\n");
    const filename = `inner-circle-export-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");

    return res.status(200).send(csv);
  } catch (error) {
    console.error("[VIP_EXPORT_FAILED]", error);
    return res.status(500).json({ ok: false, error: "Export failed" });
  }
}
