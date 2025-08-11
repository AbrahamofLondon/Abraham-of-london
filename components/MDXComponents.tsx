// components/MDXComponents.tsx
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { MDXComponents as MDXComponentsType } from 'mdx/types';

type AnchorProps = {
  href?: string;
  children?: React.ReactNode;
  className?: string;
  title?: string;
};
const A: React.FC<AnchorProps> = ({ href = '', children, className, title }) => {
  const base = 'text-forest underline underline-offset-2 hover:text-softGold transition-colors';
  const cls = className ? `${base} ${className}` : base;

  if (href.startsWith('/')) {
    return (
      <Link href={href} className={cls} title={title}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} className={cls} rel="noopener noreferrer" target="_blank" title={title}>
      {children}
    </a>
  );
};

type ImgProps = {
  src?: string;
  alt?: string;
  className?: string;
};
const Img: React.FC<ImgProps> = ({ src, alt = '', className }) => (
  <span className="block relative w-full h-96 my-6 rounded-lg overflow-hidden shadow-card">
    <Image
      src={src || '/assets/images/default-book.jpg'}
      alt={alt}
      fill
      sizes="100vw"
      priority={false}
      className={className}
      style={{ objectFit: 'cover' }}
    />
  </span>
);

export const MDXComponents: MDXComponentsType = {
  a: A as unknown as React.ComponentType,
  img: Img as unknown as React.ComponentType,
};

export default MDXComponents;
