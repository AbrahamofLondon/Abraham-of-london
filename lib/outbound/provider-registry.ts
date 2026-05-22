/**
 * lib/outbound/provider-registry.ts
 *
 * Provider-based outbound publishing registry.
 * Defines available providers and their current operational status.
 * Architecture is designed to accommodate Facebook, X, and LinkedIn
 * without tying publish logic to any single provider.
 */

export type OutboundProvider = "facebook" | "x" | "linkedin";

export type OutboundProviderStatus =
  | "active"     // fully operational, publishing available
  | "pending"    // under construction, not yet wired for publishing
  | "future"     // reserved, not yet implemented
  | "disabled";  // explicitly turned off

export type OutboundProviderEntry = {
  provider: OutboundProvider;
  label: string;
  description: string;
  status: OutboundProviderStatus;
  adminHref: string | null;
  reason?: string;
  crossPostNote?: string;
};

export const OUTBOUND_PROVIDER_REGISTRY: OutboundProviderEntry[] = [
  {
    provider: "linkedin",
    label: "LinkedIn",
    description: "Governed LinkedIn publishing via OAuth. Posts to member or organisation feed.",
    status: "active",
    adminHref: "/admin/outbound/linkedin",
  },
  {
    provider: "facebook",
    label: "Facebook",
    description: "Governed Facebook Page publishing via Meta Graph API. Supports links, images, and custom copy.",
    status: "active",
    adminHref: "/admin/outbound/facebook",
    crossPostNote:
      "Facebook cross-posts to connected X/Twitter accounts. X distribution is currently handled through this workflow.",
  },
  {
    provider: "x",
    label: "X (Twitter)",
    description: "Standalone X publishing via Twitter API v2. Bidirectional sync with Facebook — publish to both platforms in a single action.",
    status: "active",
    adminHref: "/admin/outbound/x",
    crossPostNote:
      "Facebook cross-posting (via connected X account) and standalone native X publishing are both supported. Use the sync option to coordinate posts across platforms.",
  },
];

export function getProviderEntry(
  provider: OutboundProvider,
): OutboundProviderEntry | null {
  return OUTBOUND_PROVIDER_REGISTRY.find((p) => p.provider === provider) ?? null;
}

export function getActiveProviders(): OutboundProviderEntry[] {
  return OUTBOUND_PROVIDER_REGISTRY.filter((p) => p.status === "active");
}
