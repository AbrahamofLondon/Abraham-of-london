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
 *   - LEGACY_DISABLED routes must NOT have physical app/[dir]/page.tsx files.
 *     They must be handled by config-level redirects in next.config.mjs.
 *   - REDIRECT_ONLY routes must NOT have physical app/[dir]/page.tsx files.
 *     They must be handled by config-level redirects in next.config.mjs.
 *   - DEBUG_INTERNAL routes must NOT be reachable without authentication.
 *   - physicalRouteAllowed: false means the route MUST NOT have an app/page.tsx.
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
  /**
   * Whether an app/[dir]/page.tsx is permitted for this route.
   * false = must be handled by config-level redirects (next.config.mjs redirects()),
   *         netlify.toml, or vercel.json rewrites — never by an App Router page file.
   * true  = a physical app/[dir]/page.tsx is expected and required.
   */
  physicalRouteAllowed: boolean;
  /**
   * Whether a config-level redirect is configured for this route
   * (in next.config.mjs redirects(), netlify.toml, or vercel.json).
   * Required to be true when physicalRouteAllowed is false.
   */
  redirectConfigured: boolean;
  /**
   * Whether this route is expected to be reachable and functional in production.
   * Retired routes that permanently 404 or permanently redirect should be false.
   */
  productionDeployable: boolean;
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
  // These routes have NO physical app/[dir]/page.tsx files.
  // They are handled entirely by config-level redirects in next.config.mjs.
  {
    path: "/dashboard/live",
    class: "REDIRECT_ONLY",
    owner: "platform",
    intent: "Permanent redirect to /admin for retired dashboard path",
    deployable: true,
    requiresAuth: false,
    requiresDatabase: false,
    platform: "vercel",
    physicalRouteAllowed: false,
    redirectConfigured: true,
    productionDeployable: false,
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
    physicalRouteAllowed: false,
    redirectConfigured: true,
    productionDeployable: false,
  },
  {
    path: "/dashboard/purpose-alignment",
    class: "REDIRECT_ONLY",
    owner: "platform",
    intent: "Permanent redirect to /purpose-alignment",
    deployable: true,
    requiresAuth: false,
    requiresDatabase: false,
    platform: "vercel",
    physicalRouteAllowed: false,
    redirectConfigured: true,
    productionDeployable: false,
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
    physicalRouteAllowed: false,
    redirectConfigured: true,
    productionDeployable: false,
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
    physicalRouteAllowed: false,
    redirectConfigured: true,
    productionDeployable: false,
  },

  // ─── LEGACY_DISABLED ──────────────────────────────────────────────────────
  // These routes have NO physical app/[dir]/page.tsx files.
  // They are handled by config-level redirects or simply 404.
  {
    path: "/downloads/vault",
    class: "LEGACY_DISABLED",
    owner: "platform",
    intent: "Retired vault download listing; superseded by authenticated /portal",
    deployable: false,
    requiresAuth: false,
    requiresDatabase: false,
    platform: "vercel",
    physicalRouteAllowed: false,
    redirectConfigured: true,
    productionDeployable: false,
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
    physicalRouteAllowed: true,
    redirectConfigured: false,
    productionDeployable: true,
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
    physicalRouteAllowed: true,
    redirectConfigured: false,
    productionDeployable: true,
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
    physicalRouteAllowed: true,
    redirectConfigured: false,
    productionDeployable: true,
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
    physicalRouteAllowed: true,
    redirectConfigured: false,
    productionDeployable: true,
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
    physicalRouteAllowed: true,
    redirectConfigured: false,
    productionDeployable: true,
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
    physicalRouteAllowed: true,
    redirectConfigured: false,
    productionDeployable: true,
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
    physicalRouteAllowed: true,
    redirectConfigured: false,
    productionDeployable: true,
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
    physicalRouteAllowed: true,
    redirectConfigured: false,
    productionDeployable: true,
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
    physicalRouteAllowed: true,
    redirectConfigured: false,
    productionDeployable: true,
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
    physicalRouteAllowed: true,
    redirectConfigured: false,
    productionDeployable: true,
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
    physicalRouteAllowed: true,
    redirectConfigured: false,
    productionDeployable: true,
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
    physicalRouteAllowed: true,
    redirectConfigured: false,
    productionDeployable: true,
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
    physicalRouteAllowed: true,
    redirectConfigured: false,
    productionDeployable: true,
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
    physicalRouteAllowed: true,
    redirectConfigured: false,
    productionDeployable: true,
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
    physicalRouteAllowed: true,
    redirectConfigured: false,
    productionDeployable: true,
  },
  {
    path: "/purpose-alignment",
    class: "PUBLIC_DYNAMIC",
    owner: "product",
    intent: "Purpose alignment diagnostic tool (parallel support surface)",
    deployable: true,
    requiresAuth: false,
    requiresDatabase: false,
    platform: "vercel",
    physicalRouteAllowed: true,
    redirectConfigured: false,
    productionDeployable: true,
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
    physicalRouteAllowed: true,
    redirectConfigured: false,
    productionDeployable: true,
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
    physicalRouteAllowed: true,
    redirectConfigured: false,
    productionDeployable: true,
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
    physicalRouteAllowed: true,
    redirectConfigured: false,
    productionDeployable: true,
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
    physicalRouteAllowed: true,
    redirectConfigured: false,
    productionDeployable: true,
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

/** Routes that must NOT have a physical app/[dir]/page.tsx file. */
export const NO_PHYSICAL_ROUTE_PATHS = ROUTE_REGISTRY
  .filter((r) => !r.physicalRouteAllowed)
  .map((r) => r.path);
