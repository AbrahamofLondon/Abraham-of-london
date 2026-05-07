/* components/mdx/MDXContentWrapper.tsx — INSTITUTIONAL VERSION */
import * as React from "react";
import dynamic from "next/dynamic";
import FeatureGrid from "@/components/content/FeatureGrid";
import DocumentFooter from "@/components/mdx/DocumentFooter";
import type { TierDirective } from "@/lib/resources/tier-metadata";

import type { DownloadCTAProps, CTADetail } from "@/types/download-cta";
import type { FeatureGridItem } from "@/components/content/FeatureGrid";

const DownloadCTA = dynamic<DownloadCTAProps>(
  () =>
    import("@/components/content/DownloadCTA.client").then(
      (m: any) => m?.default ?? m,
    ),
  { ssr: false },
);

type FrontmatterLike = {
  title?: string;
  version?: string;
  id?: string;
  series?: string;
  directive?: unknown;
  useFeatureGrid?: boolean;
  featureGridItems?: FeatureGridItem[] | unknown;
  featureGridColumns?: number | string;
  useDownloadCTA?: boolean;
  downloadCTA?: DownloadCTAProps | unknown;
  ctaDetails?: CTADetail[] | unknown;
  watermarkId?: string;
  forensicFooter?: string;
  classification?: string;
  issuedTo?: string;
  issuedAt?: string;
  [key: string]: unknown;
};

export interface MDXContentWrapperProps {
  content: React.ReactNode;
  frontmatter: FrontmatterLike;
}

/* -------------------------------------------------------------------------- */
/* Utilities                                                                  */
/* -------------------------------------------------------------------------- */

function safeStr(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function asNumber(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const parsed = Number(value.trim());
    if (Number.isFinite(parsed)) return parsed;
  }

  return fallback;
}

function asBoolean(value: unknown): boolean {
  return value === true;
}

function asObject(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function isCTADetail(value: unknown): value is CTADetail {
  const obj = asObject(value);
  if (!obj) return false;

  return Object.keys(obj).length > 0;
}

function asCTADetailArray(value: unknown): CTADetail[] {
  return asArray<unknown>(value).filter(isCTADetail);
}

function isFeatureGridItem(value: unknown): value is FeatureGridItem {
  const obj = asObject(value);
  if (!obj) return false;

  return Object.keys(obj).length > 0;
}

function asFeatureGridItems(value: unknown): FeatureGridItem[] {
  return asArray<unknown>(value).filter(isFeatureGridItem);
}

function isDownloadCTAProps(value: unknown): value is DownloadCTAProps {
  const obj = asObject(value);
  if (!obj) return false;

  return (
    typeof obj.title === "string" &&
    typeof obj.badge === "string" &&
    Array.isArray(obj.details) &&
    Array.isArray(obj.features)
  );
}

function asDownloadCTAProps(value: unknown): DownloadCTAProps | null {
  return isDownloadCTAProps(value) ? value : null;
}

function isTierDirective(value: unknown): value is TierDirective {
  const candidate = asObject(value);
  if (!candidate) return false;

  return (
    typeof candidate.tier === "string" &&
    candidate.tier.trim().length > 0 &&
    typeof candidate.displayTier === "string" &&
    candidate.displayTier.trim().length > 0 &&
    typeof candidate.mandate === "string" &&
    candidate.mandate.trim().length > 0 &&
    Array.isArray(candidate.focusNodes) &&
    typeof candidate.riskLevel === "string" &&
    candidate.focusNodes.every((node) => typeof node === "string")
  );
}

function resolveCTADetails(
  explicitDetails: CTADetail[],
  fallbackProps: DownloadCTAProps | null,
): CTADetail[] {
  if (explicitDetails.length > 0) return explicitDetails;

  const maybeDetails = fallbackProps?.details;
  return Array.isArray(maybeDetails)
    ? maybeDetails.filter((item): item is CTADetail => isCTADetail(item))
    : [];
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export function MDXContentWrapper({
  content,
  frontmatter,
}: MDXContentWrapperProps) {
  const title = safeStr(frontmatter?.title) || "Download Resource";
  const tokenId = safeStr(frontmatter?.id);
  const version = safeStr(frontmatter?.version);
  const series = safeStr(frontmatter?.series);

  const watermarkId = safeStr(frontmatter?.watermarkId);
  const forensicFooter = safeStr(frontmatter?.forensicFooter);
  const classification = safeStr(frontmatter?.classification);
  const issuedTo = safeStr(frontmatter?.issuedTo);
  const issuedAt = safeStr(frontmatter?.issuedAt);

  const directive = isTierDirective(frontmatter?.directive)
    ? frontmatter.directive
    : undefined;

  const useFeatureGrid = asBoolean(frontmatter?.useFeatureGrid);
  const featureGridItems = asFeatureGridItems(frontmatter?.featureGridItems);
  const featureGridColumns = asNumber(frontmatter?.featureGridColumns, 2);

  const useDownloadCTA = asBoolean(frontmatter?.useDownloadCTA);
  const downloadCTAProps = asDownloadCTAProps(frontmatter?.downloadCTA);
  const ctaDetails = resolveCTADetails(
    asCTADetailArray(frontmatter?.ctaDetails),
    downloadCTAProps,
  );

  React.useEffect(() => {
    if (typeof document === "undefined") return;

    const body = document.body;
    if (watermarkId) {
      body.setAttribute("data-watermark", watermarkId);
    } else {
      body.removeAttribute("data-watermark");
    }

    return () => {
      body.removeAttribute("data-watermark");
    };
  }, [watermarkId]);

  return (
    <div
      className="mdx-content aol-mdx-content"
      data-title={title}
      data-token-id={tokenId || undefined}
      data-watermark-id={watermarkId || undefined}
    >
      {content}

      <DocumentFooter
        id={tokenId || undefined}
        version={version || undefined}
        series={series || undefined}
        watermarkId={watermarkId || undefined}
        forensicFooter={forensicFooter || undefined}
        classification={classification || undefined}
        issuedTo={issuedTo || undefined}
        issuedAt={issuedAt || undefined}
        directive={directive}
      />

      {useFeatureGrid && featureGridItems.length > 0 ? (
        <div className="mt-20 print:hidden">
          <FeatureGrid
            items={featureGridItems}
            columns={featureGridColumns}
          />
        </div>
      ) : null}

      {useDownloadCTA && downloadCTAProps ? (
        <div className="mt-16 print:hidden">
          <DownloadCTA
            {...downloadCTAProps}
            details={ctaDetails}
          />
        </div>
      ) : null}
    </div>
  );
}

export default MDXContentWrapper;