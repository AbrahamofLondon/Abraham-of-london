// components/strategy-room/DecisionAssetLink.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import {
  trackConversion,
  trackFollowup,
} from "@/lib/strategy-room/client-trackers";

type AssetRef = {
  id: string;
  title: string;
  href?: string | null;
  kind?: string;
  matchScore?: number;
  metadataConfidence?: number | null;
  reasons?: string[];
};

type FollowupPayload = {
  routeAfter?: string;
  readinessTierAfter?: string;
  authorityTypeAfter?: string;
  clarityDelta?: number;
  authorityDelta?: number;
  convertedAfterGuidance?: boolean;
  metadata?: Record<string, unknown>;
};

type Props = {
  sessionKey: string;
  asset: AssetRef;
  rank: number;
  className?: string;
  children?: React.ReactNode;
  conversionTypeOnClick?: string;
  followupOnClick?: FollowupPayload;
};

function isExternalHref(href: string): boolean {
  return /^https?:\/\//i.test(href);
}

function normaliseHref(href?: string | null): string {
  const trimmed = String(href || "").trim();
  return trimmed || "#";
}

function toSafeNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function toSafeReasons(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const cleaned = value
    .map((item) => String(item).trim())
    .filter(Boolean)
    .slice(0, 8);
  return cleaned.length ? cleaned : undefined;
}

export function DecisionAssetLink({
  sessionKey,
  asset,
  rank,
  className,
  children,
  conversionTypeOnClick,
  followupOnClick,
}: Props) {
  const href = normaliseHref(asset.href);
  const external = isExternalHref(href);

  const trackingPayload = React.useMemo(
    () => ({
      sessionKey,
      assetId: String(asset.id),
      assetTitle: String(asset.title),
      assetHref: href,
      assetKind: asset.kind,
      rank,
      matchScore: toSafeNumber(asset.matchScore),
      metadataConfidence: toSafeNumber(asset.metadataConfidence),
      reasons: toSafeReasons(asset.reasons),
    }),
    [
      sessionKey,
      asset.id,
      asset.title,
      href,
      asset.kind,
      rank,
      asset.matchScore,
      asset.metadataConfidence,
      asset.reasons,
    ],
  );

  const handleClick = React.useCallback(() => {
    if (conversionTypeOnClick) {
      try {
        trackConversion({
          sessionKey,
          conversionType: conversionTypeOnClick,
          metadata: {
            assetId: String(asset.id),
            assetTitle: String(asset.title),
            assetHref: href,
            assetKind: asset.kind,
            rank,
            source: "decision_asset_link",
          },
        });
      } catch (error) {
        console.error("[DecisionAssetLink] trackConversion failed:", error);
      }
    }

    if (followupOnClick) {
      try {
        trackFollowup({
          sessionKey,
          routeAfter: (followupOnClick.routeAfter ?? "STRATEGY") as "REJECT" | "DIAGNOSTIC" | "STRATEGY",
          readinessTierAfter: followupOnClick.readinessTierAfter ?? "",
          authorityTypeAfter: followupOnClick.authorityTypeAfter ?? "",
          clarityDelta: followupOnClick.clarityDelta ?? 0,
          authorityDelta: followupOnClick.authorityDelta ?? 0,
          convertedAfterGuidance: followupOnClick.convertedAfterGuidance ?? false,
          metadata: {
            ...(followupOnClick.metadata || {}),
            assetId: String(asset.id),
            assetTitle: String(asset.title),
            assetKind: asset.kind,
            rank,
            source: "decision_asset_link",
          },
        });
      } catch (error) {
        console.error("[DecisionAssetLink] trackFollowup failed:", error);
      }
    }
  }, [
    conversionTypeOnClick,
    followupOnClick,
    sessionKey,
    asset.id,
    asset.title,
    asset.kind,
    href,
    rank,
  ]);

  const content = children ?? asset.title;

  if (href === "#") {
    return (
      <span
        className={className || "block"}
        onClick={handleClick}
        role="link"
        aria-disabled="true"
      >
        {content}
      </span>
    );
  }

  if (external) {
    return (
      <a
        href={href}
        onClick={handleClick}
        className={className || "block"}
        target="_blank"
        rel="noreferrer"
      >
        {content}
      </a>
    );
  }

  return (
    <Link href={href} onClick={handleClick} className={className || "block"}>
      {content}
    </Link>
  );
}