/* pages/api/admin/security/toggle-lock.ts — Global Lockdown Control
 *
 * Persists lock state to systemAuditLog (action = SYSTEM_LOCKED / SYSTEM_UNLOCKED,
 * resourceId = "global_lock"). The /api/system/lock-status endpoint reads the most
 * recent of these events to determine the live lock state, which proxy.ts then
 * consumes on every request via checkGlobalLock().
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { prisma } from "@/lib/prisma.server";
import { requireAdminServer } from "@/lib/auth/requireAdminServer";
import { getUserAccess } from "@/lib/access/get-user-access";
import { canAccessOwner } from "@/lib/access/checks";
import { writeSecurityAudit } from "@/lib/security/audit-log";
import { verifyAdminMutationOrigin } from "@/lib/api/admin-mutation-guard";

const bodySchema = z.object({
  locked: z.boolean(),
  reason: z.string().trim().max(500).optional(),
}).strict();

function getClientIp(req: NextApiRequest): string {
  const fwd = req.headers["x-forwarded-for"];
  const raw = typeof fwd === "string" ? fwd : Array.isArray(fwd) ? fwd[0] : req.socket?.remoteAddress || "0.0.0.0";
  return String(raw).split(",")[0]?.trim() || "0.0.0.0";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const originCheck = verifyAdminMutationOrigin(req);
  if (!originCheck.ok) {
    return res.status(403).json({ error: originCheck.reason });
  }

  // Layer 1: authenticated admin session with rate-limiting
  const session = await requireAdminServer(req, res, { routeKey: "admin-security-toggle-lock" });
  if (!session) return;

  // Layer 2: global lock requires OWNER authority — ADMIN alone is not sufficient
  const access = await getUserAccess(prisma, (session.user as any)?.id ?? null);
  if (!canAccessOwner(access)) {
    await writeSecurityAudit({
      action: "forbidden_object_access",
      severity: "warn",
      status: "BLOCKED",
      actorId: (session.user as any)?.id || null,
      actorEmail: session.user?.email || null,
      ip: getClientIp(req),
      resourceId: "global_lock",
    });
    return res.status(403).json({ ok: false, error: "OWNER_REQUIRED" });
  }

  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: "INVALID_REQUEST" });
  }

  const { locked, reason } = parsed.data;

  try {
    await prisma.systemAuditLog.create({
      data: {
        actorType: "admin",
        actorId: (session.user as any)?.id || null,
        action: locked ? "SYSTEM_LOCKED" : "SYSTEM_UNLOCKED",
        resourceType: "security",
        resourceId: "global_lock",
        status: "success",
        severity: "critical",
        category: "SYSTEM_OVERRIDE",
        metadata: JSON.stringify({
          locked,
          reason: reason || "Administrative override",
          actor: session.user?.email,
          timestamp: new Date().toISOString(),
        }),
      },
    });

    return res.status(200).json({
      ok: true,
      locked,
      available: true,
      message: `System migrated to ${locked ? "RESTRICTED" : "OPERATIONAL"}.`,
    });
  } catch (error) {
    console.error("[TOGGLE_LOCK_ERROR]", error);
    return res.status(500).json({ ok: false, error: "State migration failed." });
  }
}
