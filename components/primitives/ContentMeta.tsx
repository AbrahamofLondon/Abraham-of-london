import React from 'react';
import { cn } from '@/lib/utils';
import type { SurfaceContract } from '@/lib/design-system/surfaces';

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
    items.push(<span key="citations">Cited {document.citationCount} times</span>);
  }

  if (showSecurity && document.securityLevel) {
    const badgeStyles: Record<string, React.CSSProperties> = {
      confidential: {
        backgroundColor: 'var(--ds-accent-soft)',
        color: 'var(--ds-accent)',
        borderColor: 'var(--ds-accent)',
      },
      restricted: {
        backgroundColor: 'var(--ds-panel-alt)',
        color: 'var(--ds-text-muted)',
        borderColor: 'var(--ds-border)',
      },
      'top-secret': {
        backgroundColor: 'rgba(207, 77, 77, 0.12)',
        color: 'var(--ds-danger)',
        borderColor: 'var(--ds-danger)',
      },
    };

    items.push(
      <span
        key="security"
        className="inline-block px-2 py-0.5 rounded text-xs font-mono border"
        style={badgeStyles[document.securityLevel]}
      >
        {document.securityLevel.toUpperCase()}
      </span>
    );
  }

  if (items.length === 0) return null;

  return (
    <div className={cn('flex flex-wrap items-center gap-x-3 gap-y-1 text-xs ds-text-muted', className)}>
      {items.map((item, i) => (
        <React.Fragment key={i}>
          {item}
          {i < items.length - 1 && <span className="ds-text-subtle">·</span>}
        </React.Fragment>
      ))}
    </div>
  );
};
