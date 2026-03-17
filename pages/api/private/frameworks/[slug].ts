// pages/api/private/frameworks/[slug].ts
import type { NextApiRequest, NextApiResponse } from "next";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { getServerSession } from "next-auth/next";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import type { AccessContext, AccessControlledDocument } from "@/lib/access/logic";
import { checkDocumentAccess } from "@/lib/access/logic";
import { FRAMEWORKS } from "@/lib/resources/strategic-frameworks";
import { prisma } from "@/lib/server/prisma";

// ----------------------------------------------------------------------------
// Config & Constants
// ----------------------------------------------------------------------------
const PRIVATE_PDF_ROOT = path.join(
  process.cwd(),
  "private_storage",
  "frameworks",
  "frameworks",
);

const CONTENT_TYPE = "framework";
const EVENT_TYPE = "preview";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const activeRequests = new Map<string, Promise<Buffer>>();

const slugSchema = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens");

const ERROR_CODES = {
  ACCESS_DENIED: {
    code: "ACCESS_DENIED",
    message: "Insufficient permissions",
    status: 403,
  },
  RATE_LIMITED: {
    code: "RATE_LIMITED",
    message: "Too many requests",
    status: 429,
  },
  NOT_FOUND: {
    code: "NOT_FOUND",
    message: "Framework not found",
    status: 404,
  },
  PDF_MISSING: {
    code: "PDF_MISSING",
    message: "PDF not generated for this framework",
    status: 404,
  },
  NOT_PRIVATE: {
    code: "NOT_PRIVATE",
    message: "Not a private framework",
    status: 403,
  },
  INVALID_SLUG: {
    code: "INVALID_SLUG",
    message: "Invalid slug format",
    status: 400,
  },
  METHOD_NOT_ALLOWED: {
    code: "METHOD_NOT_ALLOWED",
    message: "Method not allowed",
    status: 405,
  },
  SERVER_ERROR: {
    code: "SERVER_ERROR",
    message: "Server error",
    status: 500,
  },
} as const;

// ----------------------------------------------------------------------------
// Utilities
// ----------------------------------------------------------------------------
function sha256Hex(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function getQuerySlug(input: string | string[] | undefined): string {
  if (Array.isArray(input)) return String(input[0] ?? "").trim();
  return String(input ?? "").trim();
}

function getClientIp(req: NextApiRequest): string | undefined {
  const headersToCheck = [
    "x-forwarded-for",
    "x-real-ip",
    "x-client-ip",
    "cf-connecting-ip",
    "fastly-client-ip",
  ] as const;

  for (const header of headersToCheck) {
    const value = req.headers[header];

    if (typeof value === "string" && value.trim()) {
      return value.split(",")[0]?.trim() || undefined;
    }

    if (Array.isArray(value)) {
      const first = value[0];
      if (typeof first === "string" && first.trim()) {
        return first.split(",")[0]?.trim() || undefined;
      }
    }
  }

  return req.socket?.remoteAddress || undefined;
}

function cleanExpiredRateLimits(): void {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (record.resetTime <= now) {
      rateLimitStore.delete(key);
    }
  }
}

function checkRateLimit(ip: string, memberId?: string): boolean {
  cleanExpiredRateLimits();

  const now = Date.now();
  const key = memberId ? `member:${memberId}` : `ip:${ip}`;
  const record = rateLimitStore.get(key);

  if (!record || record.resetTime <= now) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS,
    });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }

  record.count += 1;
  rateLimitStore.set(key, record);
  return true;
}

function fileNameForSlug(slug: string): string {
  return `AoL-${slug.toUpperCase()}-FRAMEWORK-PREMIUM.pdf`;
}

async function getPdfBuffer(slug: string): Promise<Buffer> {
  const key = `pdf:${slug}`;
  const filePath = path.join(PRIVATE_PDF_ROOT, fileNameForSlug(slug));

  const inFlight = activeRequests.get(key);
  if (inFlight) return inFlight;

  const readPromise = fs.promises.readFile(filePath);
  activeRequests.set(key, readPromise);

  try {
    return await readPromise;
  } finally {
    activeRequests.delete(key);
  }
}

type ResolvedAccessContext = AccessContext & {
  memberId?: string | null;
  emailHash?: string | null;
  isValidSession: boolean;
};

async function resolveAccessContext(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<ResolvedAccessContext> {
  const session = await getServerSession(req, res, authOptions);

  const baseContext: ResolvedAccessContext = {
    tier: "public",
    innerCircleAccess: false,
    isInternal: false,
    allowPrivate: false,
    returnTo: req.headers.referer || req.headers.origin || "/",
    memberId: null,
    emailHash: null,
    isValidSession: false,
  };

  if (!session) return baseContext;

  const aol = (session as { aol?: Partial<ResolvedAccessContext> }).aol;

  return {
    tier: aol?.tier ?? "public",
    innerCircleAccess: Boolean(aol?.innerCircleAccess),
    isInternal: Boolean(aol?.isInternal),
    allowPrivate: Boolean(aol?.allowPrivate),
    returnTo: req.headers.referer || "/",
    memberId: aol?.memberId ?? null,
    emailHash: aol?.emailHash ?? null,
    isValidSession: true,
  };
}

function resolveFrameworkDoc(slug: string): AccessControlledDocument | null {
  const fw = FRAMEWORKS.find((f: any) => f.slug === slug);
  if (!fw) return null;

  return {
    slug: fw.slug,
    title: fw.title,
    tier: fw.tier ?? ["public"],
    requiresInnerCircle: true,
    previewOnly: true,
  };
}

// ----------------------------------------------------------------------------
// Audit Logging
// ----------------------------------------------------------------------------
async function writeAudit(params: {
  req: NextApiRequest;
  slug: string;
  statusCode: number;
  success: boolean;
  latencyMs: number;
  fileName?: string;
  fileSize?: bigint;
  fileHash?: string;
  errorCode?: string;
  errorDetail?: string;
  ctx: ResolvedAccessContext;
}) {
  const ip = getClientIp(params.req);
  const ipHash = ip ? sha256Hex(ip) : undefined;

  const userAgent =
    typeof params.req.headers["user-agent"] === "string"
      ? params.req.headers["user-agent"]
      : undefined;

  const referrer =
    typeof params.req.headers.referer === "string"
      ? params.req.headers.referer
      : undefined;

  try {
    await prisma.downloadAuditEvent.create({
      data: {
        slug: params.slug,
        contentType: CONTENT_TYPE,
        eventType: EVENT_TYPE,
        memberId: params.ctx.memberId ?? undefined,
        fileName: params.fileName,
        fileSize: params.fileSize,
        fileHash: params.fileHash,
        emailHash: params.ctx.emailHash ?? undefined,
        userAgent,
        ipAddress: ip,
        ipHash,
        referrer,
        statusCode: params.statusCode,
        latencyMs: params.latencyMs,
        success: params.success,
        errorCode: params.errorCode,
        errorDetail: params.errorDetail,
        processedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("[PRIVATE_FRAMEWORK_AUDIT_WRITE_FAILED]", error);
  }
}

async function bumpContentMetadata(slug: string) {
  try {
    const now = new Date();

    await prisma.contentMetadata.upsert({
      where: { slug },
      create: {
        slug,
        title: slug,
        contentType: CONTENT_TYPE,
        totalDownloads: 1,
        uniqueDownloaders: 0,
        lastDownloadAt: now,
        viewCount: 0,
        shareCount: 0,
        likeCount: 0,
        commentCount: 0,
        rating: 0,
        tags: JSON.stringify(["private", "framework"]),
        metadata: JSON.stringify({}),
      },
      update: {
        totalDownloads: { increment: 1 },
        lastDownloadAt: now,
        updatedAt: now,
      },
    });
  } catch (error) {
    console.error("[PRIVATE_FRAMEWORK_METADATA_BUMP_FAILED]", error);
  }
}

// ----------------------------------------------------------------------------
// Main Handler
// ----------------------------------------------------------------------------
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const start = Date.now();

  const deny = async (
    statusCode: number,
    payload: Record<string, unknown>,
    opts: {
      errorCode: string;
      errorDetail?: string;
      slug?: string;
      ctx?: ResolvedAccessContext;
    },
  ) => {
    const latencyMs = Date.now() - start;
    const slug = opts.slug || getQuerySlug(req.query.slug) || "unknown";
    const ctx = opts.ctx || (await resolveAccessContext(req, res));

    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    await writeAudit({
      req,
      slug,
      statusCode,
      success: false,
      latencyMs,
      errorCode: opts.errorCode,
      errorDetail: opts.errorDetail || String(payload.error || payload.reason || ""),
      ctx,
    });

    return res.status(statusCode).json(payload);
  };

  try {
    if (req.method !== "GET") {
      res.setHeader("Allow", "GET");
      return deny(
        405,
        { ok: false, error: ERROR_CODES.METHOD_NOT_ALLOWED.message },
        { errorCode: ERROR_CODES.METHOD_NOT_ALLOWED.code },
      );
    }

    const rawSlug = getQuerySlug(req.query.slug);

    try {
      slugSchema.parse(rawSlug);
    } catch {
      return deny(
        400,
        { ok: false, error: ERROR_CODES.INVALID_SLUG.message },
        {
          errorCode: ERROR_CODES.INVALID_SLUG.code,
          slug: rawSlug,
        },
      );
    }

    const slug = rawSlug;
    const ip = getClientIp(req) || "unknown";
    const ctx = await resolveAccessContext(req, res);

    if (!checkRateLimit(ip)) {
      return deny(
        429,
        {
          ok: false,
          error: ERROR_CODES.RATE_LIMITED.message,
          retryAfter: 60,
        },
        {
          errorCode: ERROR_CODES.RATE_LIMITED.code,
          slug,
          ctx,
        },
      );
    }

    if (ctx.memberId && !checkRateLimit(ip, ctx.memberId)) {
      return deny(
        429,
        {
          ok: false,
          error: ERROR_CODES.RATE_LIMITED.message,
          retryAfter: 60,
        },
        {
          errorCode: ERROR_CODES.RATE_LIMITED.code,
          slug,
          ctx,
        },
      );
    }

    const doc = resolveFrameworkDoc(slug);
    if (!doc) {
      return deny(
        404,
        { ok: false, error: ERROR_CODES.NOT_FOUND.message },
        {
          errorCode: ERROR_CODES.NOT_FOUND.code,
          slug,
          ctx,
        },
      );
    }

    const docTiers = Array.isArray(doc.tier) ? doc.tier : ["public"];
    const isPrivateDoc =
      docTiers.includes("private") || docTiers.includes("restricted");

    if (!isPrivateDoc) {
      return deny(
        403,
        { ok: false, error: ERROR_CODES.NOT_PRIVATE.message },
        {
          errorCode: ERROR_CODES.NOT_PRIVATE.code,
          slug,
          ctx,
        },
      );
    }

    const decision = checkDocumentAccess(doc, ctx);
    if (!decision.ok) {
      return deny(
        403,
        {
          ok: false,
          reason: decision.reason,
          requiredTier: decision.requiredTier,
          currentTier: decision.currentTier,
          redirectUrl: decision.redirectUrl,
        },
        {
          errorCode: ERROR_CODES.ACCESS_DENIED.code,
          errorDetail: decision.reason,
          slug,
          ctx,
        },
      );
    }

    let pdfBuffer: Buffer;
    try {
      pdfBuffer = await getPdfBuffer(slug);
    } catch (error: unknown) {
      const code =
        (error as NodeJS.ErrnoException)?.code === "ENOENT"
          ? ERROR_CODES.PDF_MISSING.code
          : ERROR_CODES.SERVER_ERROR.code;

      const message =
        (error as NodeJS.ErrnoException)?.code === "ENOENT"
          ? ERROR_CODES.PDF_MISSING.message
          : ERROR_CODES.SERVER_ERROR.message;

      return deny(
        code === ERROR_CODES.PDF_MISSING.code ? 404 : 500,
        { ok: false, error: message },
        {
          errorCode: code,
          errorDetail:
            code === ERROR_CODES.PDF_MISSING.code ? "PDF file missing on disk" : "File read error",
          slug,
          ctx,
        },
      );
    }

    const fileHash = crypto.createHash("sha256").update(pdfBuffer).digest("hex");
    const fileName = fileNameForSlug(slug);
    const latencyMs = Date.now() - start;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);
    res.setHeader("Content-Length", String(pdfBuffer.length));

    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
    );
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");

    Promise.allSettled([
      writeAudit({
        req,
        slug,
        statusCode: 200,
        success: true,
        latencyMs,
        fileName,
        fileSize: BigInt(pdfBuffer.length),
        fileHash,
        ctx,
      }),
      bumpContentMetadata(slug),
    ]).catch(console.error);

    res.status(200).send(pdfBuffer);
  } catch (err: unknown) {
    console.error("[PRIVATE_FRAMEWORK_UNEXPECTED_ERROR]", err);

    const errorDetail =
      process.env.NODE_ENV === "development" && err instanceof Error
        ? err.message
        : undefined;

    return deny(
      500,
      { ok: false, error: ERROR_CODES.SERVER_ERROR.message },
      {
        errorCode: ERROR_CODES.SERVER_ERROR.code,
        errorDetail,
        slug: getQuerySlug(req.query.slug) || "unknown",
      },
    );
  }
}

export const config = {
  api: {
    responseLimit: false,
    bodyParser: false,
  },
};