// components/events/mdx-components.tsx
import Link from "next/link";
import Image, { type ImageProps } from "next/image";
import type { MDXComponents } from "mdx/types";

const A: React.FC<React.AnchorHTMLAttributes<HTMLAnchorElement>> = ({ href, children, ...rest }) => {
  const url = href || "#";
  const isExternal = url.startsWith('http') || url.startsWith('mailto:') || url.startsWith('tel:');
  
  if (isExternal) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" {...rest}>
        {children}
      </a>
    );
  }
  
  return (
    <Link href={url} {...rest}>
      {children}
    </Link>
  );
};

const Img: React.FC<ImageProps> = (props) => {
  return <Image {...props} alt={props.alt || ""} />;
};

const components: MDXComponents = {
  a: A,
  img: Img,
  // Add other components as needed
};

export default components;