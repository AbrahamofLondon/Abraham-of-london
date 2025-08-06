import Image from 'next/image';
import Link from 'next/link';

// The unused import is removed to resolve the build warning
// import { MDXRemoteSerializeResult } from 'next-mdx-remote'; 

export const MDXComponents = {
  a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
    const { href = '', ...restProps } = props;
    if (href.startsWith('/')) {
      return (
        <Link href={href}>
          <a {...restProps} className="text-blue-600 underline hover:text-blue-800" />
        </Link>
      );
    }
    return <a href={href} {...restProps} className="text-blue-600 underline hover:text-blue-800" />;
  },
  img: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <div className="relative w-full h-96">
      <Image
        src={props.src ?? '/assets/images/default-book.jpg'}
        alt={props.alt ?? ''}
        fill
        style={{ objectFit: 'cover' }}
      />
    </div>
  ),
  // Add other custom components for MDX here as needed
};