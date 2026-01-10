// lib/server/query.ts
export function qString(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  return s ? s : null;
}

export function qNumber(v: unknown): number | null {
  if (typeof v === "string" && v.trim()) {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  if (typeof v === "number" && Number.isFinite(v)) return v;
  return null;
}

export function qStringArray(v: unknown): string[] | null {
  if (Array.isArray(v)) return v.filter((x) => typeof x === "string").map((s) => s.trim()).filter(Boolean);
  if (typeof v === "string") return [v.trim()].filter(Boolean);
  return null;
}

export function qDate(v: unknown): Date | null {
  const s = qString(v);
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}


