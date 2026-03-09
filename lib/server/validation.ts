/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextApiRequest } from "next";
import type { NextRequest } from "next/server";

// -----------------------------------------------------------------------------
// RUNTIME DETECTION
// -----------------------------------------------------------------------------

type GlobalWithEdgeRuntime = typeof globalThis & {
  EdgeRuntime?: string;
};

const globalWithEdgeRuntime = globalThis as GlobalWithEdgeRuntime;

export const isEdgeRuntime =
  typeof globalWithEdgeRuntime.EdgeRuntime !== "undefined" ||
  (typeof process !== "undefined" && process.env.NEXT_RUNTIME === "edge");

// -----------------------------------------------------------------------------
// TYPES
// -----------------------------------------------------------------------------

export type AdminAuthResult =
  | { valid: true; userId?: string; method: "api_key" | "dev_mode" | "jwt" }
  | { valid: false; reason: string; statusCode?: number };

export interface ValidationResult<T = any> {
  valid: boolean;
  data?: T;
  errors?: Record<string, string>;
  message?: string;
  statusCode?: number;
}

export interface FileValidationOptions {
  allowedTypes?: string[];
  maxSize?: number;
  allowedExtensions?: string[];
  required?: boolean;
}

// -----------------------------------------------------------------------------
// TYPE GUARDS
// -----------------------------------------------------------------------------

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

// -----------------------------------------------------------------------------
// UNIVERSAL HELPERS
// -----------------------------------------------------------------------------

function isEdgeRequest(req: NextApiRequest | NextRequest): req is NextRequest {
  return "headers" in req && typeof (req.headers as Headers).get === "function";
}

function base64UrlToBase64(input: string): string {
  return input.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(input.length / 4) * 4, "=");
}

function decodeBase64ToUtf8(input: string): string {
  const normalized = base64UrlToBase64(input);

  if (typeof atob === "function") {
    const binary = atob(normalized);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }

  // Node fallback
  return Buffer.from(normalized, "base64").toString("utf-8");
}

async function timingSafeCompare(left: string, right: string): Promise<boolean> {
  if (left.length !== right.length) return false;

  // Prefer Node timingSafeEqual when available
  if (!isEdgeRuntime) {
    try {
      const cryptoMod = await import("crypto");
      const leftBuf = Buffer.from(left, "utf-8");
      const rightBuf = Buffer.from(right, "utf-8");

      if (leftBuf.length !== rightBuf.length) return false;
      return cryptoMod.timingSafeEqual(leftBuf, rightBuf);
    } catch {
      // fall through to manual comparison
    }
  }

  // Universal fallback
  let mismatch = 0;
  for (let i = 0; i < left.length; i += 1) {
    mismatch |= left.charCodeAt(i) ^ right.charCodeAt(i);
  }
  return mismatch === 0;
}

// -----------------------------------------------------------------------------
// HEADER UTILITIES
// -----------------------------------------------------------------------------

function getBearerTokenNode(req: NextApiRequest): string | null {
  const authHeader = req.headers?.authorization;
  if (typeof authHeader !== "string") return null;

  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

function getBearerTokenEdge(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization");
  if (typeof authHeader !== "string") return null;

  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

function getJwtTokenNode(req: NextApiRequest): string | null {
  const bearerToken = getBearerTokenNode(req);
  if (bearerToken && bearerToken.includes(".")) {
    return bearerToken;
  }

  const cookies = req.cookies;
  if (cookies && typeof cookies === "object") {
    const adminToken = "admin_token" in cookies ? cookies.admin_token : undefined;
    const accessToken = "access_token" in cookies ? cookies.access_token : undefined;
    return adminToken || accessToken || null;
  }

  return null;
}

function getJwtTokenEdge(req: NextRequest): string | null {
  const bearerToken = getBearerTokenEdge(req);
  if (bearerToken && bearerToken.includes(".")) {
    return bearerToken;
  }

  const adminCookie = req.cookies.get("admin_token");
  const accessCookie = req.cookies.get("access_token");
  return adminCookie?.value || accessCookie?.value || null;
}

// -----------------------------------------------------------------------------
// JWT VALIDATION
// -----------------------------------------------------------------------------

interface JwtValidationResult {
  valid: boolean;
  userId?: string;
  payload?: Record<string, unknown>;
}

async function validateJwtToken(token: string): Promise<JwtValidationResult> {
  try {
    const adminJwtSecret = process.env.ADMIN_JWT_SECRET;
    if (!adminJwtSecret) {
      return { valid: false };
    }

    const parts = token.split(".");
    if (parts.length !== 3) {
      return { valid: false };
    }

    const [, payloadB64] = parts;
    if (!payloadB64) {
      return { valid: false };
    }

    const decodedPayload = decodeBase64ToUtf8(payloadB64);
    const payload = JSON.parse(decodedPayload) as Record<string, unknown>;

    const exp = typeof payload.exp === "number" ? payload.exp : undefined;
    if (exp && Date.now() >= exp * 1000) {
      return { valid: false };
    }

    if (payload.iss !== "admin-api" || payload.aud !== "inner-circle") {
      return { valid: false };
    }

    const userId =
      typeof payload.sub === "string"
        ? payload.sub
        : typeof payload.userId === "string"
        ? payload.userId
        : undefined;

    return {
      valid: true,
      userId,
      payload,
    };
  } catch {
    return { valid: false };
  }
}

// -----------------------------------------------------------------------------
// ADMIN VALIDATION
// -----------------------------------------------------------------------------

export async function validateAdminAccessNode(
  req: NextApiRequest
): Promise<AdminAuthResult> {
  const adminKey = process.env.ADMIN_API_KEY;
  const adminJwtEnabled = process.env.ADMIN_JWT_ENABLED === "true";
  const nodeEnv = process.env.NODE_ENV;

  if (nodeEnv !== "production" && !adminKey && !adminJwtEnabled) {
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
          method: "jwt",
        };
      }
    }
  }

  const token = getBearerTokenNode(req);

  if (!adminKey) {
    return {
      valid: false,
      reason: "ADMIN_API_KEY is not configured on the server",
      statusCode: 500,
    };
  }

  if (!token) {
    return {
      valid: false,
      reason: "Missing Authorization Bearer token",
      statusCode: 401,
    };
  }

  try {
    const isMatch = await timingSafeCompare(adminKey, token);

    if (!isMatch) {
      return {
        valid: false,
        reason: "Invalid admin token",
        statusCode: 403,
      };
    }
  } catch (error) {
    console.error("[ADMIN_VALIDATION_NODE_ERROR]", error);
    return {
      valid: false,
      reason: "Internal security comparison failure",
      statusCode: 500,
    };
  }

  const userIdHeader = req.headers["x-admin-user-id"];
  return {
    valid: true,
    userId: Array.isArray(userIdHeader) ? userIdHeader[0] : userIdHeader,
    method: "api_key",
  };
}

export async function validateAdminAccessEdge(
  req: NextRequest
): Promise<AdminAuthResult> {
  const adminKey = process.env.ADMIN_API_KEY;
  const adminJwtEnabled = process.env.ADMIN_JWT_ENABLED === "true";
  const nodeEnv = process.env.NODE_ENV;

  if (nodeEnv !== "production" && !adminKey && !adminJwtEnabled) {
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
          method: "jwt",
        };
      }
    }
  }

  const token = getBearerTokenEdge(req);

  if (!adminKey) {
    return {
      valid: false,
      reason: "ADMIN_API_KEY is not configured on the server",
      statusCode: 500,
    };
  }

  if (!token) {
    return {
      valid: false,
      reason: "Missing Authorization Bearer token",
      statusCode: 401,
    };
  }

  try {
    const isMatch = await timingSafeCompare(adminKey, token);

    if (!isMatch) {
      return {
        valid: false,
        reason: "Invalid admin token",
        statusCode: 403,
      };
    }
  } catch (error) {
    console.error("[ADMIN_VALIDATION_EDGE_ERROR]", error);
    return {
      valid: false,
      reason: "Internal security comparison failure",
      statusCode: 500,
    };
  }

  const userId = req.headers.get("x-admin-user-id") || undefined;
  return { valid: true, userId, method: "api_key" };
}

export async function validateAdminAccess(
  req: NextApiRequest | NextRequest
): Promise<AdminAuthResult> {
  return isEdgeRequest(req)
    ? validateAdminAccessEdge(req)
    : validateAdminAccessNode(req);
}

// -----------------------------------------------------------------------------
// FIELD VALIDATION
// -----------------------------------------------------------------------------

export function validateEmail(email: string): ValidationResult {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email || typeof email !== "string") {
    return { valid: false, message: "Email is required" };
  }

  if (email.length > 254) {
    return { valid: false, message: "Email is too long (max 254 characters)" };
  }

  if (!emailRegex.test(email)) {
    return { valid: false, message: "Invalid email format" };
  }

  const [localPart, domain] = email.split("@");
  if (!localPart || !domain) {
    return { valid: false, message: "Invalid email format" };
  }

  if (localPart.length > 64) {
    return { valid: false, message: "Email local part is too long" };
  }

  if (domain.length > 255) {
    return { valid: false, message: "Email domain is too long" };
  }

  return { valid: true };
}

export function validatePassword(
  password: string
): ValidationResult<{ score: number }> {
  let score = 0;
  const messages: string[] = [];

  if (!password || password.length < 8) {
    messages.push("Password must be at least 8 characters long");
  } else if (password.length >= 12) {
    score += 2;
  } else {
    score += 1;
  }

  if (/[A-Z]/.test(password)) score += 1;
  else messages.push("Password should contain at least one uppercase letter");

  if (/[a-z]/.test(password)) score += 1;
  else messages.push("Password should contain at least one lowercase letter");

  if (/[0-9]/.test(password)) score += 1;
  else messages.push("Password should contain at least one number");

  if (/[^A-Za-z0-9]/.test(password)) score += 2;
  else messages.push("Password should contain at least one special character");

  if (password.length > 128) {
    messages.push("Password is too long (max 128 characters)");
  }

  const commonPasswords = [
    "password",
    "123456",
    "qwerty",
    "admin",
    "letmein",
    "welcome",
    "monkey",
    "sunshine",
    "password1",
    "123456789",
  ];

  if (commonPasswords.includes(password.toLowerCase())) {
    messages.push("Password is too common and easily guessable");
    score = 0;
  }

  if (/(.)\1{2,}/.test(password)) {
    messages.push("Password contains repeated characters");
    score = Math.max(0, score - 1);
  }

  let rating = "weak";
  if (score >= 7) rating = "strong";
  else if (score >= 4) rating = "medium";

  return {
    valid: messages.length === 0,
    message:
      messages.length > 0
        ? messages.join(". ")
        : `Password strength: ${rating}`,
    data: { score },
  };
}

export function validateUuid(uuid: string): ValidationResult {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuid || typeof uuid !== "string") {
    return { valid: false, message: "UUID is required" };
  }

  if (!uuidRegex.test(uuid)) {
    return { valid: false, message: "Invalid UUID format" };
  }

  return { valid: true };
}

export function validatePhone(phone: string): ValidationResult {
  if (!phone || typeof phone !== "string") {
    return { valid: false, message: "Phone number is required" };
  }

  const cleaned = phone.replace(/[^\d+]/g, "");
  const phoneRegex = /^(\+\d{1,3})?\d{8,15}$/;

  if (!phoneRegex.test(cleaned)) {
    return { valid: false, message: "Invalid phone number format" };
  }

  return { valid: true };
}

export function validateUrl(url: string): ValidationResult {
  try {
    if (!url || typeof url !== "string") {
      return { valid: false, message: "URL is required" };
    }

    let urlToCheck = url;
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      urlToCheck = `https://${url}`;
    }

    const urlObj = new URL(urlToCheck);

    if (!["http:", "https:"].includes(urlObj.protocol)) {
      return {
        valid: false,
        message: "URL must use http or https protocol",
      };
    }

    if (!urlObj.hostname) {
      return { valid: false, message: "URL must have a valid hostname" };
    }

    return { valid: true };
  } catch {
    return { valid: false, message: "Invalid URL format" };
  }
}

export function validateFileUpload(
  file: { name: string; size: number; type: string } | null | undefined,
  options: FileValidationOptions = {}
): ValidationResult {
  const {
    allowedTypes = [],
    maxSize = 10 * 1024 * 1024,
    allowedExtensions = [],
    required = true,
  } = options;

  if (!file && required) {
    return { valid: false, message: "File is required" };
  }

  if (!file) {
    return { valid: true };
  }

  if (file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024));
    return {
      valid: false,
      message: `File size exceeds limit of ${maxSizeMB}MB`,
    };
  }

  if (file.size === 0) {
    return { valid: false, message: "File is empty" };
  }

  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return {
      valid: false,
      message: `File type ${file.type} is not allowed`,
    };
  }

  if (allowedExtensions.length > 0) {
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!extension || !allowedExtensions.includes(extension)) {
      const allowedList = allowedExtensions.map((ext) => `.${ext}`).join(", ");
      return {
        valid: false,
        message: `File extension .${extension ?? "unknown"} is not allowed. Allowed: ${allowedList}`,
      };
    }
  }

  if (file.name.length > 255) {
    return {
      valid: false,
      message: "Filename is too long (max 255 characters)",
    };
  }

  if (file.name.includes("\0")) {
    return { valid: false, message: "Invalid filename" };
  }

  return { valid: true };
}

// -----------------------------------------------------------------------------
// IP VALIDATION
// -----------------------------------------------------------------------------

export function validateIpAddress(
  ip: string,
  allowlist: string[] = []
): ValidationResult {
  if (!ip || typeof ip !== "string") {
    return { valid: false, message: "IP address is required" };
  }

  const ipv4Regex =
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  const ipv6Regex =
    /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;

  if (!ipv4Regex.test(ip) && !ipv6Regex.test(ip)) {
    return { valid: false, message: "Invalid IP address format" };
  }

  if (allowlist.length === 0) {
    return { valid: true };
  }

  if (allowlist.includes(ip)) {
    return { valid: true };
  }

  for (const allowed of allowlist) {
    if (allowed.includes("/") && isIpInCidr(ip, allowed)) {
      return { valid: true };
    }
  }

  return {
    valid: false,
    message: `IP address ${ip} is not in the allowlist`,
  };
}

function isIpInCidr(ip: string, cidr: string): boolean {
  try {
    const [range, prefixStr] = cidr.split("/");
    const prefix = Number.parseInt(prefixStr ?? "", 10);

    if (!range || Number.isNaN(prefix) || prefix < 0 || prefix > 32) {
      return false;
    }

    const ipLong = ipToLong(ip);
    const rangeLong = ipToLong(range);
    const mask = ~((1 << (32 - prefix)) - 1);

    return (ipLong & mask) === (rangeLong & mask);
  } catch {
    return false;
  }
}

function ipToLong(ip: string): number {
  const parts = ip.split(".").map((part) => Number.parseInt(part, 10));

  if (parts.length !== 4 || parts.some(Number.isNaN)) {
    throw new Error("Invalid IPv4 address");
  }

  return (
    ((parts[0] ?? 0) << 24) +
    ((parts[1] ?? 0) << 16) +
    ((parts[2] ?? 0) << 8) +
    (parts[3] ?? 0)
  ) >>> 0;
}

// -----------------------------------------------------------------------------
// REQUEST BODY VALIDATION
// -----------------------------------------------------------------------------

export function validateRequestBody<T = any>(
  body: Record<string, unknown> | null | undefined,
  schema: Record<string, (value: any) => ValidationResult>
): ValidationResult<T> {
  const errors: Record<string, string> = {};
  const validData: Record<string, unknown> = {};

  for (const [key, validator] of Object.entries(schema)) {
    const value = body ? body[key] : undefined;
    const result = validator(value);

    if (!result.valid) {
      errors[key] = result.message || `Invalid value for ${key}`;
    } else {
      validData[key] = value;
    }
  }

  if (Object.keys(errors).length > 0) {
    return {
      valid: false,
      errors,
      message: "Validation failed",
    };
  }

  return {
    valid: true,
    data: validData as T,
  };
}

// -----------------------------------------------------------------------------
// VALIDATOR FACTORIES
// -----------------------------------------------------------------------------

export function requiredField(fieldName?: string) {
  return (value: any): ValidationResult => {
    if (value === undefined || value === null || value === "") {
      return {
        valid: false,
        message: `${fieldName || "Field"} is required`,
      };
    }
    return { valid: true };
  };
}

export function stringLength(min: number, max?: number, fieldName?: string) {
  return (value: any): ValidationResult => {
    if (typeof value !== "string") {
      return {
        valid: false,
        message: `${fieldName || "Field"} must be a string`,
      };
    }

    if (value.length < min) {
      return {
        valid: false,
        message: `${fieldName || "Field"} must be at least ${min} characters`,
      };
    }

    if (typeof max === "number" && value.length > max) {
      return {
        valid: false,
        message: `${fieldName || "Field"} must be at most ${max} characters`,
      };
    }

    return { valid: true };
  };
}

export function numberRange(min: number, max?: number, fieldName?: string) {
  return (value: any): ValidationResult => {
    const num = Number(value);

    if (Number.isNaN(num)) {
      return {
        valid: false,
        message: `${fieldName || "Field"} must be a number`,
      };
    }

    if (num < min) {
      return {
        valid: false,
        message: `${fieldName || "Field"} must be at least ${min}`,
      };
    }

    if (typeof max === "number" && num > max) {
      return {
        valid: false,
        message: `${fieldName || "Field"} must be at most ${max}`,
      };
    }

    return { valid: true };
  };
}

export function patternValidator(regex: RegExp, message?: string) {
  return (value: any): ValidationResult => {
    if (typeof value !== "string") {
      return {
        valid: false,
        message: "Value must be a string",
      };
    }

    if (!regex.test(value)) {
      return {
        valid: false,
        message: message || "Value does not match required pattern",
      };
    }

    return { valid: true };
  };
}

// -----------------------------------------------------------------------------
// MIDDLEWARE
// -----------------------------------------------------------------------------

export function withValidationNode<T>(
  handler: (req: NextApiRequest, validatedData: T) => Promise<any>,
  schema: Record<string, (value: any) => ValidationResult>
) {
  return async (req: NextApiRequest) => {
    try {
      let body: Record<string, unknown>;

      if (req.method === "GET") {
        body = req.query as Record<string, unknown>;
      } else if (typeof req.body === "string") {
        try {
          body = JSON.parse(req.body) as Record<string, unknown>;
        } catch {
          body = {};
        }
      } else {
        body = (req.body || {}) as Record<string, unknown>;
      }

      const validationResult = validateRequestBody<T>(body, schema);

      if (!validationResult.valid) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            error: "Validation failed",
            details: validationResult.errors,
          }),
        };
      }

      return handler(req, validationResult.data as T);
    } catch (error) {
      console.error("[VALIDATION_ERROR]", error);
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Internal validation error",
          message: error instanceof Error ? error.message : "Unknown error",
        }),
      };
    }
  };
}

export function withValidationEdge<T>(
  handler: (req: NextRequest, validatedData: T) => Promise<Response>,
  schema: Record<string, (value: any) => ValidationResult>
) {
  return async (req: NextRequest): Promise<Response> => {
    try {
      let body: Record<string, unknown> = {};

      if (req.method !== "GET") {
        try {
          body = (await req.json()) as Record<string, unknown>;
        } catch {
          try {
            const formData = await req.formData();
            body = Object.fromEntries(formData.entries());
          } catch {
            body = {};
          }
        }
      }

      const validationResult = validateRequestBody<T>(body, schema);

      if (!validationResult.valid) {
        return new Response(
          JSON.stringify({
            error: "Validation failed",
            details: validationResult.errors,
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      return handler(req, validationResult.data as T);
    } catch (error) {
      console.error("[VALIDATION_ERROR]", error);
      return new Response(
        JSON.stringify({
          error: "Internal validation error",
          message: error instanceof Error ? error.message : "Unknown error",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  };
}

export function withValidation<T>(
  handler: (req: NextApiRequest | NextRequest, validatedData: T) => Promise<any>,
  schema: Record<string, (value: any) => ValidationResult>
) {
  return async (req: NextApiRequest | NextRequest) => {
    if (isEdgeRequest(req)) {
      return withValidationEdge(
        handler as (req: NextRequest, data: T) => Promise<Response>,
        schema
      )(req);
    }

    return withValidationNode(
      handler as (req: NextApiRequest, data: T) => Promise<any>,
      schema
    )(req);
  };
}

// -----------------------------------------------------------------------------
// EXTRA UTIL
// -----------------------------------------------------------------------------

export const validateDateRange = (
  start: Date | string,
  end: Date | string
): boolean => {
  if (!start || !end) return false;

  const startDate = start instanceof Date ? start : new Date(start);
  const endDate = end instanceof Date ? end : new Date(end);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return false;
  }

  return startDate <= endDate;
};

// -----------------------------------------------------------------------------
// DEFAULT EXPORT
// -----------------------------------------------------------------------------

const validationApi = {
  validateAdminAccess,
  validateAdminAccessNode,
  validateAdminAccessEdge,
  isInvalidAdmin,
  isValidAdmin,
  validateEmail,
  validatePassword,
  validateUuid,
  validatePhone,
  validateUrl,
  validateFileUpload,
  validateIpAddress,
  validateRequestBody,
  requiredField,
  stringLength,
  numberRange,
  patternValidator,
  withValidation,
  withValidationNode,
  withValidationEdge,
  isEdgeRuntime,
  validateDateRange,
  type: {
    AdminAuthResult: {} as AdminAuthResult,
    ValidationResult: {} as ValidationResult,
    FileValidationOptions: {} as FileValidationOptions,
  },
};

export default validationApi;