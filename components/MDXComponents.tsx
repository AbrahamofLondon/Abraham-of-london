// components/MDXComponents.tsx
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { MDXComponents as MDXComponentsType } from 'mdx/types';

/** <a> — internal links use Next <Link>, external open in new tab */
type AnchorProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  href?: string;
};
const A: React.FC<AnchorProps> = ({ href = '', children, className, ...rest }) => {
  const base =
    'text-forest underline underline-offset-2 transition-colors hover:text-softGold';
  const cls = className ? `${base} ${className}` : base;

  // Internal route
  if (href.startsWith('/')) {
    return (
      <Link href={href} className={cls} {...rest}>
        {children}
      </Link>
    );
  }
  // External
  return (
    <a
      href={href}
      className={cls}
      target="_blank"
      rel="noopener noreferrer"
      {...rest}
    >
      {children}
    </a>
  );
};

/** <img> — render via next/image with a safe fill container */
type ImgProps = {
  src?: string;
  alt?: string;
  className?: string;
  /** Optional fixed aspect ratio height (tailwind h- classes). Default h-96 */
  heightClassName?: string;
};
const Img: React.FC<ImgProps> = ({
  src,
  alt = '',
  className,
  heightClassName = 'h-96',
}) => (
  <span
    className={`block relative w-full ${heightClassName} my-6 rounded-lg overflow-hidden shadow-card`}
  >
    <Image
      src={src || '/assets/images/default-book.jpg'}
      alt={alt}
      fill
      sizes="100vw"
      className={className ? `object-cover ${className}` : 'object-cover'}
      priority={false}
    />
  </span>
);

/** Code blocks & inline code */
const Pre: React.FC<React.HTMLAttributes<HTMLPreElement>> = ({ className, ...p }) => (
  <pre
    className={
      className ||
      'bg-zinc-900 text-zinc-100 p-4 rounded-lg overflow-x-auto text-sm leading-6'
    }
    {...p}
  />
);
const Code: React.FC<React.HTMLAttributes<HTMLElement>> = ({ className, ...p }) => (
  <code
    className={
      className || 'px-1 py-0.5 rounded bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100'
    }
    {...p}
  />
);

/** Headings & text defaults */
const H2: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className, ...p }) => (
  <h2 className={className || 'font-serif text-3xl tracking-brand text-forest mt-10 mb-4'} {...p} />
);
const H3: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className, ...p }) => (
  <h3 className={className || 'font-serif text-2xl tracking-brand text-forest mt-8 mb-3'} {...p} />
);
const P: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ className, ...p }) => (
  <p className={className || 'text-deepCharcoal leading-7 my-4'} {...p} />
);
const Ul: React.FC<React.HTMLAttributes<HTMLUListElement>> = ({ className, ...p }) => (
  <ul className={className || 'list-disc pl-6 space-y-2 my-4'} {...p} />
);
const Ol: React.FC<React.HTMLAttributes<HTMLOListElement>> = ({ className, ...p }) => (
  <ol className={className || 'list-decimal pl-6 space-y-2 my-4'} {...p} />
);
const Blockquote: React.FC<React.HTMLAttributes<HTMLQuoteElement>> = ({
  className,
  ...p
}) => (
  <blockquote
    className={
      className ||
      'border-l-4 border-softGold/70 pl-4 italic text-deepCharcoal/80 my-6'
    }
    {...p}
  />
);

/** Export registry for MDXRemote */
export const MDXComponents: MDXComponentsType = {
  a: A as unknown as React.ComponentType,
  img: Img as unknown as React.ComponentType,
  Image: Img as unknown as React.ComponentType, // allow <Image /> in MDX too
  pre: Pre as unknown as React.ComponentType,
  code: Code as unknown as React.ComponentType,
  h2: H2 as unknown as React.ComponentType,
  h3: H3 as unknown as React.ComponentType,
  p: P as unknown as React.ComponentType,
  ul: Ul as unknown as React.ComponentType,
  ol: Ol as unknown as React.ComponentType,
  blockquote: Blockquote as unknown as React.ComponentType,
};

export default MDXComponents;
