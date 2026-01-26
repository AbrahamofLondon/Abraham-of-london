import { safeFirstChar, safeSlice } from "@/lib/utils/safe";

// lib/social.ts
// Robust utilities for normalising social links coming from config or content.

export type SocialPlatform =
  | "x"
  | "twitter"
  | "instagram"
  | "facebook"
  | "linkedin"
  | "youtube"
  | "whatsapp"
  | "tiktok"
  | "mail"
  | "email"
  | "phone"
  | "website"
  | "link";

export interface SocialLink {
  href: string; // Fully-formed, safe URL or mailto:/tel:
  kind?: SocialPlatform; // Normalised platform key
  label?: string; // Human-readable label
  external?: boolean; // True for http(s) off-site links
  icon?: string; // Optional icon id/name
}

interface RawSocialItem {
  href?: string;
  url?: string;
  handle?: string;
  kind?: string;
  type?: string;
  platform?: string;
  label?: string;
  name?: string;
  icon?: string;
  external?: boolean;
}

/** Map aliases → canonical platform keys */
export const PLATFORM_ALIASES: Record<string, SocialPlatform> = {
  x: "twitter",
  twitter: "twitter",
  ig: "instagram",
  insta: "instagram",
  instagram: "instagram",
  fb: "facebook",
  facebook: "facebook",
  li: "linkedin",
  linkedin: "linkedin",
  yt: "youtube",
  youtube: "youtube",
  wa: "whatsapp",
  whatsapp: "whatsapp",
  tiktok: "tiktok",
  mail: "email",
  email: "email",
  phone: "phone",
  tel: "phone",
  site: "website",
  website: "website",
  url: "link",
  link: "link",
};

/** Base URL builders for common platforms given a handle/username */
export const PLATFORM_BUILDERS: Partial<
  Record<SocialPlatform, (h: string) => string>
> = {
  twitter: (h) => `https://twitter.com/${stripAt(h)}`,
  instagram: (h) => `https://instagram.com/${stripAt(h)}`,
  facebook: (h) => `https://facebook.com/${stripAt(h)}`,
  linkedin: (h) => {
    const u = stripAt(h);
    return u.startsWith("company/") || u.startsWith("in/") || u.includes("/")
      ? `https://www.linkedin.com/${u.replace(/^\/+/, "")}`
      : `https://www.linkedin.com/in/${u}`;
  },
  youtube: (h) => {
    const u = stripAt(h);
    return u.startsWith("@")
      ? `https://www.youtube.com/${u}`
      : `https://www.youtube.com/${u.replace(/^\/+/, "")}`;
  },
  tiktok: (h) => `https://www.tiktok.com/@${stripAt(h)}`,
  whatsapp: (h) => buildWhatsApp(h),
};

function stripAt(v: string): string {
  return String(v || "")
    .trim()
    .replace(/^@+/, "");
}

function normalisePlatform(input: unknown): SocialPlatform | undefined {
  if (typeof input !== "string") return undefined;
  const key = input.trim().toLowerCase();
  return PLATFORM_ALIASES[key] ?? undefined;
}

/** Very strict URL safety: only http(s), mailto, tel, or relative allowed */
function isSafeHref(href: string): boolean {
  const v = String(href).trim();
  if (v.startsWith("mailto:") || v.startsWith("tel:")) return true;
  try {
    const u = new URL(v, "https://dummy.local"); // base for relative
    const scheme = (u.protocol || "").toLowerCase();
    return scheme === "http:" || scheme === "https:" || v.startsWith("/");
  } catch {
    return v.startsWith("/");
  }
}

/** WhatsApp URL builder: accepts phone numbers or message templates */
export function buildWhatsApp(input: string): string {
  const v = String(input || "").trim();
  if (/^https?:\/\/(wa\.me|api\.whatsapp\.com)\//i.test(v)) return v;

  if (/^[+]?[\d\s().-]{6,}$/.test(v)) {
    const digits = v.replace(/[^\d]/g, "");
    return `https://wa.me/${digits}`;
  }

  const text = encodeURIComponent(v.replace(/^msg:/i, "").trim() || "Hello");
  return `https://wa.me/?text=${text}`;
}

/** Build href from handle when platform known; fall back to raw href */
export function coerceHref(
  rawHref: unknown,
  kind?: SocialPlatform,
): string | null {
  const v = String(rawHref ?? "").trim();
  if (!v) return null;

  if (
    v.startsWith("http://") ||
    v.startsWith("https://") ||
    v.startsWith("mailto:") ||
    v.startsWith("tel:") ||
    v.startsWith("/")
  ) {
    return isSafeHref(v) ? v : null;
  }

  if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) return `mailto:${v}`;
  if (/^[+]?[\d\s().-]{6,}$/.test(v)) return `tel:${v.replace(/\s+/g, "")}`;

  if (kind && PLATFORM_BUILDERS[kind]) {
    return PLATFORM_BUILDERS[kind]!(v);
  }

  if (/^[a-z0-9.-]+\.[a-z]{2,}(?:\/.*)?$/i.test(v)) {
    return `https://${v}`;
  }

  if (v.startsWith("@")) return `https://twitter.com/${stripAt(v)}`;

  return null;
}

/** Decide external flag */
function computeExternal(href: string): boolean {
  if (href.startsWith("mailto:") || href.startsWith("tel:")) return false;
  if (href.startsWith("/")) return false;
  return /^https?:\/\//i.test(href);
}

/** Public type guard */
export function isSocialLink(x: unknown): x is SocialLink {
  return (
    !!x && typeof x === "object" && typeof (x as SocialLink).href === "string"
  );
}

/** Coerce unknown shapes (array/object/primitive) into a clean SocialLink[] */
export function sanitizeSocialLinks(input: unknown): SocialLink[] {
  const arr: unknown[] = Array.isArray(input)
    ? input
    : input && typeof input === "object"
      ? Object.values(input as Record<string, unknown>)
      : [];

  const out: SocialLink[] = [];

  for (const item of arr) {
    if (!item || typeof item !== "object") continue;

    const raw = item as RawSocialItem;
    const rawHref = raw.href ?? raw.url ?? raw.handle ?? "";
    const rawKind = raw.kind ?? raw.type ?? raw.platform;
    const rawLabel = raw.label ?? raw.name;
    const rawIcon = raw.icon;
    const rawExternal = raw.external;

    const kind = normalisePlatform(rawKind);
    const href = coerceHref(rawHref, kind);
    if (!href || !isSafeHref(href)) continue;

    const label =
      typeof rawLabel === "string" && rawLabel.trim()
        ? rawLabel.trim()
        : kind
          ? safeCapitalize(kind)
          : "Social";

    const icon = typeof rawIcon === "string" ? rawIcon : undefined;
    const external =
      typeof rawExternal === "boolean" ? rawExternal : computeExternal(href);

    out.push({ href, kind, label, icon, external });
  }

  const seen = new Set<string>();
  const deduped: SocialLink[] = [];
  for (const s of out) {
    const key = `${s.kind ?? "unknown"}|${s.href}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(s);
    }
  }
  return deduped;
}

const socialApi = {
  PLATFORM_ALIASES,
  PLATFORM_BUILDERS,
  sanitizeSocialLinks,
  isSocialLink,
  buildWhatsApp,
  coerceHref,
};

export default socialApi;


