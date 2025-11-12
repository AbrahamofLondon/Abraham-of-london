// lib/social.ts
// Robust utilities for normalising social links coming from config or content.

export type SocialPlatform =
  | "x" | "twitter" | "instagram" | "facebook" | "linkedin" | "youtube"
  | "whatsapp" | "tiktok" | "mail" | "email" | "phone" | "website" | "link";

export interface SocialLink {
  href: string;
  kind?: SocialPlatform | string;
  label?: string;
  external?: boolean;
  icon?: string;
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

    const href = String((item as any).href ?? "").trim();
    if (!href) continue;

    const kindRaw = (item as any).kind;
    const kind = typeof kindRaw === "string" ? (kindRaw as SocialPlatform | string) : undefined;

    const labelRaw = (item as any).label;
    const label =
      typeof labelRaw === "string" && labelRaw.trim()
        ? labelRaw.trim()
        : kind
        ? kind.toString().charAt(0).toUpperCase() + kind.toString().slice(1)
        : "Social";

    const icon =
      typeof (item as any).icon === "string" ? ((item as any).icon as string) : undefined;

    const externalHint =
      typeof (item as any).external === "boolean" ? (item as any).external : undefined;

    const isUtility = href.startsWith("mailto:") || href.startsWith("tel:");
    const external = externalHint ?? (/^https?:\/\//i.test(href) && !isUtility);

    out.push({ href, kind, label, icon, external });
  }
  return out;
}