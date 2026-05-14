import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import type { NextApiRequest, NextApiResponse } from "next";
import type { Session } from "next-auth";

import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma.server";
import { canAccessAdmin } from "@/lib/access/checks";
import { getUserAccess } from "@/lib/access/get-user-access";
import { writeSecurityAudit } from "@/lib/security/audit-log";
import { consumePersistentRateLimit } from "@/lib/server/security/persistent-rate-limit";

type AdminApiOptions = {
  routeKey?: string;
  rateLimit?: {
    limit: number;
    windowMs: number;
  };
};

function getClientIp(req: NextApiRequest): string {
  const forwardedFor = req.headers["x-forwarded-for"];
  const raw =
    typeof forwardedFor === "string"
      ? forwardedFor
      : Array.isArray(forwardedFor)
        ? forwardedFor[0]
        : req.socket?.remoteAddress || "0.0.0.0";

  return String(raw).split(",")[0]?.trim() || "0.0.0.0";
}

async function enforceAdminApiRateLimit(
  req: NextApiRequest,
  session: Session,
  routeKey: string,
  limit: number,
  windowMs: number,
): Promise<{ ok: true } | { ok: false; retryAfter: number }> {
  const email = String(session.user?.email || "").trim().toLowerCase();
  const ip = getClientIp(req);
  const result = await consumePersistentRateLimit({
    key: `admin:${routeKey}:email:${email}:ip:${ip}`,
    limit,
    windowMs,
    failClosed: true,
  });

  if (result.allowed) {
    return { ok: true };
  }

  return {
    ok: false,
    retryAfter: Math.max(1, Math.ceil(result.retryAfterMs / 1000)),
  };
}

export async function requireAdminServer(): Promise<Session>;
export async function requireAdminServer(
  req: NextApiRequest,
  res: NextApiResponse,
  options?: AdminApiOptions,
): Promise<Session | null>;
export async function requireAdminServer(
  req?: NextApiRequest,
  res?: NextApiResponse,
  options?: AdminApiOptions,
): Promise<Session | null> {
  if (req && res) {
    const session = await getServerSession(req, res, authOptions);
    const routeKey = options?.routeKey || req.url || "admin";
    const ip = getClientIp(req);

    if (!session) {
      await writeSecurityAudit({
        action: "auth_failure",
        severity: "warn",
        status: "BLOCKED",
        ip,
        resourceId: routeKey,
      });
      res.status(401).json({ ok: false, error: "AUTHENTICATION_REQUIRED" });
      return null;
    }

    const access = await getUserAccess(prisma, (session.user as any)?.id ?? null);
    if (!canAccessAdmin(access)) {
      await writeSecurityAudit({
        action: "forbidden_object_access",
        severity: "warn",
        status: "BLOCKED",
        actorId: session.user?.id || null,
        actorEmail: session.user?.email || null,
        ip,
        resourceId: routeKey,
      });
      res.status(403).json({ ok: false, error: "ADMIN_REQUIRED" });
      return null;
    }

    const rateLimit = await enforceAdminApiRateLimit(
      req,
      session,
      routeKey,
      options?.rateLimit?.limit ?? 60,
      options?.rateLimit?.windowMs ?? 15 * 60_000,
    );

    if (!rateLimit.ok) {
      await writeSecurityAudit({
        action: "rate_limit_block",
        severity: "warn",
        status: "BLOCKED",
        actorId: session.user?.id || null,
        actorEmail: session.user?.email || null,
        ip,
        resourceId: routeKey,
        metadata: {
          retryAfterSeconds: rateLimit.retryAfter,
        },
      });
      res.setHeader("Retry-After", String(rateLimit.retryAfter));
      res.status(429).json({ ok: false, error: "RATE_LIMIT_EXCEEDED" });
      return null;
    }

    return session;
  }

  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/admin/login");
  }

  const access = await getUserAccess(prisma, (session.user as any)?.id ?? null);
  if (!canAccessAdmin(access)) {
    redirect("/auth/access-denied");
  }

  return session;
}
