// lib/inner-circle/access.server.ts — SINGLE SOURCE OF TRUTH (SERVER ONLY)
// IMPORTANT:
// - Do NOT import "server-only" here (pages/ router does not support it).
// - Must only be imported in server contexts. If bundled client-side, hard-fail.

function assertServerOnly(moduleName: string) {
  if (typeof window !== "undefined") {
    throw new Error(
      `[${moduleName}] is server-only but was loaded in the browser. ` +
        `Move the import into getServerSideProps/getStaticProps or an API route.`
    );
  }
}

assertServerOnly("lib/inner-circle/access.server.ts");

export type InnerCircleTier = "public" | "basic" | "premium" | "enterprise" | "restricted";

export type InnerCircleAccess = {
  tier: InnerCircleTier;
  // You can expand later (expiresAt, entitlements, flags, etc.)
  ok: boolean;
};

export function normalizeTier(input: unknown): InnerCircleTier {
  const v = String(input || "public").toLowerCase().trim();
  if (v === "basic" || v === "premium" || v === "enterprise" || v === "restricted") return v;
  return "public";
}

// Placeholder rule engine (replace with your actual policy)
export function getInnerCircleAccess(params: {
  userTier?: unknown;
  requiresTier?: InnerCircleTier;
}): InnerCircleAccess {
  const tier = normalizeTier(params.userTier);
  const requiresTier = params.requiresTier ?? "public";

  const rank: Record<InnerCircleTier, number> = {
    public: 0,
    basic: 1,
    premium: 2,
    enterprise: 3,
    restricted: 4,
  };

  const ok = rank[tier] >= rank[requiresTier];

  return { tier, ok };
}