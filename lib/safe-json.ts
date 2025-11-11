// lib/safe-json.ts

/**
 * Safely convert data to JSON-serializable format
 * Handles circular references, dates, and undefined values
 */
export function toJSONSafe<T>(data: T): unknown {
  const seen = new WeakSet();

  return JSON.parse(JSON.stringify(data, (key, value) => {
    // Handle circular references
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular]';
      }
      seen.add(value);
    }

    // Handle Date objects
    if (value instanceof Date) {
      return value.toISOString();
    }

    // Handle undefined values
    if (value === undefined) {
      return null;
    }

    // Handle BigInt (if needed)
    if (typeof value === 'bigint') {
      return value.toString();
    }

    return value;
  }));
}

/**
 * Alternative safe serialization for simpler cases
 */
export function serializeSafe<T>(data: T): string {
  try {
    return JSON.stringify(toJSONSafe(data));
  } catch (error) {
    console.warn('Serialization failed:', error);
    return JSON.stringify({ error: 'Serialization failed' });
  }
}

/**
 * Parse JSON safely with error handling
 */
export function parseSafe<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch (error) {
    console.warn('JSON parse failed:', error);
    return fallback;
  }
}