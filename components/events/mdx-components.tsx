import * as React from "react";
import Link from "next/link";
import Image, { type ImageProps } from "next/image";
import type { MDXComponents } from "mdx/types";

const A: React.FC<React.AnchorHTMLAttributes<HTMLAnchorElement>> = ({ href, children, ...rest }) => {
  const url = href || "#";
  const external = /^https?:\/\//i.test(url);
  return external ? (
    <a href={url} target="_blank" rel="noopener noreferrer" {...rest}>
      {children}
    </a>
  ) : (
    <Link href={url} {...(rest as any)}>
      {children}
    </Link>
  );
};

const Img: React.FC<ImageProps> = ({ alt = "", sizes = "100vw", ...rest }) => <Image alt={alt} sizes={sizes} {...rest} />;

const mdxComponents: MDXComponents = {
  a: A,
  img: (props: any) => <Img {...props} />,
  pre: (p) => <pre className="not-prose overflow-auto rounded-lg bg-gray-900 p-4 text-gray-100" {...p} />,
  code: (p) => <code className="rounded bg-gray-100 px-1 py-0.5" {...p} />,
};

export default mdxComponents;