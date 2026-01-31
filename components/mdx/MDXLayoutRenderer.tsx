'use client';

import React from 'react';
// Use the root import - this is the confirmed path for contentlayer2 v0.5.8+
import { useMDXComponent } from 'next-contentlayer2/hooks';
import Image from 'next/image';
import Link from 'next/link';

// Component Imports
import Callout from './Callout';
import Badge from './Badge';
import CTA from './CTA';
import Quote from './Quote';
import Note from './Note';
import Grid from './Grid';
import Verse from './Verse';
import EmbossedBrandMark from './EmbossedBrandMark';
import { components as shortcodes } from './shortcodes';

const components = {
  Image,
  a: ({ href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
    const isInternal = href && href.startsWith('/');
    if (isInternal) return <Link href={href} {...props} className="text-amber-500 hover:underline" />;
    return <a target="_blank" rel="noopener noreferrer" href={href} {...props} />;
  },
  h1: (p: any) => <h1 {...p} className="heading-statement mb-8" />,
  h2: (p: any) => <h2 {...p} className="text-kicker text-xl border-b border-white/10 pb-2 mt-12 mb-4" />,
  Callout,
  Badge,
  CTA,
  Quote,
  Note,
  Grid,
  Verse,
  EmbossedBrandMark,
  ...shortcodes,
};

interface MDXProps {
  code: string;
  [key: string]: any;
}

export const MDXLayoutRenderer = ({ code, ...rest }: MDXProps) => {
  // We provide a fallback string to prevent the hook from crashing if code is temporarily undefined
  const MDXComponent = useMDXComponent(code || '');

  if (!code) {
    return <div className="animate-pulse bg-white/5 h-64 w-full rounded-xl" />;
  }

  return (
    <article className="prose prose-invert prose-slate max-w-none">
      <MDXComponent components={components} {...rest} />
    </article>
  );
};

export default MDXLayoutRenderer;