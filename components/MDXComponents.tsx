// components/MDXComponents.tsx
import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';

type AnchorProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  children?: React.ReactNode;
};

type ImgProps = React.ImgHTMLAttributes<HTMLImageElement>;

export const MDXComponents = {
  a: ({ href = '', children, ...rest }: AnchorProps) => {
    // Internal link (starts with /): use Next <Link>
    if (href.startsWith('/')) {
      return (
        <Link
          href={href}
          className="text-forest underline underline-offset-2 hover:text-softGold transition"
          {...rest}
        >
          {children}
        </Link>
      );
    }
    // External link: standard <a> with security attrs
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-forest underline underline-offset-2 hover:text-softGold transition"
        {...rest}
      >
        {children}
      </a>
    );
  },

  img: ({ src, alt, ...rest }: ImgProps) => (
    <div className="relative w-full h-96 my-6 rounded-lg overflow-hidden shadow-card">
      <Image
        src={src || '/assets/images/default-book.jpg'}
        alt={alt || ''}
        fill
        sizes="(max-width: 768px) 100vw, 768px"
        style={{ objectFit: 'cover' }}
        {...rest}
      />
    </div>
  ),
  // Add more MDX shortcodes here (e.g., Callout, Quote, Button, etc.)
};
