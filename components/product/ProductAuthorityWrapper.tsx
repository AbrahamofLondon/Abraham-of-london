/**
 * components/product/ProductAuthorityWrapper.tsx
 *
 * ProductAuthorityWrapper Component
 *
 * Drop-in wrapper that automatically resolves and displays ProductAuthorityContract
 * for a product. Simplifies integration of authority state into product pages.
 *
 * Usage:
 *   <ProductAuthorityWrapper productCode="fast_diagnostic" showPanel={true}>
 *     {children}
 *   </ProductAuthorityWrapper>
 *
 * Or just for the authority display:
 *   <ProductAuthorityWrapper productCode="fast_diagnostic" />
 */

import React from "react";
import { resolveProductAuthority, getDefaultProductConfigurations } from "@/lib/product/resolve-product-authority";
import { ProductAuthorityBadge } from "./ProductAuthorityBadge";
import { ProductAuthorityPanel } from "./ProductAuthorityPanel";
import { ProductAuthorityNotice } from "./ProductAuthorityNotice";
import { ProductEvidenceStatus } from "./ProductEvidenceStatus";

interface ProductAuthorityWrapperProps {
  /**
   * Product code to resolve authority for (required)
   */
  productCode: string;

  /**
   * Whether to show the full authority panel
   * @default false
   */
  showPanel?: boolean;

  /**
   * Whether to show evidence status grid
   * @default false
   */
  showEvidence?: boolean;

  /**
   * Whether to show authority notice (for blocked/limited products)
   * @default true
   */
  showNotice?: boolean;

  /**
   * Size of authority badge
   * @default "medium"
   */
  badgeSize?: "small" | "medium" | "large";

  /**
   * Layout style
   * @default "inline"
   */
  layout?: "inline" | "block" | "panel";

  /**
   * Children to render after authority info
   */
  children?: React.ReactNode;

  /**
   * CSS class for wrapper
   */
  className?: string;

  /**
   * Custom styling
   */
  style?: React.CSSProperties;
}

export function ProductAuthorityWrapper({
  productCode,
  showPanel = false,
  showEvidence = false,
  showNotice = true,
  badgeSize = "medium",
  layout = "inline",
  children,
  className = "",
  style = {},
}: ProductAuthorityWrapperProps) {
  // Resolve product authority
  const configs = getDefaultProductConfigurations();
  const config = configs.find((c) => c.productCode === productCode);

  if (!config) {
    console.warn(`ProductAuthorityWrapper: Product "${productCode}" not found in default configurations`);
    return <>{children}</>;
  }

  const contract = resolveProductAuthority(config);

  // Layout: inline (badge + text)
  if (layout === "inline") {
    return (
      <div className={className} style={style}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: children ? "16px" : 0 }}>
          <ProductAuthorityBadge
            productCode={productCode}
            currentAuthorityState={contract.currentAuthorityState}
            size={badgeSize}
          />
          <p style={{ color: "#6b7280", fontSize: "14px", margin: 0 }}>
            {contract.publicClaimLanguage}
          </p>
        </div>
        {children}
      </div>
    );
  }

  // Layout: block (stacked)
  if (layout === "block") {
    return (
      <div className={className} style={style}>
        <div style={{ marginBottom: "12px" }}>
          <ProductAuthorityBadge
            productCode={productCode}
            currentAuthorityState={contract.currentAuthorityState}
            size={badgeSize}
          />
        </div>
        <p style={{ color: "#6b7280", fontSize: "14px", marginBottom: "12px" }}>
          {contract.publicClaimLanguage}
        </p>
        {showNotice && <ProductAuthorityNotice contract={contract} />}
        {children}
      </div>
    );
  }

  // Layout: panel (detailed)
  if (layout === "panel") {
    return (
      <div className={className} style={style}>
        <ProductAuthorityPanel contract={contract} expanded={showPanel} />
        {showEvidence && <div style={{ marginTop: "16px" }}><ProductEvidenceStatus contract={contract} /></div>}
        {showNotice && <div style={{ marginTop: "16px" }}><ProductAuthorityNotice contract={contract} /></div>}
        {children && <div style={{ marginTop: "16px" }}>{children}</div>}
      </div>
    );
  }

  return <>{children}</>;
}

export default ProductAuthorityWrapper;
