export const dynamic = "force-dynamic";
/* app/api/download/[token]/route.ts — STRICT-TYPED MASTER VAULT */
import { NextRequest, NextResponse } from "next/server";
import React from "react";
import type { ReactElement } from "react";
import type { DocumentProps } from "@react-pdf/renderer";
import { getServerSession } from "next-auth";

import { getPDFById } from "@/lib/pdf/registry";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  verifyDownloadToken,
  incrementTokenUsage,
  doesTokenMatchBinding,
} from "@/lib/premium/download-token";
import { generateForensicPayload } from "@/lib/intelligence/forensic-mapping";
import type { AccessTier } from "@/lib/access/tier-policy";

/**
 * Font registration is performed lazily on first request (see GET handler)
 * so that @react-pdf/renderer does not land in the module graph at import
 * time. This keeps the server chunk off the handler's hot path.
 */
let fontsRegistered = false;

type RouteContext = {
  params: {
    token: string;
  };
};

type SessionUserShape = {
  id?: string | null;
  role?: string | null;
  tier?: AccessTier | null;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

type PdfRegistryItem = {
  id?: string;
  slug: string;
  title?: string;
  subtitle?: string;
  description?: string;
  summary?: string;
  content?: string;
};

type ForensicMetadata = {
  aol?: {
    traceId?: string;
    sig?: string;
  };
};

type ForensicPayloadLike = {
  metadata?: ForensicMetadata;
};

function sanitizeContent(raw: string): string {
  if (!raw) return "";

  return raw
    .replace(/import\s+[\s\S]*?from\s+['"].*?['"];?/g, "")
    .replace(/export\s+default\s+[\s\S]*$/g, "")
    .replace(/<[^>]*>?/gm, "")
    .replace(/[#*`]/g, "")
    .trim();
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

function extractTokenId(token: string): string {
  if (!token) return "unknown-token";
  if (!token.includes(".")) return token;

  const parts = token.split(".");
  return parts[1] || parts[0] || "unknown-token";
}

function asPdfRegistryItem(value: unknown): PdfRegistryItem | null {
  if (!value || typeof value !== "object") return null;

  const obj = value as Record<string, unknown>;
  const slug = typeof obj.slug === "string" ? obj.slug : "";

  if (!slug) return null;

  return {
    id: typeof obj.id === "string" ? obj.id : undefined,
    slug,
    title: typeof obj.title === "string" ? obj.title : undefined,
    subtitle: typeof obj.subtitle === "string" ? obj.subtitle : undefined,
    description: typeof obj.description === "string" ? obj.description : undefined,
    summary: typeof obj.summary === "string" ? obj.summary : undefined,
    content: typeof obj.content === "string" ? obj.content : undefined,
  };
}

function getForensicTraceId(forensic: unknown): string {
  const typed = forensic as ForensicPayloadLike | null | undefined;
  return typed?.metadata?.aol?.traceId || "UNTRACED";
}

function getForensicSignature(forensic: unknown): string {
  const typed = forensic as ForensicPayloadLike | null | undefined;
  return typed?.metadata?.aol?.sig || "UNSIGNED";
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  const token = params.token;
  const { searchParams } = new URL(req.url);
  const contentId = searchParams.get("rid") || undefined;

  const ip = getClientIp(req);
  const userAgent = req.headers.get("user-agent") || "unknown";

  const session = await getServerSession(authOptions);
  const sessionUser = session?.user as SessionUserShape | undefined;

  const userId = sessionUser?.id ?? null;
  const userTier: AccessTier | "public" = sessionUser?.tier ?? "public";
  const sessionId = getSessionCookie(req);

  const tokenCheck = await verifyDownloadToken(token, contentId);

  if (!tokenCheck.valid || !tokenCheck.payload) {
    await logAttempt({
      token,
      contentId,
      userId,
      sessionId,
      ip,
      ua: userAgent,
      success: false,
      statusCode: 403,
      reason: tokenCheck.reason || "Unauthorized",
    });

    return NextResponse.json(
      { error: tokenCheck.reason || "Unauthorized" },
      { status: 403 }
    );
  }

  const bindingMatches = doesTokenMatchBinding(tokenCheck.payload, {
    userId,
    sessionId,
  });

  if (!bindingMatches) {
    await logAttempt({
      token,
      contentId,
      userId,
      sessionId,
      ip,
      ua: userAgent,
      success: false,
      statusCode: 403,
      reason: "Binding mismatch",
    });

    return NextResponse.json(
      { error: "Access restricted to original session" },
      { status: 403 }
    );
  }

  if (!contentId) {
    await logAttempt({
      token,
      contentId,
      userId,
      sessionId,
      ip,
      ua: userAgent,
      success: false,
      statusCode: 400,
      reason: "Missing content identifier",
    });

    return NextResponse.json(
      { error: "Missing content identifier" },
      { status: 400 }
    );
  }

  const pdfConfigRaw = getPDFById(contentId);
  const pdfConfig = asPdfRegistryItem(pdfConfigRaw);

  if (!pdfConfig) {
    await logAttempt({
      token,
      contentId,
      userId,
      sessionId,
      ip,
      ua: userAgent,
      success: false,
      statusCode: 404,
      reason: "Asset missing from vault registry",
    });

    return NextResponse.json(
      { error: "Asset missing from vault registry" },
      { status: 404 }
    );
  }

  const dbEntry = await prisma.contentMetadata.findUnique({
    where: { slug: pdfConfig.slug },
    select: {
      content: true,
      summary: true,
    },
  });

  const rawContent = dbEntry?.content || pdfConfig.content || "";
  const rawSummary =
    dbEntry?.summary || pdfConfig.description || pdfConfig.summary || "";

  const forensic = generateForensicPayload(pdfConfigRaw!, {
    userId: userId || "anonymous",
    userTier,
    sessionId,
    ipAddress: ip,
  });

  await incrementTokenUsage(token);

  const traceId = getForensicTraceId(forensic);

  await logAttempt({
    token,
    contentId,
    userId,
    sessionId,
    ip,
    ua: userAgent,
    success: true,
    statusCode: 200,
    reason: `Trace: ${traceId}`,
  });

  try {
    const ReactPDFModule = await import("@react-pdf/renderer");
    const { renderToBuffer } = ReactPDFModule;
    const { default: InstitutionalBriefDocument } = await import(
      "@/lib/pdf/templates/InstitutionalBriefDocument"
    );

    if (!fontsRegistered) {
      const { registerFonts } = await import("@/lib/pdf/register-fonts");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      registerFonts(ReactPDFModule as any);
      fontsRegistered = true;
    }

    const documentElement = React.createElement(InstitutionalBriefDocument, {
      config: {
        ...pdfConfig,
        subtitle: pdfConfig.subtitle || rawSummary.substring(0, 120),
        signAs: "The Architect",
      },
      content: sanitizeContent(rawContent),
      summaryText: sanitizeContent(rawSummary),
      watermark: forensic,
    });

    const pdfBuffer = await renderToBuffer(documentElement as ReactElement<DocumentProps>);
    const signature = getForensicSignature(forensic);
    const filename = `${pdfConfig.slug || "brief"}-${traceId}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, max-age=0",
        "X-Trace-ID": traceId,
        "X-Forensic-Signature": signature,
      },
    });
  } catch (error) {
    console.error("INSTITUTIONAL_STREAM_ERROR", error);

    await logAttempt({
      token,
      contentId,
      userId,
      sessionId,
      ip,
      ua: userAgent,
      success: false,
      statusCode: 500,
      reason: "Document generation failed",
    });

    return NextResponse.json(
      { error: "Document generation failed" },
      { status: 500 }
    );
  }
}

type LogAttemptArgs = {
  token: string;
  contentId?: string;
  userId: string | null;
  sessionId: string | null;
  ip: string;
  ua: string;
  success: boolean;
  statusCode: number;
  reason?: string;
};

async function logAttempt({
  token,
  contentId,
  userId,
  sessionId,
  ip,
  ua,
  success,
  statusCode,
  reason,
}: LogAttemptArgs): Promise<void> {
  try {
    await prisma.premiumDownloadAttempt.create({
      data: {
        tokenId: extractTokenId(token),
        contentId: contentId || "unknown",
        userId,
        sessionId,
        ipAddress: ip,
        userAgent: ua,
        success,
        statusCode,
        reason: reason || (success ? "Success" : "Unknown failure"),
      },
    });
  } catch (error) {
    console.error("AUDIT_LOG_FAILURE", error);
  }
}