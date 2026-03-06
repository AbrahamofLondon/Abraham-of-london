// lib/server/log.ts — Institutional Logger (redaction + stability)
import "server-only";

export type LogLevel = "debug" | "info" | "warn" | "error";

type Meta = Record<string, unknown>;

const REDACT_KEY_RE = /(email|ip|token|authorization|cookie|set-cookie|key|secret|password|bearer|session|jwt)/i;

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && (v as any).constructor === Object;
}

function toMeta(input: unknown): Meta {
  if (!input) return {};
  if (isPlainObject(input)) return input;
  // If someone passes an Error or string, capture safely
  if (input instanceof Error) {
    return { error: input.message, name: input.name, stack: input.stack };
  }
  return { value: input };
}

function redactDeep(value: unknown, depth = 0): unknown {
  if (depth > 5) return "[TRUNCATED]";

  if (Array.isArray(value)) {
    return value.slice(0, 50).map((v) => redactDeep(v, depth + 1));
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
  }

  if (isPlainObject(value)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      if (REDACT_KEY_RE.test(k)) out[k] = "[REDACTED]";
      else out[k] = redactDeep(v, depth + 1);
    }
    return out;
  }

  // primitives + dates
  if (value instanceof Date) return value.toISOString();
  return value;
}

function pickConsole(level: LogLevel): (...args: any[]) => void {
  // Some environments lack console.debug
  if (level === "debug") return console.debug ? console.debug.bind(console) : console.log.bind(console);
  if (level === "info") return console.info ? console.info.bind(console) : console.log.bind(console);
  if (level === "warn") return console.warn.bind(console);
  return console.error.bind(console);
}

/**
 * log(level, message, meta?)
 * - meta is redacted (deep) to avoid leaking secrets
 * - stable across runtimes
 */
export function log(level: LogLevel, message: string, meta: unknown = {}): void {
  const safeMeta = redactDeep(toMeta(meta));

  const payload = {
    level,
    message: String(message || ""),
    ts: new Date().toISOString(),
    meta: safeMeta,
  };

  pickConsole(level)(payload);
}

/**
 * Convenience helpers
 */
export const logger = {
  debug: (message: string, meta?: unknown) => log("debug", message, meta),
  info: (message: string, meta?: unknown) => log("info", message, meta),
  warn: (message: string, meta?: unknown) => log("warn", message, meta),
  error: (message: string, meta?: unknown) => log("error", message, meta),
};

export default logger;