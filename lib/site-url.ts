// lib/site-url.ts

const FALLBACK_SITE_URL = "https://www.abrahamoflondon.org";

export function getSiteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    process.env.NEXTAUTH_URL ||
    process.env.APP_URL ||
    process.env.BASE_URL ||
    FALLBACK_SITE_URL;

  try {
    return new URL(raw).origin;
  } catch {
    return FALLBACK_SITE_URL;
  }
}

export function safeAbsoluteUrl(pathOrUrl: string): string {
  const siteUrl = getSiteUrl();

  try {
    return new URL(pathOrUrl, siteUrl).toString();
  } catch {
    return siteUrl;
  }
}
