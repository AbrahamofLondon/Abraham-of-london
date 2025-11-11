// lib/safe-social.ts
import siteConfig from "@/lib/siteConfig";

interface SocialLink {
  kind: string;
  href?: string;
  handle?: string;
}

interface SiteConfigWithSocial {
  socialLinks?: SocialLink[];
  twitterHandle?: string;
  social?: Record<string, unknown>;
}

// Update the function with proper typing
export function getSocialHandle(platform: Platform): string {
  const config = siteConfig as SiteConfigWithSocial;
  
  // First try socialLinks
  try {
    const link = config?.socialLinks?.find?.(
      (x: SocialLink) => x?.kind === platform
    );
    if (link?.href && /^https?:\/\//i.test(link.href)) {
      return normalizeHandle(platform, link.href);
    }
    if (typeof link?.handle === 'string' && link.handle.trim()) {
      return normalizeHandle(platform, link.handle);
    }
  } catch {}

  // Then try common fields on siteConfig
  if (platform === 'twitter') {
    const raw = config?.twitterHandle ?? config?.social?.twitter ?? '';
    return normalizeHandle('twitter', raw);
  }

  const raw = config?.social?.[platform] ?? '';
  return normalizeHandle(platform, raw);
}

type Platform =
  | "twitter"
  | "linkedin"
  | "github"
  | "instagram"
  | "youtube"
  | "facebook"
  | "threads";

const PLATFORM_URL: Record<Platform, (handle: string) => string> = {
  twitter: (h) => `https://twitter.com/${h}`,
  linkedin: (h) =>
    /^https?:\/\//i.test(h) ? h : `https://www.linkedin.com/in/${h}`,
  github: (h) => `https://github.com/${h}`,
  instagram: (h) => `https://www.instagram.com/${h}`,
  youtube: (h) =>
    /^https?:\/\//i.test(h) ? h : `https://www.youtube.com/@${h}`,
  facebook: (h) =>
    /^https?:\/\//i.test(h) ? h : `https://www.facebook.com/${h}`,
  threads: (h) =>
    /^https?:\/\//i.test(h) ? h : `https://www.threads.net/@${h}`,
};

function normalizeHandle(platform: Platform, raw: unknown): string {
  const s = String(raw ?? "").trim();
  if (!s) return "";

  if (/^https?:\/\//i.test(s)) {
    // Convert URL to a handle-ish string (best-effort) for non-Twitter too.
    try {
      const u = new URL(s);
      const path = u.pathname.replace(/^\/+/, "");
      // e.g. /user or /@user
      const cleaned = path.replace(/^@/, "").split("/")[0] || "";
      return cleaned ? cleaned : s; // fallback to raw if weird URL
    } catch {
      return s;
    }
  }

  // Strip leading @ for platforms that often include it
  return s.replace(/^@/, "");
}

/** Get a site-level social handle (by platform), from siteConfig.socialLinks or specific keys */
export function getSocialHandle(platform: Platform): string {
  // First try socialLinks
  try {
    const link = (siteConfig as any)?.socialLinks?.find?.(
      (x: unknown) => x?.kind === platform
    );
    if (link?.href && /^https?:\/\//i.test(link.href)) {
      return normalizeHandle(platform, link.href);
    }
    if (typeof link?.handle === "string" && link.handle.trim()) {
      return normalizeHandle(platform, link.handle);
    }
  } catch {}

  // Then try common fields on siteConfig
  if (platform === "twitter") {
    const raw =
      (siteConfig as any)?.twitterHandle ??
      (siteConfig as any)?.social?.twitter ??
      "";
    return normalizeHandle("twitter", raw);
  }

  const raw = (siteConfig as any)?.social?.[platform] ?? "";
  return normalizeHandle(platform, raw);
}

/** Get a site-level social URL (by platform) */
export function getSocialUrl(platform: Platform): string {
  const handle = getSocialHandle(platform);
  if (!handle) return "";
  return PLATFORM_URL[platform](handle);
}

/** Return { handle, url } for site-level social */
export function getSocialMeta(platform: Platform): { handle: string; url: string } {
  const handle = getSocialHandle(platform);
  const url = handle ? PLATFORM_URL[platform](handle) : "";
  return { handle: handle ? (platform === "twitter" && !handle.startsWith("@") ? `@${handle}` : handle) : "", url };
}

/** Safely extract { handle, url } from an arbitrary object’s social field */
export function safeSocialFrom(
  obj: unknown,
  platform: Platform
): { handle: string; url: string } {
  const raw =
    (obj as any)?.social?.[platform] ??
    (obj as any)?.[platform] ??
    "";

  const h = normalizeHandle(platform, raw);
  if (!h) return getSocialMeta(platform);

  const url = PLATFORM_URL[platform](h);
  const handle = platform === "twitter" && !h.startsWith("@") ? `@${h}` : h;
  return { handle, url };
}
