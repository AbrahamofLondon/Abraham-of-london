// components/MdxComponents.tsx
import * as React from "react";
import Link from "next/link";
import Image from "next/image";

// Add/extend as your MDX needs
export const components = {
  a: (props: React.ComponentProps<"a">) => {
    const href = props.href || "";
    const isExternal = /^https?:\/\//i.test(href);
    if (isExternal) {
      return <a {...props} rel="noopener noreferrer" target="_blank" />;
    }
    return <Link href={href}>{props.children}</Link>;
  },
  img: (props: Omit<React.ComponentProps<"img">, "src"> & { src: string }) => (
    <Image src={props.src} alt={props.alt ?? ""} width={1200} height={630} />
  ),
  h1: (p: any) => <h1 className="font-serif">{p.children}</h1>,
};

export default components;
