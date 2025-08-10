// components/MDXComponents.tsx
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

type AnchorProps = React.AnchorHTMLAttributes<HTMLAnchorElement>;
type ImgProps = React.ImgHTMLAttributes<HTMLImageElement>;

type ComponentMap = Record<string, React.ComponentType<Record<string, unknown>>>;

const A: React.FC<AnchorProps> = ({ href = '', children, ...rest }) => {
  if (href.startsWith('/')) {
    // Next 13+: Link can wrap <a> or accept className directly; we’ll keep it simple and valid.
    return (
      <Link href={href} legacyBehavior>
        <a {...rest} className="text-blue-600 underline hover:text-blue-800">
          {children}
        </a>
      </Link>
    );
  }
  return (
    <a href={href} {...rest} className="text-blue-600 underline hover:text-blue-800">
      {children}
    </a>
  );
};

const Img: React.FC<ImgProps> = ({ src, alt = '', ..._rest }) => {
  const resolved = typeof src === 'string' && src.trim() ? src : '/assets/images/default-book.jpg';
  return (
    <div className="relative w-full h-96 my-6 rounded-lg overflow-hidden shadow-card">
      <Image src={resolved} alt={alt} fill style={{ objectFit: 'cover' }} />
    </div>
  );
};

export const MDXComponents: ComponentMap = {
  a: A as unknown as React.ComponentType<Record<string, unknown>>,
  img: Img as unknown as React.ComponentType<Record<string, unknown>>,
};
