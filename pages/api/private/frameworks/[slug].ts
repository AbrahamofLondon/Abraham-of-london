// pages/api/private/frameworks/[slug].ts
import type { NextApiRequest, NextApiResponse } from "next";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import {
  DownloadContentType,
  DownloadDeliveryMode,
  DownloadEventType,
} from "@prisma/client";

import { authOptions } from "@/lib/auth";
import type {
  AccessContext,
  AccessControlledDocument,
  ContentTier,
} from "@/lib/access/logic";
import { checkDocumentAccess } from "@/lib/access/logic";
import { FRAMEWORKS } from "@/lib/resources/strategic-frameworks";
import { prisma } from "@/lib/server/prisma";

const PRIVATE_PDF_ROOT = path.join(
  process.cwd(),
  "private_storage",
  "frameworks",
  "frameworks",
);

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
    if (record.resetTime <= now) rateLimitStore.delete(key);
  }
}

function checkRateLimit(ip: string, memberId?: string): boolean {
  cleanExpiredRateLimits();
  const now = Date.now();
  const key = memberId ? `member:${memberId}` : `ip:${ip}`;
  const record = rateLimitStore.get(key);

  if (!record || record.resetTime <= now) {
    rateLimitStore.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (record.count >= RATE_LIMIT_MAX) return false;
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
  email?: string | null;
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
    email: null,
    isValidSession: false,
  };

  if (!session) return baseContext;
  const aol = (session as { aol?: Partial<ResolvedAccessContext> }).aol;
  const user = (session as { user?: { email?: string | null } }).user;
  return {
    tier: aol?.tier ?? "public",
    innerCircleAccess: Boolean(aol?.innerCircleAccess),
    isInternal: Boolean(aol?.isInternal),
    allowPrivate: Boolean(aol?.allowPrivate),
    returnTo: req.headers.referer || "/",
    memberId: aol?.memberId ?? null,
    emailHash: aol?.emailHash ?? null,
    email: user?.email ?? null,
    isValidSession: true,
  };
}

function normalizeFrameworkTiers(input: unknown): ContentTier[] {
  const allowed = new Set<ContentTier>([
    "public",
    "member",
    "inner_circle",
    "client",
    "legacy",
    "architect",
    "owner",
    "all",
  ]);
  if (!Array.isArray(input) || input.length === 0) return ["public"];
  const normalized = input
    .map((v) => String(v).trim().toLowerCase())
    .map((v) => (v === "inner-circle" ? "inner_circle" : v))
    .filter((v): v is ContentTier => allowed.has(v as ContentTier));
  return normalized.length > 0 ? Array.from(new Set(normalized)) : ["public"];
}

function resolveFrameworkDoc(slug: string): AccessControlledDocument | null {
  const fw = FRAMEWORKS.find((f: any) => f.slug === slug);
  if (!fw) return null;
  return {
    slug: fw.slug,
    title: fw.title,
    tier: normalizeFrameworkTiers(fw.tier),
    requiresInnerCircle: true,
    previewOnly: true,
  };
}

async function bumpFrameworkMetrics(slug: string) {
  try {
    await prisma.framework.updateMany({
      where: { slug },
      data: {
        downloadCount: { increment: 1 },
        lastDownloadedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("[FRAMEWORK_METRIC_BUMP_FAILED]", error);
  }
}

async function writeAudit(params: {
  req: NextApiRequest;
  slug: string;
  frameworkId?: string | null;
  title?: string | null;
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
        title: params.title ?? undefined,
        contentType: DownloadContentType.ASSET,
        eventType:
          params.success ? DownloadEventType.DOWNLOAD : DownloadEventType.PREVIEW,
        deliveryMode: DownloadDeliveryMode.DIRECT,

        frameworkId: params.frameworkId ?? undefined,
        memberId: params.ctx.memberId ?? undefined,
        email: params.ctx.email ?? undefined,
        emailHash: params.ctx.emailHash ?? undefined,

        userAgent,
        ipAddress: ip,
        ipHash,
        referrer,

        success: params.success,
        statusCode: params.statusCode,
        latencyMs: params.latencyMs,
        processedAt: new Date(),

        fileName: params.fileName ?? undefined,
        fileSize: params.fileSize ?? undefined,
        fileHash: params.fileHash ?? undefined,
        errorCode: params.errorCode ?? undefined,
        errorDetail: params.errorDetail ?? undefined,

        metadata: JSON.stringify({
          route: "pages/api/private/frameworks/[slug]",
        }),
      },
    });
  } catch (error) {
    console.error("[PRIVATE_FRAMEWORK_AUDIT_WRITE_FAILED]", error);
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const start = Date.now();

  const deny = async (
    statusCode: number,
    payload: Record<string, unknown>,
    opts: {
      errorCode: string;
      errorDetail?: string;
      slug?: string;
      frameworkId?: string | null;
      title?: string | null;
      ctx?: ResolvedAccessContext;
    },
  ) => {
    const latencyMs = Date.now() - start;
    const slug = opts.slug || getQuerySlug(req.query.slug) || "unknown";
    const ctx = opts.ctx || (await resolveAccessContext(req, res));

    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    await writeAudit({
      req,
      slug,
      frameworkId: opts.frameworkId,
      title: opts.title,
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
        { errorCode: ERROR_CODES.INVALID_SLUG.code, slug: rawSlug },
      );
    }

    const slug = rawSlug;
    const ip = getClientIp(req) || "unknown";
    const ctx = await resolveAccessContext(req, res);

    if (!checkRateLimit(ip) || (ctx.memberId && !checkRateLimit(ip, ctx.memberId))) {
      return deny(
        429,
        { ok: false, error: ERROR_CODES.RATE_LIMITED.message, retryAfter: 60 },
        { errorCode: ERROR_CODES.RATE_LIMITED.code, slug, ctx },
      );
    }

    const doc = resolveFrameworkDoc(slug);
    if (!doc) {
      return deny(
        404,
        { ok: false, error: ERROR_CODES.NOT_FOUND.message },
        { errorCode: ERROR_CODES.NOT_FOUND.code, slug, ctx },
      );
    }

    const framework = await prisma.framework.findUnique({
      where: { slug },
      select: { id: true, slug: true, title: true, tier: true },
    });

    const docTiers = Array.isArray(doc.tier) ? doc.tier : ["public"];
    const isPrivateDoc = docTiers.includes("client") || docTiers.includes("legacy");

    if (!isPrivateDoc) {
      return deny(
        403,
        { ok: false, error: ERROR_CODES.NOT_PRIVATE.message },
        {
          errorCode: ERROR_CODES.NOT_PRIVATE.code,
          slug,
          frameworkId: framework?.id ?? null,
          title: framework?.title ?? doc.title ?? null,
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
          frameworkId: framework?.id ?? null,
          title: framework?.title ?? doc.title ?? null,
          ctx,
        },
      );
    }

    let pdfBuffer: Buffer;
    try {
      pdfBuffer = await getPdfBuffer(slug);
    } catch (error: any) {
      const isMissing = error?.code === "ENOENT";
      return deny(
        isMissing ? 404 : 500,
        {
          ok: false,
          error: isMissing
            ? ERROR_CODES.PDF_MISSING.message
            : ERROR_CODES.SERVER_ERROR.message,
        },
        {
          errorCode: isMissing
            ? ERROR_CODES.PDF_MISSING.code
            : ERROR_CODES.SERVER_ERROR.code,
          errorDetail: isMissing ? "PDF file missing" : "Read error",
          slug,
          frameworkId: framework?.id ?? null,
          title: framework?.title ?? doc.title ?? null,
          ctx,
        },
      );
    }

    const fileName = fileNameForSlug(slug);
    const latencyMs = Date.now() - start;
    const fileHash = sha256Hex(pdfBuffer.toString("base64"));

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);
    res.setHeader("Content-Length", String(pdfBuffer.length));
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");

    void Promise.allSettled([
      writeAudit({
        req,
        slug,
        frameworkId: framework?.id ?? null,
        title: framework?.title ?? doc.title ?? null,
        statusCode: 200,
        success: true,
        latencyMs,
        fileName,
        fileSize: BigInt(pdfBuffer.length),
        fileHash,
        ctx,
      }),
      bumpFrameworkMetrics(slug),
    ]).catch(console.error);

    return res.status(200).send(pdfBuffer);
  } catch {
    return deny(
      500,
      { ok: false, error: ERROR_CODES.SERVER_ERROR.message },
      {
        errorCode: ERROR_CODES.SERVER_ERROR.code,
        slug: getQuerySlug(req.query.slug) || "unknown",
      },
    );
  }
}

export const config = {
  api: { responseLimit: false, bodyParser: false },
};