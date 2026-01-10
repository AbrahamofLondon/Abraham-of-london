/* ============================================================================
 * ENTERPRISE SECURITY UTILITIES
 * ============================================================================ */

import crypto from "crypto";

/**
 * Hash email for privacy-safe storage
 */
export function hashEmail(email: string): string {
  return crypto
    .createHash("sha256")
    .update(email.trim().toLowerCase())
    .digest("hex");
}

/**
 * Mask email for display purposes
 */
export function maskEmail(email: string): string {
  const parts = email.split("@");
  
  const local = parts[0];
  const domain = parts[1];

  if (!local || !domain) return "****";
  
  if (local.length <= 2) {
    return local.length === 1 
      ? `*@${domain}`
      : `${local.charAt(0)}*@${domain}`;
  }
  
  const visible = local.slice(0, 2);
  const masked = "*".repeat(Math.max(1, local.length - 2));
  return `${visible}${masked}@${domain}`;
}

/**
 * Generate a secure random token
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString("hex");
}

/**
 * Constant-time comparison to prevent timing attacks
 */
export function constantTimeCompare(a: string, b: string): boolean {
  try {
    if (a.length !== b.length) return false;
    
    // FIX: Force cast to 'any' to bypass strict Buffer vs Uint8Array definition mismatches
    return crypto.timingSafeEqual(
      Buffer.from(a, "utf8") as unknown as Uint8Array,
      Buffer.from(b, "utf8") as unknown as Uint8Array
    );
  } catch {
    return false;
  }
}

/**
 * Sanitize user input for safe display
 */
export function sanitizeHtml(input: string): string {
  if (!input) return "";
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

/**
 * Validate URL for safe redirects
 */
export function isValidRedirectUrl(url: string, allowedDomains: string[] = []): boolean {
  if (!url || typeof url !== "string") return false;
  
  if (url.startsWith("/")) {
    return !url.includes("//"); 
  }
  
  try {
    const parsed = new URL(url);
    
    if (allowedDomains.length > 0) {
      return allowedDomains.some(domain => 
        parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`)
      );
    }
    
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Generate CSRF token
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Validate CSRF token (constant-time)
 */
export function validateCsrfToken(token: string, expectedToken: string): boolean {
  return constantTimeCompare(token, expectedToken);
}

/**
 * Encrypt data (simple XOR for demonstration)
 */
export function simpleEncrypt(data: string, key: string): string {
  const encoder = new TextEncoder();
  const dataBytes = encoder.encode(data);
  const keyBytes = encoder.encode(key);
  
  const result = new Uint8Array(dataBytes.length);
  
  // FIX: Provide explicit fallback (|| 0) for array access to satisfy strict null checks
  for (let i = 0; i < dataBytes.length; i++) {
    const d = dataBytes[i] || 0;
    const k = keyBytes[i % keyBytes.length] || 0;
    result[i] = d ^ k;
  }
  
  return Buffer.from(result).toString("base64");
}

/**
 * Decrypt data
 */
export function simpleDecrypt(encrypted: string, key: string): string {
  const dataBytes = Buffer.from(encrypted, "base64") as unknown as Uint8Array;
  const keyBytes = new TextEncoder().encode(key);
  
  const result = new Uint8Array(dataBytes.length);
  
  // FIX: Provide explicit fallback (|| 0) for array access
  for (let i = 0; i < dataBytes.length; i++) {
    const d = dataBytes[i] || 0;
    const k = keyBytes[i % keyBytes.length] || 0;
    result[i] = d ^ k;
  }
  
  return new TextDecoder().decode(result);
}

/**
 * Check if string contains SQL injection patterns
 */
export function containsSqlInjection(input: string): boolean {
  if (!input) return false;
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|EXEC|ALTER|CREATE|TRUNCATE)\b)/i,
    /(\b(OR|AND)\s+\d+=\d+\b)/i,
    /(--|\/\*|\*\/)/,
    /(\b(WAITFOR|DELAY)\b)/i,
    /(\b(SLEEP|BENCHMARK)\b)/i,
  ];
  
  return sqlPatterns.some(pattern => pattern.test(input));
}

/**
 * Check if string contains XSS patterns
 */
export function containsXss(input: string): boolean {
  if (!input) return false;
  const xssPatterns = [
    /<script\b[^>]*>(.*?)<\/script>/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe\b[^>]*>/i,
    /<object\b[^>]*>/i,
    /<embed\b[^>]*>/i,
    /data:/i,
    /vbscript:/i,
  ];
  
  return xssPatterns.some(pattern => pattern.test(input));
}

/**
 * Sanitize and validate user input
 */
export function sanitizeUserInput(input: string): {
  clean: string;
  hasSqlInjection: boolean;
  hasXss: boolean;
  isValid: boolean;
} {
  const hasSql = containsSqlInjection(input);
  const hasXss = containsXss(input);
  
  let clean = input;
  if (hasSql || hasXss) {
    clean = sanitizeHtml(input);
  }
  
  return {
    clean,
    hasSqlInjection: hasSql,
    hasXss,
    isValid: !hasSql && !hasXss,
  };
}

/**
 * Create a secure session identifier
 */
export function createSessionId(): string {
  return `sess_${crypto.randomBytes(16).toString("hex")}_${Date.now().toString(36)}`;
}

/**
 * Validate session ID format
 */
export function isValidSessionId(sessionId: string): boolean {
  return /^sess_[a-f0-9]{32}_[a-z0-9]+$/.test(sessionId);
}

