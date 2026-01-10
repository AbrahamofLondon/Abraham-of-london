// lib/server/log.ts
type LogLevel = "debug" | "info" | "warn" | "error";

function redact(input: Record<string, unknown>) {
  const clone: Record<string, unknown> = { ...input };
  // Kill anything risky by convention
  for (const k of Object.keys(clone)) {
    if (/(email|ip|token|authorization|cookie|key|secret|password)/i.test(k)) {
      clone[k] = "[REDACTED]";
    }
  }
  return clone;
}

export function log(level: LogLevel, message: string, meta: Record<string, unknown> = {}) {
  const payload = {
    level,
    message,
    ts: new Date().toISOString(),
    ...redact(meta),
  };

  // eslint-disable-next-line no-console
  console[level === "debug" ? "log" : level](payload);
}


