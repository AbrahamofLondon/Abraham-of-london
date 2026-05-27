/**
 * lib/platform/route-deployment-registry.ts
 *
 * Canonical registry of every non-trivial dynamic route in the application.
 *
 * Purpose:
 *   Provides a machine-readable source of truth for the build integrity guard
 *   (scripts/check-route-lambda-integrity.mjs) and for future tooling.
 *
 * Rules:
 *   - Every route in app/** that is NOT a simple redirect and NOT fully static
 *     MUST have an entry here.
 *   - LEGACY_DISABLED routes must NOT remain as dynamic lambdas — they should be
 *     simple redirect/notFound server components.
 *   - DEBUG_INTERNAL routes must NOT be reachable without authentication.
 *   - deployable: false means the route must redirect/404 before reaching users.
 */

export type RouteClass =
  | "PUBLIC_STATIC"      // Pre-rendered at build; no runtime data
  | "PUBLIC_DYNAMIC"     // Server-rendered per request; public access
  | "ADMIN_DYNAMIC"      // Server-rendered; requires admin auth
  | "API_DYNAMIC"        // App Router API route (route.ts)
  | "CLIENT_DELIVERY"    // Client component shell; auth enforced client-side
  | "DEBUG_INTERNAL"     // Internal tooling; must not be publicly accessible
  | "LEGACY_DISABLED"    // Route exists in code but is permanently retired
  | "REDIRECT_ONLY";     // Route exists solely to redirect to canonical URL

export type DeploymentPlatform = "vercel" | "netlify" | "static" | "disabled";

export interface RouteEntry {
  /** URL path as it appears in the browser (no trailing slash, use [param] for params) */
  path: string;
  /** Classification controlling deployment behaviour */
  class: RouteClass;
  /** Team or domain that owns this route */
  owner: string;
  /** What runtime intent this route serves */
  intent: string;
  /** Whether the route should produce a working lambda/page in production */
  deployable: boolean;
  /** True if the route should redirect non-authenticated requests */
  requiresAuth: boolean;
  /** True if the route executes Prisma queries at request time */
  requiresDatabase: boolean;
  /** Where this route is deployed */
  platform: DeploymentPlatform;
}

/**
 * Route registry. Alphabetically ordered within each class group.
 *
 * IMPORTANT: When you add a new App Router page that is NOT purely static and
 * NOT a simple redirect, add it here. The build guard will warn if a dynamic
 * route appears in the manifest without a registry entry.
 */
export const ROUTE_REGISTRY: RouteEntry[] = [
  // ─── REDIRECT_ONLY ────────────────────────────────────────────────────────
  {
    path: "/dashboard/live",
    class: "REDIRECT_ONLY",
    owner: "platform",
    intent: "Permanent redirect to /admin for retired dashboard path",
    deployable: true,
    requiresAuth: false,
    requiresDatabase: false,
    platform: "vercel",
  },
  {
    path: "/dashboard/pdf-analytics",
    class: "REDIRECT_ONLY",
    owner: "platform",
    intent: "Permanent redirect to /admin/reporting/lineage for retired OGR-IV terminal",
    deployable: true,
    requiresAuth: false,
    requiresDatabase: false,
    platform: "vercel",
  },
  {
    path: "/dashboard/purpose-alignment",
    class: "REDIRECT_ONLY",
    owner: "platform",
    intent: "Permanent redirect to /diagnostics/purpose-alignment",
    deployable: true,
    requiresAuth: false,
    requiresDatabase: false,
    platform: "vercel",
  },
  {
    path: "/pdf-dashboard",
    class: "REDIRECT_ONLY",
    owner: "platform",
    intent: "Permanent redirect to /admin/reporting/lineage for retired PDF telemetry dashboard",
    deployable: true,
    requiresAuth: false,
    requiresDatabase: false,
    platform: "vercel",
  },
  {
    path: "/testing/lab",
    class: "REDIRECT_ONLY",
    owner: "platform",
    intent: "Permanent redirect to /admin/intelligence-foundry for retired testing route",
    deployable: true,
    requiresAuth: false,
    requiresDatabase: false,
    platform: "vercel",
  },

  // ─── LEGACY_DISABLED ──────────────────────────────────────────────────────
  {
    path: "/downloads/vault",
    class: "LEGACY_DISABLED",
    owner: "platform",
    intent: "Retired vault download listing; superseded by authenticated /portal",
    deployable: true,  // returns 404/notFound
    requiresAuth: false,
    requiresDatabase: false,
    platform: "vercel",
  },

  // ─── ADMIN_DYNAMIC ────────────────────────────────────────────────────────
  {
    path: "/admin",
    class: "ADMIN_DYNAMIC",
    owner: "ops",
    intent: "Admin command centre — requires admin session",
    deployable: true,
    requiresAuth: true,
    requiresDatabase: true,
    platform: "vercel",
  },
  {
    path: "/admin/access",
    class: "ADMIN_DYNAMIC",
    owner: "ops",
    intent: "Access tier management",
    deployable: true,
    requiresAuth: true,
    requiresDatabase: true,
    platform: "vercel",
  },
  {
    path: "/admin/campaigns",
    class: "ADMIN_DYNAMIC",
    owner: "product",
    intent: "Campaign management list",
    deployable: true,
    requiresAuth: true,
    requiresDatabase: true,
    platform: "vercel",
  },
  {
    path: "/admin/campaigns/[id]",
    class: "ADMIN_DYNAMIC",
    owner: "product",
    intent: "Single campaign detail",
    deployable: true,
    requiresAuth: true,
    requiresDatabase: true,
    platform: "vercel",
  },
  {
    path: "/admin/intelligence-foundry",
    class: "ADMIN_DYNAMIC",
    owner: "intelligence",
    intent: "Agent/model intelligence foundry operator console",
    deployable: true,
    requiresAuth: true,
    requiresDatabase: true,
    platform: "vercel",
  },
  {
    path: "/admin/organisations",
    class: "ADMIN_DYNAMIC",
    owner: "product",
    intent: "Organisation list and management",
    deployable: true,
    requiresAuth: true,
    requiresDatabase: true,
    platform: "vercel",
  },
  {
    path: "/admin/organisations/[id]",
    class: "ADMIN_DYNAMIC",
    owner: "product",
    intent: "Single organisation detail",
    deployable: true,
    requiresAuth: true,
    requiresDatabase: true,
    platform: "vercel",
  },
  {
    path: "/admin/reporting/lineage",
    class: "ADMIN_DYNAMIC",
    owner: "intelligence",
    intent: "Report lineage and PDF analytics admin view",
    deployable: true,
    requiresAuth: true,
    requiresDatabase: true,
    platform: "vercel",
  },
  {
    path: "/portfolio",
    class: "ADMIN_DYNAMIC",
    owner: "ops",
    intent: "Institutional master portfolio view (route group /(dashboard))",
    deployable: true,
    requiresAuth: true,
    requiresDatabase: false,
    platform: "vercel",
  },

  // ─── PUBLIC_DYNAMIC ───────────────────────────────────────────────────────
  {
    path: "/strategy-room",
    class: "PUBLIC_DYNAMIC",
    owner: "product",
    intent: "Strategy room diagnostic entry point",
    deployable: true,
    requiresAuth: false,
    requiresDatabase: true,
    platform: "vercel",
  },
  {
    path: "/registry/[...slug]",
    class: "PUBLIC_DYNAMIC",
    owner: "platform",
    intent: "Vault content registry gated by VaultGuard",
    deployable: true,
    requiresAuth: true,
    requiresDatabase: true,
    platform: "vercel",
  },
  {
    path: "/boardroom/dossier/[dossierId]",
    class: "PUBLIC_DYNAMIC",
    owner: "product",
    intent: "Boardroom delivery dossier viewer",
    deployable: true,
    requiresAuth: true,
    requiresDatabase: true,
    platform: "vercel",
  },
  {
    path: "/assessment/[token]",
    class: "PUBLIC_DYNAMIC",
    owner: "product",
    intent: "Team assessment response form (token-gated)",
    deployable: true,
    requiresAuth: false,
    requiresDatabase: true,
    platform: "vercel",
  },
  {
    path: "/audit/[id]",
    class: "PUBLIC_DYNAMIC",
    owner: "product",
    intent: "Constitutional audit detail view",
    deployable: true,
    requiresAuth: true,
    requiresDatabase: true,
    platform: "vercel",
  },
  {
    path: "/portal",
    class: "PUBLIC_DYNAMIC",
    owner: "product",
    intent: "Client portal (force-dynamic, auth enforced)",
    deployable: true,
    requiresAuth: true,
    requiresDatabase: true,
    platform: "vercel",
  },

  // ─── PUBLIC_DYNAMIC ───────────────────────────────────────────────────────
  {
    path: "/purpose-alignment",
    class: "PUBLIC_DYNAMIC",
    owner: "product",
    intent: "Purpose alignment diagnostic tool (parallel support surface)",
    deployable: true,
    requiresAuth: false,
    requiresDatabase: false,
    platform: "vercel",
  },

  // ─── CLIENT_DELIVERY ──────────────────────────────────────────────────────
  {
    path: "/__pdf/[slug]",
    class: "CLIENT_DELIVERY",
    owner: "platform",
    intent: "Server-side PDF render route (App Router)",
    deployable: true,
    requiresAuth: true,
    requiresDatabase: false,
    platform: "vercel",
  },
  {
    path: "/render/pdf/[id]",
    class: "CLIENT_DELIVERY",
    owner: "platform",
    intent: "Dynamic PDF render route",
    deployable: true,
    requiresAuth: true,
    requiresDatabase: false,
    platform: "vercel",
  },
  {
    path: "/client",
    class: "CLIENT_DELIVERY",
    owner: "product",
    intent: "Client portal landing",
    deployable: true,
    requiresAuth: true,
    requiresDatabase: true,
    platform: "vercel",
  },
  {
    path: "/settings/integrations",
    class: "CLIENT_DELIVERY",
    owner: "product",
    intent: "OAuth integration management (Google Calendar, Slack)",
    deployable: true,
    requiresAuth: true,
    requiresDatabase: false,
    platform: "vercel",
  },

  // ─── DEBUG_INTERNAL ───────────────────────────────────────────────────────
  // (none active — all retired to REDIRECT_ONLY or LEGACY_DISABLED)
];

/** Quick lookup: is this path in the registry? */
export function isRegisteredRoute(path: string): boolean {
  return ROUTE_REGISTRY.some((r) => r.path === path);
}

/** Get registry entry for a path. */
export function getRouteEntry(path: string): RouteEntry | undefined {
  return ROUTE_REGISTRY.find((r) => r.path === path);
}

/** All routes that should NOT produce a dynamic Lambda (static or redirect). */
export const NON_LAMBDA_CLASSES = new Set<RouteClass>([
  "PUBLIC_STATIC",
  "REDIRECT_ONLY",
  "LEGACY_DISABLED",
]);
