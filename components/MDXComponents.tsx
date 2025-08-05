// components/MDXComponents.tsx
import Image from 'next/image';
import Link from 'next/link';
import { MDXRemoteSerializeResult } from 'next-mdx-remote';

export const MDXComponents = {
  a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <Link href={props.href ?? ''}>
      <a className="text-blue-600 underline hover:text-blue-800" {...props} />
    </Link>
  ),
  img: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <Image
      src={props.src ?? '/assets/images/default-book.jpg'}
      alt={props.alt ?? ''}
      width={800}
      height={450}
      layout="responsive"
    />
  ),
};
