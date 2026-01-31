'use client';

import React from 'react';
import { useMDXComponent } from 'contentlayer2'; 
import Image from 'next/image';
import Link from 'next/link';

// Discovery-driven Imports
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
  // Mapping your exact CSS classes to MDX elements
  h1: (p: any) => <h1 {...p} className="heading-statement mb-8" />,
  h2: (p: any) => <h2 {...p} className="text-kicker text-xl border-b border-white/10 pb-2 mt-12 mb-4" />,
  
  // Custom Components
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

export const MDXLayoutRenderer = ({ code, ...rest }: { code: string; [key: string]: any }) => {
  const MDXComponent = useMDXComponent(code);

  return (
    <article className="prose prose-invert prose-slate max-w-none">
      <MDXComponent components={components} {...rest} />
    </article>
  );
};

export default MDXLayoutRenderer;