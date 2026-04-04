/* lib/observability/logger.ts */

type LogLevel = "debug" | "info" | "warn" | "error";

type LogPayload = {
  level: LogLevel;
  message: string;
  scope?: string;
  meta?: Record<string, unknown>;
  timestamp: string;
};

function safeMeta(meta?: Record<string, unknown>) {
  if (!meta) return undefined;
  try {
    return JSON.parse(JSON.stringify(meta));
  } catch {
    return { serialization: "failed" };
  }
}

function emit(level: LogLevel, message: string, scope?: string, meta?: Record<string, unknown>) {
  const payload: LogPayload = {
    level,
    message,
    scope,
    meta: safeMeta(meta),
    timestamp: new Date().toISOString(),
  };

  const line = JSON.stringify(payload);

  switch (level) {
    case "error":
      console.error(line);
      break;
    case "warn":
      console.warn(line);
      break;
    default:
      console.log(line);
  }
}

export const logger = {
  debug: (message: string, scope?: string, meta?: Record<string, unknown>) =>
    emit("debug", message, scope, meta),
  info: (message: string, scope?: string, meta?: Record<string, unknown>) =>
    emit("info", message, scope, meta),
  warn: (message: string, scope?: string, meta?: Record<string, unknown>) =>
    emit("warn", message, scope, meta),
  error: (message: string, scope?: string, meta?: Record<string, unknown>) =>
    emit("error", message, scope, meta),
};