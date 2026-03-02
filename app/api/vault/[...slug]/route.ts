// app/api/vault/[...slug]/route.ts — VAULT REGISTRY RETRIEVAL (Node runtime)
/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextRequest, NextResponse } from "next/server";
import tiers from "@/lib/access/tiers";
import { prisma } from "@/lib/prisma.server";
import { decryptDocument } from "@/lib/security";

export const runtime = "nodejs";

type AccessCheckResponse = {
  hasAccess: boolean;
  reason?: string;
  tier?: string;
};

function jsonNoStore(body: any, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      Pragma: "no-cache",
    },
  });
}

function normalizeSlugParts(parts: string[]) {
  return parts
    .map((p) => String(p || "").trim())
    .filter(Boolean)
    .map((p) => p.replace(/\\/g, "/"))
    .filter((p) => p !== "." && p !== ".." && !p.includes("..") && !p.includes("\0"));
}

async function checkAccessViaPagesAPI(req: NextRequest): Promise<AccessCheckResponse> {
  // Bridge: reuse your existing Pages API access check (cookie-based).
  const cookie = req.headers.get("cookie") || "";
  const origin = req.nextUrl.origin;

  try {
    const r = await fetch(`${origin}/api/access/check`, {
      method: "GET",
      headers: { cookie, accept: "application/json" },
      cache: "no-store",
    });

    const j = (await r.json().catch(() => ({}))) as any;
    // normalize to our shape
    return {
      hasAccess: Boolean(j?.hasAccess ?? j?.ok ?? false),
      reason: j?.reason,
      tier: j?.tier,
    };
  } catch {
    return { hasAccess: false, reason: "internal_error" };
  }
}

/**
 * GET /api/vault/[...slug]
 * Secure retrieval + decryption of institutional assets in registry.
 */
export async function GET(req: NextRequest, ctx: { params: { slug: string[] } }) {
  const parts = normalizeSlugParts(ctx.params?.slug || []);
  if (!parts.length) return jsonNoStore({ ok: false, reason: "BAD_PATH" }, 400);

  const slugPath = parts.join("/");

  // 1) Registry lookup
  const asset = await prisma.contentMetadata.findUnique({
    where: { slug: slugPath },
  });

  if (!asset) {
    return jsonNoStore({ ok: false, reason: "NOT_FOUND" }, 404);
  }

  // 2) Determine required tier from registry classification fields
  const requiredTier = tiers.normalizeRequired(
    (asset as any).classification ??
      (asset as any).accessLevel ??
      (asset as any).tier ??
      "member"
  );

  // 3) Enforce access using existing access service
  if (requiredTier !== "public") {
    const access = await checkAccessViaPagesAPI(req);

    if (!access?.hasAccess) {
      return jsonNoStore(
        { ok: false, reason: access?.reason || "REQUIRES_AUTH", requiredTier },
        401
      );
    }

    const userTier = tiers.normalizeUser(access?.tier ?? "public");
    if (!tiers.hasAccess(userTier, requiredTier)) {
      return jsonNoStore(
        { ok: false, reason: "INSUFFICIENT_TIER", requiredTier },
        403
      );
    }
  }

  // 4) Validate security envelope
  let security: any;
  try {
    security = typeof (asset as any).metadata === "string" ? JSON.parse((asset as any).metadata) : (asset as any).metadata;
  } catch {
    return jsonNoStore({ ok: false, reason: "MALFORMED_REGISTRY_METADATA" }, 500);
  }

  if (!security?.content || !security?.iv || !security?.authTag) {
    return jsonNoStore({ ok: false, reason: "INCOMPLETE_SECURITY_ENVELOPE" }, 500);
  }

  // 5) Decrypt
  let decrypted: string;
  try {
    decrypted = decryptDocument(security.content, security.iv, security.authTag);
  } catch (e: any) {
    return jsonNoStore(
      {
        ok: false,
        reason: "DECRYPTION_FAILED",
        details: "Decryption failed. Verify encryption keys and envelope integrity.",
      },
      403
    );
  }

  // 6) Return verified payload
  return jsonNoStore({
    ok: true,
    requiredTier,
    asset: {
      title: (asset as any).title ?? null,
      type: (asset as any).type ?? null,
      classification: (asset as any).classification ?? null,
      lastUpdated: (asset as any).updatedAt ? new Date((asset as any).updatedAt).toISOString() : null,
      content: decrypted,
    },
  });
}