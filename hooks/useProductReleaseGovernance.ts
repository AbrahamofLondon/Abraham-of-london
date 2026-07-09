import { useEffect, useState } from "react";
import type { ProductReleaseGovernance } from "@/lib/product/product-release-governance";
import { ProductReleaseGovernanceSchema } from "@/lib/product/product-release-governance-schema";

/**
 * Hook to load ProductReleaseGovernance for a product.
 * The API adapts estate disposition records into the canonical runtime DTO;
 * the client parses the same schema so bad governance JSON fails closed.
 */
export function useProductReleaseGovernance(
  productCode: string
): ProductReleaseGovernance | null {
  const [governance, setGovernance] = useState<ProductReleaseGovernance | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadGovernance() {
      try {
        const response = await fetch("/api/product-release-governance/" + encodeURIComponent(productCode));
        if (!response.ok) {
          if (!cancelled) setGovernance(null);
          return;
        }
        const data = await response.json();
        const parsed = ProductReleaseGovernanceSchema.parse(data);
        if (!cancelled) setGovernance(parsed);
      } catch {
        if (!cancelled) setGovernance(null);
      }
    }

    void loadGovernance();
    return () => {
      cancelled = true;
    };
  }, [productCode]);

  return governance;
}