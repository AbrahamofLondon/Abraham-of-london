// components/primitives/UnifiedCard.tsx
// Unified card component using CardShell, SmartCover, and ContentMeta

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getSurfaceContract } from '@/lib/design-system/surfaces';
import { EnhancedCardShell } from './EnhancedCardShell';
import { SmartCover } from './SmartCover';
import { ContentMeta } from './ContentMeta';
import { CardTag, CardBadge } from './EnhancedCardShell';

export interface UnifiedCardProps {
  // Core content
  title: string;
  href: string;
  
  // Optional content
  subtitle?: string;
  excerpt?: string;
  description?: string;
  
  // Image
  coverImage?: string;
  coverAlt?: string;
  coverAspect?: 'square' | 'portrait' | 'landscape' | 'wide';
  
  // Metadata
  date?: string;
  readingTime?: string;
  author?: {
    name?: string;
    avatar?: string;
  };
  category?: string;
  tags?: string[];
  
  // Status
  featured?: boolean;
  isNew?: boolean;
  isLocked?: boolean;
  
  // Layout
  variant?: 'default' | 'featured' | 'compact' | 'luxury';
  layout?: 'vertical' | 'horizontal' | 'cover-led';
  
  // Surface
  surfaceId?: string;
  surfacePath?: string; // Auto-detect surface from path
  
  // Customization
  className?: string;
  showMeta?: boolean;
  showTags?: boolean;
  showCta?: boolean;
  
  // Custom slots
  customCover?: React.ReactNode;
  customMeta?: React.ReactNode;
  customFooter?: React.ReactNode;
  customCta?: React.ReactNode;
  
  // New slots for specific card types
  icon?: React.ReactNode; // For ContentCard icon
  progressBar?: React.ReactNode; // For BookCard progress
  authorSection?: React.ReactNode; // For BlogPostCard author display
}

export const UnifiedCard: React.FC<UnifiedCardProps> = ({
  title,
  href,
  subtitle,
  excerpt,
  description,
  coverImage,
  coverAlt,
  coverAspect = 'landscape',
  date,
  readingTime,
  author,
  category,
  tags = [],
  featured = false,
  isNew = false,
  isLocked = false,
  variant = 'default',
  layout = 'vertical',
  surfaceId,
  surfacePath,
  className,
  showMeta = true,
  showTags = true,
  showCta = true,
  customCover,
  customMeta,
  customFooter,
  customCta,
  icon,
  progressBar,
  authorSection,
}) => {
  // Helper to detect ISO date strings
  const isIsoDate = (dateStr: string): boolean => {
    return /^\d{4}-\d{2}-\d{2}/.test(dateStr) || dateStr.includes('T');
  };

  // Determine surface
  const surface = surfaceId 
    ? getSurfaceContract(surfacePath || href)
    : getSurfaceContract(href);

  // Determine display text (excerpt or description)
  const displayText = excerpt || description || '';

  // Badges
  const badges = React.useMemo(() => {
    const badgeElements = [];
    
    if (featured) {
      badgeElements.push(
        <CardBadge key="featured" variant="featured">
          FEATURED
        </CardBadge>
      );
    }
    
    if (isNew) {
      badgeElements.push(
        <CardBadge key="new" variant="new">
          NEW
        </CardBadge>
      );
    }
    
    if (isLocked) {
      badgeElements.push(
        <CardBadge key="locked" variant="locked">
          <span className="flex items-center gap-1">
            LOCKED
          </span>
        </CardBadge>
      );
    }
    
    if (category && !showMeta) {
      badgeElements.push(
        <CardBadge key="category">
          {category.toUpperCase()}
        </CardBadge>
      );
    }
    
    return badgeElements.length > 0 ? badgeElements : null;
  }, [featured, isNew, isLocked, category, showMeta]);

  // Cover component
  const cover = customCover || (coverImage ? (
    <SmartCover
      src={coverImage}
      alt={coverAlt || title}
      aspect={coverAspect}
      hoverEffect={variant !== 'compact'}
    />
  ) : null);

  // Metadata component
  const meta = customMeta || (showMeta ? (
    <ContentMeta
      date={date}
      readingTime={readingTime}
      author={author}
      category={category}
      tags={tags}
      featured={featured}
      isNew={isNew}
      isLocked={isLocked}
      layout="horizontal"
    />
  ) : null);

  // Tags display
  const tagsDisplay = showTags && tags.length > 0 ? (
    <div className="flex flex-wrap gap-2">
      {tags.slice(0, 3).map((tag, index) => (
        <CardTag key={`${tag}-${index}`}>
          {tag}
        </CardTag>
      ))}
      {tags.length > 3 && (
        <CardTag>
          +{tags.length - 3}
        </CardTag>
      )}
    </div>
  ) : null;

  // CTA component using design system tokens
  const cta = customCta || (showCta ? (
    <span className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[var(--ds-text-muted)] group-hover:text-[var(--ds-accent)] transition-colors">
      Read More
      <ArrowRight size={12} className="transition-transform group-hover:translate-x-1" />
    </span>
  ) : null);

  // Footer (date or custom) using design system tokens
  const footer = customFooter || (date && !showMeta ? (
    <span className="font-mono text-xs tracking-tighter text-[var(--ds-text-muted)]">
      {isIsoDate(date) 
        ? new Date(date).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })
        : date}
    </span>
  ) : null);

  return (
    <EnhancedCardShell
      surface={surface}
      variant={variant}
      layout={layout}
      interactive={true}
      href={href}
      className={className}
      cover={cover}
      badges={badges}
      metadata={meta}
      title={title}
      subtitle={subtitle}
      excerpt={displayText ? (
        <p className="text-sm font-light leading-relaxed text-[var(--ds-text-body)]">
          {displayText}
        </p>
      ) : undefined}
      tags={tagsDisplay}
      footer={footer}
      cta={cta}
      icon={icon}
      progressBar={progressBar}
      authorSection={authorSection}
    />
  );
};

// Pre-configured variants for common use cases
export const CardVariants = {
  // Blog post card
  BlogPost: (props: Omit<UnifiedCardProps, 'variant' | 'layout'>) => (
    <UnifiedCard
      variant="default"
      layout="vertical"
      coverAspect="landscape"
      showMeta={true}
      showTags={true}
      showCta={true}
      {...props}
    />
  ),
  
  // Compact blog card
  BlogCompact: (props: Omit<UnifiedCardProps, 'variant' | 'layout'>) => (
    <UnifiedCard
      variant="compact"
      layout="horizontal"
      coverAspect="square"
      showMeta={false}
      showTags={false}
      showCta={false}
      {...props}
    />
  ),
  
  // Book card
  Book: (props: Omit<UnifiedCardProps, 'variant' | 'layout'>) => (
    <UnifiedCard
      variant="default"
      layout="horizontal"
      coverAspect="portrait"
      showMeta={true}
      showTags={false}
      showCta={true}
      {...props}
    />
  ),
  
  // Resource card
  Resource: (props: Omit<UnifiedCardProps, 'variant' | 'layout'>) => (
    <UnifiedCard
      variant="compact"
      layout="vertical"
      coverAspect="landscape"
      showMeta={true}
      showTags={true}
      showCta={true}
      {...props}
    />
  ),
  
  // Featured/luxury card
  Featured: (props: Omit<UnifiedCardProps, 'variant' | 'layout'>) => (
    <UnifiedCard
      variant="luxury"
      layout="vertical"
      coverAspect="wide"
      showMeta={true}
      showTags={true}
      showCta={true}
      {...props}
    />
  ),
};