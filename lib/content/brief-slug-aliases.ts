/* lib/content/brief-slug-aliases.ts — canonical renamed brief slug aliases */

export const VAULT_BRIEF_SLUG_ALIASES: Record<string, string> = {
  "frontier-resilience-01": "frontier-resilience-surviving-volatility-without-losing-governing-order",
};

export function resolveVaultBriefSlugAlias(slug: string): string | null {
  return VAULT_BRIEF_SLUG_ALIASES[slug] || null;
}

