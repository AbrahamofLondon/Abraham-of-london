// components/MDXComponents.tsx
import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';

type AnchorProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  children?: React.ReactNode;
};

type ImgProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  src?: string;
  alt?: string;
  className?: string;
  sizes?: string;
  loading?: 'eager' | 'lazy';
};

export const MDXComponents = {
  a: ({ href = '', children, ...rest }: AnchorProps) => {
    const cls = 'text-forest underline underline-offset-2 hover:text-softGold transition';

    if (href.startsWith('/')) {
      return (
        <Link href={href} className={cls} {...rest}>
          {children}
        </Link>
      );
    }

    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls} {...rest}>
        {children}
      </a>
    );
  },

  img: ({ src, alt, className, sizes, loading }: ImgProps) => (
    <div className="relative w-full h-96 my-6 rounded-lg overflow-hidden shadow-card">
      <Image
        src={src || '/assets/images/default-book.jpg'}
        alt={alt || ''}
        fill
        sizes={sizes || '(max-width: 768px) 100vw, 768px'}
        loading={loading === 'eager' ? 'eager' : 'lazy'}
        className={className}
      />
    </div>
  ),
};

export default MDXComponents;
