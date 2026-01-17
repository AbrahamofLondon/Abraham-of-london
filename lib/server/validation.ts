/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextApiRequest } from "next";
import type { NextRequest } from "next/server";
import crypto from "crypto";

// === RUNTIME DETECTION ===
const isEdgeRuntime = typeof EdgeRuntime !== 'undefined' || 
  (typeof process !== 'undefined' && process.env.NEXT_RUNTIME === 'edge');

// === TYPE DEFINITIONS ===

// Admin authentication result types
export type AdminAuthResult =
  | { valid: true; userId?: string; method: "api_key" | "dev_mode" | "jwt" }
  | { valid: false; reason: string; statusCode?: number };

// Validation result types
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

// === TYPE GUARDS ===

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

// === HEADER UTILITIES ===

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
    const cookies = req.cookies;
    return (typeof cookies === 'object' && 'admin_token' in cookies) 
      ? cookies.admin_token 
      : (cookies.access_token || null);
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

// === JWT VALIDATION ===

interface JwtValidationResult {
  valid: boolean;
  userId?: string;
  payload?: any;
}

/**
 * Validate JWT token
 */
async function validateJwtToken(token: string): Promise<JwtValidationResult> {
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

    // Simple payload validation (for demo - in production, use proper JWT library)
    const payload = JSON.parse(
      Buffer.from(payloadB64, 'base64').toString('utf-8')
    );

    // Check expiration
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return { valid: false };
    }

    // Check issuer and audience
    if (payload.iss !== 'admin-api' || payload.aud !== 'inner-circle') {
      return { valid: false };
    }

    return {
      valid: true,
      userId: payload.sub || payload.userId,
      payload
    };
  } catch {
    return { valid: false };
  }
}

// === ADMIN VALIDATION FUNCTIONS ===

/**
 * INSTITUTIONAL ADMIN VALIDATION (Node.js runtime)
 */
export async function validateAdminAccessNode(
  req: NextApiRequest
): Promise<AdminAuthResult> {
  const adminKey = process.env.ADMIN_API_KEY;
  const adminJwtEnabled = process.env.ADMIN_JWT_ENABLED === 'true';
  const nodeEnv = process.env.NODE_ENV;
  
  // Development mode fallback
  if (nodeEnv !== "production" && !adminKey && !adminJwtEnabled) {
    return { valid: true, method: "dev_mode" };
  }

  // JWT validation if enabled
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

  // API key validation
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
    const keyBuffer = Buffer.from(adminKey, 'utf-8');
    const tokenBuffer = Buffer.from(token, 'utf-8');
    
    if (keyBuffer.length !== tokenBuffer.length) {
      return { 
        valid: false, 
        reason: "Invalid admin token",
        statusCode: 403
      };
    }
    
    // Use timing-safe comparison
    if (!crypto.timingSafeEqual(keyBuffer, tokenBuffer)) {
      return { 
        valid: false, 
        reason: "Invalid admin token",
        statusCode: 403
      };
    }
  } catch (error) {
    console.error('Token comparison error:', error);
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
  const nodeEnv = process.env.NODE_ENV;
  
  // Development mode fallback
  if (nodeEnv !== "production" && !adminKey && !adminJwtEnabled) {
    return { valid: true, method: "dev_mode" };
  }

  // JWT validation if enabled
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

  // API key validation
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
    const keyBuffer = Buffer.from(adminKey, 'utf-8');
    const tokenBuffer = Buffer.from(token, 'utf-8');
    
    if (keyBuffer.length !== tokenBuffer.length) {
      return { 
        valid: false, 
        reason: "Invalid admin token",
        statusCode: 403
      };
    }
    
    // Use timing-safe comparison
    if (!crypto.timingSafeEqual(keyBuffer, tokenBuffer)) {
      return { 
        valid: false, 
        reason: "Invalid admin token",
        statusCode: 403
      };
    }
  } catch (error) {
    console.error('Token comparison error:', error);
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

// === FIELD VALIDATION FUNCTIONS ===

/**
 * Validate email address
 */
export function validateEmail(email: string): ValidationResult {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!email || typeof email !== 'string') {
    return { 
      valid: false, 
      message: "Email is required" 
    };
  }
  
  if (email.length > 254) {
    return { 
      valid: false, 
      message: "Email is too long (max 254 characters)" 
    };
  }
  
  if (!emailRegex.test(email)) {
    return { 
      valid: false, 
      message: "Invalid email format" 
    };
  }
  
  // Additional email validation
  const [localPart, domain] = email.split('@');
  if (localPart.length > 64) {
    return { 
      valid: false, 
      message: "Email local part is too long" 
    };
  }
  
  if (domain.length > 255) {
    return { 
      valid: false, 
      message: "Email domain is too long" 
    };
  }
  
  return { valid: true };
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): ValidationResult<{ score: number }> {
  let score = 0;
  const messages: string[] = [];

  // Length check
  if (!password || password.length < 8) {
    messages.push("Password must be at least 8 characters long");
  } else if (password.length >= 12) {
    score += 2;
  } else {
    score += 1;
  }

  // Complexity checks
  if (/[A-Z]/.test(password)) score += 1;
  else messages.push("Password should contain at least one uppercase letter");

  if (/[a-z]/.test(password)) score += 1;
  else messages.push("Password should contain at least one lowercase letter");

  if (/[0-9]/.test(password)) score += 1;
  else messages.push("Password should contain at least one number");

  if (/[^A-Za-z0-9]/.test(password)) score += 2;
  else messages.push("Password should contain at least one special character");

  // Length limit
  if (password.length > 128) {
    messages.push("Password is too long (max 128 characters)");
  }

  // Common passwords check
  const commonPasswords = [
    'password', '123456', 'qwerty', 'admin', 'letmein', 
    'welcome', 'monkey', 'sunshine', 'password1', '123456789'
  ];
  
  if (commonPasswords.includes(password.toLowerCase())) {
    messages.push("Password is too common and easily guessable");
    score = 0;
  }

  // Sequential characters check
  if (/(.)\1{2,}/.test(password)) {
    messages.push("Password contains repeated characters");
    score = Math.max(0, score - 1);
  }

  // Score rating
  let rating = 'weak';
  if (score >= 7) rating = 'strong';
  else if (score >= 4) rating = 'medium';

  return {
    valid: messages.length === 0,
    message: messages.length > 0 ? messages.join('. ') : `Password strength: ${rating}`,
    data: { score }
  };
}

/**
 * Validate UUID format
 */
export function validateUuid(uuid: string): ValidationResult {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  if (!uuid || typeof uuid !== 'string') {
    return { 
      valid: false, 
      message: "UUID is required" 
    };
  }
  
  if (!uuidRegex.test(uuid)) {
    return { 
      valid: false, 
      message: "Invalid UUID format" 
    };
  }
  
  return { valid: true };
}

/**
 * Validate phone number (basic international format)
 */
export function validatePhone(phone: string): ValidationResult {
  if (!phone || typeof phone !== 'string') {
    return { 
      valid: false, 
      message: "Phone number is required" 
    };
  }

  // Remove all non-digit characters except plus sign
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // Basic validation: at least 8 digits, starts with + or digit
  const phoneRegex = /^(\+\d{1,3})?\d{8,15}$/;
  
  if (!phoneRegex.test(cleaned)) {
    return { 
      valid: false, 
      message: "Invalid phone number format" 
    };
  }
  
  return { valid: true };
}

/**
 * Validate URL format
 */
export function validateUrl(url: string): ValidationResult {
  try {
    if (!url || typeof url !== 'string') {
      return { 
        valid: false, 
        message: "URL is required" 
      };
    }
    
    // Add protocol if missing
    let urlToCheck = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      urlToCheck = 'https://' + url;
    }
    
    const urlObj = new URL(urlToCheck);
    
    // Validate protocol
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { 
        valid: false, 
        message: "URL must use http or https protocol" 
      };
    }
    
    // Validate hostname
    if (!urlObj.hostname) {
      return { 
        valid: false, 
        message: "URL must have a valid hostname" 
      };
    }
    
    return { valid: true };
  } catch {
    return { 
      valid: false, 
      message: "Invalid URL format" 
    };
  }
}

/**
 * Validate file upload
 */
export function validateFileUpload(
  file: { name: string; size: number; type: string; },
  options: FileValidationOptions = {}
): ValidationResult {
  const { 
    allowedTypes = [], 
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedExtensions = [],
    required = true
  } = options;

  if (!file && required) {
    return { 
      valid: false, 
      message: "File is required" 
    };
  }

  if (!file) {
    return { valid: true };
  }

  // Size validation
  if (file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024));
    return { 
      valid: false, 
      message: `File size exceeds limit of ${maxSizeMB}MB` 
    };
  }

  // Minimum size (optional)
  if (file.size === 0) {
    return { 
      valid: false, 
      message: "File is empty" 
    };
  }

  // Type validation
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return { 
      valid: false, 
      message: `File type ${file.type} is not allowed` 
    };
  }

  // Extension validation
  if (allowedExtensions.length > 0) {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !allowedExtensions.includes(extension)) {
      const allowedList = allowedExtensions.map(ext => `.${ext}`).join(', ');
      return { 
        valid: false, 
        message: `File extension .${extension} is not allowed. Allowed: ${allowedList}` 
      };
    }
  }

  // Filename validation
  if (file.name.length > 255) {
    return { 
      valid: false, 
      message: "Filename is too long (max 255 characters)" 
    };
  }

  // Check for null bytes in filename (security)
  if (file.name.includes('\0')) {
    return { 
      valid: false, 
      message: "Invalid filename" 
    };
  }

  return { valid: true };
}

// === IP ADDRESS VALIDATION ===

/**
 * Validate IP address against allowlist
 */
export function validateIpAddress(
  ip: string,
  allowlist: string[] = []
): ValidationResult {
  if (!ip || typeof ip !== 'string') {
    return { 
      valid: false, 
      message: "IP address is required" 
    };
  }

  // Basic IP validation
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
  
  if (!ipv4Regex.test(ip) && !ipv6Regex.test(ip)) {
    return { 
      valid: false, 
      message: "Invalid IP address format" 
    };
  }

  // If no allowlist, all IPs are valid
  if (allowlist.length === 0) {
    return { valid: true };
  }

  // Check against allowlist
  if (allowlist.includes(ip)) {
    return { valid: true };
  }

  // Check CIDR ranges
  for (const allowed of allowlist) {
    if (allowed.includes('/')) {
      if (isIpInCidr(ip, allowed)) {
        return { valid: true };
      }
    }
  }

  return { 
    valid: false, 
    message: `IP address ${ip} is not in the allowlist` 
  };
}

/**
 * Check if IP is in CIDR range
 */
function isIpInCidr(ip: string, cidr: string): boolean {
  try {
    const [range, prefixStr] = cidr.split('/');
    const prefix = parseInt(prefixStr, 10);
    
    if (isNaN(prefix) || prefix < 0 || prefix > 32) {
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

/**
 * Convert IP to long integer
 */
function ipToLong(ip: string): number {
  const parts = ip.split('.').map(part => parseInt(part, 10));
  
  if (parts.length !== 4 || parts.some(isNaN)) {
    throw new Error('Invalid IPv4 address');
  }
  
  return ((parts[0] << 24) + (parts[1] << 16) + (parts[2] << 8) + parts[3]) >>> 0;
}

// === REQUEST BODY VALIDATION ===

/**
 * Validate request body against schema
 */
export function validateRequestBody<T = any>(
  body: any,
  schema: Record<string, (value: any) => ValidationResult>
): ValidationResult<T> {
  const errors: Record<string, string> = {};
  const validData: any = {};

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
      message: 'Validation failed'
    };
  }

  return {
    valid: true,
    data: validData as T
  };
}

// === COMMON VALIDATOR FUNCTIONS ===

/**
 * Create required field validator
 */
export function requiredField(fieldName?: string) {
  return (value: any): ValidationResult => {
    if (value === undefined || value === null || value === '') {
      return {
        valid: false,
        message: `${fieldName || 'Field'} is required`
      };
    }
    return { valid: true };
  };
}

/**
 * Create string length validator
 */
export function stringLength(min: number, max?: number, fieldName?: string) {
  return (value: any): ValidationResult => {
    if (typeof value !== 'string') {
      return {
        valid: false,
        message: `${fieldName || 'Field'} must be a string`
      };
    }

    if (value.length < min) {
      return {
        valid: false,
        message: `${fieldName || 'Field'} must be at least ${min} characters`
      };
    }

    if (max && value.length > max) {
      return {
        valid: false,
        message: `${fieldName || 'Field'} must be at most ${max} characters`
      };
    }

    return { valid: true };
  };
}

/**
 * Create number range validator
 */
export function numberRange(min: number, max?: number, fieldName?: string) {
  return (value: any): ValidationResult => {
    const num = Number(value);
    
    if (isNaN(num)) {
      return {
        valid: false,
        message: `${fieldName || 'Field'} must be a number`
      };
    }

    if (num < min) {
      return {
        valid: false,
        message: `${fieldName || 'Field'} must be at least ${min}`
      };
    }

    if (max && num > max) {
      return {
        valid: false,
        message: `${fieldName || 'Field'} must be at most ${max}`
      };
    }

    return { valid: true };
  };
}

/**
 * Create regex pattern validator
 */
export function patternValidator(regex: RegExp, message?: string) {
  return (value: any): ValidationResult => {
    if (typeof value !== 'string') {
      return {
        valid: false,
        message: 'Value must be a string'
      };
    }

    if (!regex.test(value)) {
      return {
        valid: false,
        message: message || 'Value does not match required pattern'
      };
    }

    return { valid: true };
  };
}

// === MIDDLEWARE FUNCTIONS ===

/**
 * Validation middleware (Node.js runtime)
 */
export function withValidationNode<T>(
  handler: (req: NextApiRequest, validatedData: T) => Promise<any>,
  schema: Record<string, (value: any) => ValidationResult>
) {
  return async (req: NextApiRequest) => {
    try {
      let body: any;
      
      if (req.method === 'GET') {
        body = req.query;
      } else {
        // Parse JSON body
        if (typeof req.body === 'string') {
          try {
            body = JSON.parse(req.body);
          } catch {
            body = {};
          }
        } else {
          body = req.body || {};
        }
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

      return await handler(req, validationResult.data!);
    } catch (error) {
      console.error('[VALIDATION_ERROR]', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: 'Internal validation error',
          message: error instanceof Error ? error.message : 'Unknown error'
        })
      };
    }
  };
}

/**
 * Validation middleware (Edge runtime)
 */
export function withValidationEdge<T>(
  handler: (req: NextRequest, validatedData: T) => Promise<Response>,
  schema: Record<string, (value: any) => ValidationResult>
) {
  return async (req: NextRequest): Promise<Response> => {
    try {
      let body: any = {};
      
      if (req.method !== 'GET') {
        try {
          body = await req.json();
        } catch {
          // If no JSON body, try form data
          const formData = await req.formData();
          if (formData) {
            body = Object.fromEntries(formData);
          }
        }
      }

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

      return await handler(req, validationResult.data!);
    } catch (error) {
      console.error('[VALIDATION_ERROR]', error);
      return new Response(
        JSON.stringify({ 
          error: 'Internal validation error',
          message: error instanceof Error ? error.message : 'Unknown error'
        }),
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
  schema: Record<string, (value: any) => ValidationResult>
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

// === EXPORT ALL FUNCTIONS ===

const validationApi = {
  // Admin validation
  validateAdminAccess,
  validateAdminAccessNode,
  validateAdminAccessEdge,
  
  // Type guards
  isInvalidAdmin,
  isValidAdmin,
  
  // Field validators
  validateEmail,
  validatePassword,
  validateUuid,
  validatePhone,
  validateUrl,
  validateFileUpload,
  validateIpAddress,
  
  // Request validation
  validateRequestBody,
  
  // Validator creators
  requiredField,
  stringLength,
  numberRange,
  patternValidator,
  
  // Middleware
  withValidation,
  withValidationNode,
  withValidationEdge,
  
  // Runtime detection
  isEdgeRuntime,
  
  // Types
  type: {
    AdminAuthResult: {} as AdminAuthResult,
    ValidationResult: {} as ValidationResult,
    FileValidationOptions: {} as FileValidationOptions
  }
};

export default validationApi;