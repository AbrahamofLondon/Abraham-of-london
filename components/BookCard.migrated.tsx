// components/BookCard.migrated.tsx
// Migrated BookCard using UnifiedCard with progress bar support

'use client';

import { UnifiedCard } from '@/components/primitives/UnifiedCard';
import { ProgressBar } from '@/components/primitives/ProgressBar';

type BookCardProps = {
  slug: string;
  title: string;
  subtitle?: string | null;
  status?: string | null;
  blurb?: string | null;
  progress?: number | null;
  coverImage?: string | null;
  heroImage?: string | null;
  image?: string | null;
};

export default function BookCard({
  slug,
  title,
  subtitle,
  status,
  blurb,
  progress,
  coverImage,
  heroImage,
  image,
}: BookCardProps) {
  const href = `/books/${encodeURIComponent(slug)}`;
  
  // Determine cover image (priority: coverImage > heroImage > image)
  const cover = coverImage || heroImage || image || undefined;
  
  // Safe progress value
  const safeProgress = typeof progress === 'number' && progress >= 0 && progress <= 100
    ? progress
    : null;
  
  // Progress bar component if progress is provided
  const progressBar = safeProgress !== null ? (
    <ProgressBar
      value={safeProgress}
      label="Writing Progress"
      showValue={true}
      size="md"
    />
  ) : undefined;
  
  // Status badge
  const statusBadge = status ? (
    <span className="rounded-full border border-[var(--ds-amber-400)]/50 bg-[var(--ds-panel-alt)] px-3 py-1 text-xs font-medium tracking-wider text-[var(--ds-amber-400)] backdrop-blur-xl">
      {status.toUpperCase()}
    </span>
  ) : undefined;

  return (
    <UnifiedCard
      title={title}
      href={href}
      subtitle={subtitle || undefined}
      excerpt={blurb || undefined}
      coverImage={cover}
      coverAlt={title}
      coverAspect="portrait"
      variant="default"
      layout="horizontal"
      showMeta={false}
      showTags={false}
      showCta={true}
      progressBar={progressBar}
      customCover={statusBadge ? (
        <div className="absolute left-2 top-2 z-10">
          {statusBadge}
        </div>
      ) : undefined}
    />
  );
}