// components/primitives/ContentMeta.tsx
// Unified metadata component for cards

import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Clock, Calendar, User, Tag, Lock, Star } from 'lucide-react';

export interface ContentMetaProps {
  // Date information
  date?: string | null;
  dateFormat?: 'short' | 'medium' | 'long' | 'relative';
  
  // Reading time
  readingTime?: string | null;
  
  // Author information
  author?: {
    name?: string;
    avatar?: string;
  } | null;
  
  // Category/tags
  category?: string | null;
  tags?: string[];
  maxTags?: number;
  
  // Status indicators
  featured?: boolean;
  isNew?: boolean;
  isLocked?: boolean;
  
  // Layout
  layout?: 'horizontal' | 'vertical' | 'compact';
  className?: string;
  
  // Custom rendering
  renderDate?: (date: string) => React.ReactNode;
  renderAuthor?: (author: { name?: string; avatar?: string }) => React.ReactNode;
}

export const ContentMeta: React.FC<ContentMetaProps> = ({
  date,
  dateFormat = 'medium',
  readingTime,
  author,
  category,
  tags = [],
  maxTags = 3,
  featured = false,
  isNew = false,
  isLocked = false,
  layout = 'horizontal',
  className,
  renderDate,
  renderAuthor,
}) => {
  // Helper to detect ISO date strings
  const isIsoDate = (dateStr: string): boolean => {
    return /^\d{4}-\d{2}-\d{2}/.test(dateStr) || dateStr.includes('T');
  };

  // Format date
  const formattedDate = React.useMemo(() => {
    if (!date) return null;
    
    if (renderDate) return renderDate(date);
    
    // If date is already formatted (not ISO), return as-is
    if (!isIsoDate(date)) return date;
    
    try {
      const dateObj = new Date(date);
      if (Number.isNaN(dateObj.getTime())) return null;
      
      switch (dateFormat) {
        case 'short':
          return dateObj.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
          });
        case 'medium':
          return dateObj.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          });
        case 'long':
          return dateObj.toLocaleDateString('en-GB', {
            weekday: 'short',
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          });
        case 'relative':
          // Simple relative date (for demo)
          const now = new Date();
          const diffDays = Math.floor((now.getTime() - dateObj.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays === 0) return 'Today';
          if (diffDays === 1) return 'Yesterday';
          if (diffDays < 7) return `${diffDays} days ago`;
          if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
          return dateObj.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
        default:
          return dateObj.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          });
      }
    } catch {
      return null;
    }
  }, [date, dateFormat, renderDate]);

  // Format reading time
  const formattedReadingTime = React.useMemo(() => {
    if (!readingTime) return null;
    
    if (typeof readingTime === 'number') {
      return `${readingTime} min read`;
    }
    
    if (typeof readingTime === 'string') {
      const trimmed = readingTime.trim();
      if (!trimmed) return null;
      
      const lower = trimmed.toLowerCase();
      if (lower.includes('min') || lower.includes('read')) return trimmed;
      
      const n = Number(trimmed);
      if (!Number.isNaN(n)) return `${n} min read`;
      
      return trimmed;
    }
    
    return null;
  }, [readingTime]);

  // Layout classes
  const layoutClasses = {
    horizontal: 'flex items-center justify-between',
    vertical: 'flex flex-col gap-2',
    compact: 'flex items-center gap-3 text-sm',
  };

  // Status badges
  const statusBadges = React.useMemo(() => {
    const badges = [];
    
    if (featured) {
      badges.push(
        <span key="featured" className="flex items-center gap-1 text-xs font-medium text-[#C9A96E]">
          <Star size={10} />
          Featured
        </span>
      );
    }
    
    if (isNew) {
      badges.push(
        <span key="new" className="text-xs font-medium text-[#F59E0B]">
          New
        </span>
      );
    }
    
    if (isLocked) {
      badges.push(
        <span key="locked" className="flex items-center gap-1 text-xs font-medium text-[#C9A96E]">
          <Lock size={10} />
          Members Only
        </span>
      );
    }
    
    return badges;
  }, [featured, isNew, isLocked]);

  // Author display
  const authorDisplay = React.useMemo(() => {
    if (!author) return null;
    
    if (renderAuthor) return renderAuthor(author);
    
    return (
      <div className="flex items-center gap-2">
        {author.avatar && (
          <div className="relative h-6 w-6 overflow-hidden rounded-full border border-white/20">
            <Image
              src={author.avatar}
              alt={author.name || 'Author'}
              fill
              className="object-cover"
            />
          </div>
        )}
        {author.name && (
          <span className="text-xs font-medium text-white/85">
            {author.name}
          </span>
        )}
      </div>
    );
  }, [author, renderAuthor]);

  // Category display
  const categoryDisplay = React.useMemo(() => {
    if (!category) return null;
    
    return (
      <span className="font-mono text-xs uppercase tracking-wider text-white/66">
        {category}
      </span>
    );
  }, [category]);

  // Tags display
  const tagsDisplay = React.useMemo(() => {
    if (!tags.length) return null;
    
    const displayTags = tags.slice(0, maxTags);
    
    return (
      <div className="flex flex-wrap gap-1">
        {displayTags.map((tag, index) => (
          <span
            key={`${tag}-${index}`}
            className="rounded-full border border-white/12 bg-white/2 px-2 py-1 text-[10px] uppercase tracking-wider text-white/66"
          >
            {tag}
          </span>
        ))}
        {tags.length > maxTags && (
          <span className="rounded-full border border-white/12 bg-white/2 px-2 py-1 text-[10px] uppercase tracking-wider text-white/66">
            +{tags.length - maxTags}
          </span>
        )}
      </div>
    );
  }, [tags, maxTags]);

  // Date and reading time display
  const timeDisplay = React.useMemo(() => {
    const parts = [];
    
    if (formattedDate) {
      parts.push(
        <span key="date" className="flex items-center gap-1 text-xs text-white/66">
          <Calendar size={10} />
          {formattedDate}
        </span>
      );
    }
    
    if (formattedReadingTime) {
      parts.push(
        <span key="readingTime" className="flex items-center gap-1 text-xs text-white/66">
          <Clock size={10} />
          {formattedReadingTime}
        </span>
      );
    }
    
    if (parts.length === 0) return null;
    
    return (
      <div className={cn(
        'flex items-center gap-3',
        layout === 'vertical' && 'flex-col items-start gap-1'
      )}>
        {parts}
      </div>
    );
  }, [formattedDate, formattedReadingTime, layout]);

  return (
    <div className={cn(
      'content-meta',
      layoutClasses[layout],
      className
    )}>
      {/* Left side: Category and author */}
      <div className="flex items-center gap-3">
        {categoryDisplay}
        {authorDisplay}
      </div>
      
      {/* Right side: Date and reading time */}
      <div className="flex items-center gap-3">
        {timeDisplay}
        {statusBadges.length > 0 && (
          <div className="flex items-center gap-2">
            {statusBadges}
          </div>
        )}
      </div>
      
      {/* Tags (full width) */}
      {layout === 'vertical' && tagsDisplay && (
        <div className="mt-2">
          {tagsDisplay}
        </div>
      )}
    </div>
  );
};

// Helper for common metadata patterns
export const MetaPatterns = {
  // Blog post metadata
  blogPost: (props: Omit<ContentMetaProps, 'layout'>) => (
    <ContentMeta
      layout="horizontal"
      dateFormat="medium"
      maxTags={3}
      {...props}
    />
  ),
  
  // Compact card metadata
  compactCard: (props: Omit<ContentMetaProps, 'layout'>) => (
    <ContentMeta
      layout="compact"
      dateFormat="short"
      maxTags={2}
      {...props}
    />
  ),
  
  // Author-focused metadata
  authorHighlight: (props: Omit<ContentMetaProps, 'layout'>) => (
    <ContentMeta
      layout="vertical"
      {...props}
    />
  ),
};