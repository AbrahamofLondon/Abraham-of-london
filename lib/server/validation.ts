/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextApiRequest } from "next";
import type { NextRequest } from "next/server";
import crypto from "crypto";

// === RUNTIME DETECTION ===
const isEdgeRuntime = typeof EdgeRuntime !== 'undefined' || 
  (typeof process !== 'undefined' && process.env.NEXT_RUNTIME === 'edge');

// Explicit discriminated union type
export type AdminAuthResult =
  | { valid: true; userId?: string; method: "api_key" | "dev_mode" | "jwt" }
  | { valid: false; reason: string; statusCode?: number };

// Type guard functions for precise narrowing in guards.ts
export function isInvalidAdmin(
  result: AdminAuthResult
): result is { valid: false; reason: string; statusCode?: number } {
  return result.valid === false;
}

export function isValidAdmin(
  result: AdminAuthResult
): result is { valid: true; userId?: string; method: "api_key" | "dev_mode" | "jwt" } {
  return result.valid === true;
}

// === HEADER UTILITIES (Runtime-specific) ===

/**
 * Extract bearer token from request (Node.js runtime)
 */
function getBearerTokenNode(req: NextApiRequest): string | null {
  const authHeader = req.headers?.authorization;
  if (typeof authHeader === 'string') {
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    return match?.[1]?.trim() || null;
  }
  return null;
}

/**
 * Extract bearer token from request (Edge runtime)
 */
function getBearerTokenEdge(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization');
  if (typeof authHeader === 'string') {
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    return match?.[1]?.trim() || null;
  }
  return null;
}

/**
 * Extract JWT token from request (Node.js runtime)
 */
function getJwtTokenNode(req: NextApiRequest): string | null {
  // Check Authorization header first
  const bearerToken = getBearerTokenNode(req);
  if (bearerToken && bearerToken.includes('.')) {
    return bearerToken;
  }

  // Check cookie
  if (req.cookies) {
    return req.cookies.admin_token || req.cookies.access_token || null;
  }

  return null;
}

/**
 * Extract JWT token from request (Edge runtime)
 */
function getJwtTokenEdge(req: NextRequest): string | null {
  // Check Authorization header first
  const bearerToken = getBearerTokenEdge(req);
  if (bearerToken && bearerToken.includes('.')) {
    return bearerToken;
  }

  // Check cookie
  const adminCookie = req.cookies.get('admin_token');
  const accessCookie = req.cookies.get('access_token');
  return adminCookie?.value || accessCookie?.value || null;
}

/**
 * Validate JWT token
 */
async function validateJwtToken(token: string): Promise<{ valid: boolean; userId?: string }> {
  try {
    const adminJwtSecret = process.env.ADMIN_JWT_SECRET;
    
    if (!adminJwtSecret) {
      return { valid: false };
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      return { valid: false };
    }

    const [headerB64, payloadB64, signatureB64] = parts;
    if (!headerB64 || !payloadB64 || !signatureB64) {
      return { valid: false };
    }

    const payload = JSON.parse(
      Buffer.from(payloadB64, 'base64').toString('utf-8')
    );

    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return { valid: false };
    }

    if (payload.iss !== 'admin-api' || payload.aud !== 'inner-circle') {
      return { valid: false };
    }

    return {
      valid: true,
      userId: payload.sub || payload.userId,
    };
  } catch {
    return { valid: false };
  }
}

// === SEPARATE VALIDATION FUNCTIONS BY RUNTIME ===

/**
 * INSTITUTIONAL ADMIN VALIDATION (Node.js runtime)
 */
export async function validateAdminAccessNode(
  req: NextApiRequest
): Promise<AdminAuthResult> {
  const adminKey = process.env.ADMIN_API_KEY;
  const adminJwtEnabled = process.env.ADMIN_JWT_ENABLED === 'true';
  
  if (process.env.NODE_ENV !== "production" && !adminKey && !adminJwtEnabled) {
    return { valid: true, method: "dev_mode" };
  }

  if (adminJwtEnabled) {
    const jwtToken = getJwtTokenNode(req);
    if (jwtToken) {
      const jwtResult = await validateJwtToken(jwtToken);
      if (jwtResult.valid) {
        return { 
          valid: true, 
          userId: jwtResult.userId, 
          method: "jwt" 
        };
      }
    }
  }

  const token = getBearerTokenNode(req);

  if (!adminKey) {
    return { 
      valid: false, 
      reason: "ADMIN_API_KEY is not configured on the server",
      statusCode: 500
    };
  }

  if (!token) {
    return { 
      valid: false, 
      reason: "Missing Authorization Bearer token",
      statusCode: 401
    };
  }

  try {
    const keyBuffer = Buffer.from(adminKey);
    const tokenBuffer = Buffer.from(token);
    
    if (keyBuffer.length !== tokenBuffer.length || !crypto.timingSafeEqual(new Uint8Array(keyBuffer), new Uint8Array(tokenBuffer))) {
      return { 
        valid: false, 
        reason: "Invalid admin token",
        statusCode: 403
      };
    }
  } catch (_err) {
    return { 
      valid: false, 
      reason: "Internal security comparison failure",
      statusCode: 500
    };
  }

  const userId = req.headers['x-admin-user-id'];
  return { 
    valid: true, 
    userId: Array.isArray(userId) ? userId[0] : userId, 
    method: "api_key" 
  };
}

/**
 * INSTITUTIONAL ADMIN VALIDATION (Edge runtime)
 */
export async function validateAdminAccessEdge(
  req: NextRequest
): Promise<AdminAuthResult> {
  const adminKey = process.env.ADMIN_API_KEY;
  const adminJwtEnabled = process.env.ADMIN_JWT_ENABLED === 'true';
  
  if (process.env.NODE_ENV !== "production" && !adminKey && !adminJwtEnabled) {
    return { valid: true, method: "dev_mode" };
  }

  if (adminJwtEnabled) {
    const jwtToken = getJwtTokenEdge(req);
    if (jwtToken) {
      const jwtResult = await validateJwtToken(jwtToken);
      if (jwtResult.valid) {
        return { 
          valid: true, 
          userId: jwtResult.userId, 
          method: "jwt" 
        };
      }
    }
  }

  const token = getBearerTokenEdge(req);

  if (!adminKey) {
    return { 
      valid: false, 
      reason: "ADMIN_API_KEY is not configured on the server",
      statusCode: 500
    };
  }

  if (!token) {
    return { 
      valid: false, 
      reason: "Missing Authorization Bearer token",
      statusCode: 401
    };
  }

  try {
    const keyBuffer = Buffer.from(adminKey);
    const tokenBuffer = Buffer.from(token);
    
    if (keyBuffer.length !== tokenBuffer.length || !crypto.timingSafeEqual(new Uint8Array(keyBuffer), new Uint8Array(tokenBuffer))) {
      return { 
        valid: false, 
        reason: "Invalid admin token",
        statusCode: 403
      };
    }
  } catch (_err) {
    return { 
      valid: false, 
      reason: "Internal security comparison failure",
      statusCode: 500
    };
  }

  const userId = req.headers.get('x-admin-user-id') || undefined;
  return { valid: true, userId, method: "api_key" };
}

/**
 * Unified admin validation (detects runtime)
 */
export async function validateAdminAccess(
  req: NextApiRequest | NextRequest
): Promise<AdminAuthResult> {
  // Runtime detection
  if ('headers' in req && typeof (req.headers as any).get === 'function') {
    // Edge runtime
    return validateAdminAccessEdge(req as NextRequest);
  } else {
    // Node.js runtime
    return validateAdminAccessNode(req as NextApiRequest);
  }
}

// === UNIVERSAL VALIDATION FUNCTIONS ===

/**
 * Validate IP address against allowlist
 */
export function validateIpAddress(
  ip: string,
  allowlist: string[] = []
): { valid: boolean; reason?: string } {
  if (allowlist.length === 0) {
    return { valid: true };
  }

  if (allowlist.includes(ip)) {
    return { valid: true };
  }

  for (const allowed of allowlist) {
    if (allowed.includes('/')) {
      if (isIpInCidr(ip, allowed)) {
        return { valid: true };
      }
    }
  }

  return { 
    valid: false, 
    reason: `IP address ${ip} is not in the allowlist` 
  };
}

function isIpInCidr(ip: string, cidr: string): boolean {
  try {
    const [range, prefix] = cidr.split('/');
    const mask = ~((1 << (32 - parseInt(prefix))) - 1);
    const ipLong = ipToLong(ip);
    const rangeLong = ipToLong(range);
    return (ipLong & mask) === (rangeLong & mask);
  } catch {
    return false;
  }
}

function ipToLong(ip: string): number {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0);
}

export function validateDateRange(input: {
  since: Date;
  until: Date;
  maxDays: number;
}): { ok: true } | { ok: false; message: string; statusCode?: number } {
  const { since, until, maxDays } = input;

  if (Number.isNaN(since.getTime()) || Number.isNaN(until.getTime())) {
    return { ok: false, message: "Invalid date format provided", statusCode: 400 };
  }
  
  if (since > until) {
    return { ok: false, message: "Temporal paradox: Start date is after end date", statusCode: 400 };
  }
  
  const diffTime = Math.abs(until.getTime() - since.getTime());
  const diffDays = diffTime / (1000 * 60 * 60 * 24);

  if (diffDays > maxDays) {
    return { 
      ok: false, 
      message: `Oversight limit exceeded: max ${maxDays} days per export`, 
      statusCode: 400 
    };
  }

  return { ok: true };
}

export function validateEmail(email: string): { valid: boolean; message?: string } {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || typeof email !== 'string') return { valid: false, message: "Email is required" };
  if (!emailRegex.test(email)) return { valid: false, message: "Invalid email format" };
  if (email.length > 254) return { valid: false, message: "Email is too long" };
  return { valid: true };
}

export function validatePassword(password: string): { valid: boolean; message?: string; score: number } {
  let score = 0;
  const messages: string[] = [];

  if (!password || password.length < 8) {
    messages.push("Password must be at least 8 characters long");
  } else { score += 1; }

  if (!/[A-Z]/.test(password)) {
    messages.push("Password must contain at least one uppercase letter");
  } else { score += 1; }

  if (!/[a-z]/.test(password)) {
    messages.push("Password must contain at least one lowercase letter");
  } else { score += 1; }

  if (!/[0-9]/.test(password)) {
    messages.push("Password must contain at least one number");
  } else { score += 1; }

  if (!/[^A-Za-z0-9]/.test(password)) {
    messages.push("Password must contain at least one special character");
  } else { score += 1; }

  if (password.length > 128) {
    messages.push("Password is too long");
  }

  const commonPasswords = ['password', '123456', 'qwerty', 'admin', 'letmein'];
  if (commonPasswords.includes(password.toLowerCase())) {
    messages.push("Password is too common");
    score = 0;
  }

  return {
    valid: messages.length === 0,
    message: messages.join(', '),
    score
  };
}

export function validateUuid(uuid: string): { valid: boolean; message?: string } {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(uuid)) return { valid: false, message: "Invalid UUID format" };
  return { valid: true };
}

export function validateRequestBody<T>(
  body: any,
  schema: Record<string, (value: any) => { valid: boolean; message?: string }>
): { valid: boolean; data?: T; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const validData: any = {};

  for (const [key, validator] of Object.entries(schema)) {
    const result = validator(body[key]);
    if (!result.valid) {
      errors[key] = result.message || `Invalid value for ${key}`;
    } else {
      validData[key] = body[key];
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    data: Object.keys(errors).length === 0 ? validData as T : undefined,
    errors
  };
}

export function validateFileUpload(
  file: { name: string; size: number; type: string; },
  options: { allowedTypes?: string[]; maxSize?: number; allowedExtensions?: string[]; } = {}
): { valid: boolean; message?: string } {
  const { allowedTypes = [], maxSize = 10 * 1024 * 1024, allowedExtensions = [] } = options;

  if (file.size > maxSize) {
    return { valid: false, message: `File size exceeds limit of ${Math.round(maxSize / (1024 * 1024))}MB` };
  }

  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return { valid: false, message: `File type ${file.type} is not allowed` };
  }

  if (allowedExtensions.length > 0) {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !allowedExtensions.includes(extension)) {
      return { valid: false, message: `File extension .${extension} is not allowed` };
    }
  }

  return { valid: true };
}

// === RUNTIME-SPECIFIC MIDDLEWARE ===

/**
 * Middleware wrapper for validation (Node.js runtime)
 */
export function withValidationNode<T>(
  handler: (req: NextApiRequest, validatedData: T) => Promise<any>,
  schema: Record<string, (value: any) => { valid: boolean; message?: string }>
) {
  return async (req: NextApiRequest) => {
    try {
      const body = req.body;
      
      if (!body) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Missing request body' })
        };
      }

      const validationResult = validateRequestBody<T>(body, schema);
      
      if (!validationResult.valid) {
        return {
          statusCode: 400,
          body: JSON.stringify({ 
            error: 'Validation failed', 
            details: validationResult.errors 
          })
        };
      }

      return handler(req, validationResult.data!);
    } catch (error) {
      console.error('[VALIDATION_ERROR]', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Internal validation error' })
      };
    }
  };
}

/**
 * Middleware wrapper for validation (Edge runtime)
 */
export function withValidationEdge<T>(
  handler: (req: NextRequest, validatedData: T) => Promise<Response>,
  schema: Record<string, (value: any) => { valid: boolean; message?: string }>
) {
  return async (req: NextRequest): Promise<Response> => {
    try {
      const body = await req.json();
      
      const validationResult = validateRequestBody<T>(body, schema);
      
      if (!validationResult.valid) {
        return new Response(
          JSON.stringify({ 
            error: 'Validation failed', 
            details: validationResult.errors 
          }),
          { 
            status: 400, 
            headers: { 'Content-Type': 'application/json' } 
          }
        );
      }

      return handler(req, validationResult.data!);
    } catch (error) {
      console.error('[VALIDATION_ERROR]', error);
      return new Response(
        JSON.stringify({ error: 'Internal validation error' }),
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }
  };
}

/**
 * Universal validation middleware (runtime detection)
 */
export function withValidation<T>(
  handler: (req: NextApiRequest | NextRequest, validatedData: T) => Promise<any>,
  schema: Record<string, (value: any) => { valid: boolean; message?: string }>
) {
  return async (req: NextApiRequest | NextRequest) => {
    if ('headers' in req && typeof (req.headers as any).get === 'function') {
      // Edge runtime
      return withValidationEdge(handler as (req: NextRequest, data: T) => Promise<Response>, schema)(req as NextRequest);
    } else {
      // Node.js runtime
      return withValidationNode(handler as (req: NextApiRequest, data: T) => Promise<any>, schema)(req as NextApiRequest);
    }
  };
}

export default {
  validateAdminAccess,
  validateAdminAccessNode,
  validateAdminAccessEdge,
  validateDateRange,
  validateEmail,
  validatePassword,
  validateUuid,
  validateRequestBody,
  validateFileUpload,
  validateIpAddress,
  withValidation,
  withValidationNode,
  withValidationEdge,
  isInvalidAdmin,
  isValidAdmin,
  isEdgeRuntime,
};
