/**
 * lib/content/route-content-types.mjs
 *
 * SINGLE SOURCE OF TRUTH (SSOT) — which Contentlayer generated type directories
 * each public ISR content route's `getStaticProps` actually loads.
 *
 * This is a `.mjs` (plain JS) module so it can be imported at Node load time by
 * BOTH `next.config.mjs` (to GENERATE outputFileTracingIncludes) and the
 * drift-guard `scripts/check-content-route-tracing.mjs` (to verify the tracing
 * covers every type each route's loader reads). One data source → config and
 * guard cannot drift apart. `route-content-types.ts` re-exports this for any
 * TypeScript consumer.
 *
 * WHY THIS EXISTS
 * ---------------
 * Content disappeared after deploy because the content pages are `●` ISR routes
 * whose `getStaticProps` reads `.contentlayer/generated/<Type>/_index.json` from
 * the runtime filesystem (lib/contentlayer-helper.ts) via dynamic `fs` calls the
 * Next output tracer cannot see — so the generated indexes were never bundled
 * into the Netlify server handler. Build time has the files (static generation
 * works → content appears post-deploy); the first ISR revalidation re-runs
 * getStaticProps in a handler with no generated data, the helper degrades to an
 * empty registry, and Next caches an empty page.
 *
 * Fix (Approach A): trace ONLY each route's own type `_index.json` into the
 * handler — keeping it small rather than inlining the full ~64.57 MB corpus
 * (importing the `contentlayer/generated` barrel is forbidden by
 * scripts/check-contentlayer-runtime-imports.mjs precisely because it bundles
 * everything and overflows the function size limit).
 */

/**
 * Route path (as in the Next build manifest / outputFileTracingIncludes key) →
 * the generated type directory names that route's loader reads. Mirrors
 * lib/contentlayer-helper.ts COLLECTION_DIRS per content kind.
 * @type {Record<string, string[]>}
 */
export const ROUTE_CONTENT_TYPES = {
  // ── Detail routes ─────────────────────────────────────────────────────────
  "/shorts/[...slug]": ["Short"],
  "/blog/[...slug]": ["Post"],
  "/blog/series/[seriesSlug]/[partSlug]": ["Post"],
  "/briefs/[slug]": ["Brief", "VaultBrief"],
  "/vault/briefs/[slug]": ["Brief", "VaultBrief"],
  "/lexicon/[slug]": ["Lexicon"],
  "/books/[slug]": ["Book"],
  "/canon/[slug]": ["Canon"],
  "/playbooks/[slug]": ["Playbook"],
  "/editorials/[slug]": ["Editorial"],
  "/editorials/series/[seriesSlug]/[partSlug]": ["EditorialSeriesPart", "Editorial"],
  "/intelligence/[slug]": ["Intelligence"],
  "/prints/[slug]": ["Print"],
  "/resources/[...slug]": ["Resource"],
  "/resources/surrender-framework/[slug]": ["Resource"],
  "/strategy/[...slug]": ["Strategy"],
  "/downloads/[...slug]": ["Download"],
  "/vault/[...slug]": ["Vault"],
  "/events/[slug]": ["Event"],

  // ── Index / listing pages (also `getStaticProps` ISR — same persistence bug) ─
  "/shorts": ["Short"],
  "/blog": ["Post"],
  "/books": ["Book"],
  "/briefs": ["Brief", "VaultBrief"],
  "/canon": ["Canon"],
  "/events": ["Event"],
  "/frameworks": ["Playbook", "Resource"],
  "/lexicon": ["Lexicon"],
  "/playbooks": ["Playbook"],
  "/resources": ["Resource"],
  "/vault": ["Brief", "VaultBrief", "Download"],
  "/content": ["Short", "Post"],

  // ── Landing / collection pages that read content ──────────────────────────
  "/briefs/institutional-alpha": ["Brief", "VaultBrief"],
  "/briefs/sovereign-intelligence": ["Brief", "VaultBrief"],
  "/canon-campaign": ["Canon"],
  "/intelligence/market": ["Brief", "VaultBrief"],
};

/**
 * Routes whose loader resolves ANY content kind (kind inferred from the slug at
 * request time), so they trace the full public content set. Kept explicit so the
 * drift-guard treats them as a known broad-trace case, not a violation.
 * @type {string[]}
 */
export const CATCH_ALL_CONTENT_ROUTES = [
  "/[slug]",
  "/content/[...slug]",
  "/registry/[type]/[slug]",
];

/** Every generated type a catch-all route may need. @type {string[]} */
export const ALL_CONTENT_TYPES = [
  "Short", "Post", "Brief", "VaultBrief", "Lexicon", "Book", "Canon", "Playbook",
  "Editorial", "EditorialSeriesPart", "Intelligence", "Print", "Resource",
  "Strategy", "Download", "Vault", "Event",
];

/** Build the `_index.json` trace paths for a set of generated types. */
export function tracePathsForTypes(types) {
  return types.map((t) => `./.contentlayer/generated/${t}/_index.json`);
}

/**
 * Build the full outputFileTracingIncludes object from the SSOT — the exact
 * shape `next.config.mjs` spreads into its config. Catch-all routes get the full
 * content set.
 * @returns {Record<string, string[]>}
 */
export function buildContentTracingIncludes() {
  const includes = {};
  for (const [route, types] of Object.entries(ROUTE_CONTENT_TYPES)) {
    includes[route] = tracePathsForTypes(types);
  }
  for (const route of CATCH_ALL_CONTENT_ROUTES) {
    includes[route] = tracePathsForTypes(ALL_CONTENT_TYPES);
  }
  return includes;
}
