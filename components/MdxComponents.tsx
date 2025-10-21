// components/MdxComponents.tsx
import * as React from "react";
import Link from "next/link";
import Image from "next/image";

type AProps = React.ComponentProps<"a">;
type ImgProps = Omit<React.ComponentProps<"img">, "src"> & { src: string };

const A = (props: AProps) => {
  const href = props.href || "";
  const isExternal = /^https?:\/\//i.test(href);
  if (isExternal) {
    return <a {...props} rel="noopener noreferrer" target="_blank" />;
  }
  return <Link href={href}>{props.children}</Link>;
};

const Img = (props: ImgProps) => {
  // You can tune width/height or read from props via data- attributes if needed
  return <Image src={props.src} alt={props.alt ?? ""} width={1200} height={630} />;
};

export const components = {
  a: A,
  img: Img,
  h1: (p: any) => <h1 className="font-serif">{p.children}</h1>,
  // Add any MDX shortcodes/components your content uses here, e.g. Callout, Note, etc.
};

export default components;
