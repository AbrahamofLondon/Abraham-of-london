// lib/safe-social.ts
// Safe social URL utilities with proper TypeScript

export interface SocialPlatform {
  name: string;
  baseUrl: string;
  icon?: string;
}

export const socialPlatforms: Record<string, SocialPlatform> = {
  twitter: {
    name: "X (Twitter)",
    baseUrl: "https://x.com/",
    icon: "twitter",
  },
  linkedin: {
    name: "LinkedIn",
    baseUrl: "https://linkedin.com/in/",
    icon: "linkedin",
  },
  github: {
    name: "GitHub",
    baseUrl: "https://github.com/",
    icon: "github",
  },
} as const;

export function getSocialUrl(platform: string, username: string): string {
  const platformConfig = socialPlatforms[platform.toLowerCase()];
  if (!platformConfig) {
    console.warn(`Unknown social platform: ${platform}`);
    return `https://${platform}.com/${username}`;
  }
  return `${platformConfig.baseUrl}${username}`;
}

export function isValidSocialPlatform(platform: string): boolean {
  return platform.toLowerCase() in socialPlatforms;
}

export function getSocialDisplayName(platform: string): string {
  return socialPlatforms[platform.toLowerCase()]?.name || platform;
}
