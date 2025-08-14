// components/MDXComponents.tsx
import Image from "next/image";
import Link from "next/link";
import type { MDXComponents as MDXComponentsType } from "mdx/types";
import * as React from "react";

const isInternal = (href = "") => href.startsWith("/") || href.startsWith("#");

const A: MDXComponentsType["a"] = ({
  href = "",
  children,
  className,
  title,
}) => {
  const base =
    "text-forest underline underline-offset-2 hover:text-softGold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-forest";
  const cls = className ? `${base} ${className}` : base;

  if (isInternal(href)) {
    return (
      <Link href={href} prefetch={false} className={cls} title={title}>
        {children}
      </Link>
    );
  }
  const isHttp = /^https?:\/\//i.test(href);
  return (
    <a
      href={href}
      className={cls}
      rel={isHttp ? "noopener noreferrer" : undefined}
      target={isHttp ? "_blank" : undefined}
      title={title}
      aria-label={
        typeof children === "string"
          ? `${children}${isHttp ? " ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â opens in new tab" : ""}`
          : undefined
      }
    >
      {children}
    </a>
  );
};

type ImgProps = React.ComponentProps<"img"> & {
  width?: number | string;
  height?: number | string;
};

// If width/height are provided, render intrinsic to avoid CLS.
// Otherwise render a responsive slot (fill) at a sensible height.
const Img: MDXComponentsType["img"] = ({
  src,
  alt = "",
  className,
  title,
  width,
  height,
  ...rest
}: ImgProps) => {
  const safeSrc = src || "/assets/images/default-book.jpg";
  const hasDim = Number(width) > 0 && Number(height) > 0;

  // Optional skeleton while loading (for fill mode)
  const skeleton =
    "bg-gradient-to-r from-lightGrey/20 via-lightGrey/40 to-lightGrey/20 animate-[shimmer_1.8s_linear_infinite]";

  return (
    <figure className="my-6">
      {hasDim ? (
        <Image
          src={safeSrc}
          alt={alt || (title ? String(title) : "Embedded image")}
          width={Number(width)}
          height={Number(height)}
          sizes="(max-width: 768px) 100vw, 800px"
          className={className || "rounded-lg shadow-card object-cover"}
          {...rest}
        />
      ) : (
        <span
          className={`block relative w-full h-96 rounded-lg overflow-hidden shadow-card ${className || ""}`}
        >
          <Image
            src={safeSrc}
            alt={alt || (title ? String(title) : "Embedded image")}
            fill
            sizes="100vw"
            priority={false}
            className="object-cover"
          />
          <style jsx>{`
            @keyframes shimmer {
              0% {
                background-position: -200% 0;
              }
              100% {
                background-position: 200% 0;
              }
            }
          `}</style>
          <span className={`absolute inset-0 ${skeleton}`} aria-hidden="true" />
        </span>
      )}
      {title && (
        <figcaption className="mt-2 text-sm text-deepCharcoal/70">
          {title}
        </figcaption>
      )}
    </figure>
  );
};

export const MDXComponents: MDXComponentsType = {
  a: A,
  img: Img,
};

export default MDXComponents;




