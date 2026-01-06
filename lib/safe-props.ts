export const safeString = (v: unknown, d = ""): string =>
  typeof v === "string" ? v : d;

export const safeArray = <T>(v: unknown, d: T[] = []): T[] =>
  Array.isArray(v) ? (v as T[]) : d;

export const safeBool = (v: unknown, d = false): boolean =>
  typeof v === "boolean" ? v : d;

export function safeEnum<T extends string>(
  v: unknown,
  allowed: readonly T[],
  d: T
): T {
  return (allowed as readonly string[]).includes(String(v)) ? (v as T) : d;
}

