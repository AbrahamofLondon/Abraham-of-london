import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

type AnchorProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & { href?: string };
type ImgProps = React.ImgHTMLAttributes<HTMLImageElement> & { src?: string; alt?: string };

const A: React.FC<AnchorProps> = ({ href = '', children, ...rest }) => {
  const classes = 'text-blue-600 underline hover:text-blue-800';
  if (href.startsWith('/')) {
    return (
      <Link href={href} className={classes} {...rest}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} className={classes} {...rest}>
      {children}
    </a>
  );
};

const Img: React.FC<ImgProps> = ({ src, alt = '' }) => (
  <div className="relative w-full h-96 my-6 rounded-lg overflow-hidden shadow-card">
    <Image src={src || '/assets/images/default-book.jpg'} alt={alt} fill style={{ objectFit: 'cover' }} />
  </div>
);

export const MDXComponents: Record<string, React.ComponentType<any>> = {
  a: A,
  img: Img,
};

export default MDXComponents;
