// lib/social.ts
import type { SocialLink } from "@/lib/siteConfig";

export const X_HANDLE = process.env.NEXT_PUBLIC_X_HANDLE || "AbrahamAda48634";

export function normalizeX(href: string): string {
  if (!href) return href;
  const m = href.match(/^https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/([^/?#]+)/i);
  if (!m) return href;
  return `https://x.com/${X_HANDLE}`;
}

export function sanitizeSocialLinks(links: SocialLink[]): SocialLink[] {
  return links.map((l) => {
    let href = l.href || "";
    href = normalizeX(href);
    try {
      const u = new URL(href);
      // Strip basic tracking noise if present
      ["utm_source","utm_medium","utm_campaign","utm_content","utm_term","s"].forEach((p) =>
        u.searchParams.delete(p)
      );
      href = u.toString();
    } catch {
      // non-URL (mailto/tel), ignore
    }
    return { ...l, href };
  });
}
