// lib/input-validator.ts

/**
 * Sanitize user input to prevent XSS and injection attacks
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .slice(0, 1000); // Limit length
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Sanitize object keys and values recursively
 */
export function sanitizeObject(obj: any): any {
  if (typeof obj !== 'object' || obj === null) {
    return typeof obj === 'string' ? sanitizeInput(obj) : obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  const sanitized: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const sanitizedKey = sanitizeInput(key);
    sanitized[sanitizedKey] = sanitizeObject(value);
  }
  return sanitized;
}

/**
 * Check for SQL injection patterns
 */
export function containsSqlInjection(input: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
    /(--|;|\/\*|\*\/)/,
    /(\bOR\b.*=.*)/i,
    /(\bAND\b.*=.*)/i,
  ];
  
  return sqlPatterns.some(pattern => pattern.test(input));
}

/**
 * Check for XSS patterns
 */
export function containsXss(input: string): boolean {
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
  ];
  
  return xssPatterns.some(pattern => pattern.test(input));
}

/**
 * Validate and sanitize API input
 */
export function validateApiInput(data: any, schema: {
  [key: string]: {
    type: 'string' | 'number' | 'boolean' | 'email' | 'url';
    required?: boolean;
    maxLength?: number;
    min?: number;
    max?: number;
  };
}): { valid: boolean; errors: string[]; sanitized: any } {
  const errors: string[] = [];
  const sanitized: any = {};

  for (const [field, rules] of Object.entries(schema)) {
    const value = data?.[field];

    // Check required
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push(`${field} is required`);
      continue;
    }

    if (value === undefined || value === null) {
      continue;
    }

    // Type validation
    switch (rules.type) {
      case 'string':
        if (typeof value !== 'string') {
          errors.push(`${field} must be a string`);
          break;
        }
        const sanitizedStr = sanitizeInput(value);
        if (containsSqlInjection(sanitizedStr) || containsXss(sanitizedStr)) {
          errors.push(`${field} contains invalid characters`);
          break;
        }
        if (rules.maxLength && sanitizedStr.length > rules.maxLength) {
          errors.push(`${field} exceeds maximum length of ${rules.maxLength}`);
          break;
        }
        sanitized[field] = sanitizedStr;
        break;

      case 'email':
        if (!isValidEmail(value)) {
          errors.push(`${field} must be a valid email`);
          break;
        }
        sanitized[field] = value.toLowerCase().trim();
        break;

      case 'url':
        if (!isValidUrl(value)) {
          errors.push(`${field} must be a valid URL`);
          break;
        }
        sanitized[field] = value.trim();
        break;

      case 'number':
        const num = Number(value);
        if (isNaN(num)) {
          errors.push(`${field} must be a number`);
          break;
        }
        if (rules.min !== undefined && num < rules.min) {
          errors.push(`${field} must be at least ${rules.min}`);
          break;
        }
        if (rules.max !== undefined && num > rules.max) {
          errors.push(`${field} must be at most ${rules.max}`);
          break;
        }
        sanitized[field] = num;
        break;

      case 'boolean':
        sanitized[field] = Boolean(value);
        break;
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitized,
  };
}

