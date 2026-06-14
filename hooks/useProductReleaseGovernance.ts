import { useEffect, useState } from "react";
import type { ProductReleaseGovernance } from "@/lib/product/product-release-governance";

/**
 * Hook to load ProductReleaseGovernance for a product
 * Fetches from the governance matrix or returns null if not found
 */
export function useProductReleaseGovernance(
  productCode: string
): ProductReleaseGovernance | null {
  const [governance, setGovernance] = useState<ProductReleaseGovernance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadGovernance() {
      try {
        // Try to load from generated governance matrix
        const response = await fetch("/api/product-release-governance/" + encodeURIComponent(productCode));
        if (response.ok) {
          const data = await response.json();
          setGovernance(data);
        } else {
          setGovernance(null);
        }
      } catch {
        // If governance cannot be loaded, treat as unavailable
        setGovernance(null);
      } finally {
        setLoading(false);
      }
    }

    loadGovernance();
  }, [productCode]);

  return governance;
}
