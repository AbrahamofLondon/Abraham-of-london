/**
 * Shield Middleware — reusable integration helper for protected routes.
 *
 * Usage in Pages Router API routes:
 *   const verdict = await applyShield(req, "/api/my-route");
 *   if (verdict.blocked) return res.status(429).json({ error: verdict.publicMessage });
 *   if (verdict.delayMs > 0) await new Promise(r => setTimeout(r, verdict.delayMs));
 *
 * Usage in App Router route handlers:
 *   const verdict = await applyShieldFromRequest(request, "/api/my-route");
 *   if (verdict.blocked) return NextResponse.json({ error: verdict.publicMessage }, { status: 429 });
 *
 * No import "server-only" here — this file is a thin wrapper used by both
 * Pages Router and App Router. The actual shield logic is server-only.
 */

import type { NextApiRequest } from "next";

export type ShieldResult = {
  blocked: boolean;
  delayMs: number;
  degradeResponse: boolean;
  publicMessage: string;
};

function getIp(req: NextApiRequest): string {
  const xf = req.headers["x-forwarded-for"];
  return (Array.isArray(xf) ? xf[0] : xf)?.split(",")[0]?.trim() || req.socket?.remoteAddress || "0.0.0.0";
}

/**
 * Apply shield to a Pages Router API request.
 */
export async function applyShield(req: NextApiRequest, route: string): Promise<ShieldResult> {
  try {
    const { runShield } = await import("./adaptive-response.server");
    const { quickHash } = await import("./ip-abuse-watchdog.server");

    const body = (req.body ?? {}) as Record<string, unknown>;
    const verdict = await runShield({
      ipAddress: getIp(req),
      sessionId: req.headers["x-session-id"] as string | undefined,
      route,
      method: req.method ?? "GET",
      referer: req.headers.referer ?? undefined,
      userAgent: req.headers["user-agent"] ?? undefined,
      body,
      query: (req.query ?? {}) as Record<string, unknown>,
      inputHash: quickHash(JSON.stringify(body).slice(0, 200)),
      answerSetHash: quickHash(JSON.stringify(body)),
    });

    return {
      blocked: !verdict.allowed,
      delayMs: verdict.delayMs,
      degradeResponse: verdict.degradeResponse,
      publicMessage: verdict.publicMessage ?? "Please try again later.",
    };
  } catch {
    // Shield unavailable — allow (rate limiting is a separate layer)
    return { blocked: false, delayMs: 0, degradeResponse: false, publicMessage: "" };
  }
}

/**
 * Apply shield to an App Router Request object.
 */
export async function applyShieldFromRequest(request: Request, route: string): Promise<ShieldResult> {
  try {
    const { runShield } = await import("./adaptive-response.server");
    const { quickHash } = await import("./ip-abuse-watchdog.server");

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || request.headers.get("x-real-ip")
      || "0.0.0.0";

    let body: Record<string, unknown> = {};
    try {
      body = await request.clone().json();
    } catch {
      // GET request or non-JSON body
    }

    const url = new URL(request.url);
    const query: Record<string, unknown> = {};
    url.searchParams.forEach((v, k) => { query[k] = v; });

    const verdict = await runShield({
      ipAddress: ip,
      sessionId: request.headers.get("x-session-id") ?? undefined,
      route,
      method: request.method,
      referer: request.headers.get("referer") ?? undefined,
      userAgent: request.headers.get("user-agent") ?? undefined,
      body,
      query,
      inputHash: quickHash(JSON.stringify(body).slice(0, 200)),
      answerSetHash: quickHash(JSON.stringify(body)),
    });

    return {
      blocked: !verdict.allowed,
      delayMs: verdict.delayMs,
      degradeResponse: verdict.degradeResponse,
      publicMessage: verdict.publicMessage ?? "Please try again later.",
    };
  } catch {
    return { blocked: false, delayMs: 0, degradeResponse: false, publicMessage: "" };
  }
}
