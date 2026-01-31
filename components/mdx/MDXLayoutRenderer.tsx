'use client';

import React, { useMemo } from 'react';
import { useMDXComponent } from 'next-contentlayer2/hooks';
import Image from 'next/image';
import Link from 'next/link';

/**
 * Abraham of London: MDX Component Mapping
 * Defines the strict UI elements permitted within institutional documents.
 */
const components = {
  Image,
  a: ({ href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
    const isInternalLink = href && href.startsWith('/');
    const isAnchorLink = href && href.startsWith('#');

    if (isInternalLink) {
      return <Link href={href} {...props} />;
    }

    if (isAnchorLink) {
      return <a href={href} {...props} />;
    }

    return <a target="_blank" rel="noopener noreferrer" href={href} {...props} />;
  },
  // Add custom institutional components here (e.g., ProtocolAlert, DataInsight)
};

interface MDXLayoutRendererProps {
  code: string;
  [key: string]: any;
}

export const MDXLayoutRenderer = ({ code, ...rest }: MDXLayoutRendererProps) => {
  const MDXComponent = useMDXComponent(code);

  return (
    <div className="prose prose-slate max-w-none dark:prose-invert">
      <MDXComponent components={components} {...rest} />
    </div>
  );
};

export default MDXLayoutRenderer;