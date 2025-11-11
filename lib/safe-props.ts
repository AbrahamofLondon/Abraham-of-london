// lib/safe-props.ts

import type { EventResources, LinkItem } from "@/types/event";

// ---- Public, card-safe cover unions ----
export type CoverAspect = "book" | "wide" | "square";
export type CoverFit = "contain" | "cover";
/** Strict union that BlogPostCard (and similar) expect */
export type CardCoverPosition = "center" | "left" | "right" | undefined;

// ---- Core safe helpers ----
export function safeArray<T>(value: unknown, defaultValue: T[] = []): T[] {
  return Array.isArray(value) ? (value as T[]) : defaultValue;
}

export function safeString(value: unknown, defaultValue = ""): string {
  return typeof value === "string" ? value : defaultValue;
}

/** Convert null to undefined for component optional props */
export function safePostProp<T>(value: T | null | undefined): T | undefined {
  return value ?? undefined;
}

// ---- Event resources coercion ----
export function safeEventResources(resources: unknown): EventResources | null {
  if (!resources || typeof resources !== "object") return null;
  const res = resources as any;
  return {
    downloads: safeArray<LinkItem>(res.downloads),
    reads: safeArray<LinkItem>(res.reads),
  };
}

// ---- Cover helpers ----
export function safeCoverAspect(value: string | null | undefined): CoverAspect {
  const v = (value || "").toLowerCase();
  return v === "wide" || v === "square" || v === "book"
    ? (v as CoverAspect)
    : "book";
}

export function safeCoverFit(
  value: string | null | undefined,
  aspect?: string | null | undefined,
): CoverFit {
  const a = (aspect || "book").toLowerCase();
  const v = (value || (a === "book" ? "contain" : "cover")).toLowerCase();
  return v === "contain" || v === "cover"
    ? (v as CoverFit)
    : a === "book"
      ? "contain"
      : "cover";
}

/**
 * STRICT clamping to what cards accept.
 * Any "top" / "bottom" / custom values are converted to undefined or a nearby safe choice.
 */
export function safeCardCoverPosition(
  value: string | null | undefined,
): "center" | "left" | "right" | undefined {
  const v = typeof value === "string" ? value.toLowerCase() : "";
  if (v === "left" || v === "right" || v === "center") return v;
  if (!v) return undefined;
  if (v.includes("left")) return "left";
  if (v.includes("right")) return "right";
  if (v.includes("center") || v.includes("middle")) return "center";
  return undefined;
}

/** Back-compat alias if other modules import safeCoverPosition */
export const safeCoverPosition = safeCardCoverPosition;

// ---- Missing exports that were causing build errors ----

/**
 * Safely convert any value to boolean with fallback
 */
export function safeBoolean(
  value: unknown,
  defaultValue: boolean = false,
): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const lower = value.toLowerCase().trim();
    if (lower === "true" || lower === "1" || lower === "yes") return true;
    if (lower === "false" || lower === "0" || lower === "no") return false;
  }
  if (typeof value === "number") return value !== 0;
  return defaultValue;
}

/**
 * Safely convert any value to number with fallback
 */
export function safeNumber(value: unknown, defaultValue: number = 0): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const num = Number(value.trim());
    return isNaN(num) ? defaultValue : num;
  }
  return defaultValue;
}

/**
 * Safely convert any value to string with fallback
 */
export function safeStringValue(
  value: unknown,
  defaultValue: string = "",
): string {
  if (typeof value === "string") return value;
  if (value == null) return defaultValue;
  return String(value);
}
