// components/mdx/MDXContentWrapper.tsx — PRODUCTION STABLE (PAGES ROUTER SAFE)
// ✅ No SSR window access
// ✅ Dynamic DownloadCTA mapped correctly (default export guaranteed)
// ✅ Strict guards around frontmatter shapes
// ✅ Stable memo deps (no optional-chaining-in-deps pitfalls)
// ✅ Safe download handler (client-only)

import * as React from "react";
import dynamic from "next/dynamic";

import LegacyDiagram from "@/components/diagrams/LegacyDiagram";
import ProTip from "@/components/content/ProTip";
import FeatureGrid from "@/components/content/FeatureGrid";

// IMPORTANT:
// If DownloadCTA.client exports a named export instead of default, this was your crash:
// "Cannot read properties of undefined (reading 'default')"
// We force a default export mapping here, regardless of how the module exports it.
const DownloadCTA = dynamic(
  () =>
    import("@/components/content/DownloadCTA.client").then((m: any) => ({
      default: m?.default ?? m?.DownloadCTA ?? m,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="h-4 w-40 rounded bg-white/10" />
        <div className="mt-3 h-3 w-72 rounded bg-white/5" />
        <div className="mt-6 h-10 w-full rounded-xl bg-white/10" />
      </div>
    ),
  }
);

// -------------------------
// Types
// -------------------------
interface CTADetail {
  label: string;
  value: string;
  icon: string;
}

interface CTAConfig {
  badge?: string;
  details?: CTADetail[];
  features?: string[];
}

interface DownloadProcess {
  steps?: string[];
}

interface FeatureGridItem {
  title: string;
  description: string;
  icon?: string;
}

export interface MDXContentWrapperProps {
  content: React.ReactNode;
  frontmatter: {
    title?: string;
    useLegacyDiagram?: boolean;
    useProTip?: boolean;
    proTipContent?: string;
    proTipType?: "info" | "warning" | "success" | "danger";
    useFeatureGrid?: boolean;
    featureGridItems?: FeatureGridItem[];
    featureGridColumns?: number;
    useDownloadCTA?: boolean;
    ctaConfig?: CTAConfig;
    fileSize?: string;
    fileFormat?: string;
    downloadProcess?: DownloadProcess;
    file?: string;
    downloadUrl?: string;
    [key: string]: any;
  };
}

function asArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

function safeStr(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function safeUpper(v: unknown): string {
  const s = safeStr(v);
  return s ? s.toUpperCase() : "";
}

function safeUrl(v: unknown): string {
  const s = safeStr(v).trim();
  return s;
}

// -------------------------
// Component
// -------------------------
export function MDXContentWrapper({ content, frontmatter }: MDXContentWrapperProps) {
  // Flatten frontmatter values for stable deps / guardrails
  const file = safeUrl(frontmatter?.file);
  const downloadUrl = safeUrl(frontmatter?.downloadUrl);
  const title = safeStr(frontmatter?.title) || "Download Resource";

  const useLegacyDiagram = !!frontmatter?.useLegacyDiagram;

  const useProTip = !!frontmatter?.useProTip;
  const proTipContent = safeStr(frontmatter?.proTipContent);
  const proTipType = (frontmatter?.proTipType ?? "info") as "info" | "warning" | "success" | "danger";

  const useFeatureGrid = !!frontmatter?.useFeatureGrid;
  const featureGridItems = asArray<FeatureGridItem>(frontmatter?.featureGridItems);
  const featureGridColumns =
    typeof frontmatter?.featureGridColumns === "number" && frontmatter.featureGridColumns > 0
      ? frontmatter.featureGridColumns
      : 2;

  const useDownloadCTA = !!frontmatter?.useDownloadCTA;
  const ctaConfig: CTAConfig | undefined = frontmatter?.ctaConfig;
  const ctaBadge = safeStr(ctaConfig?.badge) || "Download";
  const ctaFeatures = asArray<string>(ctaConfig?.features);
  const ctaDetailsExtra = asArray<CTADetail>(ctaConfig?.details);
  const steps = asArray<string>(frontmatter?.downloadProcess?.steps);

  const fileSize = safeStr(frontmatter?.fileSize);
  const fileFormat = safeUpper(frontmatter?.fileFormat);

  const effectiveHref = file || downloadUrl || "";

  const handleDownloadClick = React.useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      // DownloadCTA might render anchor; prevent default so we can enforce noopener/noreferrer
      e.preventDefault();

      if (typeof window === "undefined") return;
      const link = effectiveHref;
      if (!link) return;

      window.open(link, "_blank", "noopener,noreferrer");
    },
    [effectiveHref]
  );

  const downloadDetails = React.useMemo<CTADetail[]>(() => {
    const details: CTADetail[] = [];

    if (fileSize) {
      details.push({ label: "File Size", value: fileSize, icon: "📦" });
    }

    if (fileFormat) {
      details.push({ label: "Format", value: fileFormat, icon: "📄" });
    }

    // Append extra details from config (if any)
    if (ctaDetailsExtra.length) {
      details.push(...ctaDetailsExtra);
    }

    return details;
  }, [fileSize, fileFormat, ctaDetailsExtra]);

  const showDownloadCTA = useDownloadCTA && !!ctaConfig && !!effectiveHref;

  return (
    <div className="mdx-content">
      {content}

      {/* Legacy Diagram */}
      {useLegacyDiagram ? <LegacyDiagram /> : null}

      {/* Pro Tip */}
      {useProTip && proTipContent ? <ProTip type={proTipType}>{proTipContent}</ProTip> : null}

      {/* Feature Grid */}
      {useFeatureGrid && featureGridItems.length ? (
        <FeatureGrid columns={featureGridColumns} items={featureGridItems} />
      ) : null}

      {/* Download CTA */}
      {showDownloadCTA ? (
        <DownloadCTA
          title={title}
          badge={ctaBadge}
          details={downloadDetails}
          features={ctaFeatures}
          steps={steps}
          buttonText="Download Now"
          onClick={handleDownloadClick}
          href={effectiveHref}
        />
      ) : null}
    </div>
  );
}

export default MDXContentWrapper;