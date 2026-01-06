// lib/apiGuard.ts
/* eslint-disable no-console */

import type { NextApiRequest, NextApiResponse } from "next";
import {
  verifyRecaptchaDetailed,
  type RecaptchaVerificationResult,
} from "@/lib/recaptchaServer";
import { getClientIp } from "@/lib/server/ip";

/* =============================================================================
   TYPES
   ============================================================================= */

export type ApiGuardFailure = {
  ok: false;
  status: number;
  error: string;
  code:
    | "ERR_METHOD"
    | "ERR_JSON"
    | "ERR_BODY_TOO_LARGE"
    | "ERR_HONEYPOT"
    | "ERR_MISSING_TOKEN"
    | "ERR_RECAPTCHA_FAILED";
  recaptcha?: Pick<RecaptchaVerificationResult, "score" | "action" | "errorCodes">;
};

export type ApiGuardSuccess = {
  ok: true;
  clientIp?: string;
  recaptcha?: RecaptchaVerificationResult;
};

export type ApiGuardResult = ApiGuardFailure | ApiGuardSuccess;

/**
 * Canonical guard options (preferred).
 */
export type GuardOptions = {
  /**
   * Require a specific HTTP method.
   */
  method?: "POST" | "GET" | "PUT" | "DELETE";

  /**
   * If true, enforce JSON content-type for methods with body.
   */
  requireJson?: boolean;

  /**
   * Maximum JSON body size in bytes (best-effort; Next parses body upstream).
   */
  maxBodyBytes?: number;

  /**
   * Honeypot fields (optional).
   * If a honeypot field is present and non-empty, we "pretend success" (200)
   * to avoid giving bots signal.
   */
  honeypot?: {
    enabled?: boolean;
    fieldNames?: string[];
    /**
     * If true (default), return 200 success for honeypot triggers.
     * If false, return 422 failure.
     */
    silentSuccess?: boolean;
  };

  /**
   * Canonical reCAPTCHA config.
   */
  recaptcha?: {
    expectedAction: string;
    recaptchaField?: string; // default "recaptchaToken"
    timeoutMs?: number;
  };
};

/**
 * Legacy options (backward-compatible), used by older routes:
 * withSecurity(handler, { requireRecaptcha, expectedAction, requireHoneypot, honeypotFieldNames })
 */
export type LegacyGuardOptions = {
  requireRecaptcha?: boolean;
  expectedAction?: string;
  requireHoneypot?: boolean;
  honeypotFieldNames?: string[];
};

/**
 * Unified options surface: supports both canonical and legacy keys.
 */
export type GuardOptionsAny = GuardOptions & LegacyGuardOptions;

/* =============================================================================
   HELPERS
   ============================================================================= */

function isJsonContentType(req: NextApiRequest): boolean {
  const ct = req.headers["content-type"];
  return typeof ct === "string" && /application\/json/i.test(ct);
}

function normalizeOptions(opts: GuardOptionsAny): GuardOptions {
  // Map legacy keys into canonical shape (without breaking canonical usage)
  const legacyRequireRecaptcha = typeof opts.requireRecaptcha === "boolean" ? opts.requireRecaptcha : undefined;
  const legacyExpectedAction = typeof opts.expectedAction === "string" ? opts.expectedAction : undefined;
  const legacyRequireHoneypot = typeof opts.requireHoneypot === "boolean" ? opts.requireHoneypot : undefined;
  const legacyHoneypotFields = Array.isArray(opts.honeypotFieldNames) ? opts.honeypotFieldNames : undefined;

  const honeypotFromLegacy =
    legacyRequireHoneypot === undefined
      ? undefined
      : {
          enabled: legacyRequireHoneypot,
          fieldNames: legacyHoneypotFields,
          // legacy behavior typically wants silent success
          silentSuccess: true,
        };

  const recaptchaFromLegacy =
    legacyRequireRecaptcha === false
      ? undefined
      : legacyExpectedAction
        ? {
            expectedAction: legacyExpectedAction,
          }
        : undefined;

  return {
    method: opts.method,
    requireJson: opts.requireJson,
    maxBodyBytes: opts.maxBodyBytes,
    honeypot: opts.honeypot ?? honeypotFromLegacy,
    recaptcha: opts.recaptcha ?? recaptchaFromLegacy,
  };
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function getBodyField(req: NextApiRequest, key: string): unknown {
  // Next.js API routes parse JSON body into req.body by default (unless bodyParser disabled)
  const b = req.body as any;
  return b?.[key];
}

/* =============================================================================
   CORE GUARD
   ============================================================================= */

export async function apiGuard(req: NextApiRequest, rawOpts: GuardOptionsAny): Promise<ApiGuardResult> {
  const opts = normalizeOptions(rawOpts);

  // Method gate
  if (opts.method && req.method !== opts.method) {
    return {
      ok: false,
      status: 405,
      code: "ERR_METHOD",
      error: `Method Not Allowed. Expected ${opts.method}.`,
    };
  }

  // Content-Type gate
  if (opts.requireJson) {
    if (!isJsonContentType(req)) {
      return {
        ok: false,
        status: 415,
        code: "ERR_JSON",
        error: "Unsupported Media Type. Expect application/json.",
      };
    }
  }

  // Best-effort size gate
  const maxBytes = typeof opts.maxBodyBytes === "number" ? opts.maxBodyBytes : undefined;
  if (maxBytes && req.headers["content-length"]) {
    const n = Number(req.headers["content-length"]);
    if (Number.isFinite(n) && n > maxBytes) {
      return {
        ok: false,
        status: 413,
        code: "ERR_BODY_TOO_LARGE",
        error: "Payload too large.",
      };
    }
  }

  const clientIp = getClientIp(req);

  // Honeypot (optional)
  const honeypotEnabled = opts.honeypot?.enabled ?? false;
  const honeypotFields = opts.honeypot?.fieldNames ?? ["website", "middleName", "botField"];
  const honeypotSilent = opts.honeypot?.silentSuccess ?? true;

  if (honeypotEnabled && req.body && typeof req.body === "object") {
    for (const field of honeypotFields) {
      const val = getBodyField(req, field);
      if (isNonEmptyString(val)) {
        if (process.env.NODE_ENV !== "production") {
          console.warn("[apiGuard] honeypot triggered", { field });
        }
        if (honeypotSilent) {
          return { ok: true, clientIp };
        }
        return {
          ok: false,
          status: 422,
          code: "ERR_HONEYPOT",
          error: "Validation failed.",
        };
      }
    }
  }

  // reCAPTCHA gate (optional)
  if (opts.recaptcha) {
    const field = opts.recaptcha.recaptchaField ?? "recaptchaToken";
    const tokenRaw = getBodyField(req, field);
    const token = typeof tokenRaw === "string" ? tokenRaw : "";

    if (!token) {
      return {
        ok: false,
        status: 400,
        code: "ERR_MISSING_TOKEN",
        error: "Security token missing.",
      };
    }

    const raw: RecaptchaVerificationResult = await verifyRecaptchaDetailed(
      token,
      opts.recaptcha.expectedAction,
      clientIp,
      opts.recaptcha.timeoutMs
    );

    if (!raw.success) {
      return {
        ok: false,
        status: 403,
        code: "ERR_RECAPTCHA_FAILED",
        error: "Security verification failed. Please refresh and try again.",
        recaptcha: {
          score: raw.score,
          action: raw.action,
          errorCodes: raw.errorCodes,
        },
      };
    }

    return { ok: true, clientIp, recaptcha: raw };
  }

  return { ok: true, clientIp };
}

/* =============================================================================
   HOF WRAPPER
   ============================================================================= */

/**
 * Higher-order wrapper for API routes with security checks.
 *
 * Usage (canonical):
 * export default withSecurity(handler, {
 *   method: "POST",
 *   requireJson: true,
 *   honeypot: { enabled: true },
 *   recaptcha: { expectedAction: "contact_form" },
 * });
 *
 * Usage (legacy-compatible):
 * export default withSecurity(handler, {
 *   requireRecaptcha: true,
 *   expectedAction: "contact_form",
 *   requireHoneypot: false,
 * });
 */
export function withSecurity<T = any>(
  handler: (req: NextApiRequest, res: NextApiResponse<T>, guard: ApiGuardSuccess) => Promise<void> | void,
  opts: GuardOptionsAny
) {
  return async (req: NextApiRequest, res: NextApiResponse<T>) => {
    const guardResult = await apiGuard(req, opts);

    // Explicit type guard for proper TypeScript narrowing
    if (guardResult.ok === false) {
      // TypeScript now knows guardResult is ApiGuardFailure
      return res.status(guardResult.status).json({
        error: guardResult.error,
        code: guardResult.code,
        ...(guardResult.recaptcha ? { recaptcha: guardResult.recaptcha } : {}),
      } as any);
    }

    // TypeScript knows guardResult is ApiGuardSuccess here
    return handler(req, res, guardResult);
  };
}

