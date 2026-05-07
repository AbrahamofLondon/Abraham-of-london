// app/api/inner-circle/verify/route.ts
import "server-only";

// Force the Node.js runtime to prevent Webpack from trying to bundle 
// Node-specific dependencies for the Edge runtime.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { verifyInnerCircleKey } from "@/lib/inner-circle/exports.server";
import { applyShieldFromRequest } from "@/lib/server/security/shield-middleware";
import {
  enforceAppRouteRateLimit,
  noStoreJson,
  parseJsonBody,
  requireJsonContent,
  requireMethod,
} from "@/lib/server/security/app-route-guards";

const verifySchema = z.object({
  key: z.string().trim().min(8).max(512).optional(),
  accessKey: z.string().trim().min(8).max(512).optional(),
}).strict().refine((value) => Boolean(value.key || value.accessKey), {
  message: "Missing access key.",
});

export async function POST(req: NextRequest) {
  const methodCheck = requireMethod(req, ["POST"]);
  if (!methodCheck.ok) return methodCheck.response;

  const contentCheck = requireJsonContent(req);
  if (!contentCheck.ok) return contentCheck.response;

  // Anti-reconnaissance shield
  const shield = await applyShieldFromRequest(req, "/api/inner-circle/verify");
  if (shield.blocked) return NextResponse.json({ error: "REQUEST_THROTTLED" }, { status: 429 });

  const rateLimit = await enforceAppRouteRateLimit({
    request: req,
    routeKey: "inner-circle-verify",
    limit: 30,
    windowMs: 60_000,
    failClosed: true,
  });
  if (!rateLimit.ok) return rateLimit.response;

  try {
    const parsed = await parseJsonBody(req, verifySchema);
    if (!parsed.ok) return parsed.response;
    const key = String(parsed.data.key || parsed.data.accessKey || "").trim();

    const result = await verifyInnerCircleKey(key);

    return noStoreJson(
      {
        ok: true,
        result,
      },
      { status: 200 }
    );
  } catch (e: any) {
    return noStoreJson(
      {
        ok: false,
        error: e?.message || "Verification failed.",
      },
      { status: 500 }
    );
  }
}
