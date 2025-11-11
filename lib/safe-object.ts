// lib/safe-object.ts
export const safe = <T extends object>(o: T | undefined | null): T =>
  new Proxy((o ?? {}) as T, {
    get(target, prop) {
      const v = (target as any)[prop];
      return v === undefined ? "" : v;
    }
  });
