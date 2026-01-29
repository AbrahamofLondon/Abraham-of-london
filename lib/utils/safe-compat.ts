// lib/utils/safe-compat.ts
import { safeCharAt, safeArraySlice, capitalize } from "@/lib/utils/string";

export function safeFirstChar(value: any, fallback: string = 'A'): string {
  const char = safeCharAt(String(value || ''), 0);
  return char || fallback;
}

export const safeSlice = safeArraySlice;
export const safeCapitalize = capitalize;
export * from "@/lib/utils/safe";