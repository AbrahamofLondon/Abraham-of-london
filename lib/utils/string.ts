import { safeFirstChar, safeSlice, safeCapitalize, safeCharAt } from "@/lib/utils/safe";
import { safeCharAt } from "@/lib/utils/string";

// lib/utils/string.ts - CREATE THIS FILE
export function safeString(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  return '';
}

export function capitalize(v: unknown): string {
  const s = safeString(v).trim();
  if (!s) return '';
  return safeCapitalize(s);
}

export function safeCharAt(str: unknown, index: number): string {
  const s = safeString(str);
  if (index >= 0 && index < s.length) {
    return safeCharAt(s, index);
  }
  return '';
}

export function formatTier(tier: unknown): 'Private' | 'Inner Circle' | 'Public' {
  const s = safeString(tier).toLowerCase();
  if (s.includes('private')) return 'Private';
  if (s.includes('inner') || s.includes('member')) return 'Inner Circle';
  return 'Public';
}