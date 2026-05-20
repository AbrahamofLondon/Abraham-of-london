const DEFAULT_ADMIN_RETURN_TO = "/admin";

function decodeAtMostTwice(value: string): string {
  let current = value;
  for (let i = 0; i < 2; i += 1) {
    try {
      const decoded = decodeURIComponent(current);
      if (decoded === current) break;
      current = decoded;
    } catch {
      break;
    }
  }
  return current;
}

export function normalizeAdminReturnTo(input: unknown, fallback = DEFAULT_ADMIN_RETURN_TO): string {
  const raw = Array.isArray(input) ? input[0] : input;
  if (typeof raw !== "string") return fallback;

  const decoded = decodeAtMostTwice(raw.trim());
  if (!decoded) return fallback;
  if (/^[a-z][a-z0-9+.-]*:/i.test(decoded)) return fallback;
  if (decoded.startsWith("//")) return fallback;
  if (!decoded.startsWith("/")) return fallback;
  if (decoded.includes("\\") || /[\u0000-\u001f\u007f]/.test(decoded)) return fallback;

  return decoded;
}
