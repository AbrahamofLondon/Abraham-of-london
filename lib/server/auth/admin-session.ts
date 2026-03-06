/* lib/server/auth/admin-session.ts — DB-BACKED ADMIN SESSION (pages + node safe)
   - No "server-only" (pages router compatible)
   - Supports NextApiRequest, NextRequest, and standard Request
   - Validates token against AdminSession table + linked InnerCircleMember
*/

import type { NextApiRequest } from "next";
import { prisma } from "@/lib/prisma";

export type AdminSessionContext = {
  user: { id: string; email?: string | null; isAdmin: boolean } | null;
  isAdmin: boolean;
  token?: string;
  sessionId?: string;
};

function isNextApiRequest(req: any): req is NextApiRequest {
  return !!req && typeof req === "object" && !!req.headers && typeof req.headers === "object" && "socket" in req;
}

function headerGet(req: any, key: string): string {
  const k = key.toLowerCase();

  // NextRequest / Request
  if (req?.headers && typeof req.headers.get === "function") {
    return String(req.headers.get(k) || req.headers.get(key) || "").trim();
  }

  // NextApiRequest
  const h = req?.headers?.[k] ?? req?.headers?.[key];
  const v = Array.isArray(h) ? h[0] : h;
  return v ? String(v).trim() : "";
}

function parseBearer(authHeader: string): string {
  const m = String(authHeader || "").match(/^Bearer\s+(.+)$/i);
  return m?.[1]?.trim() ?? "";
}

function cookieGet(req: any, name: string): string {
  // NextRequest
  if (req?.cookies && typeof req.cookies.get === "function") {
    const v = req.cookies.get(name)?.value;
    return v ? String(v).trim() : "";
  }

  // NextApiRequest might have req.cookies (via cookie parser) OR raw header
  if (req?.cookies && typeof req.cookies === "object") {
    const v = (req.cookies as any)[name];
    return v ? String(v).trim() : "";
  }

  const raw = headerGet(req, "cookie");
  if (!raw) return "";

  // minimal cookie parse
  const parts = raw.split(";").map((s: string) => s.trim()).filter(Boolean);
  for (const p of parts) {
    const i = p.indexOf("=");
    if (i < 0) continue;
    const k = p.slice(0, i).trim();
    if (k !== name) continue;
    const val = p.slice(i + 1);
    try {
      return decodeURIComponent(val).trim();
    } catch {
      return val.trim();
    }
  }
  return "";
}

/**
 * Extracts admin token from request using a strict order:
 * 1) Authorization: Bearer <token>
 * 2) x-admin-token header
 * 3) admin_token cookie
 */
function getAdminToken(req: any): string {
  const bearer = parseBearer(headerGet(req, "authorization"));
  if (bearer) return bearer;

  const headerToken = headerGet(req, "x-admin-token");
  if (headerToken) return headerToken;

  const cookieToken = cookieGet(req, "admin_token");
  if (cookieToken) return cookieToken;

  return "";
}

/**
 * DB-backed admin session validation.
 * - token must exist
 * - session must not be expired
 * - linked user must exist
 * - user must be ADMIN role (or PRINCIPAL if you want, but admin should mean ADMIN)
 * - user status must be active
 */
export async function getAdminSession(request: any): Promise<AdminSessionContext> {
  try {
    const token = getAdminToken(request);
    if (!token) return { user: null, isAdmin: false };

    // Find session + joined user
    const session = await prisma.adminSession.findUnique({
      where: { token },
      select: {
        id: true,
        token: true,
        expiresAt: true,
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            status: true,
          },
        },
      },
    });

    if (!session) return { user: null, isAdmin: false };

    // Expiry check
    const exp = session.expiresAt ? new Date(session.expiresAt).getTime() : 0;
    if (!exp || exp <= Date.now()) return { user: null, isAdmin: false };

    // User checks
    const role = String(session.user?.role || "").toUpperCase();
    const status = String(session.user?.status || "").toLowerCase();

    const isAdmin = role === "ADMIN" && status === "active";
    if (!isAdmin) return { user: null, isAdmin: false };

    return {
      user: {
        id: session.user.id,
        email: session.user.email ?? null,
        isAdmin: true,
      },
      isAdmin: true,
      token: session.token,
      sessionId: session.id,
    };
  } catch (error) {
    console.error("[ADMIN_SESSION_ERROR]", error);
    return { user: null, isAdmin: false };
  }
}