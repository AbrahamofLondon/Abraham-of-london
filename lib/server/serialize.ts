// lib/server/serialize.ts
export function jsonSafe<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_k, v) => {
      if (typeof v === "bigint") return v.toString(); // or Number(v) if safe
      if (v instanceof Date) return v.toISOString();
      return v;
    })
  );
}