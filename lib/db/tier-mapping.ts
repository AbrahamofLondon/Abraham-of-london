/* lib/db/tier-mapping.ts — Prisma AccessTier ↔ SSOT (hyphen) mapping
   - Works with Prisma enum `AccessTier` (underscored inner_circle)
   - Also compiles safely if Prisma client is temporarily stale (fallback typing)
*/

// If Prisma client is generated correctly, this resolves.
// If it isn't, TS may complain; so we use a fallback union type below.
export type PrismaAccessTier =
  | "public"
  | "member"
  | "inner_circle"
  | "client"
  | "legacy"
  | "architect"
  | "owner";

export type SSOTAccessTier =
  | "public"
  | "member"
  | "inner-circle"
  | "client"
  | "legacy"
  | "architect"
  | "owner";

// Map Prisma enums (underscores) to SSOT strings (hyphens)
export function prismaTierToSSOT(tier: PrismaAccessTier): SSOTAccessTier {
  const map: Record<PrismaAccessTier, SSOTAccessTier> = {
    public: "public",
    member: "member",
    inner_circle: "inner-circle",
    client: "client",
    legacy: "legacy",
    architect: "architect",
    owner: "owner",
  };
  return map[tier];
}

// Map SSOT strings (hyphens) to Prisma enums (underscores)
export function ssotTierToPrisma(tier: SSOTAccessTier | string): PrismaAccessTier {
  const t = String(tier || "public").trim().toLowerCase();

  const map: Record<SSOTAccessTier, PrismaAccessTier> = {
    public: "public",
    member: "member",
    "inner-circle": "inner_circle",
    client: "client",
    legacy: "legacy",
    architect: "architect",
    owner: "owner",
  };

  // tolerate accidental underscore input too
  if (t === "inner_circle") return "inner_circle";

  const key = t as SSOTAccessTier;
  const mapped = map[key];
  if (!mapped) throw new Error(`Invalid SSOT tier: ${tier}`);
  return mapped;
}

// Helper for queries that need to filter by tier
export function tierFilter(
  tier: SSOTAccessTier | string | Array<SSOTAccessTier | string>
): PrismaAccessTier | PrismaAccessTier[] {
  if (Array.isArray(tier)) return tier.map((t) => ssotTierToPrisma(t));
  return ssotTierToPrisma(tier);
}