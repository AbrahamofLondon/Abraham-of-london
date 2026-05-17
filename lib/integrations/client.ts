/**
 * lib/integrations/client.ts
 * Browser-safe integration helpers.
 *
 * Only functions that execute in the browser. No Prisma, no token-store,
 * no server-only imports. Safe to import from "use client" components.
 */

export type ProviderType = "google" | "slack" | "jira" | "linear" | "github" | "notion";

export function getOAuthRedirectUrl(provider: ProviderType): string {
  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  switch (provider) {
    case "google":
      return `${baseUrl}/api/integrations/google/connect`;
    case "slack":
      return `${baseUrl}/api/integrations/slack/connect`;
    default:
      throw new Error(`OAuth not implemented for provider: ${provider}`);
  }
}

export function initiateOAuth(provider: ProviderType): void {
  const url = getOAuthRedirectUrl(provider);
  window.location.href = url;
}
