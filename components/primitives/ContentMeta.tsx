import React from 'react';
import { cn } from '@/lib/utils';
import { SurfaceContract } from '@/lib/design-system/surfaces';

export interface ContentMetaProps {
  document: {
    author?: string;
    date?: string;
    citationCount?: number;
    securityLevel?: 'confidential' | 'restricted' | 'top-secret';
    readTime?: number;
  };
  surface: SurfaceContract;
  showAuthor?: boolean;
  showDate?: boolean;
  showCitationCount?: boolean;
  showSecurity?: boolean;
  showReadTime?: boolean;
  className?: string;
}

export const ContentMeta: React.FC<ContentMetaProps> = ({
  document,
  surface,
  showAuthor = true,
  showDate = true,
  showCitationCount = false,
  showSecurity = false,
  showReadTime = false,
  className,
}) => {
  const items: React.ReactNode[] = [];

  if (showAuthor && document.author) {
    items.push(<span key="author">{document.author}</span>);
  }

  if (showDate && document.date) {
    items.push(<span key="date">{document.date}</span>);
  }

  if (showReadTime && document.readTime) {
    items.push(<span key="readTime">{document.readTime} min read</span>);
  }

  if (showCitationCount && document.citationCount && document.citationCount > 0) {
    items.push(<span key="citations">📚 Cited {document.citationCount} times</span>);
  }

  if (showSecurity && document.securityLevel) {
    const colors = {
      confidential: 'bg-yellow-100 text-yellow-700',
      restricted: 'bg-gray-100 text-gray-700',
      'top-secret': 'bg-red-100 text-red-700',
    };
    items.push(
      <span
        key="security"
        className={cn('inline-block px-2 py-0.5 rounded text-xs font-mono', colors[document.securityLevel])}
      >
        {document.securityLevel.toUpperCase()}
      </span>
    );
  }

  if (items.length === 0) return null;

  return (
    <div className={cn('flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-surface-text-muted', className)}>
      {items.map((item, i) => (
        <React.Fragment key={i}>
          {item}
          {i < items.length - 1 && <span className="text-surface-border">•</span>}
        </React.Fragment>
      ))}
    </div>
  );
};