// components/Content/CardDisplay.tsx
'use client';

import * as React from 'react';
import { 
  ContentlayerDocument,
  isBook, 
  isPost, 
  isCanon,
  mapToBookCardProps, 
  mapToBlogPostCardProps, 
  mapToCanonCardProps,
  mapToBaseCardProps
} from '@/lib/contentlayer';
import { BookCard, BlogPostCard, CanonResourceCard, BaseCard } from '@/components/Cards';

interface CardDisplayProps {
  document: ContentlayerDocument;
  className?: string;
}

export function CardDisplay({ document, className = '' }: CardDisplayProps) {
  if (!document) {
    return <div className={className}>No document provided</div>;
  }

  if (isBook(document)) {
    return <BookCard {...mapToBookCardProps(document)} className={className} />;
  }
  
  if (isPost(document)) {
    return <BlogPostCard {...mapToBlogPostCardProps(document)} className={className} />;
  }
  
  if (isCanon(document)) {
    return <CanonResourceCard canon={mapToCanonCardProps(document)} className={className} />;
  }
  
  return <BaseCard {...mapToBaseCardProps(document)} className={className} />;
}