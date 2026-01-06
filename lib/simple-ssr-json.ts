// lib/simple-ssr-json.ts

/**
 * Minimal SSR-safe serializer for maximum compatibility
 */

export function toSSRSafeJSON<T>(value: T): T {
  const seen: unknown[] = [];

  const cleaned = JSON.parse(
    JSON.stringify(value, (key, val) => {
      // Remove undefined (causes hydration mismatches)
      if (val === undefined) return null;

      // Remove functions
      if (typeof val === "function") return null;

      // Basic circular reference check
      if (val && typeof val === "object") {
        if (seen.includes(val)) return "[Circular]";
        seen.push(val);
      }

      // Convert common non-serializable types
      if (val instanceof Date) return val.toISOString();
      if (val instanceof Map) return Object.fromEntries(val);
      if (val instanceof Set) return Array.from(val);
      if (typeof val === "bigint") return val.toString();

      return val;
    })
  );

  return cleaned;
}

/**
 * Quick SSR props helper
 */
export function safeProps<T>(props: T) {
  return toSSRSafeJSON(props);
}

