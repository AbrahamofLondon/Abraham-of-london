export const dynamic = "force-dynamic";
/* app/api/library/download/route.ts — PRIVATE BANK CADENCE TOKEN ISSUER */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createDownloadToken } from "@/lib/premium/download-token";
import tiers from "@/lib/access/tiers";
import type { AccessTier } from "@/lib/access/tier-policy";

// ─── Types ───────────────────────────────────────────────────────────────────

type SourcePDFItem = {
  id: string;
  title: string;
  type: string;
  tier: string;
  outputPath: string;
  description?: string;
  category?: string;
  requiresAuth?: boolean;
  [k: string]: unknown;
};

type ResponseData = {
  ok: boolean;
  reason?: string;
  token?: string;
  downloadUrl?: string;
  expiresInMs?: number;
  remainingDownloads?: number;
  contentId?: string;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function safeStr(v: unknown): string {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function normalizeSlug(input: string): string {
  return (input || "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/\/{2,}/g, "/");
}

function toRouteParamSlug(registrySlug: string): string {
  const n = normalizeSlug(registrySlug);
  const parts = n.split("/").filter(Boolean);
  return parts.at(-1) ?? "";
}

function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "127.0.0.1";
}

function getSessionCookie(req: NextRequest): string {
  return (
    req.cookies.get("next-auth.session-token")?.value ||
    req.cookies.get("__Secure-next-auth.session-token")?.value ||
    "no-session"
  );
}

// ─── Registry Loader ─────────────────────────────────────────────────────────

async function loadPdfRegistry(): Promise<SourcePDFItem[]> {
  try {
    const mod: any = await import("@/scripts/pdf/pdf-registry.source");
    const list =
      mod?.ALL_SOURCE_PDFS_DEDUPED ||
      mod?.ALL_SOURCE_PDFS ||
      mod?.PDF_REGISTRY ||
      mod?.default;

    const arr: any[] = Array.isArray(list)
      ? list
      : Array.isArray(list?.items)
        ? list.items
        : [];

    return arr.map((x: any) => ({
      id: safeStr(x.id || x.slug || ""),
      title: safeStr(x.title || x.name || ""),
      type: safeStr(x.type || "other"),
      tier: safeStr(x.tier || x.accessLevel || "public"),
      outputPath: safeStr(x.outputPath || x.path || x.file || ""),
      description: safeStr(x.description || x.excerpt || ""),
      category: safeStr(x.category || ""),
      requiresAuth: Boolean(x.requiresAuth),
    })).filter((a: SourcePDFItem) => Boolean(a.id));
  } catch {
    return [];
  }
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const slug = safeStr(body.slug || body.id || "").trim();

    if (!slug) {
      return NextResponse.json(
        { ok: false, reason: "SLUG_REQUIRED" },
        { status: 400 },
      );
    }

    // 1. Look up the PDF in the registry
    const registry = await loadPdfRegistry();
    const needle = slug.toLowerCase();

    const pdf =
      registry.find((p) => p.id.toLowerCase() === needle) ||
      registry.find((p) => toRouteParamSlug(p.id).toLowerCase() === needle) ||
      registry.find((p) => normalizeSlug(p.outputPath).toLowerCase().includes(needle)) ||
      null;

    if (!pdf) {
      return NextResponse.json(
        { ok: false, reason: "PDF_NOT_FOUND" },
        { status: 404 },
      );
    }

    // 2. Determine required access tier
    const requiredTier = tiers.normalizeRequired(
      pdf.tier || (pdf.requiresAuth ? "member" : "public"),
    );

    // 3. Check session / auth
    const session = await getServerSession(authOptions);
    const sessionUser = session?.user as {
      id?: string | null;
      role?: string | null;
      tier?: AccessTier | null;
    } | undefined;

    const userId = sessionUser?.id ?? null;
    const userTier: AccessTier = sessionUser?.tier ?? "public";
    const sessionId = getSessionCookie(req);

    // 4. Verify access
    if (requiredTier !== "public") {
      if (!session?.user) {
        return NextResponse.json(
          { ok: false, reason: "AUTHENTICATION_REQUIRED" },
          { status: 401 },
        );
      }

      if (!tiers.hasAccess(userTier, requiredTier)) {
        return NextResponse.json(
          {
            ok: false,
            reason: "INSUFFICIENT_CLEARANCE",
            requiredTier,
            userTier,
          },
          { status: 403 },
        );
      }
    }

    // 5. Determine contentId — use the PDF id from registry
    const contentId = pdf.id;

    // 6. Resolve the actual file path on disk
    const fs = await import("fs");
    const path = await import("path");
    const root = process.cwd();

    // Search locations in priority order
    const searchPaths = [
      pdf.outputPath,
      `/assets/downloads/${path.basename(pdf.outputPath)}`,
      `/assets/downloads/content-downloads/${path.basename(pdf.outputPath)}`,
      `/assets/downloads/lib-pdf/${path.basename(pdf.outputPath)}`,
      `/assets/downloads/public-assets/resources/pdfs/${path.basename(pdf.outputPath)}`,
      `/assets/downloads/public-assets/vault/${path.basename(pdf.outputPath)}`,
      `/vault/downloads/lib-pdf/${path.basename(pdf.outputPath)}`,
    ];

    let resolvedPublicPath = pdf.outputPath;
    for (const p of searchPaths) {
      const rel = p.startsWith("/") ? p.slice(1) : p;
      const fullPath = path.join(root, "public", rel);
      if (fs.existsSync(fullPath)) {
        resolvedPublicPath = p.startsWith("/") ? p : `/${p}`;
        break;
      }
    }

    // 7. Create a download token
    const tokenRecord = await createDownloadToken({
      contentId,
      userId,
      sessionId,
      expiresIn: 30 * 60 * 1000, // 30 minutes
      maxDownloads: 3,
      metadata: {
        slug: pdf.id,
        title: pdf.title,
        contentType: pdf.type,
        requiredTier,
        tier: userTier,
        outputPath: resolvedPublicPath,
        forensics: {
          watermarkId: `wm_${pdf.id}_${Date.now()}`,
          expectedFooter: `${pdf.title} • ${requiredTier} • Abraham of London`,
        },
      },
    });

    // 8. Build the download URL
    const downloadUrl = `/api/download/${encodeURIComponent(tokenRecord.token)}?rid=${encodeURIComponent(contentId)}`;

    // 9. Log the issuance
    try {
      await prisma.premiumDownloadAttempt.create({
        data: {
          tokenId: tokenRecord.tokenId,
          contentId,
          userId,
          sessionId,
          ipAddress: getClientIp(req),
          userAgent: req.headers.get("user-agent") || "unknown",
          success: true,
          statusCode: 200,
          reason: "TOKEN_ISSUED",
        },
      });
    } catch {
      // Non-critical — token is already created
    }

    return NextResponse.json({
      ok: true,
      token: tokenRecord.token,
      downloadUrl,
      expiresInMs: 30 * 60 * 1000,
      remainingDownloads: 3,
      contentId,
    } satisfies ResponseData);
  } catch (error) {
    console.error("[LIBRARY_DOWNLOAD_TOKEN_ERROR]", error);
    return NextResponse.json(
      { ok: false, reason: "TOKEN_GENERATION_FAILED" },
      { status: 500 },
    );
  }
}
