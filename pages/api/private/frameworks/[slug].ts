// pages/api/private/frameworks/[slug].ts
import type { NextApiRequest, NextApiResponse } from "next";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { getServerSession } from "next-auth/next";
import { pipeline } from "stream/promises";
import { z } from "zod";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
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
  "frameworks"
);

const fileNameForSlug = (slug: string) => 
  `AoL-${slug.toUpperCase()}-FRAMEWORK-PREMIUM.pdf`;

const CONTENT_TYPE = "framework";
const EVENT_TYPE = "preview";

// Simple in-memory rate limiting
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 10; // 10 requests per minute

// Input validation schema
const slugSchema = z.string()
  .min(1)
  .max(100)
  .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens");

// Concurrent request tracking
const activeRequests = new Map<string, Promise<Buffer>>();

// Structured error codes
const ERROR_CODES = {
  ACCESS_DENIED: {
    code: 'ACCESS_DENIED',
    message: 'Insufficient permissions',
    status: 403,
  },
  RATE_LIMITED: {
    code: 'RATE_LIMITED',
    message: 'Too many requests',
    status: 429,
  },
  NOT_FOUND: {
    code: 'NOT_FOUND',
    message: 'Framework not found',
    status: 404,
  },
  PDF_MISSING: {
    code: 'PDF_MISSING',
    message: 'PDF not generated for this framework',
    status: 404,
  },
  NOT_PRIVATE: {
    code: 'NOT_PRIVATE',
    message: 'Not a private framework',
    status: 403,
  },
  INVALID_SLUG: {
    code: 'INVALID_SLUG',
    message: 'Invalid slug format',
    status: 400,
  },
  METHOD_NOT_ALLOWED: {
    code: 'METHOD_NOT_ALLOWED',
    message: 'Method not allowed',
    status: 405,
  },
  SERVER_ERROR: {
    code: 'SERVER_ERROR',
    message: 'Server error',
    status: 500,
  },
  SESSION_EXPIRED: {
    code: 'SESSION_EXPIRED',
    message: 'Session expired',
    status: 401,
  }
} as const;

// ----------------------------------------------------------------------------
// Utilities
// ----------------------------------------------------------------------------
function sha256Hex(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function getClientIp(req: NextApiRequest): string | undefined {
  const headersToCheck = [
    'x-forwarded-for',
    'x-real-ip',
    'x-client-ip',
    'cf-connecting-ip',
    'fastly-client-ip',
  ];

  for (const header of headersToCheck) {
    const value = req.headers[header];
    if (typeof value === 'string' && value.length > 0) {
      return value.split(',')[0].trim();
    }
    if (Array.isArray(value) && value[0]) {
      return value[0].split(',')[0].trim();
    }
  }

  return req.socket?.remoteAddress;
}

function checkRateLimit(ip: string, memberId?: string): boolean {
  const now = Date.now();
  const key = memberId ? `member:${memberId}` : `ip:${ip}`;
  
  const record = rateLimitStore.get(key);
  
  if (!record || record.resetTime < now) {
    // New window
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
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

// Clean up old rate limit records periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (record.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 30000); // Clean every 30 seconds

async function getPdfBuffer(slug: string): Promise<Buffer> {
  const key = `pdf:${slug}`;
  const filePath = path.join(PRIVATE_PDF_ROOT, fileNameForSlug(slug));
  
  // Deduplicate concurrent requests
  if (activeRequests.has(key)) {
    return activeRequests.get(key)!;
  }
  
  const readPromise = fs.promises.readFile(filePath);
  activeRequests.set(key, readPromise);
  
  try {
    const buffer = await readPromise;
    return buffer;
  } finally {
    activeRequests.delete(key);
  }
}

async function resolveAccessContext(
  req: NextApiRequest, 
  res: NextApiResponse
): Promise<AccessContext & { 
  memberId?: string | null; 
  emailHash?: string | null; 
  isValidSession: boolean;
}> {
  const session = await getServerSession(req, res, authOptions);
  
  const baseContext = {
    tier: "public" as const,
    innerCircleAccess: false,
    isInternal: false,
    allowPrivate: false,
    returnTo: req.headers.referer || req.headers.origin || "/",
    memberId: null,
    emailHash: null,
    isValidSession: false,
  };

  if (!session) {
    return baseContext;
  }

  return {
    tier: session?.aol?.tier ?? "public",
    innerCircleAccess: session?.aol?.innerCircleAccess ?? false,
    isInternal: session?.aol?.isInternal ?? false,
    allowPrivate: session?.aol?.allowPrivate ?? false,
    returnTo: req.headers.referer || "/",
    memberId: session?.aol?.memberId ?? null,
    emailHash: session?.aol?.emailHash ?? null,
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
  ctx: AccessContext & { memberId?: string | null; emailHash?: string | null; isValidSession: boolean };
}) {
  const ip = getClientIp(params.req);
  const ipHash = ip ? sha256Hex(ip) : undefined;
  const userAgent = typeof params.req.headers["user-agent"] === "string" 
    ? params.req.headers["user-agent"] 
    : undefined;
  const referrer = typeof params.req.headers.referer === "string" 
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
    console.error('Failed to write audit log:', error);
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
        rating: 0.0,
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
    console.error('Failed to update content metadata:', error);
  }
}

// ----------------------------------------------------------------------------
// Main Handler
// ----------------------------------------------------------------------------
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const start = Date.now();

  const deny = async (
    statusCode: number, 
    payload: any, 
    opts: { 
      errorCode: string; 
      errorDetail?: string; 
      slug?: string; 
      ctx?: any;
    }
  ) => {
    const latencyMs = Date.now() - start;
    const slug = opts.slug || String(req.query.slug || "unknown");
    const ctx = opts.ctx || await resolveAccessContext(req, res);

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
      errorDetail: opts.errorDetail || payload?.error || payload?.reason,
      ctx,
    });

    return res.status(statusCode).json(payload);
  };

  try {
    if (req.method !== "GET") {
      res.setHeader("Allow", "GET");
      return deny(405, { 
        ok: false, 
        error: ERROR_CODES.METHOD_NOT_ALLOWED.message 
      }, { 
        errorCode: ERROR_CODES.METHOD_NOT_ALLOWED.code 
      });
    }

    const slug = String(req.query.slug || "").trim();
    try {
      slugSchema.parse(slug);
    } catch {
      return deny(400, { 
        ok: false, 
        error: ERROR_CODES.INVALID_SLUG.message 
      }, { 
        errorCode: ERROR_CODES.INVALID_SLUG.code,
        slug 
      });
    }

    // Rate limiting
    const ip = getClientIp(req) || 'unknown';
    const ctx = await resolveAccessContext(req, res);
    
    // Apply rate limiting based on IP first
    if (!checkRateLimit(ip)) {
      return deny(429, { 
        ok: false, 
        error: ERROR_CODES.RATE_LIMITED.message,
        retryAfter: 60 
      }, { 
        errorCode: ERROR_CODES.RATE_LIMITED.code,
        slug,
        ctx 
      });
    }

    // Additional rate limiting for authenticated users
    if (ctx.memberId && !checkRateLimit(ip, ctx.memberId)) {
      return deny(429, { 
        ok: false, 
        error: ERROR_CODES.RATE_LIMITED.message,
        retryAfter: 60 
      }, { 
        errorCode: ERROR_CODES.RATE_LIMITED.code,
        slug,
        ctx 
      });
    }

    const doc = resolveFrameworkDoc(slug);
    if (!doc) {
      return deny(404, { 
        ok: false, 
        error: ERROR_CODES.NOT_FOUND.message 
      }, { 
        errorCode: ERROR_CODES.NOT_FOUND.code,
        slug,
        ctx 
      });
    }

    // Private document enforcement
    const docTiers = doc.tier ?? ["public"];
    const isPrivateDoc = docTiers.includes("private") || docTiers.includes("restricted");
    if (!isPrivateDoc) {
      return deny(403, { 
        ok: false, 
        error: ERROR_CODES.NOT_PRIVATE.message 
      }, { 
        errorCode: ERROR_CODES.NOT_PRIVATE.code,
        slug,
        ctx 
      });
    }

    const decision = checkDocumentAccess(doc, ctx);
    if (!decision.ok) {
      return deny(403, {
        ok: false,
        reason: decision.reason,
        requiredTier: decision.requiredTier,
        currentTier: decision.currentTier,
        redirectUrl: decision.redirectUrl,
      }, { 
        errorCode: ERROR_CODES.ACCESS_DENIED.code,
        errorDetail: decision.reason,
        slug,
        ctx 
      });
    }

    const filePath = path.join(PRIVATE_PDF_ROOT, fileNameForSlug(slug));
    
    let fileStats: fs.Stats;
    try {
      fileStats = await fs.promises.stat(filePath);
    } catch {
      return deny(404, { 
        ok: false, 
        error: ERROR_CODES.PDF_MISSING.message 
      }, { 
        errorCode: ERROR_CODES.PDF_MISSING.code,
        slug,
        ctx 
      });
    }

    let fileHash: string;
    let pdfBuffer: Buffer;
    
    try {
      pdfBuffer = await getPdfBuffer(slug);
      fileHash = crypto.createHash("sha256").update(pdfBuffer).digest("hex");
    } catch (error) {
      console.error('Error reading PDF:', error);
      return deny(500, { 
        ok: false, 
        error: ERROR_CODES.SERVER_ERROR.message 
      }, { 
        errorCode: ERROR_CODES.SERVER_ERROR.code,
        errorDetail: 'File read error',
        slug,
        ctx 
      });
    }

    // Set response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${fileNameForSlug(slug)}"`);
    res.setHeader("Content-Length", fileStats.size);
    
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0"
    );
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");

    // Log success and update metadata (non-blocking)
    const latencyMs = Date.now() - start;
    Promise.all([
      writeAudit({
        req,
        slug,
        statusCode: 200,
        success: true,
        latencyMs,
        fileName: fileNameForSlug(slug),
        fileSize: BigInt(fileStats.size),
        fileHash,
        ctx,
      }),
      bumpContentMetadata(slug)
    ]).catch(console.error);

    // Stream the response
    const fileStream = fs.createReadStream(filePath);
    await pipeline(fileStream, res);

  } catch (err: any) {
    console.error('Unexpected error:', err);
    
    const errorDetail = process.env.NODE_ENV === 'development' 
      ? err.message 
      : undefined;
    
    return deny(500, { 
      ok: false, 
      error: ERROR_CODES.SERVER_ERROR.message 
    }, { 
      errorCode: ERROR_CODES.SERVER_ERROR.code,
      errorDetail,
      slug: String(req.query.slug || 'unknown')
    });
  }
}

// API configuration
export const config = {
  api: {
    responseLimit: false,
    bodyParser: false,
  },
};