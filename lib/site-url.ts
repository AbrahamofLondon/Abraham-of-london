// lib/site-url.ts

const FALLBACK_SITE_URL = "https://www.abrahamoflondon.org";

export function getSiteUrl(): string {
  // Step 1: Try environment variables in priority order, but validate each one
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.SITE_URL,
    process.env.NEXTAUTH_URL,
    process.env.APP_URL,
    process.env.BASE_URL,
  ].filter(Boolean); // Remove undefined/null

  // Step 2: Find first non-empty, trimmed candidate
  let candidate: string | undefined;
  for (const env of candidates) {
    if (typeof env === "string") {
      const trimmed = env.trim();
      if (trimmed.length > 0) {
        candidate = trimmed;
        break;
      }
    }
  }

  // Step 3: If no env var worked, use fallback
  if (!candidate || candidate.length === 0) {
    return FALLBACK_SITE_URL;
  }

  // Step 4: Safely parse the URL
  try {
    const parsed = new URL(candidate);
    return parsed.origin;
  } catch (_err) {
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
