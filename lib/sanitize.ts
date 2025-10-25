// lib/sanitize.ts
export const undef = <T>(v: T | null | undefined) =>
  v == null ? undefined : v;
