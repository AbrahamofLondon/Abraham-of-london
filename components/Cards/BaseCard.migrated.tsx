// components/Cards/BaseCard.migrated.tsx
// Migrated version using UnifiedCard

import * as React from "react";
import { UnifiedCard } from '@/components/primitives/UnifiedCard';
import type { BaseCardProps } from "./types";

const BaseCard: React.FC<BaseCardProps> = ({
  slug,
  title,
  subtitle,
  excerpt,
  description,
  coverImage,
  coverAspect = null,
  coverFit = null,
  coverPosition = "center",
  date,
  tags = [],
  featured = false,
  accessLevel,
  category,
  readingTime,
  isNew = false,
  className = "",
  href,
}) => {
  const isLocked = accessLevel === "inner-circle" || accessLevel === "premium";
  const safeHref = href || `/briefs/${slug}`;
  const displayText = excerpt || description || subtitle || "";

  // Map cover aspect
  const coverAspectMap = {
    book: "portrait" as const,
    square: "square" as const,
    wide: "wide" as const,
  };

  const unifiedCoverAspect = coverAspect 
    ? coverAspectMap[coverAspect] || "landscape"
    : "landscape";

  return (
    <UnifiedCard
      title={title}
      href={safeHref}
      subtitle={subtitle ?? undefined}
      excerpt={displayText}
      coverImage={coverImage || undefined}
      coverAlt={title}
      coverAspect={unifiedCoverAspect}
      date={date || undefined}
      readingTime={readingTime || undefined}
      category={category || undefined}
      tags={tags || []}
      featured={featured}
      isNew={isNew}
      isLocked={isLocked}
      variant="default"
      layout="vertical"
      showMeta={true}
      showTags={true}
      showCta={true}
      className={className}
    />
  );
};

export default BaseCard;
