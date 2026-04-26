/**
 * Toolkit type definitions — deployable systems, not content.
 */

export type ToolkitTier = "public" | "registered" | "paid" | "enterprise";

export type Toolkit = {
  slug: string;
  title: string;
  domain: string;
  description: string;
  components: string[];
  outputs: string[];
  linkedFrameworks: string[];
  linkedProducts: string[];
  tier: ToolkitTier;
};
