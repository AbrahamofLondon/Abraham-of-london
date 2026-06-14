// lib/site-url.ts

const FALLBACK_SITE_URL = "https://www.abrahamoflondon.org";

export function getSiteUrl(): string {
  // Step 1: Try environment variables in priority order
  const env = process.env.NEXT_PUBLIC_SITE_URL
    || process.env.SITE_URL
    || process.env.NEXTAUTH_URL
    || process.env.APP_URL
    || process.env.BASE_URL;

  // Step 2: Validate and clean the environment value
  let candidate = env;
  if (typeof candidate !== "string" || !candidate || candidate.trim().length === 0) {
    candidate = FALLBACK_SITE_URL;
  } else {
    candidate = candidate.trim();
  }

  // Step 3: Ensure it's a valid URL before passing to new URL()
  if (!candidate || typeof candidate !== "string" || candidate.length === 0) {
    return FALLBACK_SITE_URL;
  }

  try {
    const parsed = new URL(candidate);
    return parsed.origin;
  } catch (err) {
    // If URL parsing fails, return the fallback
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
